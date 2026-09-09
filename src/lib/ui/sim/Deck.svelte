<script lang="ts">
  import { CardColor, type CardTemplate, type Deck as DeckModel } from '@/lib/_model';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';

  let {
    deck,
    onCardClick,
    onNameChange,
    compact = false,
    requiredLands,
    minCards,
  }: {
    deck: DeckModel;
    onCardClick?: (card: CardTemplate) => void;
    onNameChange?: (name: string) => void;
    compact?: boolean;
    requiredLands?: number;
    minCards?: number;
  } = $props();

  function sortCards(cards: CardTemplate[]): CardTemplate[] {
    return [...cards].sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.name.localeCompare(b.name);
    });
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  const colors = $derived([
    ...new Set([...deck.cards, ...deck.lands].flatMap((c) => c.colors.map((col) => col.color))),
  ]);
  const sortedCards = $derived(sortCards(deck.cards));
  const sortedLands = $derived(sortCards(deck.lands));
  const clickable = $derived(!!onCardClick);
  const landsOk = $derived(requiredLands === undefined || deck.lands.length === requiredLands);
  const cardsOk = $derived(minCards === undefined || deck.cards.length >= minCards);
  const landsCount = $derived(
    requiredLands !== undefined
      ? `${deck.lands.length}/${requiredLands}`
      : String(deck.lands.length)
  );
  const cardsCount = $derived(
    minCards !== undefined ? `${deck.cards.length}/${minCards}+` : String(deck.cards.length)
  );
</script>

<div class="deck">
  {#if !compact}
    <header class="header">
      <h2 class="name">{deck.name}</h2>
      <p class="meta">
        {deck.cards.length} cards · {deck.lands.length} lands
      </p>
      {#if colors.length > 0}
        <div class="colors">
          {#each colors as color (color)}
            <div
              class="color-indicator"
              style="background-image: url('{colorPath(color)}')"
              title={color}
            ></div>
          {/each}
        </div>
      {/if}
    </header>
  {:else}
    <header class="header compact-bar">
      {#if onNameChange}
        <input
          class="name-input"
          type="text"
          value={deck.name}
          maxlength={40}
          aria-label="Deck name"
          placeholder="Deck name"
          oninput={(e) => onNameChange(e.currentTarget.value)}
        />
      {:else}
        <h2 class="name">{deck.name}</h2>
      {/if}
    </header>
  {/if}

  <div class="body">
    <section class="section">
      <h3 class="section-title">
        <span>Lands</span>
        {#if compact}
          <span class="count" class:bad={!landsOk}>{landsCount}</span>
        {/if}
      </h3>
      {#if sortedLands.length === 0}
        <p class="empty-section">No lands yet.</p>
      {:else}
        <ul class="card-list">
          {#each sortedLands as card (card.id)}
            <li class="card-item">
              {#if clickable}
                <button type="button" class="card-button" onclick={() => onCardClick?.(card)}>
                  <CardCompact {card} />
                </button>
              {:else}
                <CardCompact {card} />
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="section">
      <h3 class="section-title">
        <span>Cards</span>
        {#if compact}
          <span class="count" class:bad={!cardsOk}>{cardsCount}</span>
        {/if}
      </h3>
      {#if sortedCards.length === 0}
        <p class="empty-section">No cards yet.</p>
      {:else}
        <ul class="card-list">
          {#each sortedCards as card (card.id)}
            <li class="card-item">
              {#if clickable}
                <button type="button" class="card-button" onclick={() => onCardClick?.(card)}>
                  <CardCompact {card} />
                </button>
              {:else}
                <CardCompact {card} />
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>

<style>
  .deck {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-height: 0;
    height: 100%;
    color: var(--color-cream);
    font-family: var(--font-narrative);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(191, 161, 74, 0.4) transparent;
  }

  .body::-webkit-scrollbar {
    width: 5px;
  }

  .body::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .body::-webkit-scrollbar-track {
    background: transparent;
  }

  .body::-webkit-scrollbar-thumb {
    background: rgba(191, 161, 74, 0.4);
    border-radius: 3px;
  }

  .body::-webkit-scrollbar-thumb:hover {
    background: rgba(191, 161, 74, 0.6);
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .compact-bar {
    flex-direction: row;
    align-items: center;
    gap: 0;
    height: var(--editor-align-bar, 2.5rem);
    min-height: var(--editor-align-bar, 2.5rem);
    box-sizing: border-box;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-golden);
  }

  .name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-cream);
  }

  .compact-bar .name {
    font-size: 0.95rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name-input {
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0.2rem 0.45rem;
    background: rgba(10, 16, 24, 0.55);
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    color: var(--color-cream);
    font: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--color-golden);
  }

  .name-input::placeholder {
    color: var(--color-muted-label);
    font-weight: 500;
  }

  .meta,
  .empty-section {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .empty-section {
    color: var(--color-muted-label);
  }

  .colors {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.15rem;
  }

  .color-indicator {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid var(--color-golden);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .section-title {
    margin: 0;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--color-golden);
  }

  .count {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
    color: var(--color-muted-label);
  }

  .count.bad {
    color: #7a2e22;
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
