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
import { SceneActionTemplates } from './actions/_templates';
import { getCharactersAtScene } from './characters';
import { SceneEffectTemplates } from './effects/_templates';
import { getCurrentScheduledActivity } from './schedule';

let eventTemplates: StoredEventTemplate[] = [];

export async function restoreEventTemplates() {
  await replaceEventTemplates(eventsData as EventTemplate[]);
}

export async function loadEventTemplates() {
  eventTemplates = await getAllEventTemplates();
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
      options: template.optionTemplates.map(buildOption),
    },
  };
}

export function consumeEventTemplate(template: StoredEventTemplate) {
  eventTemplates = eventTemplates.filter((eventTemplate) => eventTemplate !== template);
  if (template.id !== undefined) {
    void deleteEventTemplate(template.id);
  }
}

function doesTriggerMatch(trigger: EventTrigger): boolean {
  const { parameters } = trigger;
  switch (trigger.triggerType) {
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
    outcome: {
      type: optionTemplate.outcomeType,
    },
  };
  if (optionTemplate.actionTemplate) {
    const { actionTemplate, args } = optionTemplate.actionTemplate;
    option.outcome.action = SceneActionTemplates[actionTemplate](args);
  }
  if (optionTemplate.effectsTemplates) {
    const { effectTemplate, args } = optionTemplate.effectsTemplates;
    option.outcome.effects = SceneEffectTemplates[effectTemplate](args);
  }
  return option;
}
