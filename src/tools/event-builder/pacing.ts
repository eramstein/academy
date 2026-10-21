import { npcs } from '@/data/npcs';
import {
  ActionType,
  ActivityType,
  ClassType,
  DayPeriod,
  EventEffectType,
  EventTriggerType,
  SchoolName,
  SubscriptionType,
  type Action,
  type EventEffect,
  type EventOptionTemplate,
  type EventTemplate,
  type EventTemplateEffect,
  type EventTrigger,
  type Schedule,
} from '@/lib/_model';
import { SceneActionTemplates } from '@/lib/sim/actions/_templates';
import { TransactionType } from '@/lib/sim/actions/transaction';
import type { ScheduleActivitiesParameters } from '@/lib/sim/effects/schedule';
import { resolveRelationTag } from '@/lib/sim/effects/relations';
import { getWeekDay } from '@/lib/sim/time';

const PERIODS = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];
const TERM_LENGTH = 42;

export interface PacingActivity {
  type: ActivityType;
  participants: string[];
  placeKey: string;
  day: number;
  period: DayPeriod;
  eventId?: string;
  classType?: ClassType;
}

interface PacingNpc {
  placeKey: string;
  school?: string;
  relationProgress: Record<string, number>;
  relationTags: string[];
  knownTraitTitles: string[];
  activityHistory: Record<string, number>;
  matchesWon: number;
  matchesLost: number;
}

/** Isolated playthrough. Never reads or writes the live save. */
export interface PacingWorld {
  day: number;
  period: DayPeriod;
  storyTags: Record<string, number>;
  resolved: { key: string; day: number; period: DayPeriod }[];
  /** Follow-ups pinned to the period that created them. */
  queued: { key: string; day: number; period: DayPeriod }[];
  activities: PacingActivity[];
  playerPlace: string;
  characters: Record<string, PacingNpc>;
  leaguesWon: Record<string, number>;
  lastMatchWon?: boolean;
  /** Event whose outcome is being walked. Its story tag is already stamped. */
  openKey?: string;
  academyScheduled: boolean;
}

export interface PacingChoice {
  label: string;
  notes: string[];
  effects: EventEffect[];
  /** Enter this node after effects when it is enterable. Otherwise the event ends. */
  nextNode?: string;
  matchWon?: boolean;
  opponentKey?: string;
  schedulesAcademy?: boolean;
}

export interface CalendarChip {
  key: string;
  label: string;
  status: 'ready' | 'planned' | 'done';
  open: boolean;
  /** Scene-button event (`manualTrigger`); playable here the same as automatic ones. */
  manual: boolean;
}

export interface CellContents {
  events: CalendarChip[];
  activities: string[];
}

export function createPacingWorld(): PacingWorld {
  const characters: Record<string, PacingNpc> = {};
  for (const [key, npc] of Object.entries(npcs)) {
    characters[key] = {
      placeKey: npc.placeKey,
      school: npc.school,
      relationProgress: { ...npc.relationProgress },
      relationTags: [...(npc.relationTags ?? [])],
      knownTraitTitles: (npc.knownTraits ?? []).map((trait) => trait.title),
      activityHistory: { ...(npc.activityHistory ?? {}) },
      matchesWon: npc.matchesRecord?.won ?? 0,
      matchesLost: npc.matchesRecord?.lost ?? 0,
    };
  }
  return {
    day: 1,
    period: DayPeriod.Morning,
    storyTags: {},
    resolved: [],
    queued: [],
    activities: [],
    playerPlace: 'admin-office',
    characters,
    leaguesWon: {},
    academyScheduled: false,
  };
}

