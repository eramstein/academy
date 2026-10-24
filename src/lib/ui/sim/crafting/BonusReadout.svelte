<script lang="ts">
  import { percentThreshold } from '@/lib/sim/cards/crafting-skills';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import Tooltip from '@/lib/ui/Tooltip.svelte';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';

  type RollPhase = 'idle' | 'rolling' | 'hit' | 'miss';

  let {
    label,
    singular,
    plural,
    tip,
    sure,
    chance,
    phase,
    face,
    need,
    prefix = '',
    amountText = '',
    icon = '',
    layout = 'stack',
    dieSide = 'top',
    die,
  }: {
    label: string;
    singular: string;
    plural: string;
    tip: string;
    /** Guaranteed points before the fractional roll. */
    sure: number;
    /** Fractional chance of one extra point, 0–1. */
    chance: number;
    phase: RollPhase;
    /** Settled total after a roll. */
    face: number;
    /** Percent the die must beat, 0–100. */
    need: number;
    /** Shown before the number, e.g. "±". */
    prefix?: string;
    /** When set, replaces the numeric amount (e.g. "2 / 5"). */
    amountText?: string;
    /** Optional painted icon (chart row, or plaque badge). */
    icon?: string;
    /** `chart` materials column; `plaque` conjure framed box; `stack` plain. */
    layout?: 'stack' | 'chart' | 'plaque';
    /** Where the percent die sits relative to the readout. */
    dieSide?: 'top' | 'left' | 'right';
    die?: Snippet;
  } = $props();

  const boxPath = getAssetPath('images/ui/backgrounds/box.png');

  const FILL_MS = 460;
  const CREST_MS = 110;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let displaySure = $state(sure);
  let shownPct = $state(percentThreshold(chance));
  let promoted = $state(false);
  /** Stays gold after a successful roll, until the ritual resets. */
  let held = $state(false);
  let outcome = $state<'none' | 'hit' | 'miss'>('none');
  let liveText = $state('');
  let hovered = $state(false);

  let generation = 0;
  let primed = false;
  let lastPhase: RollPhase = 'idle';
  let raf = 0;
  let promoteTimer = 0;
  const pending: number[] = [];

  const unit = $derived(displaySure === 1 ? singular : plural);
  const pctLabel = $derived(Math.round(Math.min(100, Math.max(0, shownPct))));
  const caption = $derived(
    outcome === 'miss'
      ? 'Missed'
      : outcome === 'hit' || pctLabel <= 0
        ? ''
        : `${pctLabel}% for one more`
  );

  $effect(() => {
    const nextSure = sure;
    const nextChance = percentThreshold(chance);
    const nextPhase = phase;
    const nextFace = face;
    const nextNeed = need;
    untrack(() => {
      void sync(nextSure, nextChance, nextPhase, nextFace, nextNeed);
    });
  });

  $effect(() => () => {
    generation += 1;
    if (raf) cancelAnimationFrame(raf);
    for (const id of pending) clearTimeout(id);
    pending.length = 0;
    if (promoteTimer) clearTimeout(promoteTimer);
  });

  function sleep(ms: number): Promise<void> {
    if (ms <= 0 || reduceMotion) return Promise.resolve();
    return new Promise((resolve) => {
      const id = window.setTimeout(() => {
        const index = pending.indexOf(id);
        if (index >= 0) pending.splice(index, 1);
        resolve();
      }, ms);
      pending.push(id);
    });
  }

  function cutPct(value: number) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    shownPct = value;
  }

  function drivePct(to: number, gen: number): Promise<void> {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    const from = shownPct;
    if (reduceMotion || Math.abs(to - from) < 0.4) {
      shownPct = to;
      return Promise.resolve();
    }
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        if (gen !== generation) {
          raf = 0;
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / FILL_MS);
        const eased = 1 - (1 - t) ** 3;
        shownPct = from + (to - from) * eased;
        if (t < 1) raf = requestAnimationFrame(step);
        else {
          shownPct = to;
          raf = 0;
          resolve();
        }
      };
      raf = requestAnimationFrame(step);
    });
  }

  function flashPromote() {
    promoted = false;
    if (promoteTimer) clearTimeout(promoteTimer);
    promoteTimer = window.setTimeout(() => {
      promoted = true;
      promoteTimer = window.setTimeout(() => {
        promoted = false;
        promoteTimer = 0;
      }, 1300);
    }, 16);
  }

  /** A full bar becomes one guaranteed point, then the leftover chance remains. */
  async function claimExtra(result: number, gen: number) {
    outcome = 'none';
    await drivePct(100, gen);
    if (gen !== generation) return;
    await sleep(CREST_MS);
    if (gen !== generation) return;
    displaySure = result;
    held = true;
    flashPromote();
    cutPct(0);
    outcome = 'hit';
    liveText = `${label} is now ${result} ${result === 1 ? singular : plural}`;
  }

  async function followForecast(nextSure: number, nextChance: number, gen: number) {
    if (nextSure > displaySure) {
      while (gen === generation && displaySure < nextSure) {
        await drivePct(100, gen);
        if (gen !== generation) return;
        await sleep(CREST_MS);
        if (gen !== generation) return;
        const rising = displaySure + 1;
        displaySure = rising;
        flashPromote();
        const finished = rising >= nextSure;
        cutPct(0);
        liveText = `${label} is now ${rising} ${rising === 1 ? singular : plural}`;
        if (!finished) await sleep(40);
        else if (nextChance > 0) await drivePct(nextChance, gen);
      }
      return;
    }
    if (nextSure < displaySure) {
      displaySure = nextSure;
      promoted = false;
      cutPct(0);
      await drivePct(nextChance, gen);
      return;
    }
    if (Math.abs(shownPct - nextChance) < 0.4) return;
    await drivePct(nextChance, gen);
  }

  async function sync(
    nextSure: number,
    nextChance: number,
    nextPhase: RollPhase,
    nextFace: number,
    nextNeed: number
  ) {
    if (!primed) {
      primed = true;
      displaySure = nextSure;
      shownPct = nextChance;
      lastPhase = nextPhase;
      return;
    }

    if (nextPhase === 'rolling') {
      if (lastPhase !== 'rolling') {
        generation += 1;
        lastPhase = 'rolling';
        outcome = 'none';
        promoted = false;
        held = false;
        displaySure = nextSure;
        cutPct(nextChance);
      }
      return;
    }

    if (nextPhase === 'hit') {
      if (lastPhase === 'hit') return;
      lastPhase = 'hit';
      const gen = ++generation;
      if (nextFace > nextSure) {
        displaySure = nextSure;
        if (Math.abs(shownPct - nextChance) > 1) cutPct(nextChance);
        await claimExtra(nextFace, gen);
      }
      return;
    }

    if (nextPhase === 'miss') {
      if (lastPhase === 'miss') return;
      lastPhase = 'miss';
      generation += 1;
      if (nextNeed > 0) {
        outcome = 'miss';
        if (shownPct < 0.5) shownPct = nextChance;
        liveText = `${label} chance missed`;
      }
      return;
    }

    if (lastPhase !== 'idle') {
      generation += 1;
      lastPhase = 'idle';
      outcome = 'none';
      promoted = false;
      held = false;
      displaySure = nextSure;
      cutPct(nextChance);
      return;
    }

    if (nextSure === displaySure && Math.abs(shownPct - nextChance) < 0.4) return;
    const gen = ++generation;
    await followForecast(nextSure, nextChance, gen);
  }
