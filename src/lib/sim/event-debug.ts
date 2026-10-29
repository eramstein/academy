import {
  ActivityType,
  DayPeriod,
  EventEffectType,
  EventTriggerType,
} from '../_model/enums-sim';
import type {
  EventEffect,
  EventOptionTemplate,
  EventTemplate,
  EventTemplateEffect,
  RelationProgress,
} from '../_model/model-sim';
import { gs } from '../_state';
import { resolveRelationTag } from './effects/relations';
import {
  eventTriggerMatches,
  getLoadedEventTemplates,
  rebuildWorkingEventTemplates,
  type EventTrigger,
} from './events';
import { completeCraftedArtifact } from './actions/craft-artifact';
import { getWeekDay, WEEK_DAYS } from './time';

/**
 * Setup for `/e`. Prerequisite story tags are walked from event triggers
 * (an event key is stamped when that event fires; `add_story_tag` on an
 * unconditional root effect counts too). Branch conditions stay optional:
 * passages take the first match, so turning every tag on would hide the rest.
 * Earlier events are not replayed — their rewards, schedules, and relation
 * changes stay untouched.
 */

export type EventDebugGroup = 'prerequisite' | 'scene' | 'branch';

export type SceneChange =
  | { kind: 'time'; day?: number; period?: DayPeriod; label: string }
  | { kind: 'place'; placeKey: string; label: string }
  | { kind: 'present'; characterKeys: string[]; label: string }
  | {
      kind: 'relation';
      characterKey: string;
      parameter: keyof RelationProgress;
      value: number;
      label: string;
    }
  | {
      kind: 'relation_tag';
      characterKey: string;
      relationTag: string;
      present: boolean;
      label: string;
    }
  | { kind: 'matches'; characterKey: string; field: 'won' | 'lost'; count: number; label: string }
  | { kind: 'leagues'; characterKey: string; count: number; label: string }
  | { kind: 'traits'; characterKey: string; count: number; label: string }
  | { kind: 'last_match'; won: boolean; label: string }
  | {
      kind: 'history';
      characterKey: string;
      activityType: ActivityType;
      value: number;
      label: string;
    }
  | { kind: 'artifact'; patternKey: string; label: string };

export type EventDebugAction =
  | { kind: 'story_tag'; tag: string; value: number }
  | { kind: 'clear_story_tag'; tag: string }
  | { kind: 'scene' }
  | SceneChange;

export interface EventDebugToggle {
  id: string;
  group: EventDebugGroup;
  label: string;
  detail: string;
  defaultOn: boolean;
  action: EventDebugAction;
}

export interface EventDebugPlan {
  eventKey: string;
  title: string;
  toggles: EventDebugToggle[];
  sceneChanges: SceneChange[];
  notices: string[];
  passageChoice: boolean;
}

interface Producer {
  key: string;
  title: string;
  unconditional: boolean;
}

interface PrereqTag {
  tag: string;
  value: number;
  detail: string;
}