export function cellContents(
  world: PacingWorld,
  templates: readonly EventTemplate[],
  day: number,
  period: DayPeriod
): CellContents {
  const events: CalendarChip[] = [];
  const resolvedHere = world.resolved.filter((item) => item.day === day && item.period === period);
  for (const item of resolvedHere) {
    events.push({
      key: item.key,
      label: eventLabel(templates, item.key),
      status: 'done',
      open: false,
      manual: isManualKey(templates, item.key),
    });
  }

  const ready = readyOn(world, templates, day, period);
  const readyKeys = new Set(ready.map((template) => template.key));
  for (const template of ready) {
    if (resolvedHere.some((item) => item.key === template.key)) continue;
    events.push({
      key: template.key,
      label: eventLabel(templates, template.key),
      status: 'ready',
      open: world.openKey === template.key,
      manual: isManual(template),
    });
  }

  const planned = new Set<string>();
  for (const activity of world.activities) {
    if (activity.day !== day || activity.period !== period || !activity.eventId) continue;
    if (planned.has(activity.eventId) || readyKeys.has(activity.eventId)) continue;
    if (world.resolved.some((item) => item.key === activity.eventId)) continue;
    planned.add(activity.eventId);
    events.push({
      key: activity.eventId,
      label: eventLabel(templates, activity.eventId),
      status: 'planned',
      open: false,
      manual: isManualKey(templates, activity.eventId),
    });
  }

  return {
    events,
    activities: world.activities
      .filter((activity) => activity.day === day && activity.period === period)
      .map(activityLabel),
  };
}

export function buildPacingChoices(
  template: EventTemplate,
  world: PacingWorld,
  nodeKey?: string
): PacingChoice[] {
  const beat = nodeKey ? template.nodes?.[nodeKey] : template;
  const options = beat?.optionTemplates ?? [];
  const choices: PacingChoice[] = [];
  for (const option of options) {
    if (!optionTriggersMatch(option, world, template.key)) continue;
    if (option.attributeCheck) {
      choices.push(attributeChoice(template, world, option, true));
      choices.push(attributeChoice(template, world, option, false));
      continue;
    }
    if (optionStartsMatch(option)) {
      const opponentKey = matchOpponent(option);
      const nextNode = trimmed(option.nextNode);
      const effects = option.effects ?? [];
      choices.push(matchChoice(option.text, effects, nextNode, true, opponentKey));
      choices.push(matchChoice(option.text, effects, nextNode, false, opponentKey));
      continue;
    }
    const authored = trimmed(option.nextNode);
    const nextNode = authored ? enterableNode(template, authored, world) : undefined;
    if (authored && !nextNode) continue;
    const schedulesAcademy = optionSchedulesAcademy(option);
    choices.push({
      label: option.text,
      notes: choiceNotes(option.effects ?? [], schedulesAcademy, nextNode),
      effects: option.effects ?? [],
      nextNode,
      schedulesAcademy,
    });
  }
  return choices;
}

/** Applies the choice. Returns the next node key, or nothing when the event is finished. */
export function applyPacingChoice(
  world: PacingWorld,
  template: EventTemplate,
  choice: PacingChoice
): string | undefined {
  if (isResolved(world, template.key)) return undefined;
  beginPacingEvent(world, template);
  if (choice.matchWon !== undefined) {
    world.lastMatchWon = choice.matchWon;
    const npc = choice.opponentKey ? world.characters[choice.opponentKey] : undefined;
    if (npc) {
      if (choice.matchWon) npc.matchesWon += 1;
      else npc.matchesLost += 1;
    }
  }
  for (const effect of choice.effects) applyEffect(world, effect);
  if (choice.schedulesAcademy) scheduleAcademyClasses(world);
  if (choice.nextNode && enterNode(world, template, choice.nextNode)) return choice.nextNode;
  completePacingEvent(world, template.key);
  return undefined;
}

/** Events with nothing to choose still stamp, apply on-fire effects, and finish. */
export function finishPacingEvent(world: PacingWorld, template: EventTemplate) {
  if (isResolved(world, template.key)) return;
  beginPacingEvent(world, template);
  completePacingEvent(world, template.key);
}

