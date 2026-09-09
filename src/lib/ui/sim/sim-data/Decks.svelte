<script lang="ts">
  import { type Deck as DeckModel } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import Deck from '../Deck.svelte';

  let selected: DeckModel | null = $state(null);

  const decks = $derived(gs.player.decks);

  $effect(() => {
    if (selected && !decks.includes(selected)) {
      const stillThere = decks.find((deck) => deck.key === selected?.key);
      selected = stillThere ?? null;
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

  function openCreate() {
    uiState.deckEditor.deckKey = null;
    uiState.deckEditor.visible = true;
  }

  function openEdit(deck: DeckModel) {
    uiState.deckEditor.deckKey = deck.key;
    uiState.deckEditor.visible = true;
  }
</script>

<div class="decks">
  {#if selected}
    <div class="detail-actions">
      <button type="button" class="back-btn" onclick={() => (selected = null)}>Back</button>
      <button type="button" class="edit-btn" onclick={() => selected && openEdit(selected)}>Edit</button>
    </div>
    <Deck deck={selected} />
  {:else}
    <div class="list-header">
      <button type="button" class="create-btn" onclick={openCreate}>New deck</button>
    </div>
    {#if decks.length === 0}
      <p class="empty">You don't own any decks yet.</p>
    {:else}
      <ul class="deck-list">
        {#each decks as deck, i (deck.key + '-' + i)}
          <li>
            <div class="deck-row">
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
              <button type="button" class="row-edit" onclick={() => openEdit(deck)}>Edit</button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .decks {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: var(--color-cream);
    font-family: var(--font-narrative);
  }

  .list-header,
  .detail-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .detail-actions {
    justify-content: space-between;
  }

  .empty {
    margin: 0;
    font-size: 0.95rem;
    color: var(--color-muted-label);
  }

  .back-btn,
  .edit-btn,
  .create-btn,
  .row-edit {
    padding: 0.4rem 0.75rem;
    background: var(--color-data);
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back-btn:hover,
  .edit-btn:hover,
  .create-btn:hover,
  .row-edit:hover {
    background: var(--color-data-hover);
    border-color: var(--color-golden);
    color: var(--color-cream);
  }

  .create-btn,
  .edit-btn {
    background: var(--color-data);
    color: var(--color-cream);
    border-color: var(--color-golden);
  }

  .deck-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .deck-row {
    display: flex;
    gap: 0.35rem;
    align-items: stretch;
  }

  .deck-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.55rem 0.65rem;
    background: transparent;
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .deck-item:hover {
    background: rgba(191, 161, 74, 0.1);
    border-color: var(--color-golden);
  }

  .row-edit {
    flex-shrink: 0;
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
    color: var(--color-cream);
  }

  .deck-meta {
    font-size: 0.8rem;
    color: var(--color-muted-label);
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
    border: 1px solid var(--color-golden);
  }
</style>