export function buildEventDebugPlan(eventKey: string): EventDebugPlan | null {
  const templates = getLoadedEventTemplates();
  const byKey = new Map(templates.map((template) => [template.key, template]));
  const template = byKey.get(eventKey);
  if (!template) return null;

  const producers = indexStoryTagProducers(templates);
  const prereqs = new Map<string, PrereqTag>();
  walkPrerequisiteTags(eventKey, byKey, producers, prereqs, new Set());

  const root = template.triggers ?? [];
  for (const trigger of root) {
    if (trigger.triggerType !== EventTriggerType.StoryTag) continue;
    if (trigger.parameters.value !== -1) continue;
    prereqs.delete(trigger.parameters.tag);
  }

  const rootSignatures = new Set(root.map(triggerSignature));
  const { changes, notices } = collectScene(root);
  const branches = collectBranches(template, rootSignatures, prereqs, notices);

  const toggles: EventDebugToggle[] = [];
  for (const prereq of prereqs.values()) {
    if (prereq.tag === eventKey) continue;
    const prior = byKey.get(prereq.tag);
    toggles.push({
      id: `tag:${prereq.tag}`,
      group: 'prerequisite',
      label: prior?.title ? `${prereq.tag} — ${prior.title}` : prereq.tag,
      detail: prereq.detail,
      defaultOn: true,
      action: { kind: 'story_tag', tag: prereq.tag, value: prereq.value },
    });
  }
  for (const trigger of root) {
    if (trigger.triggerType !== EventTriggerType.StoryTag) continue;
    if (trigger.parameters.value !== -1) continue;
    toggles.push({
      id: `clear:${trigger.parameters.tag}`,
      group: 'prerequisite',
      label: `Without ${trigger.parameters.tag}`,
      detail: 'This event only fires when the tag is absent',
      defaultOn: true,
      action: { kind: 'clear_story_tag', tag: trigger.parameters.tag },
    });
  }
  if (changes.length > 0) {
    toggles.push({
      id: 'scene',
      group: 'scene',
      label: 'Match where this event fires',
      detail: changes.map((change) => change.label).join(' · '),
      defaultOn: true,
      action: { kind: 'scene' },
    });
  }
  toggles.push(...branches);

  return {
    eventKey,
    title: template.title?.trim() || eventKey,
    toggles,
    sceneChanges: changes,
    notices,
    passageChoice: branches.some((toggle) => toggle.detail.includes('Passage ')),
  };
}

export function applyEventDebugSetup(
  plan: EventDebugPlan,
  enabledIds: readonly string[]
): string[] {
  const enabled = new Set(enabledIds);
  const notes: string[] = [];
  let tagsChanged = false;
  for (const toggle of plan.toggles) {
    const on = enabled.has(toggle.id);
    if (toggle.action.kind === 'story_tag') {
      const note = on
        ? ensureStoryTag(toggle.action.tag, toggle.action.value)
        : clearStoryTag(toggle.action.tag);
      if (note) {
        notes.push(note);
        tagsChanged = true;
      }
      continue;
    }
    if (!on) continue;
    if (toggle.action.kind === 'clear_story_tag') {
      const note = clearStoryTag(toggle.action.tag);
      if (note) {
        notes.push(note);
        tagsChanged = true;
      }
      continue;
    }
    if (toggle.action.kind === 'scene') {
      for (const change of plan.sceneChanges) {
        const note = applySceneChange(change);
        if (note) notes.push(note);
      }
      continue;
    }
    const note = applySceneChange(toggle.action);
    if (note) notes.push(note);
  }
  if (tagsChanged) rebuildWorkingEventTemplates();
  return notes;
}

export function formatDebugNotes(notes: string[]): string {
  if (notes.length === 0) return '';
  if (notes.length <= 4) return notes.join('; ');
  return `${notes.slice(0, 4).join('; ')}; +${notes.length - 4} more`;
}

export function formatSimulatedMessage(
  eventKey: string,
  notes: string[],
  notices: string[]
): string {
  const parts = [`Simulated event ${eventKey}`];
  const extra = formatDebugNotes(notes);
  if (extra) parts.push(extra);
  for (const notice of notices) parts.push(notice);
  return `${parts.join('. ')}.`;
}

