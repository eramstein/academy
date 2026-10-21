// Validates src/data/sim/events.json and mods/<id>/events.json against the
// EventTemplate schema and the keys/templates actually registered in the codebase.
// Usage: node .cursor/skills/create-sim-event/scripts/validate-events.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf-8');
const errors = [];

function readModCatalogs() {
  const modsRoot = path.join(root, 'mods');
  if (!fs.existsSync(modsRoot)) return [];
  const catalogs = [];
  for (const entry of fs
    .readdirSync(modsRoot, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(entry.name)) continue;
    const relative = `mods/${entry.name}/events.json`;
    const full = path.join(modsRoot, entry.name, 'events.json');
    if (!fs.existsSync(full)) continue;
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(full, 'utf-8'));
    } catch (error) {
      errors.push(`${relative}: ${error.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${relative} must be an array`);
      continue;
    }
    catalogs.push({ source: relative, events: parsed });
  }
  return catalogs;
}

function enumValues(source, enumName) {
  const body = source.match(new RegExp(`export enum ${enumName} \\{([^}]*)\\}`))?.[1] ?? '';
  // Single- or double-quoted members (e.g. RelationTag.EmmaSmitten uses ").
  return [...body.matchAll(/(['"])(.*?)\1/g)].map((m) => m[2]);
}

function recordKeys(source, recordName) {
  const start = source.indexOf(recordName);
  const body = start === -1 ? '' : source.slice(start);
  return [
    ...body.matchAll(/^ {2}(?:\[?'?([\w-]+)'?\]?):\s*\((?:args(?:\s*=\s*\{\})?)?\)\s*=>/gm),
  ].map((m) => m[1]);
}

const enums = read('src/lib/_model/enums-sim.ts');
const battleEnums = read('src/lib/_model/enums-battle.ts');
const triggerTypes = enumValues(enums, 'EventTriggerType');
const resourceTypes = enumValues(enums, 'ResourceType');
const periods = enumValues(enums, 'DayPeriod');
const activityTypes = enumValues(enums, 'ActivityType');
const classTypes = enumValues(enums, 'ClassType');
const jobTypes = enumValues(enums, 'JobType');
const emotions = enumValues(enums, 'Emotion');
const relationTags = enumValues(enums, 'RelationTag');
const subscriptionTypes = enumValues(enums, 'SubscriptionType');
const possessionTypes = enumValues(enums, 'PossessionType');
const cardColors = enumValues(battleEnums, 'CardColor');

const effectTypes = enumValues(enums, 'EventEffectType');
const actionTemplates = recordKeys(
  read('src/lib/sim/actions/_templates.ts'),
  'SceneActionTemplates'
);

const npcsSource = read('src/data/npcs.ts');
const npcKeys = [...npcsSource.matchAll(/^ {4}key: '([^']+)'/gm)].map((m) => m[1]);
const characterKeys = ['player', ...npcKeys];

const placesSource = read('src/data/sim/places.ts');
const placeKeys = [
  ...placesSource.slice(0, placesSource.indexOf('const REGIONS')).matchAll(/^ {4}key: '([^']+)'/gm),
].map((m) => m[1]);

const deckKeys = [...read('src/lib/sim/effects/decks.ts').matchAll(/deckKey === '([^']+)'/g)].map(
  (m) => m[1]
);

const keywordKeys = [
  ...(
    read('src/lib/sim/cards/keywords.ts').match(
      /export const KEYWORD_KEYS[^=]*=\s*\[([^\]]*)\]/
    )?.[1] ?? ''
  ).matchAll(/['"](\w+)['"]/g),
].map((m) => m[1]);
const actionTemplateKeys = [
  ...read('src/lib/sim/cards/action-templates-data.ts').matchAll(/^ {2}(\w+):\s*\(/gm),
].map((m) => m[1]);
const abilityKeys = [...keywordKeys, ...actionTemplateKeys];

let mainEvents;
try {
  mainEvents = JSON.parse(read('src/data/sim/events.json'));
} catch (e) {
  console.error(`Failed to read event catalogs: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(mainEvents)) {
  console.error('events.json must be an array.');
  process.exit(1);
}

const modCatalogs = readModCatalogs();
const catalogs = [{ source: 'events.json', events: mainEvents }, ...modCatalogs];
const events = catalogs.flatMap((catalog) => catalog.events);
const eventSources = catalogs.flatMap((catalog) => catalog.events.map(() => catalog.source));
const eventKeys = events.map((event) => event?.key);
const at = (event, index) => `${event?.key ?? `#${index}`}`;

const seenKeys = new Map();
eventKeys.forEach((key, index) => {
  if (typeof key !== 'string' || !key) return;
  if (seenKeys.has(key)) {
    errors.push(
      `${at(events[index], index)}: duplicate key also used by ${seenKeys.get(key)} (events.json and mod catalogs share one key space)`
    );
  } else {
    seenKeys.set(key, `${eventSources[index]}:${key}`);
  }
});

function checkPassages(where, passages) {
  const keys = new Set();
  if (passages === undefined) return keys;
  if (!passages || typeof passages !== 'object' || Array.isArray(passages)) {
    errors.push(`${where}: passages must be an object`);
    return keys;
  }
  for (const [passageKey, passage] of Object.entries(passages)) {
    const passageWhere = `${where} passages.${passageKey}`;
    if (!/^[\w-]+$/.test(passageKey)) {
      errors.push(`${passageWhere}: key must be letters, digits, "_" or "-"`);
    }
    keys.add(passageKey);
    if (!passage || typeof passage !== 'object' || Array.isArray(passage)) {
      errors.push(`${passageWhere}: must be an object`);
      continue;
    }
    if (passage.fallback !== undefined && typeof passage.fallback !== 'string') {
      errors.push(`${passageWhere}: fallback must be a string`);
    }
    if (!Array.isArray(passage.variants)) {
      errors.push(`${passageWhere}: variants must be an array`);
      continue;
    }
    passage.variants.forEach((variant, i) => {
      const variantWhere = `${passageWhere} variants[${i}]`;
      if (!variant || typeof variant !== 'object') {
        errors.push(`${variantWhere}: must be an object`);
        return;
      }
      if (typeof variant.text !== 'string') {
        errors.push(`${variantWhere}: text must be a string`);
      }
      if (!Array.isArray(variant.triggers) || variant.triggers.length === 0) {
        errors.push(`${variantWhere}: triggers must be a non-empty array`);
      } else {
        variant.triggers.forEach((trigger, j) =>
          checkTrigger(`${variantWhere} trigger[${j}]`, trigger)
        );
      }
    });
  }
  return keys;
}

function checkOneOf(where, label, value, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${where}: unknown ${label} "${value}" (expected one of: ${allowed.join(', ')})`);
  }
}

function checkTrigger(where, trigger) {
  const params = trigger?.parameters;
  if (!params || typeof params !== 'object') {
    errors.push(`${where}: trigger is missing a parameters object`);
    return;
  }
  checkOneOf(where, 'triggerType', trigger.triggerType, triggerTypes);
  switch (trigger.triggerType) {
    case 'day': {
      if (params.day == null && params.minDay == null) {
        errors.push(`${where}: day needs day and/or minDay`);
      }
      if (params.day != null && !Number.isInteger(params.day)) {
        errors.push(`${where}: day must be an integer`);
      }
      if (params.minDay != null && !Number.isInteger(params.minDay)) {
        errors.push(`${where}: minDay must be an integer`);
      }
      break;
    }
    case 'period': {
      const list = Array.isArray(params.periods)
        ? params.periods
        : params.period != null
          ? [params.period]
          : [];
      if (list.length === 0) {
        errors.push(`${where}: period needs period or periods`);
      }
      for (const period of list) {
        checkOneOf(where, 'period', period, periods);
      }
      break;
    }
    case 'day_of_week': {
      if (!Array.isArray(params.daysOfWeek) || params.daysOfWeek.length === 0) {
        errors.push(`${where}: daysOfWeek must be a non-empty array`);
      } else {
        for (const day of params.daysOfWeek) {
          if (!Number.isInteger(day) || day < 1 || day > 7) {
            errors.push(`${where}: daysOfWeek values must be 1-7 (Monday-Sunday), got ${day}`);
          }
        }
      }
      break;
    }
    case 'activity_type':
      checkOneOf(where, 'activityType', params.activityType, activityTypes);
      break;
    case 'place':
      checkOneOf(where, 'placeKey', params.placeKey, placeKeys);
      break;
    case 'character_present':
      checkOneOf(where, 'characterKey', params.characterKey, characterKeys);
      break;
    case 'relation_parameter':
      checkOneOf(where, 'characterKey', params.characterKey, characterKeys);
      checkOneOf(where, 'relationParameter', params.relationParameter, [
        'friendship',
        'respect',
        'love',
        'rivalry',
      ]);
      if (typeof params.value !== 'number') errors.push(`${where}: value must be a number`);
      break;
    case 'activity_history':
      checkOneOf(where, 'characterKey', params.characterKey, npcKeys);
      checkOneOf(where, 'activityType', params.activityType, activityTypes);
      if (typeof params.value !== 'number' || !Number.isInteger(params.value) || params.value < 1) {
        errors.push(`${where}: value must be an integer ≥ 1`);
      }
      break;
    case 'matches_won':
      checkOneOf(where, 'characterKey', params.characterKey, npcKeys);
      if (typeof params.count !== 'number' || !Number.isInteger(params.count) || params.count < 1) {
        errors.push(`${where}: count must be an integer ≥ 1`);
      }
      break;
    case 'matches_lost':
      checkOneOf(where, 'characterKey', params.characterKey, npcKeys);
      if (typeof params.count !== 'number' || !Number.isInteger(params.count) || params.count < 1) {
        errors.push(`${where}: count must be an integer ≥ 1`);
      }
      break;
    case 'leagues_won':
      checkOneOf(where, 'characterKey', params.characterKey, characterKeys);
      if (typeof params.count !== 'number' || !Number.isInteger(params.count) || params.count < 1) {
        errors.push(`${where}: count must be an integer ≥ 1`);
      }
      break;
    case 'story_tag':
      if (typeof params.tag !== 'string' || !params.tag.trim()) {
        errors.push(`${where}: tag must be a non-empty string`);
      }
      if (
        typeof params.value !== 'number' ||
        !Number.isInteger(params.value) ||
        (params.value !== -1 && params.value < 1)
      ) {
        errors.push(`${where}: value must be an integer ≥ 1, or -1 for tag absent`);
      }
      break;
    case 'relation_tag':
      checkOneOf(where, 'characterKey', params.characterKey, characterKeys);
      checkOneOf(where, 'relationTag', params.relationTag, relationTags);
      if (
        params.value != null &&
        (typeof params.value !== 'number' ||
          !Number.isInteger(params.value) ||
          (params.value !== -1 && params.value < 1))
      ) {
        errors.push(`${where}: value must be an integer ≥ 1, or -1 for tag absent`);
      }
      break;
    case 'last_match_won':
    case 'last_match_lost':
      break;
    case 'known_traits':
      checkOneOf(where, 'characterKey', params.characterKey, npcKeys);
      if (typeof params.count !== 'number' || !Number.isInteger(params.count) || params.count < 1) {
        errors.push(`${where}: count must be an integer ≥ 1`);
      }
      break;
    case 'scheduled_activity':
      // No parameters: matches when current activity.eventId === this event's key.
      break;
  }
}

function checkSchedule(where, schedule) {
  const date = schedule?.date;
  const nextFree = schedule?.nextFree === true;
  const dayOfWeek = date?.dayOfWeek;
  if (schedule?.nextFree != null && typeof schedule.nextFree !== 'boolean') {
    errors.push(`${where}: schedule.nextFree must be a boolean`);
  }
  if (dayOfWeek != null) {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      errors.push(
        `${where}: schedule.date.dayOfWeek must be 1-7 (Monday-Sunday), got ${dayOfWeek}`
      );
    }
  }
  if (date) {
    const hasDayOfWeek = dayOfWeek != null;
    if (!nextFree && !hasDayOfWeek && !Number.isInteger(date.day)) {
      errors.push(`${where}: schedule.date.day must be an integer offset`);
    }
    if ((nextFree || hasDayOfWeek) && date.day != null && !Number.isInteger(date.day)) {
      errors.push(`${where}: schedule.date.day must be an integer offset when set`);
    }
    if (date.period) checkOneOf(where, 'schedule period', date.period, periods);
  } else if (nextFree) {
    // nextFree defaults to evening when date.period is omitted
  }
  const recurrence = schedule?.recurrence;
  if (recurrence) {
    if (recurrence.period) checkOneOf(where, 'recurrence period', recurrence.period, periods);
    for (const day of recurrence.daysOfWeek ?? []) {
      if (!Number.isInteger(day) || day < 1 || day > 7) {
        errors.push(`${where}: daysOfWeek values must be 1-7 (Monday-Sunday), got ${day}`);
      }
    }
  }
}

function checkPurchaseItems(where, items) {
  if (items === undefined) return;
  if (!items || typeof items !== 'object' || Array.isArray(items)) {
    errors.push(`${where}: items must be an object`);
    return;
  }
  if (items.resources !== undefined) {
    if (!items.resources || typeof items.resources !== 'object' || Array.isArray(items.resources)) {
      errors.push(`${where}: items.resources must be an object`);
    } else {
      for (const [type, amount] of Object.entries(items.resources)) {
        checkOneOf(where, 'resourceType', type, resourceTypes);
        if (typeof amount !== 'number' || amount < 1) {
          errors.push(`${where}: items.resources.${type} must be a positive number`);
        }
      }
    }
  }
  if (items.possessions !== undefined) {
    if (
      !items.possessions ||
      typeof items.possessions !== 'object' ||
      Array.isArray(items.possessions)
    ) {
      errors.push(`${where}: items.possessions must be an object`);
    } else {
      for (const [type, name] of Object.entries(items.possessions)) {
        checkOneOf(where, 'possessionType', type, possessionTypes);
        if (typeof name !== 'string' || !name.trim()) {
          errors.push(`${where}: items.possessions.${type} must be a non-empty string name`);
        }
      }
    }
  }
}

function checkActionTemplateArgs(where, actionTemplate) {
  const name = actionTemplate?.actionTemplate;
  const args = actionTemplate?.args ?? {};
  if (name !== 'purchase') return;
  if (typeof args.cost !== 'number' || args.cost < 0) {
    errors.push(`${where}: purchase args.cost must be a non-negative number`);
  }
  checkPurchaseItems(`${where} purchase args`, args.items);
  const hasResources = args.items?.resources && Object.keys(args.items.resources).length > 0;
  const hasPossessions = args.items?.possessions && Object.keys(args.items.possessions).length > 0;
  if (!hasResources && !hasPossessions) {
    errors.push(`${where}: purchase args.items must include resources and/or possessions`);
  }
}

function checkEffect(where, effect) {
  const parameters = effect?.parameters ?? {};
  checkOneOf(where, 'type', effect?.type, effectTypes);
  switch (effect?.type) {
    case 'get_deck':
      checkOneOf(where, 'deckKey', parameters.deckKey, deckKeys);
      break;
    case 'add_resource':
      checkOneOf(where, 'resourceType', parameters.resourceType, resourceTypes);
      if (typeof parameters.amount !== 'number') errors.push(`${where}: amount must be a number`);
      break;
    case 'add_gold':
      if (typeof parameters.amount !== 'number') errors.push(`${where}: amount must be a number`);
      if (parameters.characterKey !== undefined) {
        checkOneOf(where, 'characterKey', parameters.characterKey, characterKeys);
      }
      break;
    case 'add_possession':
      checkOneOf(where, 'type', parameters.type, possessionTypes);
      if (typeof parameters.name !== 'string' || !parameters.name.trim()) {
        errors.push(`${where}: name must be a non-empty string`);
      }
      if (typeof parameters.description !== 'string' || !parameters.description.trim()) {
        errors.push(`${where}: description must be a non-empty string`);
      }
      if (parameters.count !== undefined && typeof parameters.count !== 'number') {
        errors.push(`${where}: count must be a number`);
      }
      if (parameters.characterKey !== undefined) {
        checkOneOf(where, 'characterKey', parameters.characterKey, characterKeys);
      }
      break;
    case 'subscribe':
      checkOneOf(where, 'subscriptionType', parameters.subscriptionType, subscriptionTypes);
      if (typeof parameters.duration !== 'number') {
        errors.push(`${where}: duration must be a number`);
      }
      if (parameters.cost !== undefined && typeof parameters.cost !== 'number') {
        errors.push(`${where}: cost must be a number`);
      }
      break;
    case 'schedule_activity': {
      const activity = parameters.activity;
      if (!activity) {
        errors.push(`${where}: schedule_activity needs an activity object`);
        break;
      }
      checkOneOf(where, 'activity type', activity.type, activityTypes);
      checkOneOf(where, 'placeKey', activity.placeKey, placeKeys);
      if (activity.type === 'class') checkOneOf(where, 'classType', activity.classType, classTypes);
      if (!Array.isArray(activity.participants) || activity.participants.length === 0) {
        errors.push(`${where}: participants must be a non-empty array`);
      } else {
        for (const participant of activity.participants) {
          checkOneOf(where, 'participant', participant, characterKeys);
        }
      }
      if ('day' in activity || 'period' in activity) {
        errors.push(`${where}: put day/period under schedule, not activity`);
      }
      checkSchedule(where, parameters.schedule);
      break;
    }
    case 'get_job': {
      const job = parameters.job;
      if (!job) {
        errors.push(`${where}: get_job needs a job object`);
        break;
      }
      checkOneOf(where, 'jobType', job.jobType, jobTypes);
      checkOneOf(where, 'employerKey', job.employerKey, npcKeys);
      checkOneOf(where, 'placeKey', job.placeKey, placeKeys);
      if (typeof job.name !== 'string' || !job.name.trim()) {
        errors.push(`${where}: job name is required`);
      }
      if (typeof job.payPerActivity !== 'number') {
        errors.push(`${where}: payPerActivity must be a number`);
      }
      checkSchedule(where, job.schedule);
      break;
    }
    case 'follow_up_event':
      checkOneOf(where, 'eventKey', parameters.eventKey, eventKeys);
      break;
    case 'offer_card_gifts': {
      if (typeof parameters.count !== 'number') {
        errors.push(`${where}: count must be a number`);
      } else if (parameters.count < 1) {
        errors.push(`${where}: count must be at least 1`);
      }
      const hasPool =
        Array.isArray(parameters.poolKeys) &&
        parameters.poolKeys.length > 0 &&
        parameters.poolKeys.every((key) => typeof key === 'string' && key.trim());
      const hasSpecific =
        Array.isArray(parameters.specificCardKeys) &&
        parameters.specificCardKeys.length > 0 &&
        parameters.specificCardKeys.every((key) => typeof key === 'string' && key.trim());
      if (parameters.poolKeys !== undefined && !Array.isArray(parameters.poolKeys)) {
        errors.push(`${where}: poolKeys must be an array`);
      } else if (Array.isArray(parameters.poolKeys) && parameters.poolKeys.length > 0 && !hasPool) {
        errors.push(`${where}: poolKeys must be an array of non-empty strings`);
      }
      if (
        parameters.specificCardKeys !== undefined &&
        !Array.isArray(parameters.specificCardKeys)
      ) {
        errors.push(`${where}: specificCardKeys must be an array`);
      } else if (
        Array.isArray(parameters.specificCardKeys) &&
        parameters.specificCardKeys.length > 0 &&
        !hasSpecific
      ) {
        errors.push(`${where}: specificCardKeys must be an array of non-empty strings`);
      }
      if (!hasPool && !hasSpecific) {
        errors.push(`${where}: provide non-empty poolKeys and/or specificCardKeys`);
      }
      break;
    }
    case 'gift_card_to_character':
      checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      if (typeof parameters.cardKey !== 'string' || !parameters.cardKey.trim()) {
        errors.push(`${where}: cardKey must be a non-empty string`);
      }
      if (parameters.fromPlayer !== undefined && typeof parameters.fromPlayer !== 'boolean') {
        errors.push(`${where}: fromPlayer must be a boolean`);
      }
      break;
    case 'teach_color': {
      const hasCharacter = typeof parameters.characterKey === 'string' && parameters.characterKey;
      const hasColor = parameters.color !== undefined && parameters.color !== '';
      if (!hasCharacter && !hasColor) {
        errors.push(`${where}: teach_color needs color or characterKey`);
      }
      if (hasCharacter) checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      if (hasColor) checkOneOf(where, 'color', parameters.color, cardColors);
      break;
    }
    case 'teach_ability':
      if (parameters.ability !== undefined && parameters.ability !== '') {
        checkOneOf(where, 'ability', parameters.ability, abilityKeys);
      }
      if (typeof parameters.characterKey === 'string' && parameters.characterKey) {
        checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      }
      break;
    case 'narrate':
      if (typeof parameters.text !== 'string' || !parameters.text.trim()) {
        errors.push(`${where}: narrate text is required`);
      }
      break;
    case 'level_attribute':
      checkOneOf(where, 'attribute', parameters.attribute, [
        'dexterity',
        'intelligence',
        'vitality',
        'charisma',
        'aura',
      ]);
      if (parameters.amount !== undefined && typeof parameters.amount !== 'number') {
        errors.push(`${where}: amount must be a number`);
      }
      if (typeof parameters.characterKey === 'string' && parameters.characterKey) {
        checkOneOf(where, 'characterKey', parameters.characterKey, characterKeys);
      }
      break;
    case 'level_up_character':
      checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      break;
    case 'change_relation':
      checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      checkOneOf(where, 'relationParameter', parameters.relationParameter, [
        'friendship',
        'respect',
        'love',
        'rivalry',
      ]);
      if (typeof parameters.amount !== 'number') errors.push(`${where}: amount must be a number`);
      break;
    case 'update_relation_arc':
      checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      if (typeof parameters.text !== 'string' || !parameters.text) {
        errors.push(`${where}: text must be a non-empty string`);
      }
      if (parameters.image !== undefined && typeof parameters.image !== 'string') {
        errors.push(`${where}: image must be a string`);
      }
      break;
    case 'add_relation_tag':
      checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      checkOneOf(where, 'relationTag', parameters.relationTag, relationTags);
      break;
    case 'add_story_tag':
      if (typeof parameters.tag !== 'string' || !parameters.tag.trim()) {
        errors.push(`${where}: tag must be a non-empty string`);
      }
      if (parameters.amount !== undefined && typeof parameters.amount !== 'number') {
        errors.push(`${where}: amount must be a number`);
      }
      break;
    case 'add_known_trait':
      checkOneOf(where, 'characterKey', parameters.characterKey, npcKeys);
      if (typeof parameters.title !== 'string' || !parameters.title.trim()) {
        errors.push(`${where}: title must be a non-empty string`);
      }
      if (typeof parameters.description !== 'string' || !parameters.description.trim()) {
        errors.push(`${where}: description must be a non-empty string`);
      }
      break;
    case 'move':
      checkOneOf(where, 'placeKey', parameters.placeKey, placeKeys);
      if (!Array.isArray(parameters.characterKeys) || parameters.characterKeys.length === 0) {
        errors.push(`${where}: characterKeys must be a non-empty array`);
      } else {
        for (const characterKey of parameters.characterKeys) {
          checkOneOf(where, 'characterKey', characterKey, characterKeys);
        }
      }
      break;
    case 'use_focus':
      if (typeof parameters.amount !== 'number') errors.push(`${where}: amount must be a number`);
      break;
    case 'start_match':
      checkOneOf(where, 'opponentKey', parameters.opponentKey, npcKeys);
      if (parameters.playerDeckKey !== undefined && typeof parameters.playerDeckKey !== 'string') {
        errors.push(`${where}: playerDeckKey must be a string`);
      }
      if (parameters.isLeagueMatch !== undefined && typeof parameters.isLeagueMatch !== 'boolean') {
        errors.push(`${where}: isLeagueMatch must be a boolean`);
      }
      break;
    case 'new_league_season':
      if (parameters.winnerKey != null && parameters.winnerKey !== '') {
        checkOneOf(where, 'winnerKey', parameters.winnerKey, characterKeys);
      }
      break;
  }
}

const allowedEventProps = new Set([
  'key',
  'title',
  'text',
  'optionTemplates',
  'triggers',
  'effects',
  'characterArc',
  'emotion',
  'image',
  'imageSize',
  'manualTrigger',
  'passages',
  'nodes',
]);

const allowedNodeProps = new Set([
  'text',
  'optionTemplates',
  'triggers',
  'effects',
  'title',
  'emotion',
  'image',
  'imageSize',
  'passages',
]);

const imageSizes = ['small', 'medium', 'large'];

function checkImageSize(where, imageSize) {
  if (imageSize === undefined) return;
  checkOneOf(where, 'imageSize', imageSize, imageSizes);
}

function effectsIncludeFollowUp(effects) {
  return (effects ?? []).some((effect) => effect?.type === 'follow_up_event');
}

function templateEffectsIncludeFollowUp(entries) {
  return (entries ?? []).some((entry) => entry?.effect?.type === 'follow_up_event');
}

const allowedTemplateEffectProps = new Set(['effect', 'triggers']);

function checkTemplateEffectEntry(where, entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${where}: must be an object { effect, triggers? }`);
    return;
  }
  for (const prop of Object.keys(entry)) {
    if (!allowedTemplateEffectProps.has(prop)) {
      errors.push(`${where}: unknown property "${prop}" (expected effect / triggers)`);
    }
  }
  if (!entry.effect) {
    errors.push(`${where}: effect is required`);
  } else {
    checkEffect(`${where}.effect`, entry.effect);
  }
  if (entry.triggers !== undefined) {
    if (!Array.isArray(entry.triggers)) {
      errors.push(`${where}: triggers must be an array when set`);
    } else {
      entry.triggers.forEach((trigger, j) => checkTrigger(`${where} trigger[${j}]`, trigger));
    }
  }
}

function checkNodeRef(where, label, value, nodeKeys) {
  if (value === undefined) return;
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${where}: ${label} must be a non-empty string when set`);
    return;
  }
  if (!nodeKeys.has(value)) {
    errors.push(`${where}: ${label} "${value}" does not match a node`);
  }
}

