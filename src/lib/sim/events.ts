import eventsData from '@/data/sim/events.json';
import {
  ActivityType,
  DayPeriod,
  EventEffectType,
  EventTriggerType,
  RelationTag,
} from '../_model/enums-sim';
import type {
  EventEffect,
  EventOption,
  EventOptionTemplate,
  EventPassage,
  EventTemplate,
  EventTemplateEffect,
  Npc,
  SceneEvent,
} from '../_model/model-sim';
import { gs } from '../_state';
import {
  getAllEventTemplates,
  replaceEventTemplates,
  type StoredEventTemplate,
} from '../_state/event-templates';
import { getLoadedModEvents, loadMods } from '../mods';
import { SceneActionTemplates } from './actions';
import { getActivityIllustrationRefs, probeFirstExistingImage } from './activity-image';
import { getCharactersAtScene } from './characters';
import { resolveRelationTag, updateRelationArc } from './effects/relations';
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
  /** NPC has at least `count` entries in `knownTraits`. */
  [EventTriggerType.KnownTraits]: { characterKey: string; count: number };
  /** `gs.scene.lastMatchWon === true` after a finished match. */
  [EventTriggerType.LastMatchWon]: Record<string, never>;
  /** `gs.scene.lastMatchWon === false` after a finished match. */
  [EventTriggerType.LastMatchLost]: Record<string, never>;
  /** Player owns a finished artifact (tool or trinket) with this `patternKey`. */
  [EventTriggerType.ArtifactOwned]: { patternKey: string };
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

/**
 * Root and node `effects` are `{ effect, triggers? }` couples. Older catalogs
 * stored bare `EventEffect[]` — wrap them so runtime and the editor stay consistent.
 */
function normalizeEffectEntries(
  entries: EventTemplateEffect[] | EventEffect[] | undefined
): EventTemplateEffect[] | undefined {
  if (!entries?.length) return entries as EventTemplateEffect[] | undefined;
  const first = entries[0] as EventTemplateEffect | EventEffect;
  if (first && typeof first === 'object' && 'effect' in first) {
    return entries as EventTemplateEffect[];
  }
  return (entries as EventEffect[]).map((effect) => ({ effect }));
}

export function normalizeEventTemplate<T extends EventTemplate>(template: T): T {
  const effects = normalizeEffectEntries(
    template.effects as EventTemplateEffect[] | EventEffect[] | undefined
  );
  let nodes = template.nodes;
  if (nodes) {
    let nodesChanged = false;
    const nextNodes: Record<string, (typeof nodes)[string]> = {};
    for (const [nodeKey, node] of Object.entries(nodes)) {
      const nodeEffects = normalizeEffectEntries(
        node.effects as EventTemplateEffect[] | EventEffect[] | undefined
      );
      if (nodeEffects !== node.effects) {
        nodesChanged = true;
        nextNodes[nodeKey] = { ...node, effects: nodeEffects };
      } else {
        nextNodes[nodeKey] = node;
      }
    }
    if (nodesChanged) nodes = nextNodes;
  }
  if (effects === template.effects && nodes === template.nodes) return template;
  return {
    ...template,
    ...(effects !== template.effects ? { effects } : {}),
    ...(nodes !== template.nodes ? { nodes } : {}),
  };
}

async function readEventTemplatesSource(): Promise<EventTemplate[]> {
  try {
    // Dev and preview merge events.json with every mods/<id>/events.json.
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (response.ok) {
      return ((await response.json()) as EventTemplate[]).map(normalizeEventTemplate);
    }
  } catch {
    // Static builds have no API; use the bundled catalog plus mods/index.json.
  }
  await loadMods();
  return [...(eventsData as EventTemplate[]), ...getLoadedModEvents<EventTemplate>()].map(
    normalizeEventTemplate
  );
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
  // Source is the truth for content (events.json + mods). Always refresh so edits to
  // existing keys (e.g. added nodes / nextNode) are not stuck behind a stale IndexedDB copy.
  const fromDb = (await getAllEventTemplates()).map(normalizeEventTemplate);
  const fromSource = await readEventTemplatesSource();
  const sourceKeys = new Set(fromSource.map((template) => template.key));
  const dbOnly = fromDb
    .filter((template) => !sourceKeys.has(template.key))
    .map(({ id: _id, ...template }) => template);
  await replaceEventTemplates([...fromSource, ...dbOnly]);
  allEventTemplates = (await getAllEventTemplates()).map(normalizeEventTemplate);

  rebuildWorkingEventTemplates();
}

