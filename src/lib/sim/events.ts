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
  deleteEventTemplate,
  getAllEventTemplates,
  replaceEventTemplates,
  updateEventTemplate,
  type StoredEventTemplate,
} from '../_state/event-templates';
import { SceneActionTemplates } from './actions';
import { getCharactersAtScene } from './characters';
import { narrateText } from './narration';
import { getCurrentScheduledActivity } from './schedule';
import { getWeekDay } from './time';

/** Parameter shapes expected by each EventTriggerType (see doesTriggerMatch). */
export interface EventTriggerParameters {
  [EventTriggerType.PreviousEvents]: Record<string, unknown>; // pending prior event keys
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
  [EventTriggerType.ActivityHistory]: {
    characterKey: string;
    activityType: ActivityType;
    value: number;
  };
  /** 1 = Monday … 7 = Sunday; any listed weekday matches. */
  [EventTriggerType.DayOfWeek]: { daysOfWeek: number[] };
}

export type EventTrigger = {
  [K in EventTriggerType]: {
    triggerType: K;
    parameters: EventTriggerParameters[K];
  };
}[EventTriggerType];

let eventTemplates: StoredEventTemplate[] = [];

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

export async function loadEventTemplates() {
  eventTemplates = await getAllEventTemplates();
}

/** Replace IndexedDB + in-memory templates with the given list (e.g. after editor save). */
export async function syncEventTemplates(templates: EventTemplate[]) {
  await replaceEventTemplates(templates);
  await loadEventTemplates();
}

export function getTriggeredSceneEvent():
  | { event: SceneEvent; template: StoredEventTemplate }
  | undefined {
  const template = eventTemplates.find((eventTemplate) =>
    eventTemplate.triggers.every(doesTriggerMatch)
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

export function simulateEvent(templateKey: string) {
  const template = eventTemplates.find((eventTemplate) => eventTemplate.key === templateKey);
  if (!template) {
    return undefined;
  }
  const event = {
    key: template.key,
    text: template.text,
    options: template.optionTemplates?.map(buildOption) ?? [],
  };
  narrateText(event.text, {
    characterKey: template.characterArc,
    emotion: template.emotion,
    image: template.image,
    eventKey: template.key,
  });
  gs.scene.event = event;
  return event;
}

export function consumeEventTemplate(template: StoredEventTemplate) {
  eventTemplates = eventTemplates.filter((eventTemplate) => eventTemplate !== template);
  if (template.id !== undefined) {
    void deleteEventTemplate(template.id);
  }
  // for events requiring relation values, "consume" the relation value
  for (const trigger of template.triggers.filter(
    (t) => t.triggerType === EventTriggerType.RelationParameter
  )) {
    const { characterKey, relationParameter } = trigger.parameters;
    const character = gs.characters[characterKey];
    character.relationProgress[relationParameter] = 0;
  }
}

// clear other events triggers that required this one to trigger
export function recordEventOccured(template: StoredEventTemplate) {
  const key = template.key;
  for (const eventTemplate of eventTemplates) {
    let changed = false;
    eventTemplate.triggers = eventTemplate.triggers.filter((trigger) => {
      if (trigger.triggerType !== EventTriggerType.PreviousEvents) {
        return true;
      }
      if (key in trigger.parameters) {
        delete trigger.parameters[key];
        changed = true;
      }
      // Drop once all required prior events have occurred (or were already empty)
      if (Object.keys(trigger.parameters).length === 0) {
        changed = true;
        return false;
      }
      return true;
    });
    if (changed) {
      void updateEventTemplate(eventTemplate);
    }
  }
}

export function unlockEventTemplate(templateKey: string): boolean {
  const template = eventTemplates.find((eventTemplate) => eventTemplate.key === templateKey);
  if (!template) {
    return false;
  }
  template.locked = false;
  void updateEventTemplate(template);
  return true;
}

function doesTriggerMatch(trigger: EventTrigger): boolean {
  // Keep trigger intact so switch narrows parameters per triggerType
  switch (trigger.triggerType) {
    case EventTriggerType.PreviousEvents:
      // Satisfied when nothing is left to wait on (also handles already-empty params)
      return Object.keys(trigger.parameters).length === 0;
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
    case EventTriggerType.CharacterPresent:
      return getCharactersAtScene().some(
        (character) => character.key === trigger.parameters.characterKey
      );
    case EventTriggerType.ActivityHistory:
      return checkActivityHistory(trigger);
    case EventTriggerType.DayOfWeek:
      return trigger.parameters.daysOfWeek.includes(getWeekDay(gs.time.day));
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
  if (optionTemplate.effects) {
    option.outcome.effects = optionTemplate.effects;
  }
  return option;
}
