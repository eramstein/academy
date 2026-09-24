<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import { getCardCreationBonuses } from '@/lib/sim/actions';
  import { playAddResourceSound } from '@/lib/sim/sound';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly, scale } from 'svelte/transition';
  import IngredientPile from './IngredientPile.svelte';
  import RitualCircle from './RitualCircle.svelte';

  export type RitualCharm = { id: string; icon: string };

  type CharmFlight = {
    id: string;
    icon: string;
    dir: 'in' | 'out';
    fromX: number | null;
    fromY: number | null;
    start: number;
    duration: number;
    gen: number;
  };

  let {
    selected = $bindable(),
    disabled = false,
    ignite = false,
    dim = false,
    consume = false,
    split = false,
    charms = [],
    onCharmLanded,
    circleContent,
    vessel,
    showVessel = false,
    showFlank = true,
    suppressCore = false,
    flank,
    children,
  }: {
    selected: Record<ResourceType, number>;
    disabled?: boolean;
    ignite?: boolean;
    dim?: boolean;
    consume?: boolean;
    /** Resources on one side, tray on the other; vessel sits inside the circle. */
    split?: boolean;
    charms?: RitualCharm[];
    onCharmLanded?: (id: string) => void;
    /** Overlay inside the ritual circle (e.g. Unit / Spell pick). */
    circleContent?: Snippet;
    /** Card preview shown inside the circle. */
    vessel?: Snippet;
    showVessel?: boolean;
    showFlank?: boolean;
    /** Fade the rotating core glyph (vessel flight / forming card). */
    suppressCore?: boolean;
    flank?: Snippet;
    children?: Snippet;
  } = $props();

  const TYPES = Object.values(ResourceType);
  const pagePath = getAssetPath('images/ui/backgrounds/book-page.png');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
  const bookIcon = getUiIconPath('book');
  const starIcon = getUiIconPath('star');
  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: getUiIconPath('magic_dust'),
    [ResourceType.Mithril]: getUiIconPath('metal_bar'),
    [ResourceType.Moxes]: getUiIconPath('gem'),
  };
  const BEAD = 28;
  const CHARM = 32;
  const FLY_MS = 520;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAGGER = 52;
  const CONJURE_MS = 1500;
  const MAX_SPIN = 12;
  const SUCTION_START = 900;
  const SUCTION_MS = 600;
  const RADIUS_BASE: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 103,
    [ResourceType.Mithril]: 84,
    [ResourceType.Moxes]: 65,
  };
  /** Wider orbits when the forming card sits in the enlarged split circle. */
  const RADIUS_SPLIT: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 214,
    [ResourceType.Mithril]: 202,
    [ResourceType.Moxes]: 190,
  };
  const SPEED: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 0.0007,
    [ResourceType.Mithril]: -0.00055,
    [ResourceType.Moxes]: 0.00088,
  };

  const orbitRadius = $derived(split ? RADIUS_SPLIT : RADIUS_BASE);

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
  /* eslint-disable svelte/prefer-svelte-reactivity -- mutated every animation frame */
  const tokenEls = new Map<string, HTMLElement>();
  const charmEls = new Map<string, HTMLElement>();
  const lastPos = new Map<string, { x: number; y: number }>();
  const lastCharmPos = new Map<string, { x: number; y: number }>();
  const flights = new Map<string, Flight>();
  const charmGen = new Map<string, number>();
  let charmFlights = $state<CharmFlight[]>([]);
  let seenCharms = new Map<string, string>();
  /* eslint-enable svelte/prefer-svelte-reactivity */
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

  function registerCharm(node: HTMLElement, id: string) {
    charmEls.set(id, node);
    return {
      destroy() {
        charmEls.delete(id);
      },
    };
  }

  function charmNest(id: string, bench: DOMRect): { x: number; y: number } | null {
    if (!benchEl) return null;
    for (const node of benchEl.querySelectorAll('[data-charm-nest]')) {
      if (node.getAttribute('data-charm-nest') === id) return benchPoint(node, bench);
    }
    return null;
  }

  function launchCharm(id: string, icon: string, dir: 'in' | 'out', now: number) {
    const gen = (charmGen.get(id) ?? 0) + 1;
    charmGen.set(id, gen);
    if (reduceMotion) {
      if (dir === 'in') onCharmLanded?.(id);
      return;
    }
    const from = dir === 'out' ? lastCharmPos.get(id) : undefined;
    charmFlights = [
      ...charmFlights.filter((flight) => flight.id !== id),
      {
        id,
        icon,
        dir,
        fromX: from?.x ?? null,
        fromY: from?.y ?? null,
        start: now,
        duration: FLY_MS,
        gen,
      },
    ];
    if (dir === 'in') fed += 1;
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

  function charmLandKind(id: string): 'pigment' | 'essence' | 'rune' | null {
    if (id.startsWith('pigment:')) return 'pigment';
    if (id.startsWith('essence:')) return 'essence';
    if (id.startsWith('rune:') || id.startsWith('incantation:')) return 'rune';
    return null;
  }

  /** Landing spot on the forming card (or circle center as fallback). */
  function charmLand(
    id: string,
    bench: DOMRect,
    center: { x: number; y: number } | null
  ): { x: number; y: number } | null {
    const kind = charmLandKind(id);
    if (kind && benchEl) {
      const nest = benchEl.querySelector(`[data-charm-land="${kind}"]`);
      if (nest) return benchPoint(nest, bench);
    }
    return center;
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
    const radius = orbitRadius[type];
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
    const next = charms;
    untrack(() => {
      const now = performance.now();
      const nextIds = new Set(next.map((charm) => charm.id));
      for (const [id, icon] of seenCharms) {
        if (!nextIds.has(id)) launchCharm(id, icon, 'out', now);
      }
      for (const charm of next) {
        if (!seenCharms.has(charm.id)) launchCharm(charm.id, charm.icon, 'in', now);
      }
      seenCharms = new Map(next.map((charm) => [charm.id, charm.icon]));
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
    paintCharms(now, bench, center);
  }

  function paintCharms(now: number, bench: DOMRect, center: { x: number; y: number } | null) {
    const done: string[] = [];
    for (const flight of charmFlights) {
      const el = charmEls.get(flight.id);
      if (!el) continue;
      if (charmGen.get(flight.id) !== flight.gen) {
        done.push(flight.id);
        continue;
      }

      let fromX = flight.fromX;
      let fromY = flight.fromY;
      if (fromX === null || fromY === null) {
        const origin =
          flight.dir === 'in' ? charmNest(flight.id, bench) : charmLand(flight.id, bench, center);
        if (!origin) continue;
        fromX = origin.x;
        fromY = origin.y;
        flight.fromX = fromX;
        flight.fromY = fromY;
        flight.start = now;
      }

      const dest =
        flight.dir === 'in' ? charmLand(flight.id, bench, center) : charmNest(flight.id, bench);
      const t = (now - flight.start) / flight.duration;
      if (!dest) {
        if (t >= 1) done.push(flight.id);
        else el.style.opacity = String(Math.max(0, 1 - ease(Math.max(0, t))));
        continue;
      }

      let x: number;
      let y: number;
      let scale = 1;
      let opacity = 1;
      if (t >= 1) {
        done.push(flight.id);
        x = dest.x;
        y = dest.y;
        scale = flight.dir === 'in' ? 0.3 : 1;
        opacity = 0;
      } else {
        const k = ease(Math.max(0, t));
        x = lerp(fromX, dest.x, k);
        y = lerp(fromY, dest.y, k);
        scale = flight.dir === 'in' ? lerp(1, 0.4, k) : lerp(0.4, 1, k);
        opacity = flight.dir === 'in' && k > 0.78 ? 1 - (k - 0.78) / 0.22 : 1;
      }

      lastCharmPos.set(flight.id, { x, y });
      el.style.transform = `translate(${x - CHARM / 2}px, ${y - CHARM / 2}px) scale(${scale})`;
      el.style.opacity = String(opacity);
    }

    if (!done.length) return;
    const landed = charmFlights
      .filter(
        (flight) =>
          done.includes(flight.id) && flight.dir === 'in' && charmGen.get(flight.id) === flight.gen
      )
      .map((flight) => flight.id);
    charmFlights = charmFlights.filter((flight) => !done.includes(flight.id));
    for (const id of landed) onCharmLanded?.(id);
  }
</script>

<div
  class="bench"
  class:consume
  class:split
  bind:this={benchEl}
  style="--page: url('{pagePath}'); --plaque: url('{parchmentPath}')"
>
  <div class="prep" class:split>
    {#if split}
      <div class="materials-col">
        <h3 class="col-title">Resources</h3>
        <div class="materials resources-board">
          {#each resourceRows as row (row.type)}
            <IngredientPile
              type={row.type}
              selected={row.selected}
              owned={row.owned}
              {disabled}
              showCount
              showIcon={false}
              layout="row"
              onChange={(next) => feed(row.type, next)}
            />
          {/each}
        </div>
        <div class="gauge-pair">
          <div class="gauge chart">
            <img class="gauge-icon" src={bookIcon} alt="" />
            <div class="gauge-head">
              <span class="gauge-label">Learning</span>
              <span class="gauge-value">{formatChance(bonuses.learningChance)}</span>
            </div>
            <span class="gauge-track" aria-hidden="true">
              <span class="gauge-fill" style="width: {Math.min(1, bonuses.learningChance) * 100}%"
              ></span>
            </span>
          </div>
          <div class="gauge chart">
            <img class="gauge-icon" src={starIcon} alt="" />
            <div class="gauge-head">
              <span class="gauge-label">Fortune</span>
              <span class="gauge-value">{formatChance(bonuses.extraBudgetChance)}</span>
            </div>
            <span class="gauge-track" aria-hidden="true">
              <span
                class="gauge-fill"
                style="width: {Math.min(1, bonuses.extraBudgetChance) * 100}%"
              ></span>
            </span>
          </div>
        </div>
      </div>
    {:else}
      <div class="materials">
        {#each resourceRows as row (row.type)}
          <IngredientPile
            type={row.type}
            selected={row.selected}
            owned={row.owned}
            {disabled}
            showCount
            showIcon={false}
            onChange={(next) => feed(row.type, next)}
          />
        {/each}
      </div>
    {/if}

    <div class="ritual">
      {#if !split}
        <div class="gauge">
          <span class="gauge-label">Learning</span>
          <span class="gauge-track" aria-hidden="true">
            <span
              class="gauge-fill"
              style="transform: scaleX({Math.min(1, bonuses.learningChance)})"
            ></span>
          </span>
          <span class="gauge-value">{formatChance(bonuses.learningChance)}</span>
        </div>
      {/if}

      <div class="ritual-core">
        <div class="circle-slot" bind:this={circleEl}>
          <RitualCircle
            {charge}
            {ignite}
            {dim}
            {fed}
            ornate={split}
            suppressCore={suppressCore || showVessel}
          />
          {#if circleContent}
            <div class="circle-content">{@render circleContent()}</div>
          {/if}
          {#if showVessel && vessel}
            <div class="vessel">
              <div class="vessel-inner" in:scale={{ start: 0.72, duration: 420, easing: cubicOut }}>
                {@render vessel()}
              </div>
            </div>
          {/if}
        </div>
      </div>

      {#if split}
        <p class="shape-hint" class:ready={showVessel} aria-hidden={!showVessel}>
          Add ingredients to shape your card
        </p>
      {/if}

      {#if !split}
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
      {/if}
    </div>
    {#if showFlank && flank}
      <div class="flank" in:fly={{ x: 28, duration: 460, delay: 100 }}>
        <div class="flank-body">{@render flank()}</div>
      </div>
    {/if}
  </div>

  {@render children?.()}

  <div class="beads" aria-hidden="true">
    {#each tokens as token (token.id)}
      <img
        class="bead"
        data-type={token.type}
        src={RESOURCE_ICONS[token.type]}
        alt=""
        use:registerToken={token.id}
      />
    {/each}
    {#each charmFlights as flight (flight.id + ':' + flight.gen)}
      <img class="charm" src={flight.icon} alt="" use:registerCharm={flight.id} />
    {/each}
  </div>
</div>

<style>
  .bench {
    position: relative;
    min-height: 360px;
    flex: 1 1 auto;
    overflow: visible;
  }

  .bench.split {
    display: flex;
    flex-direction: column;
    min-height: 0;
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

  .prep.split {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
    justify-content: stretch;
    gap: 18px;
    width: 100%;
    min-height: 0;
    overflow: visible;
  }

  .col-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin: 0 0 6px;
    width: 100%;
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  .diamond {
    width: 7px;
    height: 7px;
    flex-shrink: 0;
    background: #5c4632;
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }

  .prep.split .materials {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    flex: 0 0 auto;
    gap: 8px;
  }

  .resources-board {
    padding: 8px;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    background: rgba(255, 248, 230, 0.42);
    box-shadow:
      0 6px 14px rgba(42, 24, 16, 0.16),
      inset 0 0 0 1px rgba(255, 248, 230, 0.3);
  }

  .resources-board :global(.pile.row) {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
  }

  .resources-board :global(.pile.row:hover:not(:disabled):not(.empty)) {
    border-color: rgba(90, 75, 60, 0.35);
    background: rgba(255, 248, 230, 0.35);
  }

  .resources-board :global(.pile.row.on) {
    border-color: color-mix(in srgb, var(--color-golden) 65%, transparent);
    background: rgba(191, 161, 74, 0.12);
  }

  .materials-col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    align-self: stretch;
    justify-self: start;
    gap: 8px;
    width: min(14.5rem, 100%);
    max-width: 15rem;
  }

  .materials-col .materials {
    width: 100%;
  }

  .materials-col .gauge-pair {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 10px;
    margin-top: auto;
    transform: translateY(-10px);
    padding: 10px 12px 12px;
    border: 1px solid var(--color-brown-border);
    border-radius: 3px;
    background: var(--color-parchment) var(--plaque) center / cover;
    background-blend-mode: multiply;
    box-shadow:
      0 8px 16px rgba(42, 24, 16, 0.22),
      inset 0 0 0 1px rgba(255, 248, 230, 0.35);
  }

  .materials-col .gauge.chart {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    column-gap: 8px;
    row-gap: 3px;
    align-items: center;
    min-width: 0;
    width: 100%;
  }

  .materials-col .gauge.chart .gauge-icon {
    grid-row: 1 / span 2;
    align-self: center;
    width: 18px;
    height: 18px;
    object-fit: contain;
    filter: drop-shadow(0 1px 1px rgba(42, 24, 16, 0.35));
  }

  .materials-col .gauge.chart .gauge-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }

  .materials-col .gauge.chart .gauge-label {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-align: left;
    color: var(--color-ink);
  }

  .materials-col .gauge.chart .gauge-value {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
    text-align: right;
  }

  .materials-col .gauge.chart .gauge-track {
    grid-column: 2;
    width: 100%;
    min-width: 0;
    height: 7px;
    border-radius: 999px;
    background: rgba(74, 58, 42, 0.22);
    box-shadow: inset 0 1px 2px rgba(42, 24, 16, 0.28);
    overflow: hidden;
  }

  .materials-col .gauge.chart .gauge-fill {
    display: block;
    height: 100%;
    max-width: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 100%), #1a2433;
    transform: none;
    transform-origin: left center;
    transition: width 0.28s ease;
  }

  .prep.split .ritual {
    justify-self: center;
    align-self: center;
    justify-content: center;
    transform: translateX(-150px);
  }

  .prep.split .circle-slot {
    width: min(400px, 42vh);
    height: min(400px, 42vh);
    margin: 0;
    display: grid;
    place-items: center;
  }

  .shape-hint {
    margin: 100px 0 0;
    max-width: 16rem;
    text-align: center;
    font-family: var(--font-narrative);
    font-size: 0.82rem;
    font-style: italic;
    line-height: 1.3;
    color: var(--color-ink-muted);
    text-shadow: 0 1px 0 rgba(244, 232, 208, 0.45);
    /* Keep layout height from pick → ready so the circle does not jump. */
    visibility: hidden;
  }

  .shape-hint.ready {
    visibility: visible;
  }

  .prep.split .circle-slot :global(.circle) {
    transform: none;
  }

  .circle-slot {
    position: relative;
    width: 200px;
    height: 200px;
    overflow: visible;
  }

  .circle-content {
    position: absolute;
    inset: -36px;
    z-index: 4;
    pointer-events: none;
  }

  .circle-content > :global(*) {
    pointer-events: auto;
  }

  .ritual-core {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .vessel {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 3;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .vessel-inner {
    pointer-events: none;
  }

  .vessel-inner > :global(*) {
    pointer-events: auto;
  }

  .prep.split .materials :global(.pile.row) {
    width: 100%;
  }

  .prep.split .materials :global(.name),
  .prep.split .materials :global(.stock) {
    text-shadow: 0 1px 0 rgba(244, 232, 208, 0.55);
  }

  .flank {
    min-width: 0;
    max-height: none;
    align-self: stretch;
    justify-self: stretch;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 2px 4px 2px 10px;
    border-left: 1px solid rgba(90, 75, 60, 0.28);
    overflow: hidden;
  }

  .prep.split .flank {
    border-left: none;
    gap: 0;
    /* Inset so ingredient labels clear the page's corner ornaments. */
    padding: 52px 30px 32px 44px;
    margin-bottom: 20px;
    background: var(--page) center / 100% 100% no-repeat;
    width: 100%;
    max-width: none;
    transform: translateX(-60px);
  }

  .flank-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }

  @supports not selector(::-webkit-scrollbar) {
    .flank-body {
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .flank-body::-webkit-scrollbar {
    width: 6px;
  }

  .flank-body::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.45);
    border-radius: 3px;
  }

  .gauge-pair {
    display: flex;
    justify-content: center;
    gap: 18px;
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
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.45));
    transform: translate(-999px, -999px);
    opacity: 0;
    will-change: transform, opacity;
  }

  .bead.flying {
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.45))
      drop-shadow(0 0 8px rgba(191, 161, 74, 0.55));
  }

  .charm {
    position: absolute;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    object-fit: contain;
    opacity: 0;
    pointer-events: none;
    filter: drop-shadow(0 3px 4px rgba(42, 24, 16, 0.45));
    will-change: transform, opacity;
  }

  .bench.split {
    container-type: inline-size;
    container-name: invocation;
  }

  @container invocation (max-width: 620px) {
    .prep.split {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .materials-col {
      width: min(16rem, 100%);
      max-width: none;
    }

    .flank {
      width: 100%;
      max-height: 42vh;
      border-left: none;
      border-top: 1px solid rgba(90, 75, 60, 0.28);
      padding-left: 0;
    }

    .prep.split .flank {
      max-height: 46vh;
      padding: 36px 28px 30px;
      border-top: none;
    }
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
