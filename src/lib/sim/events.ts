import eventsData from '@/data/sim/events.json';
import { ActivityType, DayPeriod, EventTriggerType, RelationTag } from '../_model/enums-sim';
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
import { getActivityIllustrationRefs, probeFirstExistingImage } from './activity-image';
import { getLoadedModEvents, loadMods } from '../mods';
import { getCharactersAtScene } from './characters';
import { updateRelationArc } from './effects/relations';
import { getCurrentScheduledActivity } from './schedule';
import { getWeekDay } from './time';

/** Parameter shapes expected by each EventTriggerType (see doesTriggerMatch). */
export interface EventTriggerParameters {
  /** Exact `day`, and/or `minDay` (day >= minDay). At least one required. */
  [EventTriggerType.Day]: { day?: number; minDay?: number };
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
  /** Player has won at least `count` matches against this NPC (`matchesRecord.won`). */
  [EventTriggerType.MatchesWon]: { characterKey: string; count: number };
  /** Player has lost at least `count` matches against this NPC (`matchesRecord.lost`). */
  [EventTriggerType.MatchesLost]: { characterKey: string; count: number };
  /** Character appears at least `count` times in `league.pastWinners`. */
  [EventTriggerType.LeaguesWon]: { characterKey: string; count: number };
  /**
   * `gs.storyTags[tag]` is at least `value` (auto-stamped event keys or `add_story_tag`).
   * Pass `value: -1` to require the tag be absent (missing or 0).
   */
  [EventTriggerType.StoryTag]: { tag: string; value: number };
  /**
   * NPC has `relationTag` on `relationTags`. Pass `value: -1` to require it absent.
   */
  [EventTriggerType.RelationTag]: {
    characterKey: string;
    relationTag: RelationTag;
    value?: number;
  };
}

export type EventTrigger = {
  [K in EventTriggerType]: {
    triggerType: K;
    parameters: EventTriggerParameters[K];
  };
}[EventTriggerType];

/** Full immutable catalog (from IndexedDB / source). Never pruned during play. */
let allEventTemplates: StoredEventTemplate[] = [];
/** In-memory working set: catalog minus events already stamped in `gs.storyTags`. */
let eventTemplates: StoredEventTemplate[] = [];

function ensureStoryTags() {
  if (!gs.storyTags) {
    gs.storyTags = {};
  }
}

function hasEventOccurred(key: string): boolean {
  ensureStoryTags();
  return (gs.storyTags[key] ?? 0) > 0;
}

async function readEventTemplatesSource(): Promise<EventTemplate[]> {
  try {
    // Dev and preview merge events.json with every mods/<id>/events.json.
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (response.ok) {
      return (await response.json()) as EventTemplate[];
    }
  } catch {
    // Static builds have no API; use the bundled catalog plus mods/index.json.
  }
  await loadMods();
  return [...(eventsData as EventTemplate[]), ...getLoadedModEvents<EventTemplate>()];
}

export async function restoreEventTemplates() {
  const templates = await readEventTemplatesSource();
  await replaceEventTemplates(templates);
}

