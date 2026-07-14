<script lang="ts">
  import type { EffectTargets, Land, Player, Position, UnitDeployed } from '@lib/_model';
  import { uiState } from '@lib/_state';

  let { sourceEl }: { sourceEl: HTMLElement | null } = $props();

  // Flatten all targets across actions/effects into a simple array
  let flatTargets = $derived(() => {
    const t = uiState.battle.playedSpellTargets;
    if (!t) return [] as (UnitDeployed | Land | Player | Position)[];
    const out: (UnitDeployed | Land | Player | Position)[] = [];
    for (const action of t) {
      for (const effectGroup of action) {
        for (const target of effectGroup as EffectTargets) {
          out.push(target as any);
        }
      }
    }
    return out;
  });

  function getSourceCenter() {
    if (!sourceEl) return null;
    const r = sourceEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function getTargetCenter(t: any) {
    // Priority order: unit, land, player; positions are board cells
    if (t && typeof t === 'object') {
      if ('instanceId' in t && 'position' in t) {
        const el = document.querySelector(
          `[data-unit-instance-id="${(t as UnitDeployed).instanceId}"]`
        ) as HTMLElement | null;
        if (el) return centerOf(el);
      }
      if ('instanceId' in t && 'position' in t === false && 'ownerPlayerId' in t) {
        const el = document.querySelector(
          `[data-land-instance-id="${(t as Land).instanceId}"]`
        ) as HTMLElement | null;
        if (el) return centerOf(el);
      }
      if ('id' in t && 'hand' in t) {
        const el = document.querySelector(
          `[data-player-id="${(t as Player).id}"]`
        ) as HTMLElement | null;
        if (el) return centerOf(el);
      }
      if ('row' in t && 'column' in t) {
        const el = document.querySelector(
          `.board-cell[data-row="${(t as Position).row}"][data-column="${(t as Position).column}"]`
        ) as HTMLElement | null;
        if (el) return centerOf(el);
      }
    }
    return null;
  }

  function centerOf(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function computeArrows() {
    const src = getSourceCenter();
    if (!src) return [] as { x1: number; y1: number; x2: number; y2: number }[];
    return flatTargets()
      .map((t) => {
        const dst = getTargetCenter(t);
        if (!dst) return null;
        return { x1: src.x, y1: src.y, x2: dst.x, y2: dst.y };
      })
      .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number }[];
  }

  let arrows = $derived(computeArrows());

  // Recompute on resize/scroll to keep alignment
  function handleWindowChange() {
    arrows = computeArrows();
  }

  $effect(() => {
    arrows = computeArrows();
  });

  let cleanup: (() => void) | null = null;
  $effect(() => {
    function onResize() {
      handleWindowChange();
    }
    function onScroll() {
      handleWindowChange();
    }
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanup = () => {
      window.removeEventListener('resize', onResize as any);
      window.removeEventListener('scroll', onScroll as any);
    };
    return () => cleanup && cleanup();
  });
</script>

{#if uiState.battle.playedSpell && flatTargets().length > 0}
  <svg
    class="spell-arrows"
    width="100%"
    height="100%"
    viewBox={`0 0 ${innerWidth} ${innerHeight}`}
    preserveAspectRatio="none"
  >
    <defs>
      <marker
        id="arrowhead-outline"
        markerWidth="9"
        markerHeight="9"
        refX="9"
        refY="4.5"
        orient="auto-start-reverse"
        markerUnits="userSpaceOnUse"
      >
        <polygon points="0 0, 9 4.5, 0 9" fill="#000" opacity="0.9" />
      </marker>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="8"
        refY="4"
        orient="auto-start-reverse"
      >
        <polygon points="0 0, 8 4, 0 8" fill="#f1c40f" />
      </marker>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {#each arrows as a}
      <!-- Outline layer -->
      <line
        x1={a.x1}
        y1={a.y1}
        x2={a.x2}
        y2={a.y2}
        stroke="#000"
        stroke-width="7"
        stroke-linecap="round"
        stroke-linejoin="round"
        marker-end="url(#arrowhead-outline)"
        opacity="0.9"
      />
      <!-- Foreground golden layer -->
      <line
        x1={a.x1}
        y1={a.y1}
        x2={a.x2}
        y2={a.y2}
        stroke="#f1c40f"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        marker-end="url(#arrowhead)"
        filter="url(#glow)"
        opacity="0.98"
      />
    {/each}
  </svg>
{/if}

<style>
  .spell-arrows {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1001;
  }
</style>
