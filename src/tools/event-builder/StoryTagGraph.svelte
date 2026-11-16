<script lang="ts">
  import type { EventTemplate } from '@/lib/_model';
  import {
    countRole,
    indexStoryTags,
    storyEdgeLabel,
    storyNodeDetail,
    storyTagColumns,
    type StoryTagNode,
  } from './story-tags';

  let {
    events,
    selectedTag = $bindable<string | null>(null),
    onEdit,
    onShowCatalog,
  }: {
    events: EventTemplate[];
    selectedTag?: string | null;
    onEdit: (event: EventTemplate) => void;
    onShowCatalog: () => void;
  } = $props();

  let query = $state('');
  let pane = $state<HTMLDivElement | undefined>();

  const NODE_W = 228;
  const NODE_H = 78;
  const GAP_X = 108;
  const GAP_Y = 16;
  const PAD_X = 28;
  const PAD_TOP = 36;
  const PAD_BOTTOM = 28;
  const TAG_LINE = 26;

  const usages = $derived(indexStoryTags(events));
  const byKey = $derived(new Map(events.map((event) => [event.key, event])));

  const visible = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usages;
    return usages.filter(
      (usage) => usage.tag.toLowerCase().includes(q) || usage.tag === selectedTag
    );
  });

  const active = $derived(usages.find((usage) => usage.tag === selectedTag) ?? null);
  const columns = $derived(storyTagColumns(active ?? undefined));

  function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  function wrapTag(tag: string): string[] {
    const max = TAG_LINE;
    if (tag.length <= max) return [tag];
    const lines: string[] = [];
    let current = '';
    for (const part of tag.split('_')) {
      const next = current ? `${current}_${part}` : part;
      if (current && next.length > max) {
        lines.push(current);
        current = part;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    if (lines.length <= 2) return lines;
    return [lines[0], truncate(lines.slice(1).join('_'), max)];
  }

  function stackHeight(count: number): number {
    if (count === 0) return 0;
    return count * NODE_H + (count - 1) * GAP_Y;
  }

  const layout = $derived.by(() => {
    if (!active) return null;
    const grants = columns.grants;
    const triggers = columns.triggers;
    const nameLines = wrapTag(active.tag);
    const tagH = nameLines.length === 1 ? 78 : 96;
    const longestLine = Math.max(...nameLines.map((line) => line.length));
    const tagW = Math.min(260, Math.max(168, Math.ceil(longestLine * 8.2) + 40));
    const showLeft = grants.length > 0;
    const showRight = triggers.length > 0;
    const leftW = showLeft ? NODE_W : 0;
    const rightW = showRight ? NODE_W : 0;
    const gapLeft = showLeft ? GAP_X : 0;
    const gapRight = showRight ? GAP_X : 0;
    const bodyH = Math.max(stackHeight(grants.length), stackHeight(triggers.length), tagH);
    const width = PAD_X * 2 + leftW + gapLeft + tagW + gapRight + rightW;
    const height = PAD_TOP + bodyH + PAD_BOTTOM;
    const leftX = PAD_X;
    const tagX = PAD_X + leftW + gapLeft;
    const rightX = tagX + tagW + gapRight;
    const tagY = PAD_TOP + (bodyH - tagH) / 2;

    const yAt = (index: number, count: number) => {
      const offset = PAD_TOP + (bodyH - stackHeight(count)) / 2;
      return offset + index * (NODE_H + GAP_Y);
    };

    type Placed = StoryTagNode & { x: number; y: number; label: string; detail: string };
    type Edge = { key: string; x1: number; y1: number; x2: number; y2: number; label: string; lx: number; ly: number };

    const place = (nodes: StoryTagNode[], x: number): Placed[] =>
      nodes.map((node, index) => ({
        ...node,
        x,
        y: yAt(index, nodes.length),
        label: storyEdgeLabel(node),
        detail: storyNodeDetail(node),
      }));

    const left = place(grants, leftX);
    const right = place(triggers, rightX);
    const tagMidY = tagY + tagH / 2;

    const edges: Edge[] = [
      ...left.map((node) => {
        const x1 = node.x + NODE_W;
        const y1 = node.y + NODE_H / 2;
        const x2 = tagX;
        const y2 = tagMidY;
        const t = 0.34;
        return {
          key: `grant:${node.eventKey}`,
          x1,
          y1,
          x2,
          y2,
          label: node.label,
          lx: x1 + (x2 - x1) * t,
          ly: y1 + (y2 - y1) * t - 8,
        };
      }),
      ...right.map((node) => {
        const x1 = tagX + tagW;
        const y1 = tagMidY;
        const x2 = node.x;
        const y2 = node.y + NODE_H / 2;
        const t = 0.66;
        return {
          key: `trigger:${node.eventKey}`,
          x1,
          y1,
          x2,
          y2,
          label: node.label,
          lx: x1 + (x2 - x1) * t,
          ly: y1 + (y2 - y1) * t - 8,
        };
      }),
    ];

    return {
      width,
      height,
      tagX,
      tagY,
      tagW,
      tagH,
      nameLines,
      showLeft,
      showRight,
      leftX,
      rightX,
      left,
      right,
      edges,
    };
  });

  function eventTitle(eventKey: string, detail: string): string {
    const event = byKey.get(eventKey);
    const parts = [eventKey];
    if (event?.title) parts.push(event.title);
    if (event?.characterArc) parts.push(event.characterArc);
    parts.push(detail);
    return parts.join(' · ');
  }

  function detailLines(detail: string): string[] {
    const max = 36;
    const parts = detail.split(' · ');
    const lines: string[] = [];
    let current = '';
    for (const part of parts) {
      const next = current ? `${current} · ${part}` : part;
      if (current && next.length > max) {
        lines.push(current);
        current = part;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    if (lines.length <= 2) return lines.map((line) => truncate(line, max));
    return [truncate(lines[0], max), truncate(lines.slice(1).join(' · '), max)];
  }

  $effect(() => {
    const node = pane;
    const current = layout;
    const tag = active?.tag;
    if (!node || !current || !tag) return;
    const tagCenter = current.tagX + current.tagW / 2;
    node.scrollLeft = Math.max(0, tagCenter - node.clientWidth / 2);
  });

  function openEvent(eventKey: string) {
    const event = byKey.get(eventKey);
    if (event) onEdit(event);
  }

  function onNodeKeydown(event: KeyboardEvent, eventKey: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openEvent(eventKey);
  }
</script>

<div class="story-view">
  <header class="header">
    <div class="title-block">
      <h1>Story tags</h1>
      <p class="subtitle">
        {#if active}
          {active.tag} · {countRole(active, 'grant')} grant{countRole(active, 'grant') === 1
            ? ''
            : 's'} · {countRole(active, 'trigger')} trigger{countRole(active, 'trigger') === 1
            ? ''
            : 's'}
        {:else}
          {usages.length} tag{usages.length === 1 ? '' : 's'}
        {/if}
      </p>
    </div>
    <button type="button" class="ghost" onclick={onShowCatalog}>Catalog</button>
  </header>

  <p class="hint">
    Events on the left add to the tag. Events on the right check it. A dashed card is the event
    that stamps this tag +1 when it fires. A threshold of −1 means the tag is absent.
  </p>

  <div class="body">
    <aside class="aside" aria-label="Story tags">
      <label class="search">
        <span class="sr">Search story tags</span>
        <input type="search" placeholder="Search story tags…" bind:value={query} />
      </label>
      {#if visible.length === 0}
        <p class="empty">
          {usages.length === 0 ? 'No story tags in the catalog.' : 'No story tags match.'}
        </p>
      {:else}
        <ul class="tag-list">
          {#each visible as usage (usage.tag)}
            <li>
              <button
                type="button"
                class="tag-btn"
                class:active={usage.tag === selectedTag}
                aria-pressed={usage.tag === selectedTag}
                onclick={() => (selectedTag = usage.tag)}
              >
                <span class="tag-name">{usage.tag}</span>
                <span class="tag-meta">
                  {countRole(usage, 'grant')} grant{countRole(usage, 'grant') === 1 ? '' : 's'} ·
                  {countRole(usage, 'trigger')} trigger{countRole(usage, 'trigger') === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </aside>

    <div class="graph-pane" bind:this={pane}>
      {#if !active || !layout}
        <p class="empty pane-empty">Select a story tag to see which events grant it and which events require it.</p>
      {:else}
        <svg
          class="graph"
          viewBox="0 0 {layout.width} {layout.height}"
          width={layout.width}
          height={layout.height}
          role="group"
          aria-label="Events that grant or require {active.tag}"
        >
          <defs>
            <marker
              id="story-tag-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(175, 142, 103, 0.9)" />
            </marker>
          </defs>

          {#if layout.showLeft}
            <text class="col-label" x={layout.leftX} y="22">Grants</text>
          {/if}
          {#if layout.showRight}
            <text class="col-label" x={layout.rightX} y="22">Requires</text>
          {/if}

          {#each layout.edges as edge (edge.key)}
            <path
              class="edge"
              class:trigger={edge.key.startsWith('trigger:')}
              d="M {edge.x1} {edge.y1} C {(edge.x1 + edge.x2) / 2} {edge.y1}, {(edge.x1 + edge.x2) /
                2} {edge.y2}, {edge.x2} {edge.y2}"
              marker-end="url(#story-tag-arrow)"
            />
            <text
              class="edge-label"
              class:trigger={edge.key.startsWith('trigger:')}
              x={edge.lx}
              y={edge.ly}
              text-anchor="middle"
            >
              {edge.label}
            </text>
          {/each}

          <g class="tag-node" transform="translate({layout.tagX}, {layout.tagY})">
            <rect class="tag-bg" width={layout.tagW} height={layout.tagH} rx="4" ry="4" />
            {#each layout.nameLines as line, index (`${index}:${line}`)}
              <text class="tag-label" x={layout.tagW / 2} y={layout.nameLines.length === 1 ? 34 : 30 + index * 18} text-anchor="middle">
                {line}
              </text>
            {/each}
            <text class="tag-caption" x={layout.tagW / 2} y={layout.tagH - 16} text-anchor="middle">
              story tag
            </text>
          </g>

          {#each [...layout.left, ...layout.right] as node (`${node.sites[0]?.role}:${node.eventKey}`)}
            <g
              class="node"
              class:stamp={node.stampOnly}
              role="button"
              tabindex="0"
              transform="translate({node.x}, {node.y})"
              onclick={() => openEvent(node.eventKey)}
              onkeydown={(e) => onNodeKeydown(e, node.eventKey)}
            >
              <title>{eventTitle(node.eventKey, node.detail)}</title>
              <rect class="node-bg" width={NODE_W} height={NODE_H} rx="4" ry="4" />
              <text class="node-key" x="12" y="22">{truncate(node.eventKey, 30)}</text>
              {#each detailLines(node.detail) as line, index (`${node.eventKey}:${index}`)}
                <text class="node-detail" x="12" y={42 + index * 16}>{line}</text>
              {/each}
            </g>
          {/each}
        </svg>
      {/if}
    </div>
  </div>
</div>

<style>
  .story-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: 100%;
    min-height: 0;
    padding: 1.25rem 1.5rem 1.5rem;
    box-sizing: border-box;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(175, 142, 103, 0.35);
  }

  .title-block {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    min-width: 0;
  }

  h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-label);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ghost {
    padding: 0.45rem 0.8rem;
    border-radius: 4px;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    background: transparent;
    border: 1px solid rgba(175, 142, 103, 0.45);
    color: var(--color-cream);
    flex-shrink: 0;
  }

  .ghost:hover {
    background: var(--color-data-hover);
    border-color: var(--color-brass);
  }

  .hint {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-muted-label);
  }

  .body {
    display: flex;
    gap: 1.25rem;
    flex: 1;
    min-height: 0;
  }

  .aside {
    width: 280px;
    flex: 0 0 280px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
  }

  .search {
    display: block;
    flex-shrink: 0;
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.45rem 0.7rem;
    border-radius: 4px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--color-cream);
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.35);
  }

  .search input::placeholder {
    color: var(--color-muted-label);
  }

  .search input:focus {
    outline: none;
    border-color: var(--color-brass);
  }

  .tag-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    overflow: auto;
    min-height: 0;
  }

  .tag-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    width: 100%;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-cream);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .tag-btn:hover {
    background: var(--color-data-hover);
  }

  .tag-btn.active {
    background: rgba(175, 142, 103, 0.2);
    border-color: var(--color-brass);
  }

  .tag-name {
    font-size: 0.86rem;
    overflow-wrap: anywhere;
  }

  .tag-meta {
    font-size: 0.75rem;
    color: var(--color-muted-label);
  }

  .empty {
    margin: 0;
    color: var(--color-muted-label);
    font-size: 0.9rem;
  }

  .pane-empty {
    padding: 1.25rem;
  }

  .graph-pane {
    flex: 1;
    min-width: 0;
    overflow: auto;
    border: 1px solid rgba(175, 142, 103, 0.25);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.15);
  }

  .graph {
    display: block;
    user-select: none;
  }

  .col-label {
    fill: var(--color-muted-label);
    font-size: 12px;
    font-family: var(--font-narrative);
    letter-spacing: 0.04em;
  }

  .edge {
    fill: none;
    stroke: rgba(175, 142, 103, 0.75);
    stroke-width: 1.75;
  }

  .edge.trigger {
    stroke: rgba(240, 230, 200, 0.45);
  }

  .edge-label {
    fill: var(--color-golden);
    font-size: 12px;
    font-family: var(--font-narrative);
    font-weight: 600;
    stroke: var(--color-navy);
    stroke-width: 3px;
    paint-order: stroke;
    pointer-events: none;
  }

  .edge-label.trigger {
    fill: var(--color-cream);
    font-weight: 500;
  }

  .tag-bg {
    fill: var(--color-data-active);
    stroke: var(--color-golden);
    stroke-width: 1.75;
  }

  .tag-label {
    fill: var(--color-golden);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-narrative);
  }

  .tag-caption {
    fill: var(--color-muted-label);
    font-size: 11px;
    font-family: var(--font-narrative);
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
    stroke: rgba(175, 142, 103, 0.75);
  }

  .node-bg {
    fill: var(--color-data);
    stroke: rgba(175, 142, 103, 0.4);
    stroke-width: 1.25;
  }

  .node.stamp .node-bg {
    stroke-dasharray: 4 3;
  }

  .node-key {
    fill: var(--color-brass);
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-narrative);
  }

  .node-detail {
    fill: var(--color-cream);
    font-size: 11px;
    font-family: var(--font-narrative);
  }
</style>
