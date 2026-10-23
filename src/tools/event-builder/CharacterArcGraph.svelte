<script lang="ts">
  import {
    EventEffectType,
    EventTriggerType,
    type EventEffect,
    type EventOptionTemplate,
    type EventTemplate,
    type EventTemplateEffect,
    type EventTrigger,
  } from '@/lib/_model';

  let {
    events,
    allEvents = events,
    onEdit,
    onCreateFollowUp,
  }: {
    events: EventTemplate[];
    /** Full catalog — used for per-tag event counts across arcs. */
    allEvents?: EventTemplate[];
    onEdit: (event: EventTemplate) => void;
    onCreateFollowUp: (fromEvent: EventTemplate) => void;
  } = $props();

  let tagsExpanded = $state(true);

  const NODE_W = 180;
  const NODE_H = 72;
  const GAP_X = 48;
  const GAP_Y = 36;
  const PAD = 24;
  const ADD_R = 11;

  function walkTriggers(
    triggers: EventTrigger[] | undefined,
    visit: (trigger: EventTrigger) => void
  ) {
    for (const trigger of triggers ?? []) visit(trigger);
  }

  function walkEffects(effects: EventEffect[] | undefined, visit: (effect: EventEffect) => void) {
    for (const effect of effects ?? []) visit(effect);
  }

  function walkTemplateEffects(
    entries: EventTemplateEffect[] | undefined,
    visitTrigger: (trigger: EventTrigger) => void,
    visitEffect: (effect: EventEffect) => void
  ) {
    for (const entry of entries ?? []) {
      walkTriggers(entry.triggers, visitTrigger);
      visitEffect(entry.effect);
    }
  }

  function walkOptions(
    options: EventOptionTemplate[] | undefined,
    visitTrigger: (trigger: EventTrigger) => void,
    visitEffect: (effect: EventEffect) => void
  ) {
    for (const option of options ?? []) {
      walkTriggers(option.triggers, visitTrigger);
      walkEffects(option.effects, visitEffect);
      if (option.attributeCheck) {
        walkEffects(option.attributeCheck.successEffects, visitEffect);
        walkEffects(option.attributeCheck.failureEffects, visitEffect);
      }
    }
  }

  /**
   * Story tags referenced by triggers (event, nodes, options, passages, gated effects).
   */
  function storyTagsReferencedInEvent(event: EventTemplate): Set<string> {
    const tags = new Set<string>();

    const noteTrigger = (trigger: EventTrigger) => {
      if (trigger.triggerType !== EventTriggerType.StoryTag) return;
      const tag = trigger.parameters?.tag;
      if (typeof tag === 'string' && tag.trim()) tags.add(tag.trim());
    };

    walkTriggers(event.triggers, noteTrigger);
    walkTemplateEffects(event.effects, noteTrigger, () => {});
    walkOptions(event.optionTemplates, noteTrigger, () => {});

    for (const passage of Object.values(event.passages ?? {})) {
      for (const variant of passage.variants ?? []) {
        walkTriggers(variant.triggers, noteTrigger);
      }
    }

    for (const node of Object.values(event.nodes ?? {})) {
      walkTriggers(node.triggers, noteTrigger);
      walkTemplateEffects(node.effects, noteTrigger, () => {});
      walkOptions(node.optionTemplates, noteTrigger, () => {});
      for (const passage of Object.values(node.passages ?? {})) {
        for (const variant of passage.variants ?? []) {
          walkTriggers(variant.triggers, noteTrigger);
        }
      }
    }

    return tags;
  }

  /** Story tags this event adds via `add_story_tag` effects. */
  function storyTagsGeneratedByEvent(event: EventTemplate): string[] {
    const tags = new Set<string>();

    const noteEffect = (effect: EventEffect) => {
      if (effect.type !== EventEffectType.AddStoryTag) return;
      const tag = effect.parameters?.tag;
      if (typeof tag === 'string' && tag.trim()) tags.add(tag.trim());
    };

    walkTemplateEffects(event.effects, () => {}, noteEffect);
    walkOptions(event.optionTemplates, () => {}, noteEffect);

    for (const node of Object.values(event.nodes ?? {})) {
      walkTemplateEffects(node.effects, () => {}, noteEffect);
      walkOptions(node.optionTemplates, () => {}, noteEffect);
    }

    return [...tags].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Tags referenced or produced in this arc. Count = events across the full
   * catalog that gate on the tag; 0 means created but never used as a trigger.
   */
  const tagUsage = $derived.by(() => {
    const inArc = new Set<string>();
    for (const event of events) {
      for (const tag of storyTagsReferencedInEvent(event)) inArc.add(tag);
      for (const tag of storyTagsGeneratedByEvent(event)) inArc.add(tag);
    }

    const counts = new Map<string, number>();
    for (const tag of inArc) counts.set(tag, 0);

    for (const event of allEvents) {
      const tags = storyTagsReferencedInEvent(event);
      for (const tag of inArc) {
        if (tags.has(tag)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return [...inArc]
      .map((tag) => ({ tag, count: counts.get(tag) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  });

  const generatedByKey = $derived.by(() => {
    const map = new Map<string, string[]>();
    for (const event of events) {
      map.set(event.key, storyTagsGeneratedByEvent(event));
    }
    return map;
  });

  type LayoutNode = {
    event: EventTemplate;
    x: number;
    y: number;
    level: number;
  };

  type LayoutEdge = {
    fromKey: string;
    toKey: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  function followUpTargets(effects: EventEffect[] | undefined): string[] {
    if (!effects?.length) return [];
    return effects
      .filter((effect) => effect.type === EventEffectType.FollowUpEvent)
      .map((effect) => effect.parameters?.eventKey)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  function scheduledEventTargets(effects: EventEffect[] | undefined): string[] {
    if (!effects?.length) return [];
    return effects
      .filter((effect) => effect.type === EventEffectType.ScheduleActivity)
      .map((effect) => effect.parameters?.activity?.eventId)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  function outgoingEventTargets(effects: EventEffect[] | undefined): string[] {
    return [...followUpTargets(effects), ...scheduledEventTargets(effects)];
  }

  function templateEffectTargets(entries: EventTemplateEffect[] | undefined): string[] {
    return outgoingEventTargets(entries?.map((entry) => entry.effect));
  }

  const layout = $derived.by(() => {
    const byKey = new Map(events.map((event) => [event.key, event]));
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const event of events) {
      adjacency.set(event.key, []);
      inDegree.set(event.key, 0);
    }

    const edgeSeen = new Set<string>();
    const edgeKeys: { from: string; to: string }[] = [];

    const addEdge = (from: string, to: string) => {
      if (!byKey.has(from) || !byKey.has(to)) return;
      const edgeId = `${from}->${to}`;
      if (edgeSeen.has(edgeId)) return;
      edgeSeen.add(edgeId);
      edgeKeys.push({ from, to });
      adjacency.get(from)!.push(to);
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    };

    for (const event of events) {
      for (const trigger of event.triggers ?? []) {
        if (trigger.triggerType !== EventTriggerType.StoryTag) continue;
        const tag = trigger.parameters?.tag;
        if (typeof tag === 'string' && byKey.has(tag)) {
          addEdge(tag, event.key);
        }
      }

      for (const nextKey of templateEffectTargets(event.effects)) {
        addEdge(event.key, nextKey);
      }

      const collectFromOptions = (options: EventTemplate['optionTemplates'] | undefined) => {
        for (const option of options ?? []) {
          for (const nextKey of outgoingEventTargets(option.effects)) {
            addEdge(event.key, nextKey);
          }
          if (option.attributeCheck) {
            for (const nextKey of outgoingEventTargets(option.attributeCheck.successEffects)) {
              addEdge(event.key, nextKey);
            }
            for (const nextKey of outgoingEventTargets(option.attributeCheck.failureEffects)) {
              addEdge(event.key, nextKey);
            }
          }
        }
      };

      collectFromOptions(event.optionTemplates);
      for (const node of Object.values(event.nodes ?? {})) {
        for (const nextKey of templateEffectTargets(node.effects)) {
          addEdge(event.key, nextKey);
        }
        collectFromOptions(node.optionTemplates);
      }
    }

    // Kahn layering; cycles fall into remaining nodes at the end
    const levelOf = new Map<string, number>();
    const queue = events
      .filter((event) => (inDegree.get(event.key) ?? 0) === 0)
      .map((event) => event.key);
    for (const key of queue) levelOf.set(key, 0);

    let head = 0;
    while (head < queue.length) {
      const key = queue[head++];
      const level = levelOf.get(key) ?? 0;
      for (const next of adjacency.get(key) ?? []) {
        const nextLevel = Math.max(levelOf.get(next) ?? 0, level + 1);
        levelOf.set(next, nextLevel);
        const remaining = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, remaining);
        if (remaining === 0) queue.push(next);
      }
    }

    for (const event of events) {
      if (!levelOf.has(event.key)) levelOf.set(event.key, 0);
    }

    const columns = new Map<number, string[]>();
    for (const event of events) {
      const level = levelOf.get(event.key) ?? 0;
      const col = columns.get(level) ?? [];
      col.push(event.key);
      columns.set(level, col);
    }

    const sortedLevels = [...columns.keys()].sort((a, b) => a - b);
    for (const level of sortedLevels) {
      columns.get(level)!.sort((a, b) => a.localeCompare(b));
    }

    const maxColSize = Math.max(1, ...sortedLevels.map((level) => columns.get(level)!.length));
    const nodes: LayoutNode[] = [];
    const positions = new Map<string, { x: number; y: number }>();

    for (const level of sortedLevels) {
      const col = columns.get(level)!;
      const colHeight = col.length * NODE_H + (col.length - 1) * GAP_Y;
      const totalHeight = maxColSize * NODE_H + (maxColSize - 1) * GAP_Y;
      const offsetY = PAD + (totalHeight - colHeight) / 2;

      col.forEach((key, index) => {
        const x = PAD + level * (NODE_W + GAP_X);
        const y = offsetY + index * (NODE_H + GAP_Y);
        positions.set(key, { x, y });
        nodes.push({
          event: byKey.get(key)!,
          x,
          y,
          level,
        });
      });
    }

    const edges: LayoutEdge[] = edgeKeys.map(({ from, to }) => {
      const a = positions.get(from)!;
      const b = positions.get(to)!;
      return {
        fromKey: from,
        toKey: to,
        x1: a.x + NODE_W,
        y1: a.y + NODE_H / 2,
        x2: b.x,
        y2: b.y + NODE_H / 2,
      };
    });

    const width =
      PAD * 2 +
      Math.max(1, sortedLevels.length) * NODE_W +
      Math.max(0, sortedLevels.length - 1) * GAP_X +
      ADD_R;
    const height = PAD * 2 + maxColSize * NODE_H + Math.max(0, maxColSize - 1) * GAP_Y;

    return { nodes, edges, width, height };
  });

  function handleAdd(e: MouseEvent, event: EventTemplate) {
    e.stopPropagation();
    onCreateFollowUp(event);
  }

  function truncate(text: string, max = 28): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  function generatedLabel(event: EventTemplate): string {
    const tags = generatedByKey.get(event.key) ?? [];
    if (tags.length === 0) return '—';
    return truncate(tags.join(', '));
  }
</script>

{#if events.length === 0}
  <p class="empty">No events for this character arc.</p>
{:else}
  {#if tagUsage.length > 0}
    <section class="tag-list" aria-label="Story tags in this arc">
      <button
        type="button"
        class="tag-heading"
        aria-expanded={tagsExpanded}
        onclick={() => (tagsExpanded = !tagsExpanded)}
      >
        Story tags
      </button>
      {#if tagsExpanded}
        <ul class="tags">
          {#each tagUsage as entry (entry.tag)}
            <li
              class="tag-item"
              class:unused={entry.count === 0}
              title={entry.count === 0 ? `${entry.tag} (unused)` : entry.tag}
            >
              <span class="tag-name">{entry.tag}</span>
              <span class="tag-count">{entry.count}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}

  <div class="graph-wrap">
    <svg
      class="graph"
      viewBox="0 0 {layout.width} {layout.height}"
      width={layout.width}
      height={layout.height}
      role="img"
      aria-label="Character arc event graph"
    >
      <defs>
        <marker
          id="arc-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(175, 142, 103, 0.85)" />
        </marker>
      </defs>

      {#each layout.edges as edge (`${edge.fromKey}->${edge.toKey}`)}
        <path
          class="edge"
          d="M {edge.x1} {edge.y1} C {(edge.x1 + edge.x2) / 2} {edge.y1}, {(edge.x1 + edge.x2) /
            2} {edge.y2}, {edge.x2} {edge.y2}"
          marker-end="url(#arc-arrow)"
        />
      {/each}

      {#each layout.nodes as node (node.event.key)}
        {@const generated = generatedByKey.get(node.event.key) ?? []}
        <g class="node-group" transform="translate({node.x}, {node.y})">
          <g
            class="node"
            role="button"
            tabindex="0"
            onclick={() => onEdit(node.event)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit(node.event);
              }
            }}
          >
            <title
              >{node.event.key}{generated.length
                ? `: adds ${generated.join(', ')}`
                : ''}</title
            >
            <rect class="node-bg" width={NODE_W} height={NODE_H} rx="4" ry="4" />
            <text class="node-key" x="12" y="24">{node.event.key}</text>
            <text class="node-text" x="12" y="46">
              {generatedLabel(node.event)}
            </text>
          </g>
          <g
            class="add-btn"
            role="button"
            tabindex="0"
            transform="translate({NODE_W}, {NODE_H / 2})"
            onclick={(e) => handleAdd(e, node.event)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onCreateFollowUp(node.event);
              }
            }}
          >
            <title>Add follow-up event</title>
            <circle class="add-bg" r={ADD_R} />
            <text class="add-label" text-anchor="middle" dominant-baseline="central">+</text>
          </g>
        </g>
      {/each}
    </svg>
  </div>
{/if}

<style>
  .empty {
    margin: 0;
    color: var(--color-muted-label);
  }

  .tag-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.3);
    border-radius: 4px;
  }

  .tag-heading {
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-brass);
    font-family: var(--font-narrative);
    text-align: left;
    cursor: pointer;
    align-self: start;
  }

  .tag-heading:hover {
    color: var(--color-cream);
  }

  .tags {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0.35rem 0.75rem;
  }

  .tag-item {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-family: var(--font-narrative);
    min-width: 0;
  }

  .tag-name {
    color: var(--color-cream);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag-count {
    color: var(--color-muted-label);
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .tag-item.unused .tag-name {
    color: var(--color-muted-label);
  }

  .graph-wrap {
    overflow: auto;
    min-height: 0;
    flex: 1;
    padding: 0.25rem 0;
  }

  .graph {
    display: block;
    max-width: none;
  }

  .edge {
    fill: none;
    stroke: rgba(175, 142, 103, 0.65);
    stroke-width: 1.75;
  }

  .node {
    cursor: pointer;
  }

  .node:focus {
    outline: none;
  }

  .node:focus .node-bg,
  .node:hover .node-bg {
    fill: var(--color-data-hover);
    stroke: rgba(175, 142, 103, 0.7);
  }

  .node-bg {
    fill: var(--color-data);
    stroke: rgba(175, 142, 103, 0.35);
    stroke-width: 1.25;
  }

  .node-key {
    fill: var(--color-brass);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-narrative);
  }

  .node-text {
    fill: var(--color-cream);
    font-size: 11px;
    font-family: var(--font-narrative);
  }

  .add-btn {
    cursor: pointer;
  }

  .add-btn:focus {
    outline: none;
  }

  .add-bg {
    fill: var(--color-brass);
    stroke: var(--color-deep-brown);
    stroke-width: 1;
  }

  .add-btn:hover .add-bg,
  .add-btn:focus .add-bg {
    filter: brightness(1.1);
  }

  .add-label {
    fill: var(--color-deep-brown);
    font-size: 16px;
    font-weight: 700;
    font-family: var(--font-narrative);
    pointer-events: none;
    user-select: none;
  }
</style>
