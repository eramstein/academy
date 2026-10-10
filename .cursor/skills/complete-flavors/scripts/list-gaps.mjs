// Lists flavor-template coverage gaps against color-pie preferences.
// Usage: node .cursor/skills/complete-flavors/scripts/list-gaps.mjs [--color blue] [--facet keyword|action]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const COLORS = ['red', 'green', 'blue', 'black'];
const SIZES = ['weak', 'medium', 'powerful'];
const COLOR_ENUM = { red: 'Red', green: 'Green', blue: 'Blue', black: 'Black' };

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : process.argv[index + 1];
}

const colorFilter = arg('color');
const facetFilter = arg('facet');
if (colorFilter && !COLORS.includes(colorFilter)) {
  console.error(`Unknown color "${colorFilter}". Use ${COLORS.join(', ')}.`);
  process.exit(1);
}
if (facetFilter && facetFilter !== 'keyword' && facetFilter !== 'action') {
  console.error('Use --facet keyword or --facet action.');
  process.exit(1);
}

function keywordKeys(source) {
  const body = source.match(/KEYWORD_KEYS[\s\S]*?=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
  return [...body.matchAll(/"(\w+)"/g)].map((match) => match[1]);
}

function actionKeys(source) {
  const start = source.indexOf('export const actionTemplates');
  const body = start === -1 ? '' : source.slice(start);
  return [...body.matchAll(/^ {2}(\w+):\s*\(/gm)].map((match) => match[1]);
}

function colorBlock(source, color) {
  const marker = `[CardColor.${COLOR_ENUM[color]}]:`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Missing color pie block for ${color}`);
  const next = source.indexOf('[CardColor.', start + marker.length);
  return source.slice(start, next === -1 ? undefined : next);
}

function preferenceOverrides(block, field) {
  const start = block.indexOf(`${field}:`);
  if (start === -1) return {};
  const end = block.indexOf('},', start);
  const body = block.slice(start, end === -1 ? undefined : end);
  const prefs = {};
  for (const match of body.matchAll(/(\w+):\s*(-?\d+)/g)) {
    prefs[match[1]] = Number(match[2]);
  }
  return prefs;
}

function preferredUnitTypes(block) {
  const body = block.match(/unitTypes:\s*\[([^\]]*)\]/)?.[1] ?? '';
  return [...body.matchAll(/UnitType\.(\w+)/g)].map((match) => match[1].toLowerCase());
}

/** preference < 0: none. 0 or 1: one template. Above 1: that many templates. */
function requiredCount(preference) {
  if (preference < 0) return 0;
  if (preference > 1) return preference;
  return 1;
}

const keywords = keywordKeys(read('src/lib/sim/cards/keywords.ts'));
const actions = actionKeys(read('src/lib/sim/cards/action-templates-data.ts'));
const pieSource = read('src/lib/sim/cards/color-pie.ts');
const templates = JSON.parse(read('src/data/sim/card_flavor_templates.json'));

const pie = Object.fromEntries(
  COLORS.map((color) => {
    const block = colorBlock(pieSource, color);
    const keywordPrefs = Object.fromEntries(keywords.map((key) => [key, -1]));
    const actionPrefs = Object.fromEntries(actions.map((key) => [key, -2]));
    Object.assign(keywordPrefs, preferenceOverrides(block, 'keywordsPreferences'));
    Object.assign(actionPrefs, preferenceOverrides(block, 'actionPreferences'));
    return [color, { keywordPrefs, actionPrefs, unitTypes: preferredUnitTypes(block) }];
  })
);

function count(cardType, color, unitSize, facet, key) {
  let have = 0;
  for (const template of templates) {
    if (template.cardType !== cardType) continue;
    if (unitSize && template.unitSize !== unitSize) continue;
    if (!template.colors?.includes(color)) continue;
    const values = facet === 'keyword' ? template.keywords : template.actions;
    if (!values?.includes(key)) continue;
    have += 1;
  }
  return have;
}

const gaps = [];

function pushGap(gap) {
  if (colorFilter && gap.color !== colorFilter) return;
  if (facetFilter && gap.facet !== facetFilter) return;
  if (gap.missing <= 0) return;
  gaps.push(gap);
}

for (const color of COLORS) {
  const { keywordPrefs, actionPrefs, unitTypes } = pie[color];
  for (const size of SIZES) {
    for (const key of keywords) {
      const preference = keywordPrefs[key];
      const required = requiredCount(preference);
      const have = count('unit', color, size, 'keyword', key);
      pushGap({
        cardType: 'unit',
        color,
        unitSize: size,
        facet: 'keyword',
        key,
        preference,
        required,
        have,
        missing: required - have,
        unitTypes,
      });
    }
    for (const key of actions) {
      const preference = actionPrefs[key];
      const required = requiredCount(preference);
      const have = count('unit', color, size, 'action', key);
      pushGap({
        cardType: 'unit',
        color,
        unitSize: size,
        facet: 'action',
        key,
        preference,
        required,
        have,
        missing: required - have,
        unitTypes,
      });
    }
  }
  for (const key of actions) {
    const preference = actionPrefs[key];
    const required = requiredCount(preference);
    const have = count('spell', color, null, 'action', key);
    pushGap({
      cardType: 'spell',
      color,
      facet: 'action',
      key,
      preference,
      required,
      have,
      missing: required - have,
    });
  }
}

gaps.sort(
  (a, b) =>
    a.color.localeCompare(b.color) ||
    a.cardType.localeCompare(b.cardType) ||
    (a.unitSize ?? '').localeCompare(b.unitSize ?? '') ||
    b.preference - a.preference ||
    a.key.localeCompare(b.key)
);

const missing = gaps.reduce((sum, gap) => sum + gap.missing, 0);
if (gaps.length === 0) {
  console.log('OK');
} else {
  console.log(`${gaps.length} gaps, ${missing} templates missing`);
  for (const gap of gaps) {
    const size = gap.unitSize ? ` ${gap.unitSize}` : '';
    console.log(
      `${gap.cardType} ${gap.color}${size} ${gap.facet} ${gap.key} pref ${gap.preference} need ${gap.required} have ${gap.have} missing ${gap.missing}`
    );
  }
}
