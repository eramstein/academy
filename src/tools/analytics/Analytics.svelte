<script lang="ts">
  import { onMount } from 'svelte';
  import allCardsData from '../../data/_all_cards.json';
  import CardTable from './CardTable.svelte';
  import Filters from './Filters.svelte';
  import type { Card, Filters as FilterState } from './types';

  let allCards = $state<Card[]>([]);
  let filteredCards = $state<Card[]>([]);
  let filters = $state<FilterState>({});
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(() => {
    try {
      allCards = allCardsData as Card[];
      filteredCards = allCards;
      loading = false;
    } catch (err) {
      error = 'Failed to load cards data';
      loading = false;
    }
  });

  function updateFilters(newFilters: Partial<FilterState>) {
    filters = { ...filters, ...newFilters };
    applyFilters();
  }

  function applyFilters() {
    let filtered = allCards;

    if (filters.cardType) {
      filtered = filtered.filter((card) => card.type === filters.cardType);
    }

    if (filters.colorCombination) {
      filtered = filtered.filter((card) => {
        const cardColors = card.colors
          .map((c) => c.color)
          .sort()
          .join('-');
        return cardColors === filters.colorCombination;
      });
    }

    if (filters.cost !== undefined) {
      filtered = filtered.filter((card) => card.cost === filters.cost);
    }

    filteredCards = filtered;
  }
</script>

<div class="analytics-container">
  <header class="analytics-header">
    <h1>Card Analytics</h1>
  </header>

  {#if loading}
    <div class="loading">Loading cards...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="analytics-content">
      <aside class="filters-sidebar">
        <Filters {allCards} {filters} onFiltersChange={updateFilters} />
      </aside>

      <main class="main-content">
        <div class="results-header">
          <h2>Cards ({filteredCards.length} of {allCards.length})</h2>
          {#if Object.keys(filters).length > 0}
            <div class="active-filters">
              Active filters:
              {#each Object.entries(filters) as [key, value]}
                {#if value !== undefined && value !== ''}
                  <span class="filter-tag">
                    {value}
                    <button
                      class="remove-filter"
                      onclick={() => updateFilters({ [key]: undefined })}
                    >
                      ×
                    </button>
                  </span>
                {/if}
              {/each}
            </div>
          {/if}
        </div>

        <CardTable {filteredCards} />
      </main>
    </div>
  {/if}
</div>

<style>
  .analytics-container {
    min-height: 100vh;
    height: 100vh;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
  }

  .analytics-header {
    background: white;
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .analytics-header h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 24px;
  }

  .loading,
  .error {
    text-align: center;
    padding: 40px;
    font-size: 18px;
  }

  .error {
    color: #d32f2f;
  }

  .analytics-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .filters-sidebar {
    width: 300px;
    background: white;
    border-right: 1px solid #e9ecef;
    padding: 20px;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .results-header h2 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 20px;
  }

  .active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    color: #6c757d;
  }

  .filter-tag {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .remove-filter {
    background: none;
    border: none;
    color: #1976d2;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .remove-filter:hover {
    background: #1976d2;
    color: white;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .analytics-content {
      flex-direction: column;
    }

    .filters-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e9ecef;
    }

    .analytics-header {
      flex-direction: column;
      gap: 10px;
      text-align: center;
    }
  }
</style>