function walkPrerequisiteTags(
  eventKey: string,
  byKey: Map<string, EventTemplate>,
  producers: Map<string, Producer[]>,
  into: Map<string, PrereqTag>,
  stack: Set<string>
) {
  if (stack.has(eventKey)) return;
  stack.add(eventKey);
  const template = byKey.get(eventKey);
  if (!template) return;

  for (const trigger of template.triggers ?? []) {
    if (trigger.triggerType !== EventTriggerType.StoryTag) continue;
    const { tag, value } = trigger.parameters;
    if (value < 1 || tag === eventKey) continue;

    const prior = byKey.get(tag);
    if (prior) {
      addPrereq(into, tag, value, `Prior event “${eventTitle(prior)}”`);
      walkPrerequisiteTags(tag, byKey, producers, into, stack);
      continue;
    }

    const sources = (producers.get(tag) ?? []).filter((source) => source.key !== eventKey);
    const unconditional = sources.filter((source) => source.unconditional);
    if (unconditional.length === 1) {
      const source = unconditional[0];
      addPrereq(into, tag, value, `Added when “${source.title}” fires`);
      addPrereq(into, source.key, 1, `Fires to add ${tag}`);
      walkPrerequisiteTags(source.key, byKey, producers, into, stack);
      continue;
    }

    if (sources.length > 0) {
      const names = sources
        .slice(0, 3)
        .map((source) => source.title)
        .join(', ');
      const more = sources.length > 3 ? '…' : '';
      addPrereq(into, tag, value, `Required here. Also set by ${names}${more}`);
    } else {
      addPrereq(into, tag, value, 'Required to reach this event');
    }
  }
}

function addPrereq(into: Map<string, PrereqTag>, tag: string, value: number, detail: string) {
  const existing = into.get(tag);
  if (!existing) {
    into.set(tag, { tag, value, detail });
    return;
  }
  if (value > existing.value) existing.value = value;
}

function indexStoryTagProducers(templates: readonly EventTemplate[]): Map<string, Producer[]> {
  const map = new Map<string, Producer[]>();
  for (const template of templates) {
    const tags = new Map<string, boolean>();
    const note = (tag: unknown, unconditional: boolean) => {
      if (typeof tag !== 'string' || !tag.trim()) return;
      const key = tag.trim();
      tags.set(key, unconditional || tags.get(key) === true);
    };
    for (const entry of templateEffects(template.effects)) {
      if (entry.effect.type === EventEffectType.AddStoryTag) {
        note(entry.effect.parameters?.tag, !entry.gated);
      }
    }
    for (const effect of optionEffects(template.optionTemplates)) {
      if (effect.type === EventEffectType.AddStoryTag) note(effect.parameters?.tag, false);
    }
    for (const node of Object.values(template.nodes ?? {})) {
      for (const entry of templateEffects(node.effects)) {
        if (entry.effect.type === EventEffectType.AddStoryTag) {
          note(entry.effect.parameters?.tag, false);
        }
      }
      for (const effect of optionEffects(node.optionTemplates)) {
        if (effect.type === EventEffectType.AddStoryTag) note(effect.parameters?.tag, false);
      }
    }
    for (const [tag, unconditional] of tags) {
      const list = map.get(tag) ?? [];
      list.push({ key: template.key, title: eventTitle(template), unconditional });
      map.set(tag, list);
    }
  }
  return map;
}

function templateEffects(
  entries: EventTemplateEffect[] | undefined
): { effect: EventEffect; gated: boolean }[] {
  if (!entries?.length) return [];
  return entries.map((entry) => {
    if (entry && typeof entry === 'object' && 'effect' in entry) {
      return { effect: entry.effect, gated: (entry.triggers?.length ?? 0) > 0 };
    }
    return { effect: entry as unknown as EventEffect, gated: false };
  });
}

function optionEffects(options: EventOptionTemplate[] | undefined): EventEffect[] {
  const effects: EventEffect[] = [];
  for (const option of options ?? []) {
    effects.push(...(option.effects ?? []));
    effects.push(...(option.attributeCheck?.successEffects ?? []));
    effects.push(...(option.attributeCheck?.failureEffects ?? []));
  }
  return effects;
}

interface LocatedTrigger {
  trigger: EventTrigger;
  where: string;
}

