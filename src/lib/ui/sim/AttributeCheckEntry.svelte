<script lang="ts">
  import type { AttributeCheck } from '@/lib/_model/model-sim';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import { commitAttributeCheck } from '@/lib/sim/attribute-checks';
  import { playAddResourceSound, playSimSound } from '@/lib/sim/sound';
  import type { InkBeat } from './ink-beat';
  import TypedText from './TypedText.svelte';

  let {
    check,
    narrationId,
    animate = true,
    onProgress,
    onDone,
  }: {
    check: AttributeCheck;
    narrationId: string;
    animate?: boolean;
    onProgress?: (beat?: InkBeat) => void | Promise<void>;
    onDone?: () => void;
  } = $props();

  type Phase = 'label' | 'focus' | 'spending' | 'roll' | 'outcome' | 'done';

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const availableFocus = $derived(check.availableFocus ?? 0);
  const showFocusCommit = $derived(!!check.pending && availableFocus > 0);

  let phase: Phase = $state(!animate ? 'done' : 'label');
  let selectedFocus = $state(0);
  let spentAnimating = $state(0);
  let bumpIndex = $state<number | null>(null);

  const focusIcon = getUiIconPath('spiral');
  const focusPainted = isPaintedUiIcon('spiral');

  const labelText = $derived(`${check.attribute} check — ${check.difficulty}`);
  const outcomeText = $derived(
    check.critical
      ? `Critical ${check.success ? 'Success' : 'Failure'}`
      : check.success
        ? 'Success'
        : 'Failure'
  );
  const previewTarget = $derived(check.target + selectedFocus * 5);
  const focusHint = $derived(
    selectedFocus > 0 ? `+${selectedFocus * 5} from focus` : 'Click beads to spend focus'
  );
  const showRoll = $derived(
    (phase === 'roll' || phase === 'outcome' || phase === 'done') && !check.pending
  );

  $effect(() => {
    // Resolved checks with reduce-motion: skip the reveal and finish.
    if (!animate || !reduceMotion || check.pending || phase !== 'label') return;
    phase = 'done';
    queueMicrotask(() => onDone?.());
  });

  function afterRollReveal() {
    phase = 'roll';
    onProgress?.();
    if (reduceMotion) {
      phase = 'outcome';
      onProgress?.();
      return;
    }
    window.setTimeout(() => {
      if (phase === 'roll') {
        phase = 'outcome';
        onProgress?.();
      }
    }, 650);
  }

  function advanceFromLabel() {
    if (phase !== 'label') return;
    if (showFocusCommit) {
      phase = 'focus';
      onProgress?.();
      return;
    }
    afterRollReveal();
  }

  function adjustFocus(delta: number, event: MouseEvent) {
    event.preventDefault();
    if (phase !== 'focus' || check.pending !== true) return;
    const step = event.shiftKey ? 5 : 1;
    const next = Math.min(availableFocus, Math.max(0, selectedFocus + delta * step));
    if (next === selectedFocus) return;
    if (next > selectedFocus) {
      bumpIndex = next - 1;
      playAddResourceSound();
    } else {
      playSimSound('swoosh');
    }
    selectedFocus = next;
    onProgress?.();
  }

  function setFocusTo(index: number, event: MouseEvent) {
    event.preventDefault();
    if (phase !== 'focus' || check.pending !== true) return;
    // Click a bead: fill up to that bead (1-based), or clear if clicking the last selected.
    const next = selectedFocus === index + 1 ? 0 : index + 1;
    if (next > selectedFocus) {
      bumpIndex = next - 1;
      playAddResourceSound();
    } else if (next < selectedFocus) {
      playSimSound('swoosh');
    }
    selectedFocus = next;
    onProgress?.();
  }

  function rollWithFocus() {
    if (phase !== 'focus' || !check.pending) return;
    const spent = selectedFocus;
    commitAttributeCheck(narrationId, spent);
    if (spent > 0 && animate && !reduceMotion) {
      phase = 'spending';
      spentAnimating = spent;
      onProgress?.();
      playSpendCascade(spent);
      window.setTimeout(() => {
        if (phase !== 'spending') return;
        afterRollReveal();
      }, 180 + spent * 120);
    } else {
      afterRollReveal();
    }
  }

  function playSpendCascade(spent: number) {
    for (let i = 0; i < spent; i++) {
      window.setTimeout(() => playAddResourceSound(), i * 100);
    }
    window.setTimeout(() => playSimSound('glinggling'), spent * 100 + 40);
  }

  function finish() {
    phase = 'done';
    onDone?.();
  }
</script>

<div
  class="attribute-check"
  class:success={check.success && !check.pending}
  class:failure={!check.success && !check.pending}
  class:critical={check.critical && !check.pending}
  class:pending={!!check.pending}
