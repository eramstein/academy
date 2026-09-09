<script lang="ts">
  import { CardColor, CardType, type CardTemplate } from '@/lib/_model';
  import { getAssetPath } from '@/lib/_utils/asset-paths';

  let {
    cards,
    colorFilter = $bindable(null),
    costFilter = $bindable(null),
    typeFilter = $bindable(null),
    showColor = true,
    showCost = true,
    showType = true,
    tone = 'data',
  }: {
    cards: CardTemplate[];
    colorFilter?: CardColor | null;
    costFilter?: number | null;
    typeFilter?: CardType | null;
    showColor?: boolean;
    showCost?: boolean;
    showType?: boolean;
    tone?: 'data' | 'parchment';
  } = $props();

  const colorOptions = Object.values(CardColor);
  const typeOptions = Object.values(CardType);

  const costOptions = $derived([...new Set(cards.map((card) => card.cost))].sort((a, b) => a - b));

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

<div class="filters" class:parchment={tone === 'parchment'} class:data={tone === 'data'}>
  {#if showColor}
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
  {/if}

  {#if showCost}
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
  {/if}

  {#if showType}
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
  {/if}
</div>

<style>
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
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .filters.data {
    border-bottom: 1px solid var(--color-brass);
  }

  .filters.parchment {
    border-bottom: 1px solid rgba(90, 75, 60, 0.35);
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
    margin-right: 0.15rem;
  }

  .data .filter-label {
    color: var(--color-muted-label);
  }

  .parchment .filter-label {
    color: #6a5c4c;
  }

  .chip {
    padding: 0.2rem 0.5rem;
    min-width: 1.7rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }

  .data .chip {
    background: rgba(175, 142, 103, 0.08);
    border: 1px solid var(--color-brass);
    color: var(--color-cream);
  }

  .data .chip:hover {
    background: rgba(175, 142, 103, 0.16);
    color: var(--color-cream);
  }

  .data .chip.active {
    background: rgba(191, 161, 74, 0.2);
    border-color: var(--color-golden);
    color: var(--color-cream);
  }

  .parchment .chip {
    background: rgba(44, 37, 29, 0.06);
    border: 1px solid rgba(90, 75, 60, 0.45);
    color: #2c251d;
  }

  .parchment .chip:hover {
    background: rgba(44, 37, 29, 0.12);
  }

  .parchment .chip.active {
    background: rgba(191, 161, 74, 0.22);
    border-color: var(--color-golden);
  }

  .color-chip {
    width: 18px;
    height: 18px;
    padding: 0;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    cursor: pointer;
  }

  .data .color-chip {
    border: 1px solid var(--color-brass);
  }

  .data .color-chip:hover {
    outline: 2px solid var(--color-brass);
    outline-offset: 1px;
  }

  .data .color-chip.active {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }

  .parchment .color-chip {
    border: 1px solid rgba(90, 75, 60, 0.55);
  }

  .parchment .color-chip:hover {
    outline: 2px solid rgba(90, 75, 60, 0.55);
    outline-offset: 1px;
  }

  .parchment .color-chip.active {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }
</style>
