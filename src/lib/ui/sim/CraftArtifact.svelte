<script lang="ts">
  import { CardColor, ResourceType, type Action } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    artifactProgressChance,
    completeCraftedArtifact,
    fillArtifactCell,
    getCraftablePatterns,
    performAction,
    spendCraftFocus,
    type ArtifactCraftView,
  } from '@/lib/sim/actions';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: 'magic_dust',
    [ResourceType.Mithril]: 'metal_bar',
    [ResourceType.Moxes]: 'gem',
    [ResourceType.MollysBeads]: 'leaf',
    [ResourceType.SchlupakMushrooms]: 'feather',
    [ResourceType.SchlupakDreamspheres]: 'feather',
    [ResourceType.SchlupakSpores]: 'feather',
  };

  const patterns = $derived(getCraftablePatterns());
  let selectedKey = $state<string | null>(null);
  let focusToSpend = $state(0);
  let working = $state(false);
  let spentFocus = $state(0);
  let notice = $state('');
  let leaving = $state(false);

  const selected = $derived(
    patterns.find((pattern) => pattern.artifact.patternKey === selectedKey) ?? null
  );
  const chance = $derived(artifactProgressChance(working ? spentFocus : focusToSpend));
  const complete = $derived(
    !!selected &&
      selected.artifact.colorCost.every(
        (bar, index) => (selected.filled[index] ?? 0) >= bar.cost
      )
  );
  const subtitle = $derived(selected ? selected.artifact.name : 'Known patterns');

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || leaving) return;
      if (working) {
        void commit('paused');
        return;
      }
      if (selectedKey) {
        selectedKey = null;
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

  function costIcon(key: ArtifactCraftView['costs'][number]['key']): string {
    if (key === 'gold') return getUiIconPath('coin');
    return getUiIconPath(RESOURCE_ICONS[key]);
  }

  function selectPattern(patternKey: string) {
    selectedKey = patternKey;
    focusToSpend = 0;
    working = false;
    spentFocus = 0;
    notice = '';
  }

  function begin() {
    if (!selected || working || leaving || complete) return;
    spentFocus = spendCraftFocus(focusToSpend);
    working = true;
    notice = spentFocus > 0 ? `You spend ${spentFocus} focus.` : '';
  }

  async function onCell(barIndex: number) {
    if (leaving || !working || !selectedKey) return;
    const result = fillArtifactCell(selectedKey, barIndex, chance);
    if (!result) return;
    if (result.bonus) {
      notice = 'A second cell fills for free.';
    } else if (result.rolled) {
      notice = 'One cell fills.';
    } else {
      notice = 'The last cell of that color fills.';
    }
    if (!result.complete) return;
    const view = getCraftablePatterns().find(
      (pattern) => pattern.artifact.patternKey === selectedKey
    );
    if (view?.affordable) await commit('completed');
  }

  async function commit(outcome: 'paused' | 'completed') {
    if (leaving || !selectedKey) return;
    const view = getCraftablePatterns().find(
      (pattern) => pattern.artifact.patternKey === selectedKey
    );
    if (!view) return;
    leaving = true;
    if (outcome === 'completed' && !completeCraftedArtifact(view.artifact.patternKey)) {
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

  function progressLabel(pattern: ArtifactCraftView): string {
    const need = pattern.artifact.colorCost.reduce((sum, bar) => sum + bar.cost, 0);
    const filled = pattern.filled.reduce((sum, count) => sum + count, 0);
    if (need === 0 || filled === 0) return '';
    return `${filled}/${need}`;
  }

  function cellDisabled(pattern: ArtifactCraftView, barIndex: number, cellIndex: number): boolean {
    if (!working || leaving) return true;
    if (cellIndex < (pattern.filled[barIndex] ?? 0)) return true;
    const color = pattern.artifact.colorCost[barIndex]?.color;
    if (!color) return true;
    return (gs.player.colorMasteryPoints?.[color] ?? 0) <= 0;
  }
</script>

<WorkbenchShell title="Craft Artifact" {subtitle} wide>
  {#if !selected}
    <ul class="patterns">
      {#each patterns as pattern (pattern.artifact.patternKey)}
        {@const locked = pattern.missingPatternNames.length > 0}
        {@const progress = progressLabel(pattern)}
        <li>
          <button
            type="button"
            class="pattern"
            disabled={locked}
            onclick={() => selectPattern(pattern.artifact.patternKey)}
          >
            <span class="pattern-name">
              {pattern.artifact.name}
              {#if progress}
                <span class="tag">{progress}</span>
              {/if}
            </span>
            <span class="pattern-desc">{pattern.artifact.description}</span>
            {#if locked}
              <span class="need">Requires {pattern.missingPatternNames.join(', ')}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="description">{selected.artifact.description}</p>

    <div class="mastery" aria-label="Color mastery">
      {#each Object.values(CardColor) as color (color)}
        <span class="pip">
          <img src={colorPath(color)} alt="" />
          <span>{gs.player.colorMasteryPoints?.[color] ?? 0}</span>
        </span>
      {/each}
      <span class="focus-count">Focus {gs.player.focus}</span>
    </div>

    <section class="block">
      <h3>Costs</h3>
      {#if selected.costs.length === 0}
        <p class="muted">This pattern asks for nothing.</p>
      {:else}
        <ul class="costs">
          {#each selected.costs as line (line.key)}
            <li class:short={!line.enough}>
              <img src={costIcon(line.key)} alt="" />
              <span class="cost-label">{line.label}</span>
              <span class="cost-amount">have {line.have} · need {line.need}</span>
              <span class="cost-state">{line.enough ? 'enough' : 'short'}</span>
            </li>
          {/each}
        </ul>
      {/if}
      <p class="muted">Gold and materials are paid when the artifact is finished.</p>
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
        <h3>Focus</h3>
        {#if working}
          <p>Spent this action: {spentFocus}. Extra cell chance: {chance}%.</p>
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
            Extra cell chance: {chance}%. Dexterity {gs.player.attributes.dexterity} × 2, plus 5 per
            focus.
          </p>
        {/if}
      </section>
    {/if}

    {#if notice}
      <p class="notice">{notice}</p>
    {/if}
    {#if complete && !selected.affordable}
      <p class="notice">The color work is done. Gold and materials are still short.</p>
    {/if}
  {/if}

  {#snippet footer()}
    {#if !selected}
      <OrnateButton onclick={onDone}>Close</OrnateButton>
    {:else if !working}
      <OrnateButton variant="muted" onclick={() => (selectedKey = null)}>Back</OrnateButton>
      {#if complete}
        <OrnateButton
          disabled={!selected?.affordable || leaving}
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
          disabled={!selected?.affordable || leaving}
          onclick={() => commit('completed')}
        >
          Finish
        </OrnateButton>
      {/if}
    {/if}
  {/snippet}
</WorkbenchShell>

<style>
  .patterns {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pattern {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    background: transparent;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    cursor: pointer;
  }

  .pattern:hover:not(:disabled) {
    border-color: var(--color-brass);
  }

  .pattern:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .pattern-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.05rem;
  }

  .pattern-desc,
  .description,
  .muted,
  .notice,
  .need {
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

  .tag,
  .need {
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-brass);
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
  .costs li,
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pip img,
  .costs img,
  .bar-pip {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  .pip span,
  .focus-count,
  .bar-name,
  .bar-count,
  .cost-label,
  .cost-amount,
  .cost-state {
    font-family: var(--font-narrative);
    color: var(--color-ink);
  }

  .focus-count {
    margin-left: auto;
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

  .costs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .costs li.short .cost-amount,
  .costs li.short .cost-state {
    color: var(--color-red);
  }

  .cost-label {
    min-width: 8rem;
  }

  .cost-state {
    margin-left: auto;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.85rem;
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
</style>