function readyOn(
  world: PacingWorld,
  templates: readonly EventTemplate[],
  day: number,
  period: DayPeriod
): EventTemplate[] {
  const found = new Map<string, EventTemplate>();
  if (world.day === day && world.period === period) {
    for (const template of templates) {
      if (isResolved(world, template.key)) continue;
      const open = world.openKey === template.key;
      if (open || triggersMatch(template, world)) {
        found.set(template.key, template);
      }
    }
  }
  for (const queued of world.queued) {
    if (queued.day !== day || queued.period !== period) continue;
    if (isResolved(world, queued.key) || found.has(queued.key)) continue;
    const template = templates.find((item) => item.key === queued.key);
    if (template) found.set(template.key, template);
  }
  return [...found.values()].sort(compareEvents);
}

function beginPacingEvent(world: PacingWorld, template: EventTemplate) {
  if (world.openKey === template.key) return;
  for (const entry of template.effects ?? []) {
    if (entryApplies(entry, world, template.key)) applyEffect(world, entry.effect);
  }
  if ((world.storyTags[template.key] ?? 0) < 1) {
    world.storyTags[template.key] = 1;
  }
  world.openKey = template.key;
}

function completePacingEvent(world: PacingWorld, key: string) {
  if (!isResolved(world, key)) {
    world.resolved.push({ key, day: world.day, period: world.period });
  }
  world.openKey = undefined;
  world.queued = world.queued.filter((queued) => queued.key !== key);
}

function enterNode(world: PacingWorld, template: EventTemplate, nodeKey: string): boolean {
  const node = template.nodes?.[nodeKey];
  if (!node || !nodeEnterable(template, nodeKey, world)) return false;
  for (const entry of node.effects ?? []) {
    if (entryApplies(entry, world, template.key)) applyEffect(world, entry.effect);
  }
  return true;
}

function enterableNode(template: EventTemplate, nodeKey: string, world: PacingWorld): string | undefined {
  return nodeEnterable(template, nodeKey, world) ? nodeKey : undefined;
}

function nodeEnterable(template: EventTemplate, nodeKey: string, world: PacingWorld): boolean {
  const node = template.nodes?.[nodeKey];
  if (!node) return false;
  return (node.triggers ?? []).every((trigger) => triggerMatches(trigger, world, template.key));
}

function isResolved(world: PacingWorld, key: string): boolean {
  return world.resolved.some((item) => item.key === key);
}

function isManual(template: EventTemplate): boolean {
  return !!template.manualTrigger?.trim();
}

function isManualKey(templates: readonly EventTemplate[], key: string): boolean {
  const template = templates.find((item) => item.key === key);
  return template ? isManual(template) : false;
}

function triggersMatch(template: EventTemplate, world: PacingWorld): boolean {
  const triggers = template.triggers ?? [];
  return triggers.length > 0 && triggers.every((trigger) => triggerMatches(trigger, world, template.key));
}

function optionTriggersMatch(option: EventOptionTemplate, world: PacingWorld, eventKey: string): boolean {
  return (option.triggers ?? []).every((trigger) => triggerMatches(trigger, world, eventKey));
}

function entryApplies(entry: EventTemplateEffect, world: PacingWorld, eventKey: string): boolean {
  return (entry.triggers ?? []).every((trigger) => triggerMatches(trigger, world, eventKey));
}

interface SceneNow {
  place: string;
  present: Set<string>;
  activityTypes: Set<ActivityType>;
  eventIds: Set<string>;
}

function sceneNow(world: PacingWorld): SceneNow {
  const here = world.activities.filter(
    (activity) => activity.day === world.day && activity.period === world.period
  );
  const eventIds = new Set(
    here.map((activity) => activity.eventId).filter((id): id is string => !!id)
  );
  const activityTypes = new Set(here.map((activity) => activity.type));
  const primary = here[0];
  if (!primary) {
    const present = new Set<string>();
    for (const [key, npc] of Object.entries(world.characters)) {
      if (npc.placeKey === world.playerPlace) present.add(key);
    }
    return { place: world.playerPlace, present, activityTypes, eventIds };
  }
  const present = new Set<string>();
  for (const activity of here) {
    for (const key of activity.participants) present.add(key);
  }
  const classHere = here.some((activity) => activity.type === ActivityType.Class);
  for (const [key, npc] of Object.entries(world.characters)) {
    if (npc.placeKey === primary.placeKey) present.add(key);
    if (classHere && npc.school === SchoolName.Academy) present.add(key);
  }
  return { place: primary.placeKey, present, activityTypes, eventIds };
}

