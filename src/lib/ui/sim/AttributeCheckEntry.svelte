<script lang="ts">
  import type { AttributeCheck } from '@/lib/_model/model-game';
  import TypedText from './TypedText.svelte';

  let {
    check,
    animate = true,
    onProgress,
    onDone,
  }: {
    check: AttributeCheck;
    animate?: boolean;
    onProgress?: () => void;
    onDone?: () => void;
  } = $props();

  type Phase = 'label' | 'roll' | 'outcome' | 'done';

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let phase: Phase = $state(!animate || reduceMotion ? 'done' : 'label');

  const labelText = $derived(`${check.attribute} check — ${check.difficulty}`);
  const outcomeText = $derived(
    check.critical
      ? `Critical ${check.success ? 'Success' : 'Failure'}`
      : check.success
        ? 'Success'
        : 'Failure'
  );

  $effect(() => {
    if (animate && reduceMotion) {
      queueMicrotask(() => onDone?.());
    }
  });

  function advanceFromLabel() {
    if (phase !== 'label') return;
    phase = 'roll';
    onProgress?.();
    window.setTimeout(() => {
      if (phase === 'roll') {
        phase = 'outcome';
        onProgress?.();
      }
    }, 650);
  }

  function finish() {
    phase = 'done';
    onDone?.();
  }
</script>

<div
  class="attribute-check"
  class:success={check.success}
  class:failure={!check.success}
  class:critical={check.critical}
>
  {#if phase === 'label'}
    <TypedText class="check-label" text={labelText} onProgress={onProgress} onDone={advanceFromLabel} />
  {:else}
    <p class="check-label">{labelText}</p>
  {/if}

  {#if phase !== 'label'}
    <p class="check-roll" class:animated={animate && !reduceMotion}>
      <span class="d20"><span class="d20-face">{check.roll}</span></span>
      <span class="vs">vs {check.target}</span>
    </p>
  {/if}

  {#if phase === 'outcome'}
    <TypedText class="check-outcome" text={outcomeText} onProgress={onProgress} onDone={finish} />
  {:else if phase === 'done'}
    <p class="check-outcome">{outcomeText}</p>
  {/if}
</div>

<style>
  .attribute-check {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em;
    margin: 0 0 1.25em;
    padding: 1em 0;
    border-top: 1px solid rgba(90, 75, 60, 0.35);
    border-bottom: 1px solid rgba(90, 75, 60, 0.35);
    text-align: center;
  }

  .attribute-check :global(.check-label),
  .check-label {
    margin: 0;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #4a3f32;
    min-height: 1.4em;
  }

  .check-roll {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0.15em 0;
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }

  .check-roll.animated {
    animation: check-line-in 0.35s ease-out both;
  }

  .d20 {
    width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
    background: #3d3429;
    color: #e8dcc4;
  }

  .check-roll.animated .d20 {
    animation: die-settle 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  .d20-face {
    font-size: 1.15rem;
    font-weight: bold;
    line-height: 1;
    transform: translateY(-0.12em);
  }

  .vs {
    color: #4a3f32;
  }

  .attribute-check :global(.check-outcome),
  .check-outcome {
    margin: 0;
    font-size: 1.05rem;
    font-weight: bold;
    min-height: 1.4em;
  }

  .attribute-check.success :global(.check-outcome),
  .attribute-check.success .check-outcome {
    color: #2d5a27;
  }

  .attribute-check.failure :global(.check-outcome),
  .attribute-check.failure .check-outcome {
    color: #7a2e22;
  }

  .attribute-check.critical :global(.check-outcome),
  .attribute-check.critical .check-outcome {
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  @keyframes check-line-in {
    from {
      opacity: 0;
      transform: translateY(0.25em);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes die-settle {
    from {
      opacity: 0;
      transform: scale(0.55) rotate(-18deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .check-roll.animated,
    .check-roll.animated .d20 {
      animation: none;
    }
  }
</style>
