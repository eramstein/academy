<script lang="ts">
  import type { Action, CardTemplate, UnitKeywords } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { performAction, getAugmentPreview, type AugmentParameters } from '@/lib/sim/actions';
  import { KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  let cardId = $state<string | null>(initialCardId(action));
  let costIncrease = $state(1);
  let power = $state(0);
  let maxHealth = $state(0);
  let retaliate = $state(0);
  let keywords = $state<Partial<Record<keyof UnitKeywords, number>>>({});

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') back();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const availableCards = $derived(cardsFromAction(action));
  const canChangeCard = $derived(availableCards.length > 1);
  const knownKeywords = $derived(
    KEYWORD_KEYS.filter((key) => !!gs.player.craftingKnowledge.keywords?.[key])
  );

  const parameters = $derived.by((): AugmentParameters | null => {
    if (!cardId) return null;
    const selectedKeywords = Object.fromEntries(
      Object.entries(keywords).filter(([, value]) => value)
    ) as Partial<Record<keyof UnitKeywords, number>>;
    return {
      cardId,
      costIncrease,
      power: power || undefined,
      maxHealth: maxHealth || undefined,
      retaliate: retaliate || undefined,
      keywords: Object.keys(selectedKeywords).length ? selectedKeywords : undefined,
    };
  });

  const preview = $derived(parameters ? getAugmentPreview(parameters) : null);
  const card = $derived(preview?.card ?? null);
  const maxCostIncrease = $derived(card ? 9 - card.cost : 1);

  const canDecCost = $derived(
    !!parameters && costIncrease > 1 && fits({ ...parameters, costIncrease: costIncrease - 1 })
  );
  const canIncCost = $derived(costIncrease < maxCostIncrease);
  const canDecPower = $derived(power > 0);
  const canIncPower = $derived(!!parameters && fits({ ...parameters, power: power + 1 }));
  const canDecHealth = $derived(maxHealth > 0);
  const canIncHealth = $derived(!!parameters && fits({ ...parameters, maxHealth: maxHealth + 1 }));
  const canDecRetaliate = $derived(retaliate > 0);
  const canIncRetaliate = $derived(
    !!parameters && fits({ ...parameters, retaliate: retaliate + 1 })
  );

  function optionId(option: string | [string, string]): string {
    return Array.isArray(option) ? option[0] : option;
  }

  function cardsFromAction(source: Action): CardTemplate[] {
    const raw = source.missingParameters?.cardId;
    const ids = Array.isArray(raw) ? raw.map(optionId) : [];
    const fromMissing = ids
      .map((id) => gs.player.collection.find((c) => c.id === id))
      .filter((c): c is CardTemplate => !!c);
    if (fromMissing.length) return fromMissing;

    const selected = source.actionParameters.cardId;
    if (typeof selected === 'string') {
      const found = gs.player.collection.find((c) => c.id === selected);
      return found ? [found] : [];
    }
    return [];
  }

  function initialCardId(source: Action): string | null {
    if (typeof source.actionParameters.cardId === 'string') {
      return source.actionParameters.cardId;
    }
    const cards = cardsFromAction(source);
    return cards.length === 1 ? cards[0].id : null;
  }

  function resetForm() {
    costIncrease = 1;
    power = 0;
    maxHealth = 0;
    retaliate = 0;
    keywords = {};
  }

  function selectCard(id: string) {
    cardId = id;
    resetForm();
  }

  function back() {
    if (cardId && canChangeCard) {
      cardId = null;
      resetForm();
      return;
    }
    onDone();
  }

  function fits(next: AugmentParameters): boolean {
    return getAugmentPreview(next).error === '';
  }

  function formatKeyword(keyword: string): string {
    return keyword.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  function hasBooleanKeyword(key: keyof UnitKeywords): boolean {
    if (!card || NUMERIC_KEYWORDS.has(key)) return false;
    return !!card.keywords?.[key];
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
    if (!parameters || hasBooleanKeyword(key)) return;
    const enabled = !keywords[key];
    const nextKeywords = { ...keywords };
    if (enabled) {
      nextKeywords[key] = 1;
      if (!fits({ ...parameters, keywords: nextKeywords })) return;
    } else {
      delete nextKeywords[key];
    }
    keywords = nextKeywords;
  }

  function canIncKeyword(key: keyof UnitKeywords): boolean {
    if (!parameters) return false;
    const nextKeywords = { ...keywords, [key]: (keywords[key] ?? 0) + 1 };
    return fits({ ...parameters, keywords: nextKeywords });
  }

  function confirm() {
    if (!parameters || preview?.error) return;
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
  <div class="panel" role="dialog" aria-labelledby="enchant-title">
    <header class="header">
      <h2 id="enchant-title" class="title">
        {#if cardId}
          Enchant {card?.name ?? 'card'}
        {:else}
          Enchant a card
        {/if}
      </h2>
      <p class="subtitle">
        {cardId ? 'Choose how to spend the upgrade budget.' : 'Which card?'}
      </p>
    </header>

    {#if !cardId}
      {#if availableCards.length === 0}
        <p class="error">No units available to enchant.</p>
      {:else}
        <div class="card-grid">
          {#each availableCards as option (option.id)}
            <button type="button" class="card-pick" onclick={() => selectCard(option.id)}>
              <CardCompact card={option} />
            </button>
          {/each}
        </div>
      {/if}
    {:else if !card || !preview}
      <p class="error">{preview?.error || 'Card not found.'}</p>
    {:else}
      <div class="preview-row">
        <CardCompact {card} />
        <span class="arrow" aria-hidden="true">→</span>
        {#if preview.preview}
          <CardCompact card={preview.preview} />
        {/if}
      </div>

      <div class="budget" class:over={!!preview.error}>
        <span class="budget-label">Budget</span>
        <span class="budget-value">{preview.spent} / {preview.upgradeBudget}</span>
        {#if preview.error}
          <span class="budget-note error-note">{preview.error}</span>
        {:else if preview.extraBudget > 0}
          <span class="budget-note">
            {preview.extraBudget} remaining will be spent automatically
          </span>
        {/if}
      </div>

      <div class="controls">
        {@render stepper(
          'Cost +',
          costIncrease,
          canDecCost,
          canIncCost,
          () => (costIncrease -= 1),
          () => (costIncrease += 1)
        )}
        {@render stepper(
          'Power +',
          power,
          canDecPower,
          canIncPower,
          () => (power -= 1),
          () => (power += 1)
        )}
        {@render stepper(
          'Health +',
          maxHealth,
          canDecHealth,
          canIncHealth,
          () => (maxHealth -= 1),
          () => (maxHealth += 1)
        )}
        {@render stepper(
          'Retaliate +',
          retaliate,
          canDecRetaliate,
          canIncRetaliate,
          () => (retaliate -= 1),
          () => (retaliate += 1)
        )}
      </div>

      <section class="keywords">
        <h3 class="section-title">Keywords</h3>
        {#if knownKeywords.length === 0}
          <p class="empty">No known keywords yet.</p>
        {:else}
          <div class="keyword-list">
            {#each knownKeywords as key (key)}
              {#if NUMERIC_KEYWORDS.has(key)}
                <div class="keyword-chip numeric">
                  <img
                    class="keyword-icon"
                    src="/assets/images/keywords/{key}.png"
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
                    disabled={!canIncKeyword(key)}
                    onclick={() => setKeyword(key, (keywords[key] ?? 0) + 1)}
                  >
                    +
                  </button>
                </div>
              {:else}
                {@const owned = hasBooleanKeyword(key)}
                {@const selected = !!keywords[key]}
                <button
                  type="button"
                  class="keyword-chip"
                  class:selected
                  class:owned
                  disabled={owned || (!selected && !canIncKeyword(key))}
                  onclick={() => toggleKeyword(key)}
                >
                  <img
                    class="keyword-icon"
                    src="/assets/images/keywords/{key}.png"
                    alt=""
                    aria-hidden="true"
                  />
                  <span class="keyword-name">{formatKeyword(key)}</span>
                  {#if owned}
                    <span class="owned-label">has</span>
                  {/if}
                </button>
              {/if}
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    <footer class="actions">
      <button type="button" class="action-btn cancel" onclick={back}>
        {cardId && canChangeCard ? 'Back' : 'Cancel'}
      </button>
      {#if cardId}
        <button
          type="button"
          class="action-btn confirm"
          disabled={!card || !!preview?.error}
          onclick={confirm}
        >
          Enchant
        </button>
      {/if}
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

  .error {
    margin: 0 0 16px;
    text-align: center;
    color: #c47a6a;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .card-pick {
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 0;
    cursor: pointer;
  }

  .card-pick:hover {
    border-color: var(--color-brass);
  }

  .preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .arrow {
    flex-shrink: 0;
    font-size: 1.8rem;
    color: #a89880;
  }

  .budget {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 8px 12px;
    margin-bottom: 16px;
    padding: 8px 12px;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    background: #241e18;
  }

  .budget.over {
    border-color: #8a4a3c;
  }

  .budget-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #a89880;
  }

  .budget-value {
    font-variant-numeric: tabular-nums;
    color: #f0e6c8;
  }

  .budget-note {
    width: 100%;
    text-align: center;
    font-size: 0.8rem;
    color: #a89880;
  }

  .error-note {
    color: #c47a6a;
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

  .keywords {
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

  .keyword-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

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

  .keyword-chip:hover:not(:disabled):not(.numeric) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .keyword-chip.selected {
    border-color: var(--color-golden);
    color: #f0e6c8;
  }

  .keyword-chip.owned,
  .keyword-chip:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .keyword-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }

  .keyword-name {
    text-transform: capitalize;
  }

  .owned-label {
    font-size: 0.7rem;
    color: #a89880;
    text-transform: uppercase;
    letter-spacing: 0.04em;
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

  .action-btn:disabled {
    opacity: 0.45;
    cursor: default;
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
