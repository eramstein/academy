<script lang="ts">
  import { CardColor, CardType, isLandCard, type CardTemplate } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';

  let {
    cards: cardsProp,
    onSelect,
    selectedIds,
  }: {
    cards?: CardTemplate[];
    onSelect?: (card: CardTemplate) => void;
    selectedIds?: Set<string>;
  } = $props();

  const collection = $derived(cardsProp ?? gs.player.collection);
  const selectable = $derived(!!onSelect);

  let colorFilter = $state<CardColor | null>(null);
  let costFilter = $state<number | null>(null);
  let typeFilter = $state<CardType | null>(null);

  const colorOptions = Object.values(CardColor);
  const typeOptions = Object.values(CardType);

  const costOptions = $derived(
    [...new Set(collection.map((card) => card.cost))].sort((a, b) => a - b)
  );

  const filtered = $derived(
    collection.filter((card) => {
      if (selectedIds?.has(card.id)) return false;
      if (colorFilter && !card.colors.some((c) => c.color === colorFilter)) return false;
      if (costFilter !== null && card.cost !== costFilter) return false;
      if (typeFilter && card.type !== typeFilter) return false;
      return true;
    })
  );

  const lands = $derived(sortCards(filtered.filter(isLandCard)));
  const cards = $derived(sortCards(filtered.filter((card) => !isLandCard(card))));
  const hasActiveFilters = $derived(
    colorFilter !== null || costFilter !== null || typeFilter !== null
  );

  function handleCardClick(card: CardTemplate) {
    onSelect?.(card);
  }

  function sortCards(list: CardTemplate[]): CardTemplate[] {
    return [...list].sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.name.localeCompare(b.name);
    });
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  function toggleColor(color: CardColor) {
    colorFilter = colorFilter === color ? null : color;
  }

  function toggleCost(cost: number) {
    costFilter = costFilter === cost ? null : cost;
  }

  function toggleType(type: CardType) {
    typeFilter = typeFilter === type ? null : type;
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
</script>

<div class="collection">
  {#if collection.length === 0}
    <p class="empty">Your collection is empty.</p>
  {:else}
    <div class="filters">
      <div class="filter-group" role="group" aria-label="Filter by color">
        <span class="filter-label">Color</span>
        {#each colorOptions as color (color)}
          <button
            type="button"
            class="color-chip"
            class:active={colorFilter === color}
            style="background-image: url('{colorPath(color)}')"
            title={capitalize(color)}
            aria-pressed={colorFilter === color}
            aria-label={capitalize(color)}
            onclick={() => toggleColor(color)}
          ></button>
        {/each}
      </div>

      <div class="filter-group" role="group" aria-label="Filter by mana cost">
        <span class="filter-label">Cost</span>
        {#each costOptions as cost (cost)}
          <button
            type="button"
            class="chip"
            class:active={costFilter === cost}
            aria-pressed={costFilter === cost}
            onclick={() => toggleCost(cost)}
          >
            {cost}
          </button>
        {/each}
      </div>

      <div class="filter-group" role="group" aria-label="Filter by card type">
        <span class="filter-label">Type</span>
        {#each typeOptions as type (type)}
          <button
            type="button"
            class="chip"
            class:active={typeFilter === type}
            aria-pressed={typeFilter === type}
            onclick={() => toggleType(type)}
          >
            {capitalize(type)}
          </button>
        {/each}
      </div>
    </div>

    <div class="results">
      {#if lands.length === 0 && cards.length === 0}
        <p class="empty">
          {hasActiveFilters
            ? 'No cards match these filters.'
            : selectedIds
              ? 'All cards from your collection are in this deck.'
              : 'Your collection is empty.'}
        </p>
      {:else}
        {#if lands.length > 0}
          <section class="section">
            <h3 class="section-title">Lands</h3>
            <ul class="card-list">
              {#each lands as card (card.id)}
                {@render cardItem(card)}
              {/each}
            </ul>
          </section>
        {/if}

        {#if cards.length > 0}
          <section class="section">
            <h3 class="section-title">Cards</h3>
            <ul class="card-list">
              {#each cards as card (card.id)}
                {@render cardItem(card)}
              {/each}
            </ul>
          </section>
        {/if}
      {/if}
    </div>
  {/if}
</div>

{#snippet cardItem(card: CardTemplate)}
  <li class="card-item">
    {#if selectable}
      <button type="button" class="card-button" onclick={() => handleCardClick(card)}>
        <CardCompact {card} />
      </button>
    {:else}
      <CardCompact {card} />
    {/if}
  </li>
{/snippet}

<style>
  .collection {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-height: 0;
    height: 100%;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    padding: 0px 16px;
  }

  .filters {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.45rem 0.85rem;
    flex-shrink: 0;
    box-sizing: border-box;
    height: var(--editor-align-bar, auto);
    min-height: var(--editor-align-bar, 2.5rem);
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-golden);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .filter-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
  }

  .filter-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    margin-right: 0.15rem;
  }

  .chip {
    padding: 0.2rem 0.5rem;
    min-width: 1.7rem;
    background: rgba(191, 161, 74, 0.08);
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    color: var(--color-cream);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }

  .chip:hover {
    background: rgba(191, 161, 74, 0.16);
    color: var(--color-cream);
  }

  .chip.active {
    background: rgba(191, 161, 74, 0.16);
    border-color: var(--color-golden);
    color: var(--color-cream);
  }

  .color-chip {
    width: 18px;
    height: 18px;
    padding: 0;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid var(--color-golden);
    cursor: pointer;
  }

  .color-chip:hover {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }

  .color-chip.active {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(191, 161, 74, 0.4) transparent;
  }

  .results::-webkit-scrollbar {
    width: 5px;
  }

  .results::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .results::-webkit-scrollbar-track {
    background: transparent;
  }

  .results::-webkit-scrollbar-thumb {
    background: rgba(191, 161, 74, 0.4);
    border-radius: 3px;
  }

  .results::-webkit-scrollbar-thumb:hover {
    background: rgba(191, 161, 74, 0.6);
  }

  .empty {
    margin: 0;
    font-size: 0.95rem;
    color: var(--color-muted-label);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--color-golden);
  }

  .card-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .card-item {
    flex: 0 0 auto;
  }

  .card-button {
    display: block;
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 8px;
  }

  .card-button:hover {
    outline: 2px solid var(--color-golden);
    outline-offset: 2px;
  }
</style>
