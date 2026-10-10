// Splits a unit batch across a color's weighted unit types.
// Usage: node .cursor/skills/complete-flavors/scripts/allocate-types.mjs --color green --count 55
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const COLORS = ['red', 'green', 'blue', 'black'];
const COLOR_ENUM = { red: 'Red', green: 'Green', blue: 'Blue', black: 'Black' };

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : process.argv[index + 1];
}

const color = arg('color');
const count = Number(arg('count'));
if (!COLORS.includes(color)) {
  console.error(`Usage: node .cursor/skills/complete-flavors/scripts/allocate-types.mjs --color <${COLORS.join('|')}> --count <units>`);
  process.exit(1);
}
if (!Number.isInteger(count) || count < 0) {
  console.error('--count must be a non-negative integer (units only, not spells).');
  process.exit(1);
}

const pieSource = fs.readFileSync(path.join(root, 'src/lib/sim/cards/color-pie.ts'), 'utf8');
const enumSource = fs.readFileSync(path.join(root, 'src/lib/_model/enums-battle.ts'), 'utf8');

function colorBlock(source, colorName) {
  const marker = `[CardColor.${COLOR_ENUM[colorName]}]:`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Missing color pie block for ${colorName}`);
  const next = source.indexOf('[CardColor.', start + marker.length);
  return source.slice(start, next === -1 ? undefined : next);
}

function unitTypeValues(source) {
  const body = source.match(/export enum UnitType \{([\s\S]*?)\}/)?.[1] ?? '';
  const values = {};
  for (const match of body.matchAll(/(\w+)\s*=\s*'(\w+)'/g)) values[match[1]] = match[2];
  return values;
}

function weightedTypes(block, enumValues) {
  const body = block.match(/unitTypes:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
  const types = [];
  for (const match of body.matchAll(/UnitType\.(\w+)\s*,\s*weight:\s*(-?\d+)/g)) {
    const weight = Number(match[2]);
    if (weight <= 0) continue;
    const type = enumValues[match[1]];
    if (!type) throw new Error(`Unknown UnitType.${match[1]}`);
    types.push({ type, weight });
  }
  if (types.length === 0) throw new Error(`No weighted unit types for ${color}`);
  return types;
}

/** Largest remainder, so the counts sum to `count` and track the weights. */
function allocateUnitTypes(types, unitCount) {
  const total = types.reduce((sum, type) => sum + type.weight, 0);
  const rows = types.map((type) => {
    const exact = (unitCount * type.weight) / total;
    const count = Math.floor(exact);
    return { ...type, count, fraction: exact - count };
  });
  let left = unitCount - rows.reduce((sum, row) => sum + row.count, 0);
  const order = [...rows].sort(
    (a, b) => b.fraction - a.fraction || b.weight - a.weight || a.type.localeCompare(b.type)
  );
  for (const row of order) {
    if (left <= 0) break;
    row.count += 1;
    left -= 1;
  }
  return rows.sort((a, b) => b.count - a.count || b.weight - a.weight || a.type.localeCompare(b.type));
}

const rows = allocateUnitTypes(weightedTypes(colorBlock(pieSource, color), unitTypeValues(enumSource)), count);
console.log(`${color}: ${count} unit${count === 1 ? '' : 's'}`);
for (const row of rows) {
  console.log(`${row.type} ${row.count} (weight ${row.weight})`);
}
