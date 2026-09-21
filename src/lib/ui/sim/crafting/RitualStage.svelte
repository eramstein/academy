<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getCardCreationBonuses } from '@/lib/sim/actions';
  import { playAddResourceSound } from '@/lib/sim/sound';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import IngredientPile from './IngredientPile.svelte';
  import RitualCircle from './RitualCircle.svelte';

  let {
    selected = $bindable(),
    disabled = false,
    ignite = false,
    dim = false,
    consume = false,
    children,
  }: {
    selected: Record<ResourceType, number>;
    disabled?: boolean;
    ignite?: boolean;
    dim?: boolean;
    consume?: boolean;
    children?: Snippet;
  } = $props();

  const TYPES = Object.values(ResourceType);
  const BEAD = 10;
  const FLY_MS = 520;
  const STAGGER = 52;
  const CONJURE_MS = 1500;
  const MAX_SPIN = 12;
  const SUCTION_START = 900;
  const SUCTION_MS = 600;
  const RADIUS: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 86,
    [ResourceType.Mithril]: 70,
    [ResourceType.Moxes]: 54,
  };
  const SPEED: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 0.0007,
    [ResourceType.Mithril]: -0.00055,
    [ResourceType.Moxes]: 0.00088,
  };

  type Token = { id: string; type: ResourceType; unit: number };
  type Flight = {
    dir: 'in' | 'out';
    fromX: number;
    fromY: number;
    start: number;
    delay: number;
    duration: number;
  };

  let fed = $state(0);
  let benchEl: HTMLDivElement | undefined = $state();
  let circleEl: HTMLDivElement | undefined = $state();
  const tokenEls = new Map<string, HTMLElement>();
  const lastPos = new Map<string, { x: number; y: number }>();
  const flights = new Map<string, Flight>();
  let prevSelected: Record<ResourceType, number> = { ...selected };
  let consumeAt = 0;
  let orbitClock = 0;
  let lastTick = 0;

  const resourceRows = $derived(
    TYPES.map((type) => ({
      type,
      selected: selected[type] ?? 0,
      owned: gs.player.resources[type] ?? 0,
    }))
  );

  const resources = $derived(
    resourceRows
      .filter((row) => row.selected > 0)
      .map((row) => ({ type: row.type, count: row.selected }))
  );

  const bonuses = $derived(getCardCreationBonuses(resources));
  const charge = $derived(
    Math.min(1, resourceRows.reduce((sum, row) => sum + row.selected, 0) / 8)
  );

  const tokens = $derived.by((): Token[] => {
    const list: Token[] = [];
    for (const row of resourceRows) {
      const pile = consume ? row.owned : Math.max(0, row.owned - row.selected);
      const total = pile + row.selected;
      for (let unit = 0; unit < total; unit++) {
        list.push({ id: `${row.type}:${unit}`, type: row.type, unit });
      }
    }
    return list;
  });

  function formatChance(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function setCount(type: ResourceType, value: number) {
    const owned = gs.player.resources[type] ?? 0;
    selected = { ...selected, [type]: Math.min(owned, Math.max(0, value)) };
  }

  function ease(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function tokenId(type: ResourceType, unit: number): string {
    return `${type}:${unit}`;
  }

  function registerToken(node: HTMLElement, id: string) {
    tokenEls.set(id, node);
    return {
      destroy() {
        tokenEls.delete(id);
        lastPos.delete(id);
      },
    };
  }

  function benchPoint(el: Element, bench: DOMRect): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - bench.left,
      y: rect.top + rect.height / 2 - bench.top,
    };
  }

  function pileLocal(index: number): { x: number; y: number } {
    const angle = index * 2.3999632;
    const r = Math.min(14, 3 + Math.sqrt(index) * 4.8);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.4 };
  }

  function nestCenter(type: ResourceType, bench: DOMRect): { x: number; y: number } | null {
    const nest = benchEl?.querySelector(`[data-token-nest="${type}"]`);
    if (!nest) return null;
    return benchPoint(nest, bench);
  }

  function circleCenter(bench: DOMRect): { x: number; y: number } | null {
    if (!circleEl) return null;
    return benchPoint(circleEl, bench);
  }

  function pileTarget(
    type: ResourceType,
    unit: number,
    selectedCount: number,
    bench: DOMRect
  ): { x: number; y: number } | null {
    const nest = nestCenter(type, bench);
    if (!nest) return null;
    const local = pileLocal(unit - selectedCount);
    return { x: nest.x + local.x, y: nest.y + local.y };
  }

  function orbitTarget(
    type: ResourceType,
    unit: number,
    selectedCount: number,
    center: { x: number; y: number }
  ): { x: number; y: number } {
    const n = Math.max(1, selectedCount);
    const angle = orbitClock * SPEED[type] + (unit / n) * Math.PI * 2;
    const radius = RADIUS[type];
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  }

  function startFlights(type: ResourceType, from: number, to: number, now: number) {
    if (to > from) {
      for (let i = 0; i < to - from; i++) {
        const unit = from + i;
        const id = tokenId(type, unit);
        const pos = lastPos.get(id);
        flights.set(id, {
          dir: 'in',
          fromX: pos?.x ?? 0,
          fromY: pos?.y ?? 0,
          start: now,
          delay: i * STAGGER,
          duration: FLY_MS,
        });
      }
      fed += 1;
      playAddResourceSound();
    } else if (to < from) {
      for (let i = 0; i < from - to; i++) {
        const unit = from - 1 - i;
        const id = tokenId(type, unit);
        const pos = lastPos.get(id);
        flights.set(id, {
          dir: 'out',
          fromX: pos?.x ?? 0,
          fromY: pos?.y ?? 0,
          start: now,
          delay: i * STAGGER,
          duration: FLY_MS,
        });
      }
    }
  }

  function feed(type: ResourceType, next: number) {
    setCount(type, next);
  }

  $effect(() => {
    const next = selected;
    untrack(() => {
      const now = performance.now();
      for (const type of TYPES) {
        const before = prevSelected[type] ?? 0;
        const after = next[type] ?? 0;
        if (before !== after) startFlights(type, before, after, now);
      }
      prevSelected = { ...next };
    });
  });

  $effect(() => {
    if (consume) {
      if (!consumeAt) consumeAt = performance.now();
    } else {
      consumeAt = 0;
    }
  });

  function spinBoost(now: number): number {
    if (!ignite || !consumeAt) return 1;
    const t = Math.min(1, (now - consumeAt) / CONJURE_MS);
    return 1 + t * t * (MAX_SPIN - 1);
  }

  function suctionAmount(now: number): number {
    if (!consumeAt) return 0;
    return ease(Math.min(1, Math.max(0, now - consumeAt - SUCTION_START) / SUCTION_MS));
  }

  $effect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const loop = (now: number) => {
      untrack(() => paint(now, reduceMotion));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  function paint(now: number, reduceMotion: boolean) {
    if (!benchEl) return;
    const dt = lastTick ? Math.min(48, now - lastTick) : 0;
    lastTick = now;
    const boost = reduceMotion ? 1 : spinBoost(now);
    orbitClock += dt * boost;
    if (circleEl) {
      for (const node of circleEl.querySelectorAll('.ring, .spiral')) {
        for (const anim of node.getAnimations()) {
          anim.playbackRate = boost;
        }
      }
    }
    const bench = benchEl.getBoundingClientRect();
    const center = circleCenter(bench);
    const suction = suctionAmount(now);
    const counts = untrack(() =>
      TYPES.map((type) => {
        const chosen = selected[type] ?? 0;
        const owned = gs.player.resources[type] ?? 0;
        const pile = consume ? owned : Math.max(0, owned - chosen);
        return { type, chosen, pile };
      })
    );

    for (const token of untrack(() => tokens)) {
      const el = tokenEls.get(token.id);
      if (!el) continue;
      const row = counts.find((c) => c.type === token.type);
      if (!row || !center) continue;

      const inCircle = token.unit < row.chosen;
      const orbit = orbitTarget(token.type, token.unit, row.chosen, center);
      const pile = pileTarget(token.type, token.unit, row.chosen, bench);
      const flight = flights.get(token.id);
      const leftover = consume && !inCircle;

      let x: number;
      let y: number;
      let scale = 1;
      let opacity = leftover ? Math.max(0, 1 - suction) : 1;
      let flying = false;

      if (leftover) {
        // Leftovers dissolve where they sit — never feed into the circle.
        const prev = lastPos.get(token.id);
        if (prev) {
          x = prev.x;
          y = prev.y;
        } else if (pile) {
          x = pile.x;
          y = pile.y;
        } else {
          continue;
        }
        scale = 1 - suction * 0.4;
        flying = false;
      } else if (flight) {
        const t = (now - flight.start - flight.delay) / flight.duration;
        if (t < 0) {
          x = flight.fromX;
          y = flight.fromY;
        } else if (reduceMotion || t >= 1) {
          flights.delete(token.id);
          const dest = flight.dir === 'in' ? orbit : (pile ?? orbit);
          x = dest.x;
          y = dest.y;
        } else {
          flying = true;
          const dest = flight.dir === 'in' ? orbit : (pile ?? orbit);
          const k = ease(t);
          x = lerp(flight.fromX, dest.x, k);
          y = lerp(flight.fromY, dest.y, k);
        }
      } else if (inCircle) {
        x = orbit.x;
        y = orbit.y;
      } else if (pile) {
        const prev = lastPos.get(token.id);
        x = prev ? lerp(prev.x, pile.x, 0.22) : pile.x;
        y = prev ? lerp(prev.y, pile.y, 0.22) : pile.y;
      } else {
        continue;
      }

      if (consume && suction > 0 && inCircle) {
        x = lerp(x, center.x, suction);
        y = lerp(y, center.y, suction);
        scale = 1 - suction * 0.85;
        opacity = 1 - suction;
        flying = false;
      }

      lastPos.set(token.id, { x, y });
      el.style.transform = `translate(${x - BEAD / 2}px, ${y - BEAD / 2}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.classList.toggle('flying', flying);
    }
  }
</script>

<div class="bench" class:consume bind:this={benchEl}>
  <div class="prep">
    <div class="materials">
      {#each resourceRows as row (row.type)}
        <IngredientPile
          type={row.type}
          selected={row.selected}
          owned={row.owned}
          {disabled}
          onChange={(next) => feed(row.type, next)}
        />
      {/each}
    </div>

    <div class="ritual">
      <div class="gauge">
        <span class="gauge-label">Learning</span>
        <span class="gauge-track" aria-hidden="true">
          <span class="gauge-fill" style="transform: scaleX({Math.min(1, bonuses.learningChance)})"
          ></span>
        </span>
        <span class="gauge-value">{formatChance(bonuses.learningChance)}</span>
      </div>

      <div class="circle-slot" bind:this={circleEl}>
        <RitualCircle {charge} {ignite} {dim} {fed} />
      </div>

      <div class="gauge">
        <span class="gauge-label">Fortune</span>
        <span class="gauge-track" aria-hidden="true">
          <span
            class="gauge-fill"
            style="transform: scaleX({Math.min(1, bonuses.extraBudgetChance)})"
          ></span>
        </span>
        <span class="gauge-value">{formatChance(bonuses.extraBudgetChance)}</span>
      </div>
    </div>
  </div>

  {@render children?.()}

  <div class="beads" aria-hidden="true">
    {#each tokens as token (token.id)}
      <span class="bead" data-type={token.type} use:registerToken={token.id}></span>
    {/each}
  </div>
</div>

<style>
  .bench {
    position: relative;
    min-height: 360px;
    flex: 1 1 auto;
  }

  .prep {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .materials {
    display: flex;
    justify-content: center;
    gap: 18px;
    flex-wrap: wrap;
    transition:
      opacity 0.7s ease,
      transform 0.7s ease;
  }

  .bench.consume .materials {
    opacity: 0;
    transform: translateY(36px) scale(0.45);
    pointer-events: none;
  }

  .ritual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 7rem;
    transition: opacity 0.4s ease;
  }

  .bench.consume .gauge {
    opacity: 0;
  }

  .gauge-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #4a3f32;
  }

  .gauge-track {
    display: block;
    width: 5.5rem;
    height: 4px;
    overflow: hidden;
    background: rgba(44, 37, 29, 0.16);
    border-radius: 2px;
  }

  .gauge-fill {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--color-brass);
    transform-origin: left center;
    transition: transform 0.28s ease;
  }

  .gauge-value {
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    color: var(--color-ink);
  }

  .beads {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    overflow: visible;
  }

  .bead {
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-golden);
    box-shadow:
      0 0 0 1px rgba(44, 37, 29, 0.5),
      0 1px 2px rgba(42, 24, 16, 0.4),
      0 0 8px var(--color-golden);
    transform: translate(-999px, -999px);
    opacity: 0;
    will-change: transform, opacity;
  }

  .bead[data-type='mithril'] {
    background: var(--color-cream);
    box-shadow:
      0 0 0 1px rgba(44, 37, 29, 0.5),
      0 1px 2px rgba(42, 24, 16, 0.4),
      0 0 8px var(--color-cream);
  }

  .bead[data-type='moxes'] {
    background: var(--color-brass);
    box-shadow:
      0 0 0 1px rgba(44, 37, 29, 0.5),
      0 1px 2px rgba(42, 24, 16, 0.4),
      0 0 8px var(--color-brass);
  }

  @media (prefers-reduced-motion: reduce) {
    .materials,
    .gauge,
    .gauge-fill {
      animation: none;
      transition: none;
    }
  }
</style>