function collectBranches(
  template: EventTemplate,
  rootSignatures: Set<string>,
  prereqs: Map<string, PrereqTag>,
  notices: string[]
): EventDebugToggle[] {
  const grouped = new Map<string, LocatedTrigger>();
  for (const located of innerTriggers(template)) {
    const signature = triggerSignature(located.trigger);
    if (rootSignatures.has(signature)) continue;
    if (located.trigger.triggerType === EventTriggerType.StoryTag) {
      const { tag, value } = located.trigger.parameters;
      if (value >= 1 && prereqs.has(tag)) {
        addPrereq(prereqs, tag, value, prereqs.get(tag)!.detail);
        continue;
      }
      if (value === -1 && prereqs.has(tag)) continue;
    }
    const existing = grouped.get(signature);
    if (existing) existing.where = `${existing.where} · ${located.where}`;
    else grouped.set(signature, { ...located });
  }

  const positiveStoryTags = new Set<string>();
  for (const located of grouped.values()) {
    if (located.trigger.triggerType !== EventTriggerType.StoryTag) continue;
    if (located.trigger.parameters.value >= 1)
      positiveStoryTags.add(located.trigger.parameters.tag);
  }

  const toggles: EventDebugToggle[] = [];
  for (const [signature, located] of grouped) {
    const trigger = located.trigger;
    if (
      trigger.triggerType === EventTriggerType.StoryTag &&
      trigger.parameters.value === -1 &&
      positiveStoryTags.has(trigger.parameters.tag)
    ) {
      continue;
    }
    const toggle = branchToggle(template.key, signature, located, notices);
    if (toggle) toggles.push(toggle);
  }
  return toggles;
}

function branchToggle(
  eventKey: string,
  signature: string,
  located: LocatedTrigger,
  notices: string[]
): EventDebugToggle | null {
  const trigger = located.trigger;
  const detail = truncate(located.where, 180);
  if (trigger.triggerType === EventTriggerType.StoryTag) {
    const { tag, value } = trigger.parameters;
    if (value >= 1) {
      return {
        id: `branch:${signature}`,
        group: 'branch',
        label: tag,
        detail,
        defaultOn: eventTriggerMatches(trigger, eventKey),
        action: { kind: 'story_tag', tag, value },
      };
    }
    if (value === -1) {
      return {
        id: `branch:${signature}`,
        group: 'branch',
        label: `Without ${tag}`,
        detail,
        defaultOn: true,
        action: { kind: 'clear_story_tag', tag },
      };
    }
    return null;
  }

  const change = triggerToChange(trigger);
  if (!change) {
    if (
      trigger.triggerType === EventTriggerType.ScheduledActivity ||
      trigger.triggerType === EventTriggerType.ActivityType
    ) {
      pushNotice(notices, 'Some branches depend on the current activity and are left alone');
    }
    return null;
  }
  return {
    id: `branch:${signature}`,
    group: 'branch',
    label: change.label,
    detail,
    defaultOn: eventTriggerMatches(trigger, eventKey),
    action: change,
  };
}

function innerTriggers(template: EventTemplate): LocatedTrigger[] {
  const located: LocatedTrigger[] = [];
  const visit = (
    beat: {
      passages?: EventTemplate['passages'];
      optionTemplates?: EventOptionTemplate[];
      effects?: EventTemplateEffect[];
    },
    scope: string
  ) => {
    for (const [passageKey, passage] of Object.entries(beat.passages ?? {})) {
      for (const variant of passage.variants ?? []) {
        for (const trigger of variant.triggers ?? []) {
          located.push({ trigger, where: `Passage ${passageKey}` });
        }
      }
    }
    for (const option of beat.optionTemplates ?? []) {
      const optionLabel = truncate(option.text, 42);
      for (const trigger of option.triggers ?? []) {
        located.push({ trigger, where: `Option “${optionLabel}”` });
      }
    }
    for (const entry of beat.effects ?? []) {
      const triggers =
        entry && typeof entry === 'object' && 'triggers' in entry ? entry.triggers : undefined;
      for (const trigger of triggers ?? []) {
        located.push({ trigger, where: scope === 'event' ? 'When the event fires' : scope });
      }
    }
  };

  visit(template, 'event');
  for (const [nodeKey, node] of Object.entries(template.nodes ?? {})) {
    const scope = `Node ${nodeKey}`;
    for (const trigger of node.triggers ?? []) located.push({ trigger, where: scope });
    visit(node, scope);
  }
  return located;
}

