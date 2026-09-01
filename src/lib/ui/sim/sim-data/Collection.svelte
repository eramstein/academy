<script lang="ts">
  import {
    CardColor,
    CardType,
    isLandCard,
    isUnitCard,
    type CardTemplate,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath, getCardImagePath } from '@/lib/_utils/asset-paths';

  interface GroupedCard {
    card: CardTemplate;
    count: number;
  }

  const collection = $derived(gs.player.collection);

  const lands = $derived(collection.filter(isLandCard));
  const cards = $derived(collection.filter((card) => !isLandCard(card)));
  const groupedLands = $derived(groupCards(lands));
  const groupedCards = $derived(groupCards(cards));

  function groupKey(card: CardTemplate): string {
    const colors = card.colors.map((c) => `${c.color}:${c.count}`).join(',');
    if (isUnitCard(card)) {
      return `${card.name}|${card.type}|${card.cost}|${card.power}|${card.maxHealth}|${colors}|${JSON.stringify(card.keywords ?? {})}`;
    }
    if (isLandCard(card)) {
      return `${card.name}|${card.type}|${card.health}|${colors}`;
    }
    return `${card.name}|${card.type}|${card.cost}|${colors}`;
  }

  function groupCards(list: CardTemplate[]): GroupedCard[] {
    const grouped = new Map<string, GroupedCard>();
    for (const card of list) {
      const key = groupKey(card);
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(key, { card, count: 1 });
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
</script>

<div class="collection">
  {#if collection.length === 0}
    <p class="empty">Your collection is empty.</p>
  {:else}
    <p class="meta">{cards.length} cards · {lands.length} lands</p>

    {#if groupedLands.length > 0}
      <section class="section">
        <h3 class="section-title">Lands</h3>
        <ul class="card-list">
          {#each groupedLands as { card, count } (groupKey(card))}
            <li class="card-row">
              <div
                class="thumb"
                style="background-image: url('{getCardImagePath(card.imageFileName)}')"
              ></div>
              <div class="card-info">
                <span class="card-name">{card.name}</span>
                <span class="card-stats">{cardStats(card)}</span>
              </div>
              <div class="colors">
                {#each card.colors as colorInfo (colorInfo.color)}
                  {#each Array(colorInfo.count) as _, i (`${colorInfo.color}-${i}`)}
                    <div
                      class="color-indicator"
                      style="background-image: url('{colorPath(colorInfo.color)}')"
                      title={colorInfo.color}
                    ></div>
                  {/each}
                {/each}
              </div>
              <span class="count">×{count}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if groupedCards.length > 0}
      <section class="section">
        <h3 class="section-title">Cards</h3>
        <ul class="card-list">
          {#each groupedCards as { card, count } (groupKey(card))}
            <li class="card-row">
              <div
                class="thumb"
                style="background-image: url('{getCardImagePath(card.imageFileName)}')"
              ></div>
              <div class="card-info">
                <span class="card-name">{card.name}</span>
                <span class="card-stats">{card.cost} · {cardStats(card)}</span>
              </div>
              <div class="colors">
                {#each card.colors as colorInfo (colorInfo.color)}
                  {#each Array(colorInfo.count) as _, i (`${colorInfo.color}-${i}`)}
                    <div
                      class="color-indicator"
                      style="background-image: url('{colorPath(colorInfo.color)}')"
                      title={colorInfo.color}
                    ></div>
                  {/each}
                {/each}
              </div>
              <span class="count">×{count}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .collection {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: #e8e8e8;
  }

  .empty,
  .meta {
    margin: 0;
    font-size: 0.9rem;
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }

  .empty {
    color: #888888;
    font-size: 0.95rem;
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

  .colors {
    display: flex;
    flex-shrink: 0;
    gap: 0.15rem;
  }

  .color-indicator {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .count {
    flex-shrink: 0;
    min-width: 1.75rem;
    text-align: right;
    font-size: 0.9rem;
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }
</style>
