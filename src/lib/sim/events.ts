import eventsData from '@/data/sim/events.json';
import {
  EventTriggerType,
  type EventOption,
  type EventOptionTemplate,
  type EventTemplate,
  type EventTrigger,
  type SceneEvent,
} from '../_model';
import { gs } from '../_state';
import {
  deleteEventTemplate,
  getAllEventTemplates,
  replaceEventTemplates,
  type StoredEventTemplate,
} from '../_state/event-templates';
import { SceneActionTemplates } from './actions';
import { getCharactersAtScene } from './characters';
import { resolveEffectTemplates } from './effects';
import { getCurrentScheduledActivity } from './schedule';

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
      text: template.text,
      options: template.optionTemplates?.map(buildOption) ?? [],
    },
  };
}

export function consumeEventTemplate(template: StoredEventTemplate) {
  eventTemplates = eventTemplates.filter((eventTemplate) => eventTemplate !== template);
  if (template.id !== undefined) {
    void deleteEventTemplate(template.id);
  }
}

// clear other events triggers that required this one to trigger
export function recordEventOccured(template: StoredEventTemplate) {
  for (const eventTemplate of eventTemplates) {
    for (const trigger of eventTemplate.triggers.filter(
      (trigger) => trigger.triggerType === EventTriggerType.PreviousEvents
    )) {
      if (trigger.parameters[template.key]) {
        delete trigger.parameters[template.key];
        if (Object.keys(trigger.parameters).length === 0) {
          eventTemplate.triggers = eventTemplate.triggers.filter((t) => t !== trigger);
        }
      }
    }
  }
}

function doesTriggerMatch(trigger: EventTrigger): boolean {
  const { parameters } = trigger;
  switch (trigger.triggerType) {
    case EventTriggerType.PreviousEvents:
      return false; // we assume it would have been removed by recordEventOccured
    case EventTriggerType.Day:
      return gs.time.day === parameters.day;
    case EventTriggerType.Period:
      return gs.time.period === parameters.period;
    case EventTriggerType.ActivityType:
      return getCurrentScheduledActivity()?.type === parameters.activityType;
    case EventTriggerType.Place:
      return gs.player.placeKey === parameters.placeKey;
    case EventTriggerType.CharacterPresent:
      return getCharactersAtScene().some((character) => character.key === parameters.characterKey);
    default:
      return false;
  }
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
  if (optionTemplate.effectsTemplates) {
    option.outcome.effects = resolveEffectTemplates(optionTemplate.effectsTemplates);
  }
  return option;
}
