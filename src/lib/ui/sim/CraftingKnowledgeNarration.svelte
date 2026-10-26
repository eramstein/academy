<script lang="ts">
  import type { CraftingKnowledgeGain } from '@/lib/_model';
  import { getActionTypeIconPath, getAssetPath } from '@/lib/_utils/asset-paths';
  import { onMount } from 'svelte';
  import type { InkBeat } from './ink-beat';

  let {
    gain,
    text,
    animate = false,
    onProgress,
    onDone,
  }: {
    gain: CraftingKnowledgeGain;
    text: string;
    animate?: boolean;
    onProgress?: (beat?: InkBeat) => void | Promise<void>;
    onDone?: () => void;
  } = $props();

  const MAX_CELLS = 3;

  const targetLevel = Math.min(gain.level, MAX_CELLS);
  const startLevel = Math.min(gain.previous, MAX_CELLS);

  /** Cells shown filled; ticks from the previous level to the new one. */
  let shownLevel = $state(animate ? startLevel : targetLevel);
  let justFilledStep = $state<number | null>(null);
  let revealed = $state(!animate);

  const iconPath = $derived(
    gain.kind === 'keyword'
      ? getAssetPath(`images/keywords/material-icons/${gain.key}.png`)
      : getActionTypeIconPath(gain.key)
  );

  const eyebrow = $derived(gain.previous < 1 ? 'New knowledge' : 'Knowledge raised');

  let finished = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  function finish() {
    if (finished) return;
    finished = true;
    shownLevel = targetLevel;
    onDone?.();
  }

  function skip() {
    if (!animate || finished) return;
    for (const timer of timers) clearTimeout(timer);
    timers = [];
    justFilledStep = targetLevel > startLevel ? targetLevel : null;
    revealed = true;
    finish();
  }

  onMount(() => {
    if (!animate) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      revealed = true;
      finish();
      return;
    }

    timers.push(
      setTimeout(() => {
        revealed = true;
        onProgress?.({ kind: 'layout' });
      }, 40)
    );

    timers.push(
      setTimeout(() => {
        shownLevel = targetLevel;
        if (targetLevel > startLevel) {
          justFilledStep = targetLevel;
        }
      }, 420)
    );

    timers.push(setTimeout(finish, 1100));

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  });
</script>

<aside
  class="plaque"
  class:revealed
  class:animate
  aria-label="{eyebrow}: {gain.label}, level {gain.level} of {MAX_CELLS}. {text}"
  onclick={skip}
>
  <span class="corner tl" aria-hidden="true"></span>
  <span class="corner tr" aria-hidden="true"></span>
  <span class="corner bl" aria-hidden="true"></span>
  <span class="corner br" aria-hidden="true"></span>

  <div class="row">
    <span class="icon-frame" aria-hidden="true">
      <img src={iconPath} alt="" />
    </span>

    <div class="titles">
      <span class="eyebrow">{eyebrow}</span>
      <span class="label">{gain.label}</span>
    </div>

    <span class="level-bar" aria-hidden="true">
      {#each [1, 2, 3] as step (step)}
        <span
          class="level-cell"
          class:filled={shownLevel >= step}
          class:just-filled={justFilledStep === step}
        ></span>
      {/each}
    </span>

    <span class="fraction" aria-hidden="true">
      <span class="current">{shownLevel}</span><span class="of">/{MAX_CELLS}</span>
    </span>
  </div>
</aside>

<style>
  .plaque {
    position: relative;
    margin: 0.15rem 0 1.25em;
    padding: 0.55rem 0.85rem 0.55rem 0.7rem;
    border: 1px solid #83663c;
    border-radius: 4px;
    background: rgba(255, 246, 226, 0.28);
    cursor: pointer;
    opacity: 0;
    transform: translateY(0.3rem);
    transition:
      opacity 0.3s ease,
      transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .plaque::before {
    content: '';
    position: absolute;
    inset: 3px;
    border: 1px solid rgba(131, 102, 60, 0.55);
    border-radius: 2px;
    pointer-events: none;
  }

  .plaque.revealed,
  .plaque:not(.animate) {
    opacity: 1;
    transform: none;
  }

  .corner {
    position: absolute;
    z-index: 1;
    width: 11px;
    height: 11px;
    border: 1.5px solid #83663c;
    pointer-events: none;
  }

  .corner::after {
    content: '';
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #83663c;
  }

  .corner.tl {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 3px;
  }

  .corner.tl::after {
    top: 1px;
    left: 1px;
  }

  .corner.tr {
    top: -1px;
    right: -1px;
    border-left: none;
    border-bottom: none;
    border-top-right-radius: 3px;
  }

  .corner.tr::after {
    top: 1px;
    right: 1px;
  }

  .corner.bl {
    bottom: -1px;
    left: -1px;
    border-right: none;
    border-top: none;
    border-bottom-left-radius: 3px;
  }

  .corner.bl::after {
    bottom: 1px;
    left: 1px;
  }

  .corner.br {
    right: -1px;
    bottom: -1px;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 3px;
  }

  .corner.br::after {
    right: 1px;
    bottom: 1px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .icon-frame {
    display: grid;
    place-items: center;
    width: 3.35rem;
    height: 3.35rem;
    flex-shrink: 0;
    background: transparent;
  }

  .icon-frame img {
    width: 2.45rem;
    height: 2.45rem;
    object-fit: contain;
  }

  .titles {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
    flex: 0 1 auto;
  }

  .eyebrow {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: #7f6238;
    white-space: nowrap;
  }

  .label {
    font-family: var(--font-narrative);
    font-size: 1.28rem;
    font-weight: 700;
    line-height: 1.05;
    color: var(--color-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .level-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  .level-cell {
    width: 3.15rem;
    height: 1.2rem;
    flex-shrink: 0;
    border-radius: 2px;
    border: 1px solid rgba(115, 80, 40, 0.35);
    background: rgba(115, 80, 40, 0.08);
    box-shadow: inset 0 1px 2px color-mix(in srgb, #000 10%, transparent);
    transition:
      background 0.28s ease,
      border-color 0.28s ease,
      box-shadow 0.28s ease;
  }

  .level-cell.filled {
    border-color: #735028;
    background: linear-gradient(180deg, #c89d59 0%, #b17b35 22%, #a8732f 58%, #94652d 100%);
    box-shadow:
      inset 0 1px 0 #cea567,
      inset 0 -1px 0 #735028;
  }

  .level-cell.just-filled {
    animation: cell-ignite 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes cell-ignite {
    0% {
      filter: brightness(1.45);
      transform: scaleX(0.82);
    }
    55% {
      filter: brightness(1.15);
      transform: scaleX(1.04);
    }
    100% {
      filter: none;
      transform: none;
    }
  }

  .fraction {
    flex-shrink: 0;
    display: flex;
    align-items: baseline;
    font-family: var(--font-narrative);
    line-height: 1;
  }

  .current {
    font-size: 1.85rem;
    font-weight: 700;
    color: #9e6e2e;
    font-variant-numeric: tabular-nums;
  }

  .of {
    font-size: 0.95rem;
    font-weight: 600;
    color: #8a6e48;
  }
</style>