</script>

<div
  class="bonus"
  class:chart={layout === 'chart'}
  class:plaque={layout === 'plaque'}
  class:live={phase === 'rolling'}
  class:missed={outcome === 'miss'}
  class:die-left={dieSide === 'left'}
  class:die-right={dieSide === 'right'}
  style={layout === 'plaque' ? `--box: url('${boxPath}')` : undefined}
>
  {#if die}
    {@render die()}
  {/if}
  {#if icon}
    <img class="icon" class:badge={layout === 'plaque'} src={icon} alt="" draggable="false" />
  {/if}
  <div class="body">
    <p class="head">
      <Tooltip content={tip} show={hovered} placement="top">
        <span
          class="label"
          onmouseenter={() => (hovered = true)}
          onmouseleave={() => (hovered = false)}>{label}</span
        >
      </Tooltip>
      <span class="amount">
        {#if amountText}
          <span class="num custom" class:promoted class:held>{amountText}</span>
        {:else}
          {#if prefix}<span class="prefix">{prefix}</span>{/if}
          <span class="num" class:promoted class:held>{displaySure}</span>
          <span class="unit">{unit}</span>
        {/if}
      </span>
    </p>
    <span class="track" aria-hidden="true">
      <span class="fill" class:crest={shownPct >= 99.5} style="width: {shownPct}%"></span>
      <span class="tick" style="left: 25%"></span>
      <span class="tick" style="left: 50%"></span>
      <span class="tick" style="left: 75%"></span>
    </span>
    <p class="caption" class:full={pctLabel >= 100 && outcome !== 'miss'}>{caption || '\u00a0'}</p>
  </div>
  <span class="live-text" aria-live="polite">{liveText}</span>
</div>

<style>
  /* Deep ink + wine read clearly on parchment; brass/gold wash into the page. */
  .bonus {
    --bonus-fill: #2a3344;
    --bonus-crest: #7a1f2e;
    --bonus-glow: #9b2436;
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    padding: 0 8px;
    overflow: visible;
  }

  .body {
    min-width: 0;
  }

  .bonus.chart {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 8px;
    align-items: center;
    width: 100%;
    padding: 0;
  }

  .bonus.chart .body {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    filter: drop-shadow(0 1px 1px rgba(42, 24, 16, 0.35));
  }

  .head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.12em;
    margin: 0;
    min-width: 0;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    text-align: center;
  }

  .bonus.chart .head {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    text-align: left;
  }

  .amount {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.28em;
    white-space: nowrap;
  }

  .label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4a3f32;
    cursor: help;
  }

  .bonus.chart .label {
    color: var(--color-ink);
  }

  .bonus.live .label {
    color: var(--bonus-crest);
  }

  .prefix {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-ink);
  }

  .num {
    display: inline-block;
    font-size: 1.25rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: var(--color-ink);
  }

  .bonus.chart .num {
    font-size: 0.95rem;
  }

  .num.custom {
    font-size: 0.92rem;
  }

  .num.promoted,
  .num.held,
  .bonus.chart .num.promoted,
  .bonus.chart .num.held {
    color: var(--bonus-glow);
  }

  .num.promoted {
    animation: claim 0.48s cubic-bezier(0.22, 1.25, 0.36, 1);
  }

  .unit {
    font-size: 0.9rem;
  }

  .bonus.chart .unit {
    font-size: 0.82rem;
  }

  .track {
    position: relative;
    display: block;
    height: 7px;
    margin: 7px 0 5px;
    border-radius: 2px;
    background: rgba(44, 37, 29, 0.22);
    box-shadow: inset 0 1px 2px rgba(42, 24, 16, 0.28);
  }

  .bonus.chart .track {
    margin: 3px 0 2px;
    border-radius: 999px;
  }

  .bonus.plaque {
    flex: 0 0 auto;
    width: 100%;
    min-width: 11.5rem;
    aspect-ratio: 1673 / 853;
    padding: 15% 12% 8%;
    box-sizing: border-box;
    background: var(--box) center / 100% 100% no-repeat;
  }

  .bonus.plaque .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
  }

  .bonus.plaque .head,
  .bonus.plaque .track,
  .bonus.plaque .caption {
    flex-shrink: 0;
  }

  .bonus.plaque .icon.badge {
    position: absolute;
    left: 50%;
    top: 17.6%;
    width: 13%;
    height: auto;
    aspect-ratio: 1;
    padding: 0;
    object-fit: contain;
    transform: translate(-50%, -50%);
    pointer-events: none;
    filter:
      grayscale(0.28)
      sepia(0.72)
      saturate(0.55)
      brightness(0.9)
      contrast(0.95)
      drop-shadow(0 1px 1px rgba(42, 24, 16, 0.35));
  }

  .bonus.plaque .head {
    gap: 0.08em;
  }

  .bonus.plaque .label {
    font-size: 0.8rem;
    letter-spacing: 0.2em;
    color: #2c251d;
  }

  .bonus.plaque .num {
    font-size: 1.72rem;
    color: #2a3344;
  }

  .bonus.plaque .unit {
    font-size: 1.02rem;
    font-weight: 500;
    color: #2c251d;
  }

  .bonus.plaque .prefix {
    font-size: 1.35rem;
    color: #2a3344;
  }

  .bonus.plaque .num.promoted,
  .bonus.plaque .num.held {
    color: var(--bonus-glow);
  }

  .bonus.plaque .track {
    width: 86%;
    max-width: none;
    height: 6px;
    margin: 4px 0 7px;
    border-radius: 1px;
    background: rgba(44, 37, 29, 0.28);
  }

  .bonus.plaque .caption {
    min-height: 0;
    margin-top: 1px;
    font-size: 0.8rem;
    line-height: 1.1;
    color: #5a4e42;
  }

  .fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    border-radius: inherit;
    background: var(--bonus-fill);
  }

  .fill.crest {
    background: var(--bonus-crest);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--bonus-glow) 55%, transparent);
  }

  .tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 100%;
    background: rgba(244, 232, 208, 0.55);
    transform: translateX(-50%);
  }

  .caption {
    margin: 0;
    min-height: 1.2em;
    text-align: center;
    font-family: var(--font-narrative);
    font-size: 0.78rem;
    font-style: italic;
    letter-spacing: 0.02em;
    color: var(--color-ink-muted);
  }

  .caption.full {
    color: var(--bonus-crest);
    font-style: normal;
    font-weight: 700;
  }

  .bonus.missed .fill {
    opacity: 0.35;
    background: #5c5146;
  }

  .bonus.missed .track {
    animation: miss-shake 0.35s ease;
  }

  .bonus.missed .caption {
    font-style: normal;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5c4038;
  }

  .live-text {
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

  @keyframes claim {
    0% {
      transform: translateY(0.35em);
      opacity: 0.15;
    }
    45% {
      transform: translateY(-0.08em) scale(1.16);
    }
    100% {
      transform: none;
      opacity: 1;
    }
  }

  @keyframes miss-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    35% {
      transform: translateX(-3px);
    }
    70% {
      transform: translateX(3px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .num.promoted,
    .bonus.missed .track {
      animation: none;
    }
  }
</style>
