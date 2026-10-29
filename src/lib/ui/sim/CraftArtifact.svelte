<script lang="ts">
  import { CardColor, ResourceType, type Action } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import {
    artifactProgressChance,
    canAffordPieceChoices,
    canPayArtifactCell,
    completeCraftedArtifact,
    dreamsphereStock,
    fillArtifactCell,
    getCraftablePatterns,
    performAction,
    spendCraftFocus,
    type ArtifactCellPayment,
    type ArtifactCraftView,
  } from '@/lib/sim/actions';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import ResourceIcon from '@/lib/ui/sim/ResourceIcon.svelte';
  import ArtifactMaterials from './crafting/ArtifactMaterials.svelte';
  import PatternBook from './crafting/PatternBook.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  type CraftStep = 'materials' | 'colors';

  const patterns = $derived(getCraftablePatterns());
  let selectedKey = $state<string | null>(null);
  let craftStep = $state<CraftStep>('materials');
  let pieceChoices = $state<number[]>([]);
  let focusToSpend = $state(0);
  let takeYourTime = $state(false);
  let payment = $state<ArtifactCellPayment>('mastery');
  let working = $state(false);
  let spentFocus = $state(0);
  let sessionTakeYourTime = $state(false);
  let progressedThisSession = $state(false);
  let notice = $state('');
  let leaving = $state(false);
  let patternPage = $state(0);

  const selected = $derived(
    patterns.find((pattern) => pattern.artifact.patternKey === selectedKey) ?? null
  );
  const activeTakeYourTime = $derived(working ? sessionTakeYourTime : takeYourTime);
  const chance = $derived(
    artifactProgressChance(working ? spentFocus : focusToSpend, activeTakeYourTime)
  );
  const complete = $derived(
    !!selected &&
      selected.artifact.colorCost.every(
        (bar, index) => (selected.filled[index] ?? 0) >= bar.cost
      )
  );
  const choicesAffordable = $derived(
    !!selected &&
      pieceChoices.length === selected.pieces.length &&
      canAffordPieceChoices(selected.pieces, pieceChoices)
  );
  const subtitle = $derived(selected ? selected.artifact.name : 'Known patterns');
  const dreamspheres = $derived(dreamsphereStock());

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || leaving) return;
      if (working) {
        void commit('paused');
        return;
      }
      if (selectedKey && craftStep === 'colors') {
        craftStep = 'materials';
        notice = '';
        return;
      }
      if (selectedKey) {
        selectedKey = null;
        craftStep = 'materials';
        pieceChoices = [];
        notice = '';
        return;
      }
      onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function confirmPattern(patternKey: string) {
    if (leaving) return;
    const view = patterns.find((pattern) => pattern.artifact.patternKey === patternKey);
    if (!view || view.missingPatternNames.length > 0) return;
    selectPattern(patternKey);
  }

  function selectPattern(patternKey: string) {
    const view = patterns.find((pattern) => pattern.artifact.patternKey === patternKey);
    selectedKey = patternKey;
    craftStep = 'materials';
    pieceChoices =
      view?.affordableChoices ?? view?.pieces.map((piece) => piece.suggestedIndex) ?? [];
    focusToSpend = 0;
    takeYourTime = false;
    payment = 'mastery';
    working = false;
    spentFocus = 0;
    sessionTakeYourTime = false;
    progressedThisSession = false;
    notice = '';
  }

  function clearPattern() {
    selectedKey = null;
    craftStep = 'materials';
    pieceChoices = [];
    notice = '';
  }

  function goToColors() {
    if (!selected || leaving) return;
    craftStep = 'colors';
    notice = '';
  }

  function goToMaterials() {
    if (working || leaving) return;
    craftStep = 'materials';
    notice = '';
  }

  function cyclePiece(pieceIndex: number, delta: number) {
    if (!selected || leaving || craftStep !== 'materials') return;
    const count = selected.pieces[pieceIndex]?.alternatives.length ?? 0;
    if (count <= 1) return;
    const current = pieceChoices[pieceIndex] ?? 0;
    const next = [...pieceChoices];
    next[pieceIndex] = (current + delta + count) % count;
    pieceChoices = next;
  }

  function setTakeYourTime(value: boolean) {
    if (working || leaving) return;
    takeYourTime = value;
    if (value) focusToSpend = 0;
  }

  function begin() {
    if (!selected || working || leaving || complete || craftStep !== 'colors') return;
    sessionTakeYourTime = takeYourTime;
    spentFocus = takeYourTime ? 0 : spendCraftFocus(focusToSpend);
    working = true;
    progressedThisSession = false;
    if (takeYourTime) {
      notice = 'You take your time. One careful attempt this session.';
    } else {
      notice = spentFocus > 0 ? `You spend ${spentFocus} focus.` : '';
    }
  }

  async function onCell(barIndex: number) {
    if (leaving || !working || !selectedKey || craftStep !== 'colors') return;
    if (sessionTakeYourTime && progressedThisSession) return;
    const result = fillArtifactCell(selectedKey, barIndex, chance, payment);
    if (!result) return;
    progressedThisSession = true;
    if (result.bonus) {
      notice = 'A second cell fills for free.';
    } else if (result.rolled) {
      notice = 'One cell fills.';
    } else {
      notice = 'The last cell of that color fills.';
    }
    if (sessionTakeYourTime && !result.complete) {
      notice = result.bonus
        ? 'Careful work fills two cells. That is all for this session.'
        : 'Careful work fills one cell. That is all for this session.';
    }
    if (!result.complete) return;
    const view = getCraftablePatterns().find(
      (pattern) => pattern.artifact.patternKey === selectedKey
    );
    if (view && canAffordPieceChoices(view.pieces, pieceChoices)) await commit('completed');
  }

  async function commit(outcome: 'paused' | 'completed') {
    if (leaving || !selectedKey) return;
    const view = getCraftablePatterns().find(
      (pattern) => pattern.artifact.patternKey === selectedKey
    );
    if (!view) return;
    leaving = true;
    if (
      outcome === 'completed' &&
      !completeCraftedArtifact(view.artifact.patternKey, { pieceChoices })
    ) {
      leaving = false;
      notice = 'Gold and materials are still short.';
      return;
    }
    await performAction({
      ...action,
      actionParameters: {
        outcome,
        patternKey: view.artifact.patternKey,
        name: view.artifact.name,
      },
      missingParameters: {},
    });
    onDone();
  }

  function cellDisabled(pattern: ArtifactCraftView, barIndex: number, cellIndex: number): boolean {
    if (!working || leaving) return true;
    if (sessionTakeYourTime && progressedThisSession) return true;
    if (cellIndex < (pattern.filled[barIndex] ?? 0)) return true;
    const color = pattern.artifact.colorCost[barIndex]?.color;
    if (!color) return true;
    return !canPayArtifactCell(color, payment);
  }
