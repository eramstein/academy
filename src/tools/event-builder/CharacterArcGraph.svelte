<script lang="ts">
  import { EventTriggerType, type EventTemplate } from '@/lib/_model';

  let {
    events,
    onEdit,
    onCreateFollowUp,
  }: {
    events: EventTemplate[];
    onEdit: (event: EventTemplate) => void;
    onCreateFollowUp: (fromEvent: EventTemplate) => void;
  } = $props();

  const NODE_W = 180;
  const NODE_H = 72;
  const GAP_X = 48;
  const GAP_Y = 36;
  const PAD = 24;
  const ADD_R = 11;

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
    for (const event of events) {
      for (const trigger of event.triggers ?? []) {
        if (trigger.triggerType !== EventTriggerType.PreviousEvents) continue;
        for (const prevKey of Object.keys(trigger.parameters ?? {})) {
          if (!byKey.has(prevKey)) continue;
          const edgeId = `${prevKey}->${event.key}`;
          if (edgeSeen.has(edgeId)) continue;
          edgeSeen.add(edgeId);
          edgeKeys.push({ from: prevKey, to: event.key });
          adjacency.get(prevKey)!.push(event.key);
          inDegree.set(event.key, (inDegree.get(event.key) ?? 0) + 1);
        }
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

  function truncate(text: string, max = 56): string {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= max) return cleaned;
    return cleaned.slice(0, max - 1) + '…';
  }

  function handleAdd(e: MouseEvent, event: EventTemplate) {
    e.stopPropagation();
    onCreateFollowUp(event);
  }
</script>

{#if events.length === 0}
  <p class="empty">No events for this character arc.</p>
{:else}
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
          d="M {edge.x1} {edge.y1} C {(edge.x1 + edge.x2) / 2} {edge.y1}, {(edge.x1 + edge.x2) / 2} {edge.y2}, {edge.x2} {edge.y2}"
          marker-end="url(#arc-arrow)"
        />
      {/each}

      {#each layout.nodes as node (node.event.key)}
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
            <title>{node.event.key}: {node.event.text}</title>
            <rect class="node-bg" width={NODE_W} height={NODE_H} rx="4" ry="4" />
            <text class="node-key" x="12" y="24">{node.event.key}</text>
            <text class="node-text" x="12" y="46">
              {truncate(node.event.text, 28)}
            </text>
            {#if node.event.triggersOnce}
              <text class="node-meta" x="12" y="62">once</text>
            {/if}
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

  .node-meta {
    fill: var(--color-muted-label);
    font-size: 10px;
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