function collectScene(triggers: EventTrigger[]): { changes: SceneChange[]; notices: string[] } {
  const changes: SceneChange[] = [];
  const notices: string[] = [];
  const day = desiredDay(triggers);
  const period = desiredPeriod(triggers);
  if (day != null || period != null) {
    const bits: string[] = [];
    if (day != null) bits.push(`day ${day} (${weekdayName(day)})`);
    if (period != null) bits.push(period);
    changes.push({ kind: 'time', day, period, label: bits.join(', ') });
  }

  let placeKey: string | undefined;
  for (const trigger of triggers) {
    if (trigger.triggerType === EventTriggerType.Place) placeKey = trigger.parameters.placeKey;
  }
  if (placeKey) {
    changes.push({ kind: 'place', placeKey, label: placeName(placeKey) });
  }

  const present: string[] = [];
  for (const trigger of triggers) {
    if (trigger.triggerType !== EventTriggerType.CharacterPresent) continue;
    const key = trigger.parameters.characterKey;
    if (key && !present.includes(key)) present.push(key);
  }
  if (present.length > 0) {
    changes.push({
      kind: 'present',
      characterKeys: present,
      label: `${present.map(who).join(', ')} present`,
    });
  }

  for (const trigger of triggers) {
    if (trigger.triggerType === EventTriggerType.StoryTag) continue;
    if (
      trigger.triggerType === EventTriggerType.Day ||
      trigger.triggerType === EventTriggerType.Period ||
      trigger.triggerType === EventTriggerType.DayOfWeek ||
      trigger.triggerType === EventTriggerType.Place ||
      trigger.triggerType === EventTriggerType.CharacterPresent
    ) {
      continue;
    }
    if (trigger.triggerType === EventTriggerType.ScheduledActivity) {
      pushNotice(notices, 'Leaves the schedule alone. This event normally waits for its activity');
      continue;
    }
    if (trigger.triggerType === EventTriggerType.ActivityType) {
      pushNotice(
        notices,
        `Leaves the current activity alone (normally ${trigger.parameters.activityType})`
      );
      continue;
    }
    const change = triggerToChange(trigger);
    if (change) changes.push(change);
  }
  return { changes, notices };
}