>
  {#if phase === 'label'}
    <TypedText class="check-label" text={labelText} onBeat={(beat) => onProgress?.(beat)} onDone={advanceFromLabel} />
  {:else}
    <p class="check-label">{labelText}</p>
  {/if}

  {#if phase === 'focus' || phase === 'spending'}
    <div class="focus-commit" class:spending={phase === 'spending'}>
      <div class="focus-head">
        <span
          class="focus-glyph"
          class:painted={focusPainted}
          style="--icon: url('{focusIcon}')"
          aria-hidden="true"
        ></span>
        <span class="focus-title">Focus</span>
        <span class="focus-count">{selectedFocus}/{availableFocus}</span>
      </div>
      <div
        class="focus-beads"
        role="group"
        aria-label="Focus to spend. Click to add, right-click to remove."
      >
        {#each Array.from({ length: availableFocus }, (_, i) => i) as i (i)}
          <button
            type="button"
            class="bead"
            class:selected={i < selectedFocus}
            class:spending={phase === 'spending' && i < spentAnimating}
            class:bump={bumpIndex === i}
            class:painted={focusPainted}
            style="--icon: url('{focusIcon}'); --i: {i}"
            disabled={phase !== 'focus'}
            aria-label="Focus {i + 1} of {availableFocus}"
            aria-pressed={i < selectedFocus}
            onclick={(e) => setFocusTo(i, e)}
            oncontextmenu={(e) => adjustFocus(-1, e)}
            onanimationend={() => {
              if (bumpIndex === i) bumpIndex = null;
            }}
          ></button>
        {/each}
      </div>
      <p class="focus-hint">{focusHint}</p>
      {#if phase === 'focus'}
        <p class="focus-preview">Need {previewTarget} or lower on the die</p>
        <button type="button" class="roll-btn" onclick={rollWithFocus}>
          {selectedFocus > 0 ? `Roll with ${selectedFocus} focus` : 'Roll without focus'}
        </button>
      {/if}
    </div>
  {/if}

  {#if showRoll}
    <p class="check-roll" class:animated={animate && !reduceMotion}>
      <span class="d20"><span class="d20-face">{check.roll}</span></span>
      <span class="vs">vs {check.target}</span>
    </p>
    {#if (check.usedFocus ?? 0) > 0 && (phase === 'outcome' || phase === 'done')}
      <div class="focus-spent" aria-label={`Spent ${check.usedFocus} focus`}>
        {#each Array.from({ length: check.usedFocus ?? 0 }, (_, i) => i) as i (i)}
          <span
            class="bead spent"
            class:painted={focusPainted}
            style="--icon: url('{focusIcon}')"
            aria-hidden="true"
          ></span>
        {/each}
      </div>
    {/if}
  {/if}

  {#if phase === 'outcome'}
    <TypedText class="check-outcome" text={outcomeText} onBeat={(beat) => onProgress?.(beat)} onDone={finish} />
  {:else if phase === 'done' && !check.pending}
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
    color: var(--color-ink-muted);
    min-height: 1.4em;
  }

  .focus-commit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45em;
    margin: 0.35em 0 0.15em;
    animation: check-line-in 0.35s ease-out both;
  }

  .focus-head {
    display: flex;
    align-items: center;
    gap: 0.4em;
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .focus-glyph {
    width: 1.15rem;
    height: 1.15rem;
    background: var(--color-ink-muted);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .focus-glyph.painted {
    background: transparent;
    mask: none;
    -webkit-mask: none;
    background-image: var(--icon);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .focus-title {
    font-size: 0.95rem;
    letter-spacing: 0.04em;
  }

  .focus-count {
    font-variant-numeric: tabular-nums;
    color: var(--color-ink-muted);
    font-size: 0.9rem;
  }

  .focus-beads {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4em;
    padding: 0.2em 0;
  }

  .bead {
    width: 1.85rem;
    height: 1.85rem;
    padding: 0;
    border: 1px solid rgba(90, 75, 60, 0.45);
    border-radius: 50%;
    background: rgba(44, 37, 29, 0.12);
    cursor: pointer;
    position: relative;
    transition:
      transform 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.2s ease;
  }

  .bead::after {
    content: '';
    position: absolute;
    inset: 18%;
    background: var(--color-ink-muted);
    opacity: 0.35;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .bead.painted::after {
    background: transparent;
    opacity: 0.45;
    mask: none;
    -webkit-mask: none;
    background-image: var(--icon);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .bead.selected {
    border-color: var(--color-brass, #af8e67);
    box-shadow: 0 0 0 1px rgba(175, 142, 103, 0.45);
    background: rgba(175, 142, 103, 0.18);
  }

  .bead.selected::after {
    opacity: 1;
    background: var(--color-ink);
  }

  .bead.selected.painted::after {
    background: transparent;
    background-image: var(--icon);
    opacity: 1;
  }

  .bead.bump {
    animation: bead-bump 0.28s ease;
  }

  .bead.spending {
    animation: bead-spend 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    animation-delay: calc(var(--i) * 90ms);
  }

  .bead:disabled {
    cursor: default;
  }

  .focus-hint,
  .focus-preview {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-ink-muted);
  }

  .focus-preview {
    font-variant-numeric: tabular-nums;
  }

  .roll-btn {
    margin-top: 0.15em;
    padding: 0.4em 1.1em;
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    color: var(--color-parchment, #e8dcc4);
    background: var(--color-wood-mid, #3a2f24);
    border: 1px solid var(--color-brass, #af8e67);
    border-radius: 4px;
    cursor: pointer;
  }

  .roll-btn:hover {
    border-color: var(--color-golden, #bfa14a);
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
    background: var(--color-wood-mid);
    color: var(--color-parchment);
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
    color: var(--color-ink-muted);
  }

  .focus-spent {
    display: flex;
    gap: 0.25em;
    margin-top: 0.1em;
  }

  .bead.spent {
    width: 1.1rem;
    height: 1.1rem;
    border-color: rgba(90, 75, 60, 0.35);
    opacity: 0.7;
    pointer-events: none;
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

  @keyframes bead-bump {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.18);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes bead-spend {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    55% {
      opacity: 0.85;
      transform: scale(1.08) translateY(-0.55em);
    }
    100% {
      opacity: 0;
      transform: scale(0.35) translateY(-1.4em);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .check-roll.animated,
    .check-roll.animated .d20,
    .focus-commit,
    .bead.bump,
    .bead.spending {
      animation: none;
    }
  }
</style>
