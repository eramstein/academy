/**
 * Maps unitTypes onto conjuration_templates.json from _all_cards_archive.json
 * (lookup by unique card name). Units missing unitTypes in the archive get
 * an inferred type from name keywords against UnitType enum values.
 *
 * Usage: node src/tools/map-conjuration-unit-types.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

const VALID_UNIT_TYPES = new Set([
  'mushroom',
  'beast',
  'human',
  'dwarf',
  'monster',
  'elemental',
  'spirit',
  'dragon',
  'demon',
  'halfing',
  'plant',
  'construct',
  'building',
  'undead',
]);

/** Archive aliases that aren't in the enum */
const TYPE_ALIASES = {
  hobbit: 'halfing',
};

/**
 * Name-based overrides for archive units that have no unitTypes.
 * Prefer explicit picks over fuzzy keyword matching for ambiguous names.
 */
const NAME_OVERRIDES = {
  'Agent of Chaos': ['demon'],
  Drake: ['dragon'],
  'Dwarf Cadencer': ['dwarf'],
  'Eagle Mounted Archers': ['human', 'beast'],
  Ebonheart: ['demon'],
  'Flying Carpet': ['construct'],
  'Frenzied Shaman': ['human'],
  'Giant Spider': ['monster'],
  'Gnome Engineer': ['halfing'],
  'Goblin Engineer': ['monster'],
  'Jumping Hare': ['beast'],
  Kobold: ['monster'],
  'Mad Ballooner': ['human'],
  "Modi's Chosen": ['human'],
  Mosquito: ['beast'],
  'Mountain Giant': ['monster'],
  'Mycosed Bear': ['beast', 'mushroom'],
  'Ogre Brawler': ['monster'],
  'Peaceful Faerie': ['spirit'],
  'Red Dragon': ['dragon'],
  'Savannah Lion': ['beast'],
  Snek: ['beast'],
  'Spirit of Speed and Fury': ['spirit'],
  Tim: ['human'],
  'Whirling Dervishes': ['human'],
  Wolf: ['beast'],
};

/** Ordered keyword hints used when no override / archive type exists */
const NAME_HINTS = [
  [/mushroom|myco|fung/i, 'mushroom'],
  [/dragon|drake|wyrm/i, 'dragon'],
  [/demon|devil|fiend|chaos/i, 'demon'],
  [/undead|skeleton|zombie|ghost|wraith|lich/i, 'undead'],
  [/spirit|faerie|fairy|wisp|soul/i, 'spirit'],
  [/elemental|golem|djinn|efreet/i, 'elemental'],
  [/dwarf/i, 'dwarf'],
  [/halfling|halfing|hobbit|gnome/i, 'halfing'],
  [/construct|cannon|automaton|machine|carpet|train|golem/i, 'construct'],
  [/building|tower|wall|fort|keep/i, 'building'],
  [/plant|tree|vine|bloom|flower/i, 'plant'],
  [/beast|wolf|bear|lion|hare|spider|eagle|bird|snake|snek|mosquito|cat|dog|boar|fox|rat/i, 'beast'],
  [/ogre|giant|troll|goblin|kobold|orc|monster/i, 'monster'],
  [/human|knight|archer|shaman|mage|wizard|warrior|rider|dervish|ballooner|chosen/i, 'human'],
];

function normalizeTypes(types) {
  const out = [];
  for (const raw of types) {
    const mapped = TYPE_ALIASES[raw] ?? raw;
    if (!VALID_UNIT_TYPES.has(mapped)) {
      console.warn(`  skipping unknown unitType "${raw}"`);
      continue;
    }
    if (!out.includes(mapped)) out.push(mapped);
  }
  return out;
}

function inferUnitTypes(name) {
  if (NAME_OVERRIDES[name]) {
    return [...NAME_OVERRIDES[name]];
  }
  const found = [];
  for (const [pattern, type] of NAME_HINTS) {
    if (pattern.test(name) && !found.includes(type)) {
      found.push(type);
    }
  }
  return found.length ? found : ['human'];
}

const archive = JSON.parse(readFileSync(join(root, 'src/data/_all_cards_archive.json'), 'utf8'));
const conjurationPath = join(root, 'src/data/sim/conjuration_templates.json');
const conjuration = JSON.parse(readFileSync(conjurationPath, 'utf8'));

const archiveByName = new Map();
for (const card of archive) {
  if (archiveByName.has(card.name)) {
    throw new Error(`Duplicate archive name: ${card.name}`);
  }
  archiveByName.set(card.name, card);
}

let fromArchive = 0;
let inferred = 0;
const inferredLog = [];

const updated = conjuration.map((card) => {
  if (card.cardType !== 'unit') {
    const { unitTypes: _drop, ...rest } = card;
    return rest;
  }

  const archiveCard = archiveByName.get(card.name);
  let unitTypes;

  if (archiveCard?.unitTypes?.length) {
    unitTypes = normalizeTypes(archiveCard.unitTypes);
    fromArchive++;
  } else {
    unitTypes = inferUnitTypes(card.name);
    inferred++;
    inferredLog.push({ name: card.name, unitTypes });
  }

  if (!unitTypes.length) {
    throw new Error(`No unitTypes resolved for "${card.name}"`);
  }

  return { ...card, unitTypes };
});

writeFileSync(conjurationPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');

console.log(`Updated ${fromArchive + inferred} unit cards (${fromArchive} from archive, ${inferred} inferred).`);
if (inferredLog.length) {
  console.log('Inferred:');
  for (const row of inferredLog) {
    console.log(`  ${row.name} -> ${JSON.stringify(row.unitTypes)}`);
  }
}