function triggerToChange(trigger: EventTrigger): SceneChange | null {
  switch (trigger.triggerType) {
    case EventTriggerType.Day: {
      const day = desiredDay([trigger]);
      if (day == null) return null;
      return { kind: 'time', day, label: `Day ${day} (${weekdayName(day)})` };
    }
    case EventTriggerType.Period: {
      const period = desiredPeriod([trigger]);
      if (!period) return null;
      return { kind: 'time', period, label: capitalize(period) };
    }
    case EventTriggerType.DayOfWeek: {
      const day = desiredDay([trigger]);
      if (day == null) return null;
      return { kind: 'time', day, label: weekdayName(day) };
    }
    case EventTriggerType.Place:
      return {
        kind: 'place',
        placeKey: trigger.parameters.placeKey,
        label: placeName(trigger.parameters.placeKey),
      };
    case EventTriggerType.CharacterPresent:
      return {
        kind: 'present',
        characterKeys: [trigger.parameters.characterKey],
        label: `${who(trigger.parameters.characterKey)} present`,
      };
    case EventTriggerType.RelationParameter: {
      const { characterKey, relationParameter, value } = trigger.parameters;
      if (value === 0) return null;
      const cmp = value < 0 ? '≤' : '≥';
      return {
        kind: 'relation',
        characterKey,
        parameter: relationParameter,
        value,
        label: `${who(characterKey)} ${relationParameter} ${cmp} ${value}`,
      };
    }
    case EventTriggerType.RelationTag: {
      const { characterKey, relationTag, value } = trigger.parameters;
      const present = value !== -1;
      return {
        kind: 'relation_tag',
        characterKey,
        relationTag: String(relationTag),
        present,
        label: present
          ? `${who(characterKey)}: ${relationTag}`
          : `${who(characterKey)} lacks ${relationTag}`,
      };
    }
    case EventTriggerType.MatchesWon:
      if (trigger.parameters.count < 1) return null;
      return {
        kind: 'matches',
        characterKey: trigger.parameters.characterKey,
        field: 'won',
        count: trigger.parameters.count,
        label: `Wins against ${who(trigger.parameters.characterKey)} ≥ ${trigger.parameters.count}`,
      };
    case EventTriggerType.MatchesLost:
      if (trigger.parameters.count < 1) return null;
      return {
        kind: 'matches',
        characterKey: trigger.parameters.characterKey,
        field: 'lost',
        count: trigger.parameters.count,
        label: `Losses against ${who(trigger.parameters.characterKey)} ≥ ${trigger.parameters.count}`,
      };
    case EventTriggerType.LeaguesWon:
      if (trigger.parameters.count < 1) return null;
      return {
        kind: 'leagues',
        characterKey: trigger.parameters.characterKey,
        count: trigger.parameters.count,
        label: `${who(trigger.parameters.characterKey)} league wins ≥ ${trigger.parameters.count}`,
      };
    case EventTriggerType.KnownTraits:
      if (trigger.parameters.count < 1) return null;
      return {
        kind: 'traits',
        characterKey: trigger.parameters.characterKey,
        count: trigger.parameters.count,
        label: `${who(trigger.parameters.characterKey)} known traits ≥ ${trigger.parameters.count}`,
      };
    case EventTriggerType.LastMatchWon:
      return { kind: 'last_match', won: true, label: 'Last match won' };
    case EventTriggerType.LastMatchLost:
      return { kind: 'last_match', won: false, label: 'Last match lost' };
    case EventTriggerType.ActivityHistory:
      if (trigger.parameters.value < 1) return null;
      return {
        kind: 'history',
        characterKey: trigger.parameters.characterKey,
        activityType: trigger.parameters.activityType,
        value: trigger.parameters.value,
        label: `${who(trigger.parameters.characterKey)} ${trigger.parameters.activityType} × ${trigger.parameters.value}`,
      };
    case EventTriggerType.ArtifactOwned: {
      const { patternKey } = trigger.parameters;
      if (!patternKey?.trim()) return null;
      return {
        kind: 'artifact',
        patternKey,
        label: `Own artifact ${patternKey}`,
      };
    }
    default:
      return null;
  }
}

