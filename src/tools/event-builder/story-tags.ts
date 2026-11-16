import {
  EventEffectType,
  EventTriggerType,
  type EventEffect,
  type EventOptionTemplate,
  type EventPassage,
  type EventTemplate,
  type EventTemplateEffect,
  type EventTrigger,
} from '@/lib/_model';

/** One place an event grants a story tag or checks it. */
export type StoryTagSite = {
  eventKey: string;
  role: 'grant' | 'trigger';
  /** `add_story_tag` amount, or the `story_tag` threshold (`-1` means absent). */
  value: number;
  where: string;
  /** +1 applied when this event fires, because the tag is the event key. */
  stamp?: boolean;
};

export type StoryTagUsage = {
  tag: string;
  sites: StoryTagSite[];
};

export type StoryTagNode = {
  eventKey: string;
  sites: StoryTagSite[];
  /** Every site is the automatic fire stamp, not an `add_story_tag` effect. */
  stampOnly: boolean;
};

const WHERE_MAX = 42;

function clip(text: string, max = WHERE_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max - 1) + '…';
}

function tagOf(parameters: { tag?: unknown } | undefined): string | null {
  const tag = parameters?.tag;
  if (typeof tag !== 'string') return null;
  const trimmed = tag.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function push(into: Map<string, StoryTagSite[]>, tag: string, site: StoryTagSite) {
  const sites = into.get(tag) ?? [];
  sites.push(site);
  into.set(tag, sites);
}

function noteTriggers(
  triggers: EventTrigger[] | undefined,
  eventKey: string,
  where: string,
  into: Map<string, StoryTagSite[]>
) {
  for (const trigger of triggers ?? []) {
    if (trigger.triggerType !== EventTriggerType.StoryTag) continue;
    const tag = tagOf(trigger.parameters);
    const value = trigger.parameters?.value;
    if (!tag || typeof value !== 'number' || !Number.isFinite(value)) continue;
    push(into, tag, { eventKey, role: 'trigger', value, where });
  }
}

function noteEffects(
  effects: EventEffect[] | undefined,
  eventKey: string,
  where: string,
  into: Map<string, StoryTagSite[]>
) {
  for (const effect of effects ?? []) {
    if (effect?.type !== EventEffectType.AddStoryTag) continue;
    const tag = tagOf(effect.parameters);
    if (!tag) continue;
    const amount = effect.parameters?.amount;
    const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 1;
    push(into, tag, { eventKey, role: 'grant', value, where });
  }
}

function noteTemplateEffects(
  entries: EventTemplateEffect[] | undefined,
  eventKey: string,
  effectWhere: string,
  gateWhere: string,
  into: Map<string, StoryTagSite[]>
) {
  for (const entry of entries ?? []) {
    noteTriggers(entry.triggers, eventKey, gateWhere, into);
    if (entry.effect) noteEffects([entry.effect], eventKey, effectWhere, into);
  }
}

function optionWhere(prefix: string, text: string, suffix = ''): string {
  const quoted = `“${clip(text || 'option', 32)}”`;
  const head = prefix ? `${prefix} · ${quoted}` : quoted;
  return suffix ? `${head} ${suffix}` : head;
}

function noteOptions(
  options: EventOptionTemplate[] | undefined,
  eventKey: string,
  prefix: string,
  into: Map<string, StoryTagSite[]>
) {
  for (const option of options ?? []) {
    const place = optionWhere(prefix, option.text);
    noteTriggers(option.triggers, eventKey, place, into);
    noteEffects(option.effects, eventKey, place, into);
    if (option.attributeCheck) {
      noteEffects(
        option.attributeCheck.successEffects,
        eventKey,
        optionWhere(prefix, option.text, 'success'),
        into
      );
      noteEffects(
        option.attributeCheck.failureEffects,
        eventKey,
        optionWhere(prefix, option.text, 'failure'),
        into
      );
    }
  }
}

function notePassages(
  passages: Record<string, EventPassage> | undefined,
  eventKey: string,
  prefix: string,
  into: Map<string, StoryTagSite[]>
) {
  for (const [key, passage] of Object.entries(passages ?? {})) {
    const place = prefix ? `${prefix} · passage ${key}` : `passage ${key}`;
    for (const variant of passage.variants ?? []) {
      noteTriggers(variant.triggers, eventKey, place, into);
    }
  }
}

/**
 * Story tags authored on the catalog: `add_story_tag` grants and `story_tag`
 * checks (event, option, node, passage, and gated effects). When a tag is also
 * an event key, that event contributes +1 each time it fires.
 */
export function indexStoryTags(events: EventTemplate[]): StoryTagUsage[] {
  const into = new Map<string, StoryTagSite[]>();

  for (const event of events) {
    noteTriggers(event.triggers, event.key, 'to fire', into);
    noteTemplateEffects(event.effects, event.key, 'on fire', 'effect gate', into);
    noteOptions(event.optionTemplates, event.key, '', into);
    notePassages(event.passages, event.key, '', into);

    for (const [nodeKey, node] of Object.entries(event.nodes ?? {})) {
      const nodeLabel = `node ${nodeKey}`;
      noteTriggers(node.triggers, event.key, nodeLabel, into);
      noteTemplateEffects(node.effects, event.key, nodeLabel, `${nodeLabel} gate`, into);
      noteOptions(node.optionTemplates, event.key, nodeLabel, into);
      notePassages(node.passages, event.key, nodeLabel, into);
    }
  }

  const eventKeys = new Set(events.map((event) => event.key));
  for (const [tag, sites] of into) {
    if (!eventKeys.has(tag) || sites.some((site) => site.stamp)) continue;
    sites.push({
      eventKey: tag,
      role: 'grant',
      value: 1,
      where: 'when it fires',
      stamp: true,
    });
  }

  return [...into.entries()]
    .map(([tag, sites]) => ({ tag, sites }))
    .sort((a, b) => b.sites.length - a.sites.length || a.tag.localeCompare(b.tag));
}

function group(sites: StoryTagSite[]): StoryTagNode[] {
  const map = new Map<string, StoryTagSite[]>();
  for (const site of sites) {
    const list = map.get(site.eventKey) ?? [];
    list.push(site);
    map.set(site.eventKey, list);
  }
  return [...map.entries()].map(([eventKey, grouped]) => {
    const ordered = [...grouped].sort(
      (a, b) => Number(Boolean(b.stamp)) - Number(Boolean(a.stamp))
    );
    return {
      eventKey,
      sites: ordered,
      stampOnly: ordered.every((site) => site.stamp),
    };
  });
}

function grantTotal(node: StoryTagNode): number {
  return node.sites.reduce((total, site) => total + site.value, 0);
}

function triggerRank(node: StoryTagNode): number {
  const gates = node.sites.map((site) => site.value).filter((value) => value >= 0);
  if (gates.length === 0) return Number.NEGATIVE_INFINITY;
  return Math.max(...gates);
}

export function storyTagColumns(usage: StoryTagUsage | undefined): {
  grants: StoryTagNode[];
  triggers: StoryTagNode[];
} {
  if (!usage) return { grants: [], triggers: [] };
  const grants = group(usage.sites.filter((site) => site.role === 'grant'));
  const triggers = group(usage.sites.filter((site) => site.role === 'trigger'));
  grants.sort(
    (a, b) => grantTotal(b) - grantTotal(a) || a.eventKey.localeCompare(b.eventKey)
  );
  triggers.sort(
    (a, b) => triggerRank(b) - triggerRank(a) || a.eventKey.localeCompare(b.eventKey)
  );
  return { grants, triggers };
}

export function formatStoryAmount(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function formatStoryThreshold(value: number): string {
  if (value === -1) return 'absent';
  return `≥${value}`;
}

export function storyEdgeLabel(node: StoryTagNode): string {
  const labels = [
    ...new Set(
      node.sites.map((site) =>
        site.role === 'grant' ? formatStoryAmount(site.value) : formatStoryThreshold(site.value)
      )
    ),
  ];
  const text = labels.join(', ');
  if (text.length <= 16) return text;
  if (node.sites[0]?.role === 'grant') {
    const max = Math.max(...node.sites.map((site) => site.value));
    return `${formatStoryAmount(max)}…`;
  }
  const gates = node.sites.map((site) => site.value).filter((value) => value >= 0);
  if (gates.length === 0) return 'absent';
  return `${formatStoryThreshold(Math.min(...gates))}…`;
}

export function storyNodeDetail(node: StoryTagNode): string {
  return node.sites
    .map((site) => {
      const mark =
        site.role === 'grant' ? formatStoryAmount(site.value) : formatStoryThreshold(site.value);
      return `${mark} ${site.where}`;
    })
    .join(' · ');
}

export function countRole(usage: StoryTagUsage, role: StoryTagSite['role']): number {
  return new Set(usage.sites.filter((site) => site.role === role).map((site) => site.eventKey)).size;
}