function checkBeatOptions(where, options, nodeKeys) {
  if (options === undefined) return;
  if (!Array.isArray(options)) {
    errors.push(`${where}: optionTemplates must be an array`);
    return;
  }
  const attributeKeys = ['dexterity', 'intelligence', 'vitality', 'charisma', 'aura'];
  const difficultyKeys = ['trivial', 'veryeasy', 'easy', 'medium', 'hard', 'extreme', 'impossible'];
  options.forEach((option, i) => {
    const optionWhere = `${where} option[${i}]`;
    if (typeof option?.text !== 'string' || !option.text.trim()) {
      errors.push(`${optionWhere}: text is required`);
    }
    if (option?.triggers !== undefined) {
      if (!Array.isArray(option.triggers)) {
        errors.push(`${optionWhere}: triggers must be an array`);
      } else {
        option.triggers.forEach((trigger, j) =>
          checkTrigger(`${optionWhere} trigger[${j}]`, trigger)
        );
      }
    }
    if (option?.actionTemplate) {
      checkOneOf(
        optionWhere,
        'actionTemplate',
        option.actionTemplate.actionTemplate,
        actionTemplates
      );
      checkActionTemplateArgs(optionWhere, option.actionTemplate);
    }
    if (option?.attributeCheck && option?.effects) {
      errors.push(`${optionWhere}: use either effects or attributeCheck, not both`);
    }
    (option?.effects ?? []).forEach((effect, j) =>
      checkEffect(`${optionWhere} effects[${j}]`, effect)
    );
    checkNodeRef(optionWhere, 'nextNode', option?.nextNode, nodeKeys);
    if (option?.attributeCheck) {
      const check = option.attributeCheck;
      const checkWhere = `${optionWhere} attributeCheck`;
      if (!check || typeof check !== 'object') {
        errors.push(`${checkWhere}: must be an object`);
      } else {
        checkOneOf(checkWhere, 'attribute', check.attribute, attributeKeys);
        checkOneOf(checkWhere, 'difficulty', check.difficulty, difficultyKeys);
        (check.successEffects ?? []).forEach((effect, j) =>
          checkEffect(`${checkWhere} successEffects[${j}]`, effect)
        );
        (check.failureEffects ?? []).forEach((effect, j) =>
          checkEffect(`${checkWhere} failureEffects[${j}]`, effect)
        );
        checkNodeRef(checkWhere, 'successNode', check.successNode, nodeKeys);
        checkNodeRef(checkWhere, 'failureNode', check.failureNode, nodeKeys);
      }
    }
    const namedNodes = [
      option?.nextNode,
      option?.attributeCheck?.successNode,
      option?.attributeCheck?.failureNode,
    ].filter((key) => typeof key === 'string' && key.trim());
    if (namedNodes.length > 0 && option?.actionTemplate) {
      errors.push(`${optionWhere}: use either an action template or a next node, not both`);
    }
    const followUp =
      effectsIncludeFollowUp(option?.effects) ||
      effectsIncludeFollowUp(option?.attributeCheck?.successEffects) ||
      effectsIncludeFollowUp(option?.attributeCheck?.failureEffects);
    if (namedNodes.length > 0 && followUp) {
      errors.push(
        `${optionWhere}: follow_up_event starts another event; do not also set a next node`
      );
    }
  });
}