function triggerMatches(trigger: EventTrigger, world: PacingWorld, eventKey: string): boolean {
  switch (trigger.triggerType) {
    case EventTriggerType.Day: {
      const { day, minDay } = trigger.parameters;
      if (day == null && minDay == null) return false;
      if (minDay != null && world.day < minDay) return false;
      if (day != null && world.day !== day) return false;
      return true;
    }
    case EventTriggerType.Period: {
      const { period, periods } = trigger.parameters;
      if (periods && periods.length > 0) return periods.includes(world.period);
      return period != null && world.period === period;
    }
    case EventTriggerType.ActivityType:
      return sceneNow(world).activityTypes.has(trigger.parameters.activityType);
    case EventTriggerType.Place:
      return sceneNow(world).place === trigger.parameters.placeKey;
    case EventTriggerType.CharacterPresent:
      return sceneNow(world).present.has(trigger.parameters.characterKey);
    case EventTriggerType.RelationParameter: {
      const { characterKey, relationParameter, value } = trigger.parameters;
      const npc = world.characters[characterKey];
      if (!npc) return false;
      const current = npc.relationProgress[relationParameter] ?? 0;
      return value < 0 ? current <= value : current >= value;
    }
    case EventTriggerType.ActivityHistory: {
      const { characterKey, activityType, value } = trigger.parameters;
      return activityCount(world, characterKey, activityType) >= value;
    }
    case EventTriggerType.DayOfWeek:
      return trigger.parameters.daysOfWeek.includes(getWeekDay(world.day));
    case EventTriggerType.ScheduledActivity:
      return sceneNow(world).eventIds.has(eventKey);
    case EventTriggerType.MatchesWon: {
      const npc = world.characters[trigger.parameters.characterKey];
      return (npc?.matchesWon ?? 0) >= trigger.parameters.count;
    }
    case EventTriggerType.MatchesLost: {
      const npc = world.characters[trigger.parameters.characterKey];
      return (npc?.matchesLost ?? 0) >= trigger.parameters.count;
    }
    case EventTriggerType.LeaguesWon:
      return (world.leaguesWon[trigger.parameters.characterKey] ?? 0) >= trigger.parameters.count;
    case EventTriggerType.StoryTag: {
      const { tag, value } = trigger.parameters;
      const current = world.storyTags[tag] ?? 0;
      if (value === -1) return current === 0;
      return current >= value;
    }
    case EventTriggerType.RelationTag: {
      const { characterKey, relationTag, value } = trigger.parameters;
      const npc = world.characters[characterKey];
      if (!npc) return false;
      const resolved = resolveRelationTag(String(relationTag)) ?? relationTag;
      const hasTag = npc.relationTags.includes(resolved);
      return value === -1 ? !hasTag : hasTag;
    }
    case EventTriggerType.KnownTraits: {
      const npc = world.characters[trigger.parameters.characterKey];
      return (npc?.knownTraitTitles.length ?? 0) >= trigger.parameters.count;
    }
    case EventTriggerType.LastMatchWon:
      return world.lastMatchWon === true;
    case EventTriggerType.LastMatchLost:
      return world.lastMatchWon === false;
    default:
      return false;
  }
}

