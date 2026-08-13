<script lang="ts">
  import { type Deck as DeckModel } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import Deck from '../Deck.svelte';

  let selected: DeckModel | null = $state(null);

  const decks = $derived(gs.player.decks);

  $effect(() => {
    if (selected && !decks.includes(selected)) {
      selected = null;
    }
  });

  function deckColors(deck: DeckModel): string[] {
    return [
      ...new Set([...deck.cards, ...deck.lands].flatMap((c) => c.colors.map((col) => col.color))),
    ];
  }

  function colorPath(color: string): string {
    return getAssetPath(`images/color_${color}.png`);
  }
</script>

<div class="decks">
  {#if selected}
    <button type="button" class="back-btn" onclick={() => (selected = null)}>Back</button>
    <Deck deck={selected} />
  {:else if decks.length === 0}
    <p class="empty">You don't own any decks yet.</p>
  {:else}
    <ul class="deck-list">
      {#each decks as deck, i (deck.key + '-' + i)}
        <li>
          <button type="button" class="deck-item" onclick={() => (selected = deck)}>
            <div class="deck-info">
              <span class="deck-name">{deck.name}</span>
              <span class="deck-meta">
                {deck.cards.length} cards · {deck.lands.length} lands
              </span>
            </div>
            <div class="colors">
              {#each deckColors(deck) as color (color)}
                <div
                  class="color-indicator"
                  style="background-image: url('{colorPath(color)}')"
                  title={color}
                ></div>
              {/each}
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .decks {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty {
    margin: 0;
    font-size: 0.95rem;
    color: #888888;
  }

  .back-btn {
    align-self: flex-start;
    padding: 0.4rem 0.75rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #cccccc;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  .deck-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .deck-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.55rem 0.65rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .deck-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .deck-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .deck-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #e8e8e8;
  }

  .deck-meta {
    font-size: 0.8rem;
    color: #888888;
    font-variant-numeric: tabular-nums;
  }

  .colors {
    display: flex;
    flex-shrink: 0;
    gap: 0.2rem;
  }

  .color-indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
</style>
