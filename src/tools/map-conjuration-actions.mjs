/**
 * Maps action template keys onto conjuration_templates.json from
 * _all_cards_archive.json (lookup by unique card name).
 *
 * Spells: top-level `actions`
 * Units/lands: actions nested under `abilities`
 * Only effects that match known action templates are kept.
 *
 * Usage: node src/tools/map-conjuration-actions.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

/**
 * 1:1 archive effect.name → action template key.
 * Ambiguous effects (addCounters, applyUnitStatus, damagePlayer) are handled below.
 * Keep in sync with src/lib/sim/cards/action-templates-data.ts
 */
const EFFECT_TO_ACTION = {
  damageUnit: 'directDamage',
  healUnit: 'healUnit',
  damageLand: 'damageLand',
  destroyUnit: 'destroyUnit',
  fortifyLand: 'fortifyLand',
  reanimate: 'reanimate',
  drawCard: 'drawCards',
  bounceUnit: 'bounceUnit',
  forceMoveUnit: 'forceMoveUnit',
  fight: 'fight',
  cycleCards: 'cycleCards',
  tutorCard: 'tutorCard',
  regrowCard: 'regrowCard',
  addMana: 'addMana',
};

const STATUS_TO_ACTION = {
  mezz: 'mezz',
  stun: 'stun',
  root: 'root',
  daze: 'daze',
};

const ACTION_TEMPLATE_KEYS = new Set([
  'directDamage',
  'grow',
  'healUnit',
  'damageLand',
  'destroyUnit',
  'fortifyLand',
  'reanimate',
  'damageOpponent',
  'addGrowthCounters',
  'addDecayCounters',
  'drawCards',
  'mezz',
  'stun',
  'root',
  'daze',
  'bounceUnit',
  'forceMoveUnit',
  'fight',
  'cycleCards',
  'tutorCard',
  'regrowCard',
  'addMana',
]);

function effectToActionKeys(effect) {
  if (!effect?.name) return [];
  const keys = [];
  const args = effect.args ?? {};

  if (effect.name === 'addCounters') {
    const counterType = args.counterType;
    if (counterType === 'growth') {
      // Both templates exist for growth counters
      keys.push('grow', 'addGrowthCounters');
    } else if (counterType === 'decay') {
      keys.push('addDecayCounters');
    }
  } else if (effect.name === 'applyUnitStatus') {
    const status = STATUS_TO_ACTION[args.statusType];
    if (status) keys.push(status);
  } else if (effect.name === 'damagePlayer') {
    // Template is specifically opposing-player damage
    if (args.opposingPlayer !== false) {
      keys.push('damageOpponent');
    }
  } else if (EFFECT_TO_ACTION[effect.name]) {
    keys.push(EFFECT_TO_ACTION[effect.name]);
  }

  // useEnergy wraps another effect template
  if (effect.name === 'useEnergy' && args.effectTemplate) {
    keys.push(
      ...effectToActionKeys({
        name: args.effectTemplate,
        args: args.otherArgs ?? {},
      })
    );
  }

  return keys.filter((key) => ACTION_TEMPLATE_KEYS.has(key));
}

function collectActionKeys(card) {
  const keys = new Set();
  const walk = (actions) => {
    if (!actions) return;
    for (const action of actions) {
      for (const key of effectToActionKeys(action.effect)) {
        keys.add(key);
      }
    }
  };

  walk(card.actions);
  if (card.abilities) {
    for (const ability of card.abilities) {
      walk(ability.actions);
    }
  }
  return [...keys];
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

let withActions = 0;
const dist = {};

const updated = conjuration.map((card) => {
  const archiveCard = archiveByName.get(card.name);
  if (!archiveCard) {
    console.warn(`No archive card for "${card.name}"`);
    return card;
  }

  const actions = collectActionKeys(archiveCard);
  if (actions.length) {
    withActions++;
    for (const key of actions) {
      dist[key] = (dist[key] ?? 0) + 1;
    }
    return { ...card, actions };
  }

  // Drop stale actions if re-running
  const { actions: _drop, ...rest } = card;
  return rest;
});

writeFileSync(conjurationPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');

console.log(`Updated ${withActions}/${updated.length} cards with actions.`);
console.log('Distribution:', dist);