function checkTextPassages(where, text, passageKeys) {
  if (typeof text !== 'string') return;
  const referenced = [...text.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)].map((match) => match[1]);
  for (const passageKey of referenced) {
    if (!passageKeys.has(passageKey)) {
      errors.push(`${where}: text references unknown passage "${passageKey}"`);
    }
  }
  for (const passageKey of passageKeys) {
    if (!referenced.includes(passageKey)) {
      errors.push(`${where}: passage "${passageKey}" is not used in text`);
    }
  }
}

/** Validate `nodes` and return the set of node keys (empty when absent or invalid). */
function checkNodes(where, nodes) {
  const keys = new Set();
  if (nodes === undefined) return keys;
  if (!nodes || typeof nodes !== 'object' || Array.isArray(nodes)) {
    errors.push(`${where}: nodes must be an object`);
    return keys;
  }
  for (const [nodeKey, node] of Object.entries(nodes)) {
    const nodeWhere = `${where} node "${nodeKey}"`;
    if (!/^[\w-]+$/.test(nodeKey)) {
      errors.push(`${nodeWhere}: key must be letters, digits, "_" or "-"`);
    }
    keys.add(nodeKey);
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      errors.push(`${nodeWhere}: must be an object`);
      continue;
    }
    for (const prop of Object.keys(node)) {
      if (!allowedNodeProps.has(prop)) errors.push(`${nodeWhere}: unknown property "${prop}"`);
    }
    if (typeof node.text !== 'string' || !node.text.trim()) {
      errors.push(`${nodeWhere}: text is required`);
    }
    if (!Array.isArray(node.optionTemplates)) {
      errors.push(`${nodeWhere}: optionTemplates must be an array`);
    }
    if (node.title !== undefined && (typeof node.title !== 'string' || !node.title.trim())) {
      errors.push(`${nodeWhere}: title must be a non-empty string when set`);
    }
    if (node.emotion !== undefined) checkOneOf(nodeWhere, 'emotion', node.emotion, emotions);
    if (node.image !== undefined && (typeof node.image !== 'string' || !node.image.trim())) {
      errors.push(`${nodeWhere}: image must be a non-empty string when set`);
    }
    checkImageSize(nodeWhere, node.imageSize);
    if (node.triggers !== undefined) {
      if (!Array.isArray(node.triggers)) {
        errors.push(`${nodeWhere}: triggers must be an array`);
      } else {
        node.triggers.forEach((trigger, i) => checkTrigger(`${nodeWhere} trigger[${i}]`, trigger));
      }
    }
    for (const [i, entry] of (node.effects ?? []).entries()) {
      checkTemplateEffectEntry(`${nodeWhere} effects[${i}]`, entry);
    }
    if (
      Array.isArray(node.optionTemplates) &&
      node.optionTemplates.length > 0 &&
      templateEffectsIncludeFollowUp(node.effects)
    ) {
      errors.push(
        `${nodeWhere}: follow_up_event on enter replaces this beat; give it no options, or put the follow-up on an option that does not continue`
      );
    }
    const passageKeys = checkPassages(nodeWhere, node.passages);
    checkTextPassages(nodeWhere, node.text, passageKeys);
  }
  return keys;
}

