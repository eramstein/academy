// Inserts authored flavor templates into src/data/sim/card_flavor_templates.json.
// Usage: node .cursor/skills/complete-flavors/scripts/add-flavors.mjs <flavors.json>
// Existing entries are left unchanged. New objects are inserted in name order.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const catalogPath = path.join(root, 'src/data/sim/card_flavor_templates.json');
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Usage: node .cursor/skills/complete-flavors/scripts/add-flavors.mjs <flavors.json>');
  process.exit(1);
}

const COLORS = new Set(['red', 'green', 'blue', 'black']);
const SIZES = new Set(['weak', 'medium', 'powerful']);
const TYPES = new Set(['unit', 'spell']);

function nameToImageName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

const catalog = readJson(catalogPath);
const incoming = readJson(path.resolve(inputPath));
if (!Array.isArray(catalog)) {
  console.error('card_flavor_templates.json is not an array');
  process.exit(1);
}
if (!Array.isArray(incoming) || incoming.length === 0) {
  console.error('Input must be a non-empty JSON array.');
  process.exit(1);
}

const names = new Set(catalog.map((template) => template.name));
const imageNames = new Set(catalog.map((template) => template.imageName));
const errors = [];

for (const [index, template] of incoming.entries()) {
  const where = `entry ${index} (${template?.name ?? 'unnamed'})`;
  if (!template || typeof template !== 'object') {
    errors.push(`${where}: not an object`);
    continue;
  }
  if (typeof template.name !== 'string' || !template.name.trim()) errors.push(`${where}: name is required`);
  if (typeof template.imagePrompt !== 'string' || !template.imagePrompt.trim()) {
    errors.push(`${where}: imagePrompt is required`);
  }
  if (!TYPES.has(template.cardType)) errors.push(`${where}: cardType must be unit or spell`);
  if (!SIZES.has(template.unitSize)) errors.push(`${where}: unitSize must be weak, medium, or powerful`);
  if (template.cheapImage !== false) errors.push(`${where}: cheapImage must be false`);
  if (!Array.isArray(template.colors) || template.colors.length !== 1 || !COLORS.has(template.colors[0])) {
    errors.push(`${where}: colors must be a single red, green, blue, or black`);
  }
  if (!Array.isArray(template.keywords)) errors.push(`${where}: keywords must be an array`);
  const actions = template.actions ?? [];
  if (!Array.isArray(actions)) errors.push(`${where}: actions must be an array`);
  const keywordCount = Array.isArray(template.keywords) ? template.keywords.length : 0;
  if (template.cardType === 'spell') {
    if (keywordCount !== 0) errors.push(`${where}: spells do not take keywords`);
    if (actions.length !== 1) errors.push(`${where}: spells need exactly one action`);
    if (template.unitTypes) errors.push(`${where}: spells do not take unitTypes`);
    if (template.unitSize !== 'medium') errors.push(`${where}: spell gap-fills use unitSize "medium"`);
  } else if (keywordCount === 1 && actions.length === 0) {
    if (!Array.isArray(template.unitTypes) || template.unitTypes.length !== 1) {
      errors.push(`${where}: units need exactly one unitType`);
    }
  } else if (keywordCount === 0 && actions.length === 1) {
    if (!Array.isArray(template.unitTypes) || template.unitTypes.length !== 1) {
      errors.push(`${where}: units need exactly one unitType`);
    }
  } else {
    errors.push(`${where}: a unit fills either one keyword or one action, not both`);
  }
  if (template.name && names.has(template.name)) errors.push(`${where}: name already exists`);
  const imageName = nameToImageName(template.name ?? '');
  if (!imageName) errors.push(`${where}: imageName would be empty`);
  if (imageName && imageNames.has(imageName)) errors.push(`${where}: imageName "${imageName}" already exists`);
  if (template.imageName && template.imageName !== imageName) {
    errors.push(`${where}: imageName must be "${imageName}"`);
  }
  template.imageName = imageName;
  template.cheapImage = false;
  if (template.name) names.add(template.name);
  if (imageName) imageNames.add(imageName);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

function serialize(template) {
  const ordered = {
    name: template.name,
    imagePrompt: template.imagePrompt,
    imageName: template.imageName,
    cardType: template.cardType,
    unitSize: template.unitSize,
    cheapImage: false,
    colors: template.colors,
    keywords: template.keywords,
  };
  if (template.unitTypes) ordered.unitTypes = template.unitTypes;
  if (template.actions?.length) ordered.actions = template.actions;
  return JSON.stringify(ordered, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function insertBlock(source, block, name) {
  const objectPattern = /\n  \{[\s\S]*?\n  \}/g;
  let insertAt = -1;
  for (const match of source.matchAll(objectPattern)) {
    const existingName = match[0].match(/"name": "((?:\\.|[^"\\])*)"/)?.[1];
    if (existingName && existingName.localeCompare(name) > 0) {
      insertAt = match.index;
      break;
    }
  }
  if (insertAt === -1) {
    const close = source.lastIndexOf('\n]');
    let before = source.slice(0, close).replace(/\s*$/, '');
    if (!before.endsWith(',')) before += ',';
    return `${before}\n${block}\n]\n`;
  }
  const after = source.slice(insertAt);
  let before = source.slice(0, insertAt).replace(/\s*$/, '');
  if (before === '[') return `[\n${block},${after}`;
  if (!before.endsWith(',')) before += ',';
  return `${before}\n${block},${after}`;
}

let next = fs.readFileSync(catalogPath, 'utf8');
const sorted = [...incoming].sort((a, b) => a.name.localeCompare(b.name));
for (const template of sorted) {
  next = insertBlock(next, serialize(template), template.name);
}
JSON.parse(next);
fs.writeFileSync(catalogPath, next.endsWith('\n') ? next : `${next}\n`);
console.log(`Added ${incoming.length} template${incoming.length === 1 ? '' : 's'}.`);
