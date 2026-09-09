<script lang="ts">
  import { CardColor, CardType, isLandCard, type CardTemplate } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import CardFilters from '@/lib/ui/cards/CardFilters.svelte';
  import { hasActiveCardFilters, matchesCardFilters } from '@/lib/ui/cards/card-filters';

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

  const filters = $derived({ color: colorFilter, cost: costFilter, type: typeFilter });

  const filtered = $derived(
    collection.filter((card) => {
      if (selectedIds?.has(card.id)) return false;
      return matchesCardFilters(card, filters);
    })
  );

  const lands = $derived(sortCards(filtered.filter(isLandCard)));
  const cards = $derived(sortCards(filtered.filter((card) => !isLandCard(card))));
  const hasActiveFilters = $derived(hasActiveCardFilters(filters));

  function handleCardClick(card: CardTemplate) {
    onSelect?.(card);
  }

  function sortCards(list: CardTemplate[]): CardTemplate[] {
    return [...list].sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.name.localeCompare(b.name);
    });
  }
</script>

<div class="collection">
  {#if collection.length === 0}
    <p class="empty">Your collection is empty.</p>
  {:else}
    <CardFilters
      cards={collection}
      bind:colorFilter
      bind:costFilter
      bind:typeFilter
      tone="data"
    />

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

  .results {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 142, 103, 0.4) transparent;
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
    background: rgba(175, 142, 103, 0.4);
    border-radius: 3px;
  }

  .results::-webkit-scrollbar-thumb:hover {
    background: rgba(175, 142, 103, 0.6);
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
    border-bottom: 1px solid var(--color-brass);
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
    outline: 2px solid var(--color-brass);
    outline-offset: 2px;
  }
</style>