function activityCount(world: PacingWorld, characterKey: string, activityType: ActivityType): number {
  const npc = world.characters[characterKey];
  const base = npc?.activityHistory[activityType] ?? 0;
  const now = slotIndex(world.day, world.period);
  const extra = world.activities.filter(
    (activity) =>
      activity.type === activityType &&
      activity.participants.includes(characterKey) &&
      slotIndex(activity.day, activity.period) <= now
  ).length;
  return base + extra;
}

function slotIndex(day: number, period: DayPeriod): number {
  return day * PERIODS.length + PERIODS.indexOf(period);
}

function applyEffect(world: PacingWorld, effect: EventEffect) {
  switch (effect.type) {
    case EventEffectType.AddStoryTag: {
      const tag = typeof effect.parameters.tag === 'string' ? effect.parameters.tag.trim() : '';
      const amount = typeof effect.parameters.amount === 'number' ? effect.parameters.amount : 1;
      if (!tag || !Number.isFinite(amount)) return;
      world.storyTags[tag] = (world.storyTags[tag] ?? 0) + amount;
      return;
    }
    case EventEffectType.ScheduleActivity:
      scheduleFromEffect(world, effect.parameters as ScheduleActivitiesParameters);
      return;
    case EventEffectType.ChangeRelation: {
      const { characterKey, relationParameter, amount } = effect.parameters;
      const npc = world.characters[characterKey];
      if (!npc || typeof amount !== 'number') return;
      npc.relationProgress[relationParameter] = (npc.relationProgress[relationParameter] ?? 0) + amount;
      return;
    }
    case EventEffectType.AddRelationTag: {
      const npc = world.characters[effect.parameters.characterKey];
      if (!npc) return;
      const tag = resolveRelationTag(String(effect.parameters.relationTag)) ?? effect.parameters.relationTag;
      if (tag && !npc.relationTags.includes(tag)) npc.relationTags.push(String(tag));
      return;
    }
    case EventEffectType.AddKnownTrait: {
      const npc = world.characters[effect.parameters.characterKey];
      const title = typeof effect.parameters.title === 'string' ? effect.parameters.title.trim() : '';
      if (!npc || !title || npc.knownTraitTitles.includes(title)) return;
      npc.knownTraitTitles.push(title);
      return;
    }
    case EventEffectType.FollowUpEvent: {
      const eventKey = effect.parameters.eventKey;
      if (typeof eventKey !== 'string' || !eventKey) return;
      if (isResolved(world, eventKey) || world.queued.some((queued) => queued.key === eventKey)) return;
      world.queued.push({ key: eventKey, day: world.day, period: world.period });
      return;
    }
    case EventEffectType.Move: {
      const placeKey = effect.parameters.placeKey;
      const characterKeys = effect.parameters.characterKeys;
      if (typeof placeKey !== 'string' || !Array.isArray(characterKeys)) return;
      for (const key of characterKeys) {
        if (key === 'player') world.playerPlace = placeKey;
        else if (world.characters[key]) world.characters[key].placeKey = placeKey;
      }
      return;
    }
    case EventEffectType.Subscribe:
      if (effect.parameters.subscriptionType === SubscriptionType.Academy) scheduleAcademyClasses(world);
      return;
    case EventEffectType.NewLeagueSeason: {
      const winner = effect.parameters.winnerKey;
      if (typeof winner === 'string' && winner) {
        world.leaguesWon[winner] = (world.leaguesWon[winner] ?? 0) + 1;
      }
      return;
    }
    default:
      return;
  }
}

function scheduleAcademyClasses(world: PacingWorld) {
  if (world.academyScheduled) return;
  world.academyScheduled = true;
  const remainingDays = TERM_LENGTH - (world.day % TERM_LENGTH);
  for (let i = 0; i < remainingDays; i++) {
    if (getWeekDay(world.day + i) > 5) continue;
    const day = world.day + i;
    if (i > 0) {
      placeActivity(world, {
        type: ActivityType.Class,
        participants: ['player'],
        placeKey: 'artificery-room',
        day,
        period: DayPeriod.Morning,
        classType: ClassType.Artificery,
      });
    }
    placeActivity(world, {
      type: ActivityType.Class,
      participants: ['player'],
      placeKey: 'enchanting-room',
      day,
      period: DayPeriod.Afternoon,
      classType: ClassType.Enchanting,
    });
  }
}

