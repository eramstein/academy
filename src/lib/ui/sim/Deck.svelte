<script lang="ts">
  import {
    CardColor,
    CardType,
    isUnitCard,
    type CardTemplate,
    type Deck as DeckModel,
  } from '@/lib/_model';
  import { getAssetPath, getCardImagePath } from '@/lib/_utils/asset-paths';

  let { deck }: { deck: DeckModel } = $props();

  interface GroupedCard {
    card: CardTemplate;
    count: number;
  }

  function groupCards(cards: CardTemplate[]): GroupedCard[] {
    const grouped = new Map<string, GroupedCard>();
    for (const card of cards) {
      const existing = grouped.get(card.id);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(card.id, { card, count: 1 });
      }
    }
    return [...grouped.values()].sort((a, b) => {
      if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
      return a.card.name.localeCompare(b.card.name);
    });
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  function cardStats(card: CardTemplate): string {
    if (isUnitCard(card)) return `${card.power}/${card.maxHealth}`;
    if (card.type === CardType.Land && 'health' in card) return `${card.health} HP`;
    return card.type;
  }

  const colors = $derived(
    [...new Set([...deck.cards, ...deck.lands].flatMap((c) => c.colors.map((col) => col.color)))],
  );
  const groupedCards = $derived(groupCards(deck.cards));
  const groupedLands = $derived(groupCards(deck.lands));
</script>

<div class="deck">
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

  <section class="section">
    <h3 class="section-title">Lands</h3>
    <ul class="card-list">
      {#each groupedLands as { card, count } (card.id)}
        <li class="card-row">
          <div class="thumb" style="background-image: url('{getCardImagePath(card.imageFileName)}')"></div>
          <div class="card-info">
            <span class="card-name">{card.name}</span>
            <span class="card-stats">{cardStats(card)}</span>
          </div>
          <span class="count">×{count}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="section">
    <h3 class="section-title">Cards</h3>
    <ul class="card-list">
      {#each groupedCards as { card, count } (card.id)}
        <li class="card-row">
          <div class="thumb" style="background-image: url('{getCardImagePath(card.imageFileName)}')"></div>
          <div class="card-info">
            <span class="card-name">{card.name}</span>
            <span class="card-stats">
              {card.cost} · {cardStats(card)}
            </span>
          </div>
          <span class="count">×{count}</span>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .deck {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: #e8e8e8;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.3;
    color: white;
  }

  .meta {
    margin: 0;
    font-size: 0.9rem;
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
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
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #cccccc;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .card-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .card-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  .thumb {
    flex: 0 0 48px;
    width: 48px;
    height: 36px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: rgba(0, 0, 0, 0.35);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .card-info {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  .card-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #e8e8e8;
  }

  .card-stats {
    font-size: 0.8rem;
    color: #888888;
    text-transform: capitalize;
    font-variant-numeric: tabular-nums;
  }

  .count {
    flex-shrink: 0;
    font-size: 0.9rem;
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }
</style>