</script>

{#if !selected}
  <PatternBook
    {patterns}
    bind:page={patternPage}
    onConfirm={confirmPattern}
    onBack={onDone}
  />
{:else if craftStep === 'materials'}
  <ArtifactMaterials
    pieces={selected.pieces}
    {pieceChoices}
    {leaving}
    affordable={choicesAffordable}
    onCycle={cyclePiece}
    onBack={clearPattern}
    onAssemble={goToColors}
  />
{:else}
  <WorkbenchShell title="Craft Artifact" {subtitle} wide>
    <nav class="steps" aria-label="Crafting steps">
      <button
        type="button"
        class="step"
        class:active={craftStep === 'materials'}
        class:done={craftStep === 'colors'}
        disabled={leaving || working}
        onclick={goToMaterials}
      >
        <span class="step-num">1</span>
        <span class="step-label">Materials</span>
      </button>
      <span class="step-rule" aria-hidden="true"></span>
      <button
        type="button"
        class="step"
        class:active={craftStep === 'colors'}
        disabled={leaving || working || craftStep !== 'colors'}
        onclick={goToColors}
      >
        <span class="step-num">2</span>
        <span class="step-label">Colors</span>
      </button>
    </nav>

    <p class="description">{selected.artifact.description}</p>

    <div class="mastery" aria-label="Color mastery">
        {#each Object.values(CardColor) as color (color)}
          <span class="pip">
            <img src={colorPath(color)} alt="" />
            <span>{gs.player.colorMasteryPoints?.[color] ?? 0}</span>
          </span>
        {/each}
        <span class="pip dreamsphere-pip">
          <span class="cost-icon">
            <ResourceIcon type={ResourceType.Dreamspheres} />
          </span>
          <span>{dreamspheres}</span>
        </span>
        <span class="focus-count">Focus {gs.player.focus}</span>
      </div>

      <section class="block">
        <h3>Pay with</h3>
        <div class="pay-options" role="radiogroup" aria-label="Color cell payment">
          <button
            type="button"
            class="pay-option"
            class:chosen={payment === 'mastery'}
            role="radio"
            aria-checked={payment === 'mastery'}
            disabled={leaving}
            onclick={() => (payment = 'mastery')}
          >
            Color mastery
          </button>
          <button
            type="button"
            class="pay-option"
            class:chosen={payment === 'dreamsphere'}
            role="radio"
            aria-checked={payment === 'dreamsphere'}
            disabled={leaving || dreamspheres <= 0}
            onclick={() => (payment = 'dreamsphere')}
          >
            Dreamspheres
          </button>
        </div>
        <p class="muted">
          {#if payment === 'dreamsphere'}
            One dreamsphere fills any color cell.
          {:else}
            Each cell spends one mastery point of that color.
          {/if}
        </p>
      </section>

      <section class="block">
        <h3>Colors</h3>
        {#if selected.artifact.colorCost.length === 0}
          <p class="muted">This pattern has no color cells.</p>
        {:else}
          <div class="bars">
            {#each selected.artifact.colorCost as bar, barIndex (barIndex)}
              <div class="bar">
                <img class="bar-pip" src={colorPath(bar.color)} alt="" />
                <span class="bar-name">{bar.color}</span>
                <span class="cells">
                  {#each Array.from({ length: bar.cost }, (_, cellIndex) => cellIndex) as cellIndex (cellIndex)}
                    {@const filled = cellIndex < (selected.filled[barIndex] ?? 0)}
                    <button
                      type="button"
                      class="cell"
                      class:filled
                      style="--swatch: var(--color-{bar.color})"
                      disabled={cellDisabled(selected, barIndex, cellIndex)}
                      aria-label={filled ? `${bar.color} cell filled` : `Fill a ${bar.color} cell`}
                      onclick={() => onCell(barIndex)}
                    ></button>
                  {/each}
                </span>
                <span class="bar-count">{selected.filled[barIndex] ?? 0}/{bar.cost}</span>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      {#if !complete}
        <section class="block focus-block">
          <h3>Care</h3>
          {#if working}
            {#if sessionTakeYourTime}
              <p>
                Taking your time. Extra cell chance: {chance}%.
                {#if progressedThisSession}
                  One attempt used.
                {:else}
                  One attempt left this session.
                {/if}
              </p>
            {:else}
              <p>Spent this action: {spentFocus}. Extra cell chance: {chance}%.</p>
            {/if}
          {:else}
            <label class="take-time">
              <input
                type="checkbox"
                checked={takeYourTime}
                disabled={leaving}
                onchange={(event) => setTakeYourTime(event.currentTarget.checked)}
              />
              <span>Take your time</span>
            </label>
            {#if takeYourTime}
              <p class="muted">
                One color attempt this session. Extra cell chance: 100%.
              </p>
            {:else}
              <div class="stepper">
                <button
                  type="button"
                  onclick={() => (focusToSpend = Math.max(0, focusToSpend - 1))}
                  disabled={focusToSpend <= 0}
                >
                  −
                </button>
                <span>{focusToSpend}</span>
                <button
                  type="button"
                  onclick={() =>
                    (focusToSpend = Math.min(gs.player.focus ?? 0, focusToSpend + 1))}
                  disabled={focusToSpend >= (gs.player.focus ?? 0)}
                >
                  +
                </button>
              </div>
              <p class="muted">
                Extra cell chance: {chance}%. Dexterity {gs.player.attributes.dexterity} × 2, plus 5
                per focus.
              </p>
            {/if}
          {/if}
        </section>
      {/if}

      {#if notice}
        <p class="notice">{notice}</p>
      {/if}
      {#if complete && !choicesAffordable}
        <p class="notice warn">The color work is done. Gold and materials are still short.</p>
      {/if}

    {#snippet footer()}
      {#if !working}
        <OrnateButton variant="muted" onclick={goToMaterials}>Back</OrnateButton>
        {#if complete}
          <OrnateButton
            disabled={!choicesAffordable || leaving}
            onclick={() => commit('completed')}
          >
            Finish
          </OrnateButton>
        {:else}
          <OrnateButton disabled={leaving} onclick={begin}>Begin</OrnateButton>
        {/if}
      {:else}
        <OrnateButton variant="muted" disabled={leaving} onclick={() => commit('paused')}>
          Stop
        </OrnateButton>
        {#if complete}
          <OrnateButton
            disabled={!choicesAffordable || leaving}
            onclick={() => commit('completed')}
          >
            Finish
          </OrnateButton>
        {/if}
      {/if}
    {/snippet}
  </WorkbenchShell>
{/if}

<style>
  .description,
  .muted,
  .notice {
    margin: 0;
    color: var(--color-ink-muted);
    font-family: var(--font-narrative);
    line-height: 1.5;
  }

  .description {
    color: var(--color-ink);
    font-size: 1.05rem;
    line-height: 1.7;
  }

  .steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 0 14px;
  }

  .step {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    font-family: var(--font-narrative);
    color: var(--color-ink-muted);
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .step:disabled {
    cursor: default;
  }

  .step.active {
    color: var(--color-ink);
  }

  .step.done:not(.active) {
    color: var(--color-ink);
  }

  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    border: 1px solid var(--color-brown-border);
    border-radius: 50%;
    font-size: 0.8rem;
    line-height: 1;
  }

  .step.active .step-num,
  .step.done .step-num {
    border-color: var(--color-golden);
    background: color-mix(in srgb, var(--color-golden) 22%, transparent);
    color: var(--color-ink);
  }

  .step-label {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .step-rule {
    width: 28px;
    height: 1px;
    background: var(--color-brown-border);
  }

  .mastery {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin: 14px 0;
    padding: 8px 10px;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
  }

  .pip,
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pip img,
  .cost-icon,
  .bar-pip {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  .cost-icon {
    display: block;
    flex-shrink: 0;
  }

  .pip span,
  .focus-count,
  .bar-name,
  .bar-count {
    font-family: var(--font-narrative);
    color: var(--color-ink);
  }

  .focus-count {
    margin-left: auto;
  }

  .pay-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pay-option {
    padding: 6px 10px;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    background: transparent;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    cursor: pointer;
  }

  .pay-option:hover:not(:disabled) {
    border-color: var(--color-brass);
  }

  .pay-option.chosen {
    border-color: var(--color-golden);
  }

  .pay-option:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .take-time {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    cursor: pointer;
  }

  .take-time input {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-brass);
  }

  .block {
    margin-top: 14px;
  }

  h3 {
    margin: 0 0 8px;
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-muted);
  }

  .muted {
    margin-top: 8px;
    font-size: 0.92rem;
  }

  .bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bar-name {
    min-width: 4.2rem;
    text-transform: capitalize;
  }

  .cells {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .cell {
    width: 26px;
    height: 34px;
    padding: 0;
    border: 1px solid var(--color-brown-border);
    border-radius: 3px;
    background: rgba(44, 37, 29, 0.06);
    cursor: pointer;
  }

  .cell.filled {
    background: var(--swatch);
    border-color: var(--color-ink);
    cursor: default;
  }

  .cell:disabled {
    cursor: default;
  }

  .cell:not(:disabled):hover {
    border-color: var(--color-golden);
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-narrative);
    font-size: 1.2rem;
    color: var(--color-ink);
  }

  .stepper button {
    width: 32px;
    height: 32px;
    font-family: var(--font-narrative);
    font-size: 1.2rem;
    color: var(--color-ink);
    background: transparent;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    cursor: pointer;
  }

  .stepper button:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .notice {
    margin-top: 14px;
    color: var(--color-ink);
  }

  .notice.warn {
    color: var(--color-red);
  }
</style>
