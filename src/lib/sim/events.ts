import eventsData from '@/data/sim/events.json';
import { ActivityType, DayPeriod, EventTriggerType } from '../_model/enums-sim';
import type {
  EventOption,
  EventOptionTemplate,
  EventTemplate,
  Npc,
  SceneEvent,
} from '../_model/model-sim';
import { gs } from '../_state';
import {
  getAllEventTemplates,
  replaceEventTemplates,
  type StoredEventTemplate,
} from '../_state/event-templates';
import { SceneActionTemplates } from './actions';
import type { SocializeParameters } from './actions/socialize';
import { getCharactersAtScene } from './characters';
import { narrateText } from './narration';
import { getCurrentScheduledActivity } from './schedule';
import { getWeekDay } from './time';

/** Parameter shapes expected by each EventTriggerType (see doesTriggerMatch). */
export interface EventTriggerParameters {
  [EventTriggerType.PreviousEvents]: Record<string, unknown>; // required prior event keys
  [EventTriggerType.Day]: { day: number };
  /** Single `period` or `periods` (any match). Prefer `periods` when listing more than one. */
  [EventTriggerType.Period]: { period?: DayPeriod; periods?: DayPeriod[] };
  [EventTriggerType.ActivityType]: { activityType: ActivityType };
  [EventTriggerType.Place]: { placeKey: string };
  [EventTriggerType.CharacterPresent]: { characterKey: string };
  [EventTriggerType.RelationParameter]: {
    characterKey: string;
    relationParameter: keyof Npc['relationProgress'];
    value: number;
  };
  [EventTriggerType.Socialize]: SocializeParameters;
  [EventTriggerType.ActivityHistory]: {
    characterKey: string;
    activityType: ActivityType;
    value: number;
  };
  /** 1 = Monday … 7 = Sunday; any listed weekday matches. */
  [EventTriggerType.DayOfWeek]: { daysOfWeek: number[] };
  /** Matches when the current scheduled activity's `eventId` equals this event's key. */
  [EventTriggerType.ScheduledActivity]: Record<string, never>;
}

export type EventTrigger = {
  [K in EventTriggerType]: {
    triggerType: K;
    parameters: EventTriggerParameters[K];
  };
}[EventTriggerType];

/** Full immutable catalog (from IndexedDB / source). Never pruned during play. */
let allEventTemplates: StoredEventTemplate[] = [];
/** In-memory working set: catalog minus once-events already in gs.events.occurred. */
let eventTemplates: StoredEventTemplate[] = [];

function ensureEventProgress() {
  if (!gs.events) {
    gs.events = { occurred: [], unlocked: [] };
  } else {
    gs.events.occurred ??= [];
    gs.events.unlocked ??= [];
  }
}

async function readEventTemplatesSource(): Promise<EventTemplate[]> {
  try {
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (response.ok) {
      return (await response.json()) as EventTemplate[];
    }
  } catch {
    // Fall back to the bundled import outside the Vite dev server.
  }
  return eventsData as EventTemplate[];
}

export async function restoreEventTemplates() {
  const templates = await readEventTemplatesSource();
  await replaceEventTemplates(templates);
}

/** Rebuild the working set from the full catalog + current game progress. */
export function rebuildWorkingEventTemplates() {
  ensureEventProgress();
  const occurred = new Set(gs.events.occurred);
  eventTemplates = allEventTemplates.filter(
    (template) => !(template.triggersOnce && occurred.has(template.key))
  );
}

export async function loadEventTemplates() {
  // Repair catalogs pruned by older play sessions: source is the truth for content.
  const fromDb = await getAllEventTemplates();
  const fromSource = await readEventTemplatesSource();
  const dbKeys = new Set(fromDb.map((template) => template.key));
  const missingFromDb = fromSource.filter((template) => !dbKeys.has(template.key));

  if (fromDb.length === 0 || missingFromDb.length > 0) {
    const sourceKeys = new Set(fromSource.map((template) => template.key));
    const dbOnly = fromDb
      .filter((template) => !sourceKeys.has(template.key))
      .map(({ id: _id, ...template }) => template);
    await replaceEventTemplates([...fromSource, ...dbOnly]);
    allEventTemplates = await getAllEventTemplates();
  } else {
    allEventTemplates = fromDb;
  }

  rebuildWorkingEventTemplates();
}

/** Replace IndexedDB + in-memory templates with the given list (e.g. after editor save). */
export async function syncEventTemplates(templates: EventTemplate[]) {
  await replaceEventTemplates(templates);
  // Do not re-merge from source — that would overwrite the editor's just-saved catalog.
  allEventTemplates = await getAllEventTemplates();
  rebuildWorkingEventTemplates();
}

function isTemplateUnlocked(template: StoredEventTemplate): boolean {
  ensureEventProgress();
  if (!template.locked) return true;
  return gs.events.unlocked.includes(template.key);
}

export function getTriggeredSceneEvent():
  | { event: SceneEvent; template: StoredEventTemplate }
  | undefined {
  const template = eventTemplates.find(
    (eventTemplate) =>
      isTemplateUnlocked(eventTemplate) &&
      (eventTemplate.triggers ?? []).every((trigger) =>
        doesTriggerMatch(trigger, eventTemplate.key)
      )
  );
  if (!template) {
    return undefined;
  }
  return {
    template,
    event: {
      key: template.key,
      text: template.text,
      options: template.optionTemplates?.map(buildOption) ?? [],
    },
  };
}