function applySceneChange(change: SceneChange): string | null {
  switch (change.kind) {
    case 'time': {
      let changed = false;
      if (change.day != null && gs.time.day !== change.day) {
        gs.time.day = change.day;
        changed = true;
      }
      if (change.period != null && gs.time.period !== change.period) {
        gs.time.period = change.period;
        changed = true;
      }
      if (!changed) return null;
      // Direct write: goToPeriod() restarts the scene and can fire a different event.
      gs.time.usedActions = {};
      gs.time.longActionPerformed = false;
      return change.label;
    }
    case 'place': {
      if (!gs.places[change.placeKey]) return `Unknown place ${change.placeKey}`;
      if (gs.player.placeKey === change.placeKey) return null;
      gs.player.placeKey = change.placeKey;
      return change.label;
    }
    case 'present': {
      const moved: string[] = [];
      for (const key of change.characterKeys) {
        const character = gs.characters[key];
        if (!character || character.placeKey === gs.player.placeKey) continue;
        character.placeKey = gs.player.placeKey;
        moved.push(character.name);
      }
      if (moved.length === 0) return null;
      return `${moved.join(', ')} present`;
    }
    case 'relation': {
      const character = gs.characters[change.characterKey];
      if (!character) return null;
      const current = character.relationProgress[change.parameter] ?? 0;
      if (change.value < 0) {
        if (current <= change.value) return null;
      } else if (current >= change.value) {
        return null;
      }
      character.relationProgress[change.parameter] = change.value;
      return change.label;
    }
    case 'relation_tag': {
      const character = gs.characters[change.characterKey];
      if (!character) return null;
      const tag = resolveRelationTag(change.relationTag);
      if (!tag) return `Unknown relation tag ${change.relationTag}`;
      const tags = character.relationTags ?? [];
      const has = tags.includes(tag);
      if (change.present) {
        if (has) return null;
        character.relationTags = [...tags, tag];
      } else if (has) {
        character.relationTags = tags.filter((entry) => entry !== tag);
      } else {
        return null;
      }
      return change.label;
    }
    case 'matches': {
      const character = gs.characters[change.characterKey];
      if (!character) return null;
      character.matchesRecord ??= { won: 0, lost: 0 };
      if ((character.matchesRecord[change.field] ?? 0) >= change.count) return null;
      character.matchesRecord[change.field] = change.count;
      return change.label;
    }
    case 'leagues': {
      gs.league.pastWinners ??= [];
      const have = gs.league.pastWinners.filter((key) => key === change.characterKey).length;
      if (have >= change.count) return null;
      for (let i = have; i < change.count; i++) gs.league.pastWinners.push(change.characterKey);
      return change.label;
    }
    case 'traits': {
      const character = gs.characters[change.characterKey];
      if (!character) return null;
      character.knownTraits ??= [];
      if (character.knownTraits.length >= change.count) return null;
      let n = character.knownTraits.length;
      while (character.knownTraits.length < change.count) {
        n += 1;
        character.knownTraits.push({
          title: `Debug trait ${n}`,
          description: 'Placeholder so this event can be tested.',
        });
      }
      return change.label;
    }
    case 'last_match':
      if (gs.scene.lastMatchWon === change.won) return null;
      gs.scene.lastMatchWon = change.won;
      return change.label;
    case 'history': {
      const character = gs.characters[change.characterKey];
      if (!character) return null;
      character.activityHistory ??= {};
      if ((character.activityHistory[change.activityType] ?? 0) >= change.value) return null;
      character.activityHistory[change.activityType] = change.value;
      return change.label;
    }
    case 'artifact': {
      const artifacts = gs.player.artifacts;
      const owned =
        (artifacts?.tools ?? []).some((tool) => tool.patternKey === change.patternKey) ||
        (artifacts?.trinkets ?? []).some((trinket) => trinket.patternKey === change.patternKey);
      if (owned) return null;
      if (!completeCraftedArtifact(change.patternKey, { free: true })) {
        return `Unknown artifact ${change.patternKey}`;
      }
      return change.label;
    }
    default:
      return null;
  }
}

function desiredDay(triggers: EventTrigger[]): number | undefined {
  let exact: number | undefined;
  let minDay: number | undefined;
  let weekdays: number[] | undefined;
  for (const trigger of triggers) {
    if (trigger.triggerType === EventTriggerType.Day) {
      if (trigger.parameters.day != null) exact = trigger.parameters.day;
      if (trigger.parameters.minDay != null) minDay = trigger.parameters.minDay;
    }
    if (trigger.triggerType === EventTriggerType.DayOfWeek) {
      weekdays = trigger.parameters.daysOfWeek;
    }
  }
  if (exact == null && minDay == null && !weekdays?.length) return undefined;
  let day = exact ?? gs.time.day;
  if (minDay != null) day = Math.max(day, minDay);
  if (weekdays?.length && !weekdays.includes(getWeekDay(day))) {
    for (let i = 0; i < 7; i++) {
      if (weekdays.includes(getWeekDay(day + i))) {
        day = day + i;
        break;
      }
    }
  }
  return day;
}