/** Replace IndexedDB + in-memory templates with the given list (e.g. after editor save). */
export async function syncEventTemplates(templates: EventTemplate[]) {
  await replaceEventTemplates(templates.map(normalizeEventTemplate));
  // Do not re-merge from source — that would overwrite the editor's just-saved catalog.
  allEventTemplates = (await getAllEventTemplates()).map(normalizeEventTemplate);
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

/**
 * Events that must fire even when the period already has several events:
 * scheduled activities, exact-day triggers (not minDay alone), or priority > 0.
 */
function isForcedPeriodEvent(template: StoredEventTemplate): boolean {
  if ((template.priority ?? 0) > 0) return true;
  for (const trigger of template.triggers ?? []) {
    if (trigger.triggerType === EventTriggerType.ScheduledActivity) return true;
    if (trigger.triggerType === EventTriggerType.Day && trigger.parameters.day != null) {
      return true;
    }
  }
  return false;
}

export function getTriggeredSceneEvent():
  | { event: SceneEvent; template: StoredEventTemplate }
  | undefined {
  const periodHasRoom = gs.scene.eventsThisPeriod <= 1;
  const template = eventTemplates
    .filter(
      (eventTemplate) =>
        triggersMatch(eventTemplate) &&
        !manualTriggerLabel(eventTemplate) &&
        (isForcedPeriodEvent(eventTemplate) || periodHasRoom)
    )
    .sort((a, b) => {
      const forcedDiff = Number(isForcedPeriodEvent(b)) - Number(isForcedPeriodEvent(a));
      if (forcedDiff !== 0) return forcedDiff;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })[0];
  return triggeredFromTemplate(template);
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
export function recordEventOccured(template: StoredEventTemplate, resolvedText?: string) {
  ensureStoryTags();
  gs.scene.eventsThisPeriod += 1;
  const key = template.key;
  const text = resolvedText ?? resolveEventText(template);
  gs.storyTags[key] = (gs.storyTags[key] ?? 0) + 1;
  if (template.characterArc) {
    updateRelationArc({
      characterKey: template.characterArc,
      text,
      title: template.title,
      image: template.image,
    });
    if (!template.image) {
      attachActivityImageToArc(template.characterArc, text);
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

/** Catalog currently loaded in memory (main game plus mods). */
export function getLoadedEventTemplates(): readonly StoredEventTemplate[] {
  return allEventTemplates;
}

/** Whether this trigger matches the live game. */
export function eventTriggerMatches(trigger: EventTrigger, eventKey: string): boolean {
  return doesTriggerMatch(trigger, eventKey);
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
    case EventTriggerType.KnownTraits:
      return checkKnownTraits(trigger);
    case EventTriggerType.LastMatchWon:
      return gs.scene.lastMatchWon === true;
    case EventTriggerType.LastMatchLost:
      return gs.scene.lastMatchWon === false;
    case EventTriggerType.ArtifactOwned:
      return checkArtifactOwned(trigger);
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
  const resolved = resolveRelationTag(String(relationTag)) ?? relationTag;
  const hasTag = (character.relationTags ?? []).includes(resolved);
  if (value === -1) {
    return !hasTag;
  }
  return hasTag;
}

function checkKnownTraits(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.KnownTraits }>
): boolean {
  const { characterKey, count } = trigger.parameters;
  const character = gs.characters[characterKey];
  if (!character) return false;
  return (character.knownTraits?.length ?? 0) >= count;
}

function checkArtifactOwned(
  trigger: Extract<EventTrigger, { triggerType: EventTriggerType.ArtifactOwned }>
): boolean {
  const { patternKey } = trigger.parameters;
  if (!patternKey) return false;
  const artifacts = gs.player.artifacts;
  if (!artifacts) return false;
  const ownsTool = (artifacts.tools ?? []).some((tool) => tool.patternKey === patternKey);
  if (ownsTool) return true;
  return (artifacts.trinkets ?? []).some((trinket) => trinket.patternKey === patternKey);
}

const PASSAGE_TOKEN = /\{\{\s*([\w-]+)\s*\}\}/g;

/** First variant whose triggers all match, otherwise the passage fallback. */
function resolvePassage(passage: EventPassage, eventKey: string): string {
  for (const variant of passage.variants ?? []) {
    const triggers = variant.triggers ?? [];
    if (triggers.every((trigger) => doesTriggerMatch(trigger, eventKey))) {
      return variant.text ?? '';
    }
  }
  return passage.fallback ?? '';
}

/** Replace `{{ passageKey }}` tokens using current game state. Template text stays authored. */
export function resolveEventText(
  template: Pick<EventTemplate, 'key' | 'text' | 'passages'>
): string {
  const passages = template.passages;
  if (!passages) return template.text;
  return template.text.replace(PASSAGE_TOKEN, (_match, passageKey: string) => {
    const passage = passages[passageKey];
    if (!passage) return '';
    return resolvePassage(passage, template.key);
  });
}

function sceneEventFromTemplate(template: StoredEventTemplate): SceneEvent {
  return {
    key: template.key,
    text: resolveEventText(template),
    options: buildOptions(template, template.optionTemplates),
  };
}

function trimmedNodeKey(key: string | undefined): string | undefined {
  const trimmed = key?.trim();
  return trimmed ? trimmed : undefined;
}

function optionStartsMatch(optionTemplate: EventOptionTemplate): boolean {
  return (
    optionTemplate.effects?.some((effect) => effect.type === EventEffectType.StartMatch) ?? false
  );
}

/** Where an option can go. A missing node on a branch means that branch ends the event. */
function optionResolutions(optionTemplate: EventOptionTemplate): {
  endings: boolean;
  nodes: string[];
} {
  // Post-match node triggers are evaluated after the fight; don't hide the start option.
  if (optionStartsMatch(optionTemplate)) {
    return { endings: true, nodes: [] };
  }
  if (!optionTemplate.attributeCheck) {
    const node = trimmedNodeKey(optionTemplate.nextNode);
    return node ? { endings: false, nodes: [node] } : { endings: true, nodes: [] };
  }
  const success = trimmedNodeKey(
    optionTemplate.attributeCheck.successNode ?? optionTemplate.nextNode
  );
  const failure = trimmedNodeKey(
    optionTemplate.attributeCheck.failureNode ?? optionTemplate.nextNode
  );
  return {
    endings: !success || !failure,
    nodes: [success, failure].filter((node): node is string => !!node),
  };
}

/** Empty node triggers always match. A missing node is not enterable. */
export function nodeIsEnterable(template: EventTemplate, nodeKey: string): boolean {
  const node = template.nodes?.[nodeKey];
  if (!node) return false;
  const triggers = node.triggers ?? [];
  return triggers.every((trigger) => doesTriggerMatch(trigger, template.key));
}

/**
 * Root / node effect entries: omit or empty `triggers` always applies.
 * Otherwise every trigger must match (AND). Root entries are evaluated before the
 * event story tag stamps; node entries on enter, before that beat's passages and options.
 */
export function eventTemplateEffectApplies(entry: EventTemplateEffect, eventKey: string): boolean {
  const triggers = entry.triggers ?? [];
  return triggers.every((trigger) => doesTriggerMatch(trigger, eventKey));
}

/**
 * Omit triggers (or leave them empty) to always offer the option. Otherwise every trigger must match.
 * An option that can only open locked or missing nodes is hidden. A branch that ends the event
 * keeps the option available even when another branch's node is locked.
 */
function optionIsAvailable(optionTemplate: EventOptionTemplate, template: EventTemplate): boolean {
  const triggers = optionTemplate.triggers ?? [];
  if (
    triggers.length > 0 &&
    !triggers.every((trigger) => doesTriggerMatch(trigger, template.key))
  ) {
    return false;
  }
  const { endings, nodes } = optionResolutions(optionTemplate);
  if (endings || nodes.length === 0) return true;
  return nodes.some((nodeKey) => nodeIsEnterable(template, nodeKey));
}

function buildOptions(
  template: EventTemplate,
  optionTemplates: EventOptionTemplate[] | undefined
): EventOption[] {
  return (optionTemplates ?? [])
    .filter((optionTemplate) => optionIsAvailable(optionTemplate, template))
    .map((optionTemplate) => buildOption(optionTemplate, template));
}

/**
 * An explicit node that is locked ends that branch. It does not fall through to `nextNode`.
 * An omitted branch uses `nextNode` when that node is enterable.
 */
function resolveDestination(
  explicit: string | undefined,
  fallback: string | undefined,
  template: EventTemplate
): string | undefined {
  const named = trimmedNodeKey(explicit);
  if (named) return nodeIsEnterable(template, named) ? named : undefined;
  const fallbackKey = trimmedNodeKey(fallback);
  if (!fallbackKey) return undefined;
  return nodeIsEnterable(template, fallbackKey) ? fallbackKey : undefined;
}

function buildOption(optionTemplate: EventOptionTemplate, template: EventTemplate): EventOption {
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
    const successNode = resolveDestination(
      optionTemplate.attributeCheck.successNode,
      optionTemplate.nextNode,
      template
    );
    const failureNode = resolveDestination(
      optionTemplate.attributeCheck.failureNode,
      optionTemplate.nextNode,
      template
    );
    if (successNode) option.outcome.successNode = successNode;
    if (failureNode) option.outcome.failureNode = failureNode;
  } else if (optionTemplate.effects) {
    option.outcome.effects = optionTemplate.effects;
    if (optionStartsMatch(optionTemplate)) {
      // Enterability of nextNode is re-checked after the match (last_match_* triggers).
      const raw = trimmedNodeKey(optionTemplate.nextNode);
      if (raw) option.outcome.nextNode = raw;
    } else {
      const nextNode = resolveDestination(optionTemplate.nextNode, undefined, template);
      if (nextNode) option.outcome.nextNode = nextNode;
    }
  } else {
    const nextNode = resolveDestination(optionTemplate.nextNode, undefined, template);
    if (nextNode) option.outcome.nextNode = nextNode;
  }
  return option;
}

/** Later beat of an event already in progress. Does not stamp or consume the template. */
export function sceneEventForNode(
  template: EventTemplate,
  nodeKey: string
): SceneEvent | undefined {
  const node = template.nodes?.[nodeKey];
  if (!node) return undefined;
  return {
    key: template.key,
    nodeKey,
    text: resolveEventText({ key: template.key, text: node.text, passages: node.passages }),
    options: buildOptions(template, node.optionTemplates),
  };
}