export function getSceneEventByKey(
  templateKey: string
): { event: SceneEvent; template: StoredEventTemplate } | undefined {
  // Search full catalog so follow-ups / debug still resolve consumed once-events.
  const template = allEventTemplates.find((eventTemplate) => eventTemplate.key === templateKey);
  if (!template) {
    return undefined;
  }
  return {
    template,
    event: {
      key: template.key,
      text: template.text,
      options: template.optionTemplates?.map(buildOption) ?? [],
    },
  };
}

export function simulateEvent(templateKey: string) {
  const resolved = getSceneEventByKey(templateKey);
  if (!resolved) {
    return undefined;
  }
  const { event, template } = resolved;
  narrateText(event.text, {
    characterKey: template.characterArc,
    emotion: template.emotion,
    image: template.image,
    imageSize: template.imageSize,
    eventKey: template.key,
  });
  gs.scene.event = event;
  return event;
}

/** Drop a once-event from the in-memory working set. Catalog stays intact. */
export function consumeEventTemplate(template: StoredEventTemplate) {
  eventTemplates = eventTemplates.filter((eventTemplate) => eventTemplate !== template);
}

/** Record that an event fired (save-backed). Does not mutate catalog templates. */
export function recordEventOccured(template: StoredEventTemplate) {
  ensureEventProgress();
  const key = template.key;
  if (!gs.events.occurred.includes(key)) {
    gs.events.occurred.push(key);
  }
}

export function unlockEventTemplate(templateKey: string): boolean {
  const template = allEventTemplates.find((eventTemplate) => eventTemplate.key === templateKey);
  if (!template) {
    return false;
  }
  ensureEventProgress();
  if (!gs.events.unlocked.includes(templateKey)) {
    gs.events.unlocked.push(templateKey);
  }
  return true;
}

function doesTriggerMatch(trigger: EventTrigger, eventKey: string): boolean {
  // Keep trigger intact so switch narrows parameters per triggerType
  switch (trigger.triggerType) {
    case EventTriggerType.PreviousEvents:
      ensureEventProgress();
      return Object.keys(trigger.parameters).every((key) => gs.events.occurred.includes(key));
    case EventTriggerType.Day:
      return gs.time.day === trigger.parameters.day;
    case EventTriggerType.Period:
      return checkPeriod(trigger);
    case EventTriggerType.ActivityType:
      return getCurrentScheduledActivity()?.type === trigger.parameters.activityType;
    case EventTriggerType.Place:
      return gs.player.placeKey === trigger.parameters.placeKey;
    case EventTriggerType.RelationParameter:
      return checkRelationParameter(trigger);
    case EventTriggerType.Socialize:
      return checkSocialize(trigger);
    case EventTriggerType.CharacterPresent:
      return getCharactersAtScene().some(
        (character) => character.key === trigger.parameters.characterKey
      );
    case EventTriggerType.ActivityHistory:
      return checkActivityHistory(trigger);
    case EventTriggerType.DayOfWeek:
      return trigger.parameters.daysOfWeek.includes(getWeekDay(gs.time.day));
    case EventTriggerType.ScheduledActivity:
      return getCurrentScheduledActivity()?.eventId === eventKey;
    default:
      return false;
  }
}

function checkPeriod(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.Period }>
): boolean {
  const { period, periods } = trigger.parameters;
  if (periods && periods.length > 0) {
    return periods.includes(gs.time.period);
  }
  return period != null && gs.time.period === period;
}

function checkRelationParameter(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.RelationParameter }>
): boolean {
  const { characterKey, relationParameter, value } = trigger.parameters;
  const character = gs.characters[characterKey];
  if (value < 0) {
    return character.relationProgress[relationParameter] <= value;
  } else {
    return character.relationProgress[relationParameter] >= value;
  }
}

function checkSocialize(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.Socialize }>
): boolean {
  const context = gs.scene.socializeContext;
  if (!context) {
    return false;
  }
  return (
    context.characterKey === trigger.parameters.characterKey &&
    context.socializeType === trigger.parameters.socializeType
  );
}

function checkActivityHistory(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.ActivityHistory }>
): boolean {
  const { characterKey, activityType, value } = trigger.parameters;
  const character = gs.characters[characterKey];
  return (character.activityHistory[activityType] ?? 0) >= value;
}

function buildOption(optionTemplate: EventOptionTemplate): EventOption {
  const option: EventOption = {
    text: optionTemplate.text,
    outcome: {},
  };
  if (optionTemplate.actionTemplate) {
    const { actionTemplate, args } = optionTemplate.actionTemplate;
    option.outcome.action = SceneActionTemplates[actionTemplate](args);
  }
  if (optionTemplate.attributeCheck) {
    option.outcome.attributeCheck = optionTemplate.attributeCheck;
  } else if (optionTemplate.effects) {
    option.outcome.effects = optionTemplate.effects;
  }
  return option;
}