function desiredPeriod(triggers: EventTrigger[]): DayPeriod | undefined {
  for (const trigger of triggers) {
    if (trigger.triggerType !== EventTriggerType.Period) continue;
    const { period, periods } = trigger.parameters;
    if (periods?.length) {
      return periods.includes(gs.time.period) ? gs.time.period : periods[0];
    }
    if (period) return period;
  }
  return undefined;
}

function triggerSignature(trigger: EventTrigger): string {
  switch (trigger.triggerType) {
    case EventTriggerType.StoryTag: {
      const { tag, value } = trigger.parameters;
      return value === -1 ? `story:${tag}:absent` : `story:${tag}:${value}`;
    }
    case EventTriggerType.RelationParameter: {
      const { characterKey, relationParameter, value } = trigger.parameters;
      return `rel:${characterKey}:${relationParameter}:${value}`;
    }
    case EventTriggerType.RelationTag: {
      const { characterKey, relationTag, value } = trigger.parameters;
      return `rtag:${characterKey}:${relationTag}:${value === -1 ? 'absent' : 'present'}`;
    }
    case EventTriggerType.Day: {
      const { day, minDay } = trigger.parameters;
      return `day:${day ?? ''}:${minDay ?? ''}`;
    }
    case EventTriggerType.Period: {
      const { period, periods } = trigger.parameters;
      return `period:${period ?? ''}:${(periods ?? []).join(',')}`;
    }
    case EventTriggerType.DayOfWeek:
      return `dow:${trigger.parameters.daysOfWeek.join(',')}`;
    case EventTriggerType.Place:
      return `place:${trigger.parameters.placeKey}`;
    case EventTriggerType.CharacterPresent:
      return `present:${trigger.parameters.characterKey}`;
    case EventTriggerType.MatchesWon:
      return `won:${trigger.parameters.characterKey}:${trigger.parameters.count}`;
    case EventTriggerType.MatchesLost:
      return `lost:${trigger.parameters.characterKey}:${trigger.parameters.count}`;
    case EventTriggerType.LeaguesWon:
      return `league:${trigger.parameters.characterKey}:${trigger.parameters.count}`;
    case EventTriggerType.KnownTraits:
      return `traits:${trigger.parameters.characterKey}:${trigger.parameters.count}`;
    case EventTriggerType.LastMatchWon:
      return 'last_won';
    case EventTriggerType.LastMatchLost:
      return 'last_lost';
    case EventTriggerType.ActivityHistory: {
      const { characterKey, activityType, value } = trigger.parameters;
      return `hist:${characterKey}:${activityType}:${value}`;
    }
    case EventTriggerType.ActivityType:
      return `activity:${trigger.parameters.activityType}`;
    case EventTriggerType.ScheduledActivity:
      return 'scheduled';
    case EventTriggerType.ArtifactOwned:
      return `artifact:${trigger.parameters.patternKey}`;
    default:
      return 'unknown';
  }
}

function ensureStoryTag(tag: string, value: number): string | null {
  gs.storyTags ??= {};
  if ((gs.storyTags[tag] ?? 0) >= value) return null;
  gs.storyTags[tag] = value;
  return `Set ${tag}`;
}

function clearStoryTag(tag: string): string | null {
  if ((gs.storyTags?.[tag] ?? 0) === 0) return null;
  gs.storyTags ??= {};
  gs.storyTags[tag] = 0;
  return `Cleared ${tag}`;
}

function pushNotice(notices: string[], notice: string) {
  if (!notices.includes(notice)) notices.push(notice);
}

function eventTitle(template: EventTemplate): string {
  return template.title?.trim() || template.key;
}

function who(characterKey: string): string {
  return gs.characters[characterKey]?.name ?? characterKey;
}

function placeName(placeKey: string): string {
  return gs.places[placeKey]?.name ?? placeKey;
}

function weekdayName(day: number): string {
  return WEEK_DAYS[getWeekDay(day) - 1] ?? `day ${day}`;
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
