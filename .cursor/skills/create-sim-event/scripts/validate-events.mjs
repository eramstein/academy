// Validates src/data/sim/events.json against the EventTemplate schema and the
// keys/templates actually registered in the codebase.
// Usage: node .cursor/skills/create-sim-event/scripts/validate-events.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf-8');
const errors = [];

function enumValues(source, enumName) {
  const body = source.match(new RegExp(`export enum ${enumName} \\{([^}]*)\\}`))?.[1] ?? '';
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function recordKeys(source, recordName) {
  const start = source.indexOf(recordName);
  const body = start === -1 ? '' : source.slice(start);
  return [...body.matchAll(/^ {2}(?:\[?'?([\w-]+)'?\]?):\s*\((?:args)?\)\s*=>/gm)].map((m) => m[1]);
}

const enums = read('src/lib/_model/enums-sim.ts');
const triggerTypes = enumValues(enums, 'EventTriggerType');
const resourceTypes = enumValues(enums, 'ResourceType');
const periods = enumValues(enums, 'DayPeriod');
const activityTypes = enumValues(enums, 'ActivityType');
const classTypes = enumValues(enums, 'ClassType');
const jobTypes = enumValues(enums, 'JobType');

const effectTemplates = recordKeys(
  read('src/lib/sim/effects/_templates.ts'),
  'SceneEffectTemplates'
);
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

const raw = read('src/data/sim/events.json');
let events;
try {
  events = JSON.parse(raw);
} catch (e) {
  console.error(`events.json is not valid JSON: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(events)) {
  console.error('events.json must be an array.');
  process.exit(1);
}

const eventKeys = events.map((event) => event?.key);
const at = (event, index) => `${event?.key ?? `#${index}`}`;

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
    case 'previous_events': {
      const keys = Object.keys(params);
      if (keys.length === 0) errors.push(`${where}: previous_events has no event keys`);
      for (const key of keys) {
        if (!eventKeys.includes(key)) errors.push(`${where}: unknown previous event "${key}"`);
        if (params[key] !== true) errors.push(`${where}: previous_events["${key}"] must be true`);
      }
      break;
    }
    case 'day':
      if (!Number.isInteger(params.day)) errors.push(`${where}: day must be an integer`);
      break;
    case 'period':
      checkOneOf(where, 'period', params.period, periods);
      break;
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
  }
}

function checkSchedule(where, schedule) {
  const date = schedule?.date;
  if (date) {
    if (!Number.isInteger(date.day))
      errors.push(`${where}: schedule.date.day must be an integer offset`);
    if (date.period) checkOneOf(where, 'schedule period', date.period, periods);
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

function checkEffect(where, effect) {
  const args = effect?.args ?? {};
  checkOneOf(where, 'effectTemplate', effect?.effectTemplate, effectTemplates);
  switch (effect?.effectTemplate) {
    case 'getDeck':
      checkOneOf(where, 'deckKey', args.deckKey, deckKeys);
      break;
    case 'addResource':
      checkOneOf(where, 'resourceType', args.resourceType, resourceTypes);
      if (typeof args.amount !== 'number') errors.push(`${where}: amount must be a number`);
      break;
    case 'scheduleActivity': {
      const activity = args.activity;
      if (!activity) {
        errors.push(`${where}: scheduleActivity needs an activity object`);
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
      checkSchedule(where, args.schedule);
      break;
    }
    case 'getJob': {
      const job = args.job;
      if (!job) {
        errors.push(`${where}: getJob needs a job object`);
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
    case 'unlockEvent':
      checkOneOf(where, 'eventKey', args.eventKey, eventKeys);
      break;
  }
}

const allowedEventProps = new Set([
  'key',
  'text',
  'optionTemplates',
  'triggers',
  'triggersOnce',
  'effectsTemplates',
  'characterArc',
]);

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
  for (const prop of Object.keys(event ?? {})) {
    if (!allowedEventProps.has(prop)) errors.push(`${where}: unknown property "${prop}"`);
  }
  if (event?.characterArc !== undefined) {
    checkOneOf(where, 'characterArc', event.characterArc, npcKeys);
  }

  if (!Array.isArray(event?.triggers) || event.triggers.length === 0) {
    errors.push(`${where}: at least one trigger is required`);
  } else {
    event.triggers.forEach((trigger, i) => checkTrigger(`${where} trigger[${i}]`, trigger));
  }

  for (const [i, effect] of (event?.effectsTemplates ?? []).entries()) {
    checkEffect(`${where} effectsTemplates[${i}]`, effect);
  }

  if (event?.optionTemplates !== undefined && !Array.isArray(event.optionTemplates)) {
    errors.push(`${where}: optionTemplates must be an array`);
  }
  (event?.optionTemplates ?? []).forEach((option, i) => {
    const optionWhere = `${where} option[${i}]`;
    if (typeof option?.text !== 'string' || !option.text.trim()) {
      errors.push(`${optionWhere}: text is required`);
    }
    if (option?.actionTemplate) {
      checkOneOf(
        optionWhere,
        'actionTemplate',
        option.actionTemplate.actionTemplate,
        actionTemplates
      );
    }
    (option?.effectsTemplates ?? []).forEach((effect, j) =>
      checkEffect(`${optionWhere} effectsTemplates[${j}]`, effect)
    );
  });
});

if (errors.length > 0) {
  console.error(`${errors.length} problem(s) in src/data/sim/events.json:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`OK: ${events.length} events valid.`);