function scheduleFromEffect(world: PacingWorld, parameters: ScheduleActivitiesParameters) {
  const { activity, schedule = {} } = parameters;
  const { date, recurrence, nextFree } = schedule;
  const datePeriod =
    date?.period ?? (nextFree || date?.dayOfWeek != null ? DayPeriod.Evening : world.period);
  const fromDay = world.day + (date?.day ?? 0);
  const startDay =
    date?.dayOfWeek != null
      ? findNextWeekdayDay(world, date.dayOfWeek, datePeriod, fromDay, !!nextFree)
      : nextFree
        ? findNextFreeDay(world, datePeriod, fromDay)
        : fromDay;

  const placed: PacingActivity[] = [];
  if (recurrence) {
    const maxCount = recurrence.maxCount ?? 24;
    const period = recurrence.period ?? datePeriod;
    const daysOfWeek = recurrence.daysOfWeek;
    const hasMatchingDays =
      !daysOfWeek || daysOfWeek.some((dayOfWeek) => dayOfWeek >= 1 && dayOfWeek <= 7);
    let day = startDay;
    while (hasMatchingDays && placed.length < maxCount) {
      if (!daysOfWeek || daysOfWeek.includes(getWeekDay(day))) {
        placed.push({ ...activity, day, period });
      }
      day += 1;
    }
  } else {
    placed.push({ ...activity, day: startDay, period: datePeriod });
  }
  for (const item of placed) placeActivity(world, item);
}

function placeActivity(world: PacingWorld, activity: PacingActivity) {
  if (activity.day === world.day && activity.period === world.period) {
    world.activities = world.activities.filter(
      (item) => item.day !== activity.day || item.period !== activity.period
    );
  }
  world.activities.push(activity);
}

function earliestSchedulableDay(world: PacingWorld, period: DayPeriod, fromDay: number): number {
  let day = fromDay;
  if (day <= world.day) {
    day = world.day;
    if (PERIODS.indexOf(world.period) >= PERIODS.indexOf(period)) day += 1;
  }
  return day;
}

function findNextFreeDay(world: PacingWorld, period: DayPeriod, fromDay: number): number {
  let day = earliestSchedulableDay(world, period, fromDay);
  while (slotTaken(world, day, period)) day += 1;
  return day;
}

function findNextWeekdayDay(
  world: PacingWorld,
  dayOfWeek: number,
  period: DayPeriod,
  fromDay: number,
  nextFree: boolean
): number {
  let day = earliestSchedulableDay(world, period, fromDay);
  while (getWeekDay(day) !== dayOfWeek) day += 1;
  if (nextFree) {
    while (slotTaken(world, day, period)) day += 7;
  }
  return day;
}

function slotTaken(world: PacingWorld, day: number, period: DayPeriod): boolean {
  return world.activities.some((activity) => activity.day === day && activity.period === period);
}

function optionStartsMatch(option: EventOptionTemplate): boolean {
  return option.effects?.some((effect) => effect.type === EventEffectType.StartMatch) ?? false;
}

function matchOpponent(option: EventOptionTemplate): string | undefined {
  const effect = option.effects?.find((item) => item.type === EventEffectType.StartMatch);
  const key = effect?.parameters.opponentKey;
  return typeof key === 'string' ? key : undefined;
}

function optionSchedulesAcademy(option: EventOptionTemplate): boolean {
  const action = buildAction(option);
  if (!action) return false;
  const params = action.actionParameters ?? {};
  return (
    (action.actionType === ActionType.Transaction || action.actionType === ActionType.Negotiate) &&
    params.transactionType === TransactionType.Subscription &&
    params.subscriptionType === SubscriptionType.Academy
  );
}

