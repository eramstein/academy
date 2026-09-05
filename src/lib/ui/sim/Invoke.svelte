<script lang="ts">
  import {
    CardColor,
    UnitType,
    type Action,
    type UnitKeywords,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { performAction, type CardCreationParameters } from '@/lib/sim/actions';
  import { KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { getAssetPath } from '@/lib/_utils/asset-paths';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const STAT_MAX = 20;

  let colors = $state<CardColor[]>([]);
  let power = $state(1);
  let hp = $state(1);
  let keywords = $state<Partial<Record<keyof UnitKeywords, number>>>({});
  let unitTypes = $state<UnitType[]>([]);

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const knownColors = $derived(
    Object.values(CardColor).filter((color) => !!gs.player.cardCrafting.colors?.[color])
  );
  const availableColors = $derived(knownColors.length ? knownColors : Object.values(CardColor));

  const knownKeywords = $derived(
    KEYWORD_KEYS.filter((key) => !!gs.player.cardCrafting.keywords?.[key])
  );
  const availableKeywords = $derived(knownKeywords.length ? knownKeywords : KEYWORD_KEYS);

  const availableUnitTypes = Object.values(UnitType);

  const parameters = $derived.by((): CardCreationParameters => {
    const selectedKeywords = toUnitKeywords(keywords);
    return {
      colors: colors.length ? colors : undefined,
      power,
      hp,
      keywords: selectedKeywords,
      unitTypes: unitTypes.length ? unitTypes : undefined,
    };
  });

  function toUnitKeywords(
    selected: Partial<Record<keyof UnitKeywords, number>>
  ): UnitKeywords | undefined {
    const result: UnitKeywords = {};
    for (const key of KEYWORD_KEYS) {
      const value = selected[key];
      if (!value) continue;
      if (NUMERIC_KEYWORDS.has(key)) {
        (result[key] as number) = value;
      } else {
        (result[key] as boolean) = true;
      }
    }
    return Object.keys(result).length ? result : undefined;
  }

  function formatKeyword(keyword: string): string {
    return keyword.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function toggleColor(color: CardColor) {
    if (colors.includes(color)) {
      colors = colors.filter((entry) => entry !== color);
    } else {
      colors = [...colors, color];
    }
  }

  function toggleUnitType(unitType: UnitType) {
    if (unitTypes.includes(unitType)) {
      unitTypes = unitTypes.filter((entry) => entry !== unitType);
    } else {
      unitTypes = [...unitTypes, unitType];
    }
  }

  function setKeyword(key: keyof UnitKeywords, value: number) {
    const next = { ...keywords };
    if (value) {
      next[key] = value;
    } else {
      delete next[key];
    }
    keywords = next;
  }

  function toggleKeyword(key: keyof UnitKeywords) {
    const next = { ...keywords };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 1;
    }
    keywords = next;
  }

  function confirm() {
    performAction({
      ...action,
      actionParameters: {
        ...action.actionParameters,
        ...parameters,
      },
      missingParameters: {},
    });
    onDone();
  }
</script>

<div class="overlay" role="presentation">
  <div class="panel" role="dialog" aria-labelledby="invoke-title">
    <header class="header">
      <h2 id="invoke-title" class="title">Invoke a unit</h2>
      <p class="subtitle">Choose colors, stats, type, and keywords.</p>
    </header>

    <section class="section">
      <h3 class="section-title">Colors</h3>
      <div class="chip-list">
        {#each availableColors as color (color)}
          {@const selected = colors.includes(color)}
          <button
            type="button"
            class="color-chip"
            class:selected
            aria-pressed={selected}
            onclick={() => toggleColor(color)}
          >
            <span class="color-dot" style="background-color: var(--color-{color})"></span>
            <span>{capitalize(color)}</span>
          </button>
        {/each}
      </div>
    </section>

    <div class="controls">
      {@render stepper(
        'Power',
        power,
        power > 0,
        power < STAT_MAX,
        () => (power -= 1),
        () => (power += 1)
      )}
      {@render stepper(
        'Health',
        hp,
        hp > 1,
        hp < STAT_MAX,
        () => (hp -= 1),
        () => (hp += 1)
      )}
    </div>

    <section class="section">
      <h3 class="section-title">Unit type</h3>
      <div class="chip-list">
        {#each availableUnitTypes as unitType (unitType)}
          {@const selected = unitTypes.includes(unitType)}
          <button
            type="button"
            class="type-chip"
            class:selected
            aria-pressed={selected}
            onclick={() => toggleUnitType(unitType)}
          >
            {capitalize(unitType)}
          </button>
        {/each}
      </div>
    </section>

    <section class="section">
      <h3 class="section-title">Keywords</h3>
      {#if availableKeywords.length === 0}
        <p class="empty">No known keywords yet.</p>
      {:else}
        <div class="chip-list">
          {#each availableKeywords as key (key)}
            {#if NUMERIC_KEYWORDS.has(key)}
              <div class="keyword-chip numeric">
                <img
                  class="keyword-icon"
                  src={getAssetPath(`images/keywords/${key}.png`)}
                  alt=""
                  aria-hidden="true"
                />
                <span class="keyword-name">{formatKeyword(key)}</span>
                <button
                  type="button"
                  class="step-btn"
                  disabled={(keywords[key] ?? 0) <= 0}
                  onclick={() => setKeyword(key, (keywords[key] ?? 0) - 1)}
                >
                  −
                </button>
                <span class="step-value">{keywords[key] ?? 0}</span>
                <button
                  type="button"
                  class="step-btn"
                  disabled={(keywords[key] ?? 0) >= STAT_MAX}
                  onclick={() => setKeyword(key, (keywords[key] ?? 0) + 1)}
                >
                  +
                </button>
              </div>
            {:else}
              {@const selected = !!keywords[key]}
              <button
                type="button"
                class="keyword-chip"
                class:selected
                onclick={() => toggleKeyword(key)}
              >
                <img
                  class="keyword-icon"
                  src={getAssetPath(`images/keywords/${key}.png`)}
                  alt=""
                  aria-hidden="true"
                />
                <span class="keyword-name">{formatKeyword(key)}</span>
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </section>

    <footer class="actions">
      <button type="button" class="action-btn cancel" onclick={onDone}>Cancel</button>
      <button type="button" class="action-btn confirm" onclick={confirm}>Invoke</button>
    </footer>
  </div>
</div>

{#snippet stepper(
  label: string,
  value: number,
  canDec: boolean,
  canInc: boolean,
  dec: () => void,
  inc: () => void
)}
  <div class="stepper">
    <span class="stepper-label">{label}</span>
    <button type="button" class="step-btn" disabled={!canDec} onclick={dec}>−</button>
    <span class="step-value">{value}</span>
    <button type="button" class="step-btn" disabled={!canInc} onclick={inc}>+</button>
  </div>
{/snippet}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .panel {
    width: min(960px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: #2c251d;
    border: 1px solid #5a4b3c;
    border-radius: 6px;
    color: #e8dcc4;
    padding: 20px 24px 16px;
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .header {
    text-align: center;
    margin-bottom: 16px;
  }

  .title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    color: #f0e6c8;
  }

  .subtitle {
    margin: 6px 0 0;
    font-size: 0.85rem;
    color: #a89880;
  }

  .section {
    margin-bottom: 18px;
  }

  .section-title {
    margin: 0 0 10px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #a89880;
    text-align: center;
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: #a89880;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px 24px;
    margin-bottom: 18px;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stepper-label {
    min-width: 4.5rem;
    font-size: 0.85rem;
    color: #a89880;
  }

  .step-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 1rem;
    line-height: 1;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    cursor: pointer;
  }

  .step-btn:hover:not(:disabled) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .step-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .step-value {
    min-width: 1.25rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .color-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.8rem;
    text-transform: capitalize;
    cursor: pointer;
  }

  .color-chip:hover {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .color-chip.selected {
    border-color: var(--color-golden);
    color: #f0e6c8;
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }

  .type-chip,
  .keyword-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .keyword-chip.numeric {
    cursor: default;
  }

  .type-chip:hover,
  .keyword-chip:hover:not(.numeric) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .type-chip.selected,
  .keyword-chip.selected {
    border-color: var(--color-golden);
    color: #f0e6c8;
  }

  .keyword-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }

  .keyword-name {
    text-transform: capitalize;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 8px;
  }

  .action-btn {
    font-family: inherit;
    font-size: 1rem;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    padding: 10px 24px;
    cursor: pointer;
  }

  .action-btn:hover:not(:disabled) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .action-btn.confirm {
    color: #f0e6c8;
    border-color: var(--color-golden);
  }

  .action-btn.confirm:hover:not(:disabled) {
    border-color: #d4b85c;
  }

  .action-btn.cancel {
    color: #a89880;
    background: transparent;
  }

  .action-btn.cancel:hover {
    color: #e8dcc4;
    background: #3d3429;
  }
</style>