/** Rebuild the working set from the full catalog + current game progress. */
export function rebuildWorkingEventTemplates() {
  ensureStoryTags();
  eventTemplates = allEventTemplates.filter((template) => !hasEventOccurred(template.key));
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

function manualTriggerLabel(template: StoredEventTemplate): string | undefined {
  const label = template.manualTrigger?.trim();
  return label ? label : undefined;
}

/** Empty triggers = follow-up / debug only; never a scene match. */
function triggersMatch(template: StoredEventTemplate): boolean {
  const triggers = template.triggers ?? [];
  return (
    triggers.length > 0 && triggers.every((trigger) => doesTriggerMatch(trigger, template.key))
  );
}

function triggeredFromTemplate(template: StoredEventTemplate | undefined) {
  if (!template) return undefined;
  return {
    template,
    event: sceneEventFromTemplate(template),
  };
}

export function getTriggeredSceneEvent(options?: {
  /**
   * Socialize: also take a manualTrigger event that matches only while
   * `socializeContext` is set. Scene-entry offers stay buttons.
   */
  includeManual?: boolean;
}): { event: SceneEvent; template: StoredEventTemplate } | undefined {
  const template = eventTemplates.find((eventTemplate) => {
    if (!triggersMatch(eventTemplate)) return false;
    if (!manualTriggerLabel(eventTemplate)) return true;
    if (!options?.includeManual) return false;
    return matchesOnlyBecauseOfSocialize(eventTemplate);
  });
  return triggeredFromTemplate(template);
}

/** True when clearing socializeContext makes this event's triggers fail. */
function matchesOnlyBecauseOfSocialize(template: StoredEventTemplate): boolean {
  const saved = gs.scene.socializeContext;
  gs.scene.socializeContext = undefined;
  const matchesWithout = triggersMatch(template);
  gs.scene.socializeContext = saved;
  return !matchesWithout;
}

/** Matching events that wait for a scene-action button (`manualTrigger` label). */
export function getManualSceneTriggers(): { eventKey: string; label: string }[] {
  const offers: { eventKey: string; label: string }[] = [];
  for (const template of eventTemplates) {
    const label = manualTriggerLabel(template);
    if (!label || !triggersMatch(template)) continue;
    offers.push({ eventKey: template.key, label });
  }
  return offers;
}

/** Working-set event whose manualTrigger button may be pressed right now. */
export function getPlayableManualTrigger(
  eventKey: string
): { event: SceneEvent; template: StoredEventTemplate } | undefined {
  const template = eventTemplates.find((eventTemplate) => eventTemplate.key === eventKey);
  if (!template || !manualTriggerLabel(template) || !triggersMatch(template)) {
    return undefined;
  }
  return triggeredFromTemplate(template);
}

export function getSceneEventByKey(
  templateKey: string
): { event: SceneEvent; template: StoredEventTemplate } | undefined {
  // Search full catalog so follow-ups / debug still resolve consumed events.
  const template = allEventTemplates.find((eventTemplate) => eventTemplate.key === templateKey);
  if (!template) {
    return undefined;
  }
  return {
    template,
    event: sceneEventFromTemplate(template),
  };
}

/** Drop a fired event from the in-memory working set. Catalog stays intact. */
export function consumeEventTemplate(template: StoredEventTemplate) {
  eventTemplates = eventTemplates.filter((eventTemplate) => eventTemplate !== template);
}

/** Record that an event fired (save-backed). Does not mutate catalog templates. */
export function recordEventOccured(template: StoredEventTemplate) {
  ensureStoryTags();
  const key = template.key;
  gs.storyTags[key] = (gs.storyTags[key] ?? 0) + 1;
  if (template.characterArc) {
    updateRelationArc({
      characterKey: template.characterArc,
      text: template.text,
      title: template.title,
      image: template.image,
    });
    if (!template.image) {
      attachActivityImageToArc(template.characterArc, template.text);
    }
  }
}

/** When an arc event has no art, probe the current activity illustration (same as Location). */
function attachActivityImageToArc(characterKey: string, text: string) {
  const activity = getCurrentScheduledActivity();
  if (!activity) return;

  const candidates = getActivityIllustrationRefs(activity);
  if (candidates.length === 0) return;

  void probeFirstExistingImage(candidates).then((image) => {
    if (!image) return;
    const character = gs.characters[characterKey];
    if (!character) return;
    // Match the beat that started as this event text (outcome prose may already be mixed in).
    const entry = [...character.relationArc]
      .reverse()
      .find((beat) => !beat.image && (beat.text === text || beat.text.startsWith(text)));
    if (entry) {
      entry.image = image.stored;
    }
  });
}

function doesTriggerMatch(trigger: EventTrigger, eventKey: string): boolean {
  // Keep trigger intact so switch narrows parameters per triggerType
  switch (trigger.triggerType) {
    case EventTriggerType.Day: {
      const { day, minDay } = trigger.parameters;
      if (day == null && minDay == null) return false;
      if (minDay != null && gs.time.day < minDay) return false;
      if (day != null && gs.time.day !== day) return false;
      return true;
    }
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
    case EventTriggerType.MatchesWon:
      return checkMatchesWon(trigger);
    case EventTriggerType.MatchesLost:
      return checkMatchesLost(trigger);
    case EventTriggerType.LeaguesWon:
      return checkLeaguesWon(trigger);
    case EventTriggerType.StoryTag:
      return checkStoryTag(trigger);
    case EventTriggerType.RelationTag:
      return checkRelationTag(trigger);
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

function checkMatchesWon(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.MatchesWon }>
): boolean {
  const { characterKey, count } = trigger.parameters;
  const character = gs.characters[characterKey];
  if (!character) return false;
  return (character.matchesRecord?.won ?? 0) >= count;
}

function checkMatchesLost(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.MatchesLost }>
): boolean {
  const { characterKey, count } = trigger.parameters;
  const character = gs.characters[characterKey];
  if (!character) return false;
  return (character.matchesRecord?.lost ?? 0) >= count;
}

function checkLeaguesWon(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.LeaguesWon }>
): boolean {
  const { characterKey, count } = trigger.parameters;
  const wins = gs.league.pastWinners.filter((winnerKey) => winnerKey === characterKey).length;
  return wins >= count;
}

function checkStoryTag(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.StoryTag }>
): boolean {
  const { tag, value } = trigger.parameters;
  const current = gs.storyTags?.[tag] ?? 0;
  if (value === -1) {
    return current === 0;
  }
  return current >= value;
}

function checkRelationTag(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.RelationTag }>
): boolean {
  const { characterKey, relationTag, value } = trigger.parameters;
  const character = gs.characters[characterKey];
  if (!character) return false;
  const hasTag = (character.relationTags ?? []).includes(relationTag);
  if (value === -1) {
    return !hasTag;
  }
  return hasTag;
}

function sceneEventFromTemplate(template: StoredEventTemplate): SceneEvent {
  return {
    key: template.key,
    text: template.text,
    options: buildOptions(template),
  };
}

/** Omit triggers (or leave them empty) to always offer the option. Otherwise every trigger must match. */
function optionIsAvailable(optionTemplate: EventOptionTemplate, eventKey: string): boolean {
  const triggers = optionTemplate.triggers ?? [];
  return triggers.length === 0 || triggers.every((trigger) => doesTriggerMatch(trigger, eventKey));
}

function buildOptions(template: StoredEventTemplate): EventOption[] {
  return (template.optionTemplates ?? [])
    .filter((optionTemplate) => optionIsAvailable(optionTemplate, template.key))
    .map(buildOption);
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
