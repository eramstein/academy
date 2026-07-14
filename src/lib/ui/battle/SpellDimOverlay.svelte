<script lang="ts">
  import type { EffectTargets, Land, Player, Position, UnitDeployed } from '@lib/_model';
  import { uiState } from '@lib/_state';

  let { sourceEl }: { sourceEl: HTMLElement | null } = $props();

  // Flatten all targets across actions/effects
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

  function centerOf(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }

  function getSourceRect() {
    if (!sourceEl) return null;
    return centerOf(sourceEl);
  }

  function queryTargetRect(t: any) {
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

  function computeRects() {
    const src = getSourceRect();
    const targets = flatTargets()
      .map((t) => queryTargetRect(t))
      .filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    return { src, targets };
  }

  let rects = $derived(computeRects());

  function handleWindowChange() {
    rects = computeRects();
  }

  $effect(() => {
    rects = computeRects();
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

{#if uiState.battle.playedSpell}
  <svg
    class="spell-dim"
    width="100%"
    height="100%"
    viewBox={`0 0 ${innerWidth} ${innerHeight}`}
    preserveAspectRatio="none"
  >
    <defs>
      <mask id="cutout-mask">
        <!-- Start fully visible (white) and punch holes (black) where we want to keep undimmed -->
        <rect x="0" y="0" width={innerWidth} height={innerHeight} fill="white" />
        {#if rects.src}
          <circle
            cx={rects.src.x}
            cy={rects.src.y}
            r={Math.max(rects.src.w, rects.src.h) * 0.6}
            fill="black"
          />
        {/if}
        {#each rects.targets as r}
          <circle cx={r.x} cy={r.y} r={Math.max(r.w, r.h) * 0.65} fill="black" />
        {/each}
      </mask>
    </defs>
    <rect
      x="0"
      y="0"
      width={innerWidth}
      height={innerHeight}
      fill="rgba(0,0,0,0.55)"
      mask="url(#cutout-mask)"
    />
  </svg>
{/if}

<style>
  .spell-dim {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1000; /* under arrows (1001) and flash (1002) */
  }
</style>