events.forEach((event, index) => {
  const where = at(event, index);
  if (typeof event?.key !== 'string' || !event.key.trim()) {
    errors.push(`${where}: key is required`);
  } else if (eventKeys.indexOf(event.key) !== index) {
    errors.push(`${where}: duplicate key`);
  }
  if (typeof event?.text !== 'string' || !event.text.trim()) {
    errors.push(`${where}: text is required`);
  }
  const passageKeys = checkPassages(where, event?.passages);
  checkTextPassages(where, event?.text, passageKeys);
  if (event?.title !== undefined) {
    if (typeof event.title !== 'string' || !event.title.trim()) {
      errors.push(`${where}: title must be a non-empty string when set`);
    }
  }
  for (const prop of Object.keys(event ?? {})) {
    if (!allowedEventProps.has(prop)) errors.push(`${where}: unknown property "${prop}"`);
  }
  if (event?.characterArc !== undefined) {
    checkOneOf(where, 'characterArc', event.characterArc, npcKeys);
  }
  if (event?.emotion !== undefined) {
    checkOneOf(where, 'emotion', event.emotion, emotions);
  }
  if (event?.image !== undefined) {
    if (typeof event.image !== 'string' || !event.image.trim()) {
      errors.push(`${where}: image must be a non-empty string when set`);
    }
  }
  checkImageSize(where, event?.imageSize);
  if (event?.manualTrigger !== undefined) {
    if (typeof event.manualTrigger !== 'string' || !event.manualTrigger.trim()) {
      errors.push(`${where}: manualTrigger must be a non-empty string when set`);
    }
  }

  if (event?.triggers === undefined) {
    errors.push(`${where}: triggers is required (use [] for follow-up-only events)`);
  } else if (!Array.isArray(event.triggers)) {
    errors.push(`${where}: triggers must be an array`);
  } else {
    event.triggers.forEach((trigger, i) => checkTrigger(`${where} trigger[${i}]`, trigger));
  }

  for (const [i, entry] of (event?.effects ?? []).entries()) {
    checkTemplateEffectEntry(`${where} effects[${i}]`, entry);
  }

  const nodeKeys = checkNodes(where, event?.nodes);
  checkBeatOptions(`${where}`, event?.optionTemplates, nodeKeys);
  if (event?.nodes && typeof event.nodes === 'object' && !Array.isArray(event.nodes)) {
    for (const [nodeKey, node] of Object.entries(event.nodes)) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) continue;
      if (!Array.isArray(node.optionTemplates)) continue;
      checkBeatOptions(`${where} node "${nodeKey}"`, node.optionTemplates, nodeKeys);
    }
  }
});

if (errors.length > 0) {
  console.error(
    `${errors.length} problem(s) in event catalogs (events.json + mods/*/events.json):`
  );
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
const modCount = modCatalogs.reduce((count, catalog) => count + catalog.events.length, 0);
const modNote = modCount > 0 ? ` (+ ${modCount} from mods)` : '';
console.log(`OK: ${events.length} events valid${modNote}.`);