function buildAction(option: EventOptionTemplate): Action | undefined {
  const spec = option.actionTemplate;
  if (!spec) return undefined;
  const build = SceneActionTemplates[spec.actionTemplate];
  if (!build) return undefined;
  try {
    return build(spec.args ?? {});
  } catch {
    return undefined;
  }
}

function attributeChoice(
  template: EventTemplate,
  world: PacingWorld,
  option: EventOptionTemplate,
  success: boolean
): PacingChoice {
  const check = option.attributeCheck!;
  const authored = trimmed((success ? check.successNode : check.failureNode) ?? option.nextNode);
  const nextNode = authored ? enterableNode(template, authored, world) : undefined;
  const effects = (success ? check.successEffects : check.failureEffects) ?? [];
  return {
    label: `${option.text} — ${success ? 'success' : 'failure'}`,
    notes: choiceNotes(effects, false, nextNode),
    effects,
    nextNode,
  };
}

function matchChoice(
  text: string,
  effects: EventEffect[],
  nextNode: string | undefined,
  won: boolean,
  opponentKey: string | undefined
): PacingChoice {
  return {
    label: `${text} — ${won ? 'win' : 'loss'}`,
    notes: choiceNotes(effects, false, nextNode),
    effects,
    nextNode,
    matchWon: won,
    opponentKey,
  };
}

function choiceNotes(effects: EventEffect[], schedulesAcademy: boolean, nextNode?: string): string[] {
  const notes: string[] = [];
  if (schedulesAcademy) notes.push('Schedules academy classes');
  for (const effect of effects) {
    if (effect.type === EventEffectType.AddStoryTag && effect.parameters.tag) {
      notes.push(`Tag ${effect.parameters.tag}`);
    } else if (effect.type === EventEffectType.ScheduleActivity) {
      const eventId = effect.parameters.activity?.eventId;
      const when = describeSchedule(effect.parameters.schedule);
      notes.push(eventId ? `Plans ${eventId}${when}` : `Plans an activity${when}`);
    } else if (effect.type === EventEffectType.FollowUpEvent && effect.parameters.eventKey) {
      notes.push(`Then ${effect.parameters.eventKey}`);
    } else if (effect.type === EventEffectType.ChangeRelation) {
      const amount = effect.parameters.amount;
      const sign = typeof amount === 'number' && amount > 0 ? '+' : '';
      notes.push(`${effect.parameters.relationParameter} ${sign}${amount}`);
    } else if (effect.type === EventEffectType.AddKnownTrait) {
      notes.push(`Learns about ${effect.parameters.characterKey}`);
    } else if (effect.type === EventEffectType.AddRelationTag) {
      notes.push(`Relation ${effect.parameters.relationTag}`);
    } else if (effect.type === EventEffectType.StartMatch) {
      notes.push(`Match vs ${effect.parameters.opponentKey}`);
    }
  }
  if (nextNode) notes.push('Continues');
  return notes;
}

function describeSchedule(schedule: Schedule | undefined): string {
  if (!schedule) return '';
  const bits: string[] = [];
  if (schedule.date?.day) bits.push(`in ${schedule.date.day}d`);
  if (schedule.date?.period) bits.push(schedule.date.period);
  else if (schedule.nextFree) bits.push('evening');
  if (schedule.date?.dayOfWeek) bits.push(`weekday ${schedule.date.dayOfWeek}`);
  return bits.length ? ` (${bits.join(' ')})` : '';
}

function trimmed(key: string | undefined): string | undefined {
  const value = key?.trim();
  return value ? value : undefined;
}

function eventLabel(templates: readonly EventTemplate[], key: string): string {
  return templates.find((template) => template.key === key)?.title?.trim() || key;
}

function activityLabel(activity: PacingActivity): string {
  return activity.classType ?? activity.type;
}

function compareEvents(a: EventTemplate, b: EventTemplate): number {
  return (b.priority ?? 0) - (a.priority ?? 0) || a.key.localeCompare(b.key);
}
