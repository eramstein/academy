<script lang="ts">
  import type { ResourceType } from '@/lib/_model/enums-sim';
  import { percentThreshold } from '@/lib/sim/cards/crafting-skills';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import Tooltip from '@/lib/ui/Tooltip.svelte';
  import ResourceIcon from '@/lib/ui/sim/ResourceIcon.svelte';
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
    captionText,
    extraChance,
    extraLabel = 'Discovery chance',
    extraTip = '',
    icon = '',
    resourceType,
    layout = 'stack',
    frame = 'box',
    dieSide = 'top',
    /** When set, the bar is sure/scaleMax (e.g. ingredient capacity out of 10). */
    scaleMax = 0,
    showOutcome = false,
    reward,
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
    /** When set, replaces the default chance caption under the bar. */
    captionText?: string;
    /** Optional second forecast bar (e.g. discovery), 0–1. */
    extraChance?: number;
    /** Top label for the second bar. */
    extraLabel?: string;
    /** Tooltip for the second bar label. */
    extraTip?: string;
    /** Optional painted icon URL (chart row, or plaque badge). */
    icon?: string;
    /** When set, uses the resource spritesheet instead of `icon`. */
    resourceType?: ResourceType;
    /** `chart` materials column; `plaque` conjure framed box; `stack` plain. */
    layout?: 'stack' | 'chart' | 'plaque';
    /** Plaque art: standard `box.png`, or wider `box_long.png`. */
    frame?: 'box' | 'long';
    /** Where the percent die sits relative to the readout. */
    dieSide?: 'top' | 'left' | 'right';
    /** Count scale for the bar (0 = percent chance mode). */
    scaleMax?: number;
    /** Replace the forecast with the roll's reward. */
    showOutcome?: boolean;
    reward?: Snippet;
    die?: Snippet;
  } = $props();

  const boxPath = $derived(
    getAssetPath(
      frame === 'long'
        ? 'images/ui/backgrounds/box_long.png'
        : 'images/ui/backgrounds/box.png'
    )
  );

  const FILL_MS = 460;
  const CREST_MS = 110;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let displaySure = $state(sure);
  let shownPct = $state(percentThreshold(chance));
  let shownExtraPct = $state(
    extraChance === undefined ? 0 : percentThreshold(extraChance)
  );
  let promoted = $state(false);
  /** Stays gold after a successful roll, until the ritual resets. */
  let held = $state(false);
  let outcome = $state<'none' | 'hit' | 'miss'>('none');
  let liveText = $state('');
  let hovered = $state(false);
  let extraHovered = $state(false);

  let generation = 0;
  let extraGeneration = 0;
  let primed = false;
  let lastPhase: RollPhase = 'idle';
  let raf = 0;
  let extraRaf = 0;
  let promoteTimer = 0;
  const pending: number[] = [];

  const countScale = $derived(scaleMax > 0);
  const scaleTicks = $derived.by(() => {
    if (!countScale || scaleMax < 2) return [] as number[];
    return Array.from({ length: scaleMax - 1 }, (_, i) => ((i + 1) / scaleMax) * 100);
  });
  const hasExtra = $derived(extraChance !== undefined);
  const unit = $derived(displaySure === 1 ? singular : plural);
  const pctLabel = $derived(Math.round(Math.min(100, Math.max(0, shownPct))));
  const extraPctLabel = $derived(Math.round(Math.min(100, Math.max(0, shownExtraPct))));
  const caption = $derived(
    captionText !== undefined
      ? captionText
      : countScale
        ? ''
        : outcome === 'miss'
          ? 'Missed'
          : outcome === 'hit' || pctLabel <= 0
            ? ''
            : `${pctLabel}% for one more`
  );
  const extraCaption = $derived(
    extraPctLabel <= 0 ? '' : `${extraPctLabel}% chance`
  );

  function scalePct(value: number): number {
    if (scaleMax <= 0) return 0;
    return Math.min(100, Math.max(0, (value / scaleMax) * 100));
  }

  $effect(() => {
    const nextSure = sure;
    const nextChance = countScale ? scalePct(sure) : percentThreshold(chance);
    const nextPhase = phase;
    const nextFace = face;
    const nextNeed = need;
    untrack(() => {
      void sync(nextSure, nextChance, nextPhase, nextFace, nextNeed);
    });
  });

  $effect(() => {
    if (extraChance === undefined) return;
    const nextExtra = percentThreshold(extraChance);
    untrack(() => {
      void syncExtra(nextExtra);
    });
  });

  $effect(() => () => {
    generation += 1;
    extraGeneration += 1;
    if (raf) cancelAnimationFrame(raf);
    if (extraRaf) cancelAnimationFrame(extraRaf);
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

  function driveBar(
    from: number,
    to: number,
    gen: number,
    currentGen: () => number,
    setValue: (n: number) => void,
    setRaf: (id: number) => void
  ): Promise<void> {
    if (reduceMotion || Math.abs(to - from) < 0.4) {
      setValue(to);
      return Promise.resolve();
    }
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        if (gen !== currentGen()) {
          setRaf(0);
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / FILL_MS);
        const eased = 1 - (1 - t) ** 3;
        setValue(from + (to - from) * eased);
        if (t < 1) setRaf(requestAnimationFrame(step));
        else {
          setValue(to);
          setRaf(0);
          resolve();
        }
      };
      setRaf(requestAnimationFrame(step));
    });
  }

  function drivePct(to: number, gen: number): Promise<void> {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    return driveBar(
      shownPct,
      to,
      gen,
      () => generation,
      (n) => (shownPct = n),
      (id) => (raf = id)
    );
  }

  async function syncExtra(nextExtra: number) {
    if (Math.abs(shownExtraPct - nextExtra) < 0.4) {
      shownExtraPct = nextExtra;
      return;
    }
    const gen = ++extraGeneration;
    if (extraRaf) cancelAnimationFrame(extraRaf);
    extraRaf = 0;
    await driveBar(
      shownExtraPct,
      nextExtra,
      gen,
      () => extraGeneration,
      (n) => (shownExtraPct = n),
      (id) => (extraRaf = id)
    );
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

    if (countScale) {
      if (nextSure === displaySure && Math.abs(shownPct - nextChance) < 0.4) return;
      const gen = ++generation;
      const rising = nextSure > displaySure;
      displaySure = nextSure;
      if (rising) flashPromote();
      else promoted = false;
      await drivePct(nextChance, gen);
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
  class:long={layout === 'plaque' && frame === 'long'}
  class:live={phase === 'rolling'}
  class:missed={outcome === 'miss'}
  class:die-left={dieSide === 'left'}
  class:die-right={dieSide === 'right'}
  class:show-outcome={showOutcome}
  style={layout === 'plaque' ? `--box: url('${boxPath}')` : undefined}
>
  {#if die}
    {@render die()}
  {/if}
  {#if resourceType}
    <span class="icon" class:badge={layout === 'plaque'}>
      <ResourceIcon type={resourceType} />
    </span>
  {:else if icon}
    <img class="icon" class:badge={layout === 'plaque'} src={icon} alt="" draggable="false" />
  {/if}
  <div class="body" class:dual={hasExtra && !showOutcome} class:outcome={showOutcome}>
    {#if showOutcome}
      <p class="head title-only">
        <span class="label">{label}</span>
      </p>
      <div class="outcome-slot">
        {@render reward?.()}
      </div>
    {:else if !hasExtra}
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
    {:else}
      <p class="head title-only">
        <Tooltip content={tip} show={hovered} placement="top">
          <span
            class="label"
            onmouseenter={() => (hovered = true)}
            onmouseleave={() => (hovered = false)}>{label}</span
          >
        </Tooltip>
      </p>
    {/if}
    {#if !showOutcome}
    <div class="meters" class:dual={hasExtra}>
      <div class="meter">
        {#if hasExtra}
          <p class="meter-head">
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
        {/if}
        <span class="track" class:scaled={countScale} aria-hidden="true">
          <span
            class="fill"
            class:crest={!countScale && shownPct >= 99.5}
            style="width: {shownPct}%"
          ></span>
          {#if countScale}
            {#each scaleTicks as at (at)}
              <span class="tick" style="left: {at}%"></span>
            {/each}
          {:else}
            <span class="tick" style="left: 25%"></span>
            <span class="tick" style="left: 50%"></span>
            <span class="tick" style="left: 75%"></span>
          {/if}
        </span>
        <p class="caption" class:full={pctLabel >= 100 && outcome !== 'miss'}>{caption || '\u00a0'}</p>
      </div>
      {#if hasExtra}
        <div class="meter">
          <p class="meter-head">
            {#if extraTip}
              <Tooltip content={extraTip} show={extraHovered} placement="top">
                <span
                  class="amount"
                  onmouseenter={() => (extraHovered = true)}
                  onmouseleave={() => (extraHovered = false)}
                >
                  <span class="unit">{extraLabel}</span>
                </span>
              </Tooltip>
            {:else}
              <span class="amount"><span class="unit">{extraLabel}</span></span>
            {/if}
          </p>
          <span class="track" aria-hidden="true">
            <span
              class="fill"
              class:crest={shownExtraPct >= 99.5}
              style="width: {shownExtraPct}%"
            ></span>
            <span class="tick" style="left: 25%"></span>
            <span class="tick" style="left: 50%"></span>
            <span class="tick" style="left: 75%"></span>
          </span>
          <p class="caption" class:full={extraPctLabel >= 100}>{extraCaption || '\u00a0'}</p>
        </div>
      {/if}
    </div>
    {/if}
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
    display: block;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
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
    width: 100%;
    height: 7px;
    margin: 7px 0 5px;
    overflow: hidden;
    border-radius: 2px;
    background: rgba(44, 37, 29, 0.22);
    box-shadow: inset 0 1px 2px rgba(42, 24, 16, 0.28);
  }

  .bonus.chart .track {
    margin: 3px 0 2px;
    border-radius: 999px;
  }

  .track.scaled {
    border-radius: 2px;
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

  .bonus.plaque.long {
    min-width: 16rem;
    aspect-ratio: 2320 / 853;
    padding: 13% 8% 6%;
  }

  /* Same absolute badge size as the standard plaque (13% of narrower box). */
  .bonus.plaque.long .icon.badge {
    width: 9.4%;
    transform: translate(calc(-50% - 1px), calc(-50% - 2px));
  }

  .bonus.plaque.long .body.dual {
    gap: 2px;
  }

  .bonus.plaque.long .head.title-only {
    margin-bottom: 2px;
  }

  .bonus.plaque.long .meter-head .num {
    font-size: 1.35rem;
  }

  .bonus.plaque.long .meter-head .unit {
    font-size: 0.88rem;
  }

  .bonus.plaque.long .caption {
    font-size: 0.74rem;
  }

  .bonus.plaque .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
  }

  .body.outcome {
    justify-content: center;
    gap: 1px;
  }

  .outcome-slot {
    width: 100%;
    min-height: 0;
    animation: outcome-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes outcome-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.92);
      filter: brightness(1.6);
    }
  }

  .bonus.plaque .head,
  .bonus.plaque .meters,
  .bonus.plaque .track,
  .bonus.plaque .caption {
    flex-shrink: 0;
  }

  .meters {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .meters.dual {
    flex-direction: row;
    align-items: stretch;
    gap: 10px;
    width: 92%;
  }

  .meter {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: 0;
    width: 100%;
  }

  .meters.dual .meter {
    flex: 1 1 0;
  }

  .meter-head {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin: 0 0 2px;
    min-width: 0;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    text-align: center;
  }

  .meter-head .amount {
    cursor: help;
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
    margin: 4px auto 7px;
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
    .outcome-slot {
      animation: none;
    }

    .num.promoted,
    .bonus.missed .track {
      animation: none;
    }
  }
</style>
