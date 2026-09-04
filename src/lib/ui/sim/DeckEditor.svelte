<script lang="ts">
  import { isLandCard, type CardTemplate } from '@/lib/_model';
  import type { Deck as DeckModel } from '@/lib/_model/model-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { showToast, uiState } from '@/lib/_state/state-ui.svelte';
  import { untrack } from 'svelte';
  import DeckView from './Deck.svelte';
  import Collection from './sim-data/Collection.svelte';

  const REQUIRED_LANDS = 4;
  const MIN_CARDS = 16;

  let draft = $state<DeckModel | null>(null);
  let isNew = $state(false);

  const visible = $derived(uiState.deckEditor.visible);
  const selectedIds = $derived(
    new Set(draft ? [...draft.cards, ...draft.lands].map((card) => card.id) : [])
  );
  const landsOk = $derived(draft !== null && draft.lands.length === REQUIRED_LANDS);
  const cardsOk = $derived(draft !== null && draft.cards.length >= MIN_CARDS);
  const nameOk = $derived(draft !== null && draft.name.trim().length > 0);
  const canSave = $derived(landsOk && cardsOk && nameOk);

  $effect(() => {
    if (!uiState.deckEditor.visible) {
      draft = null;
      return;
    }

    const deckKey = uiState.deckEditor.deckKey;

    untrack(() => {
      if (deckKey) {
        const existing = gs.player.decks.find((deck) => deck.key === deckKey);
        if (!existing) {
          close();
          return;
        }
        isNew = false;
        draft = {
          key: existing.key,
          name: existing.name,
          cards: [...existing.cards],
          lands: [...existing.lands],
        };
        return;
      }

      isNew = true;
      draft = {
        key: `deck_${crypto.randomUUID()}`,
        name: 'New Deck',
        cards: [],
        lands: [],
      };
    });
  });

  function close() {
    uiState.deckEditor.visible = false;
    uiState.deckEditor.deckKey = null;
  }

  function addCard(card: CardTemplate) {
    if (!draft) return;
    if (selectedIds.has(card.id)) return;

    if (isLandCard(card)) {
      if (draft.lands.length >= REQUIRED_LANDS) {
        showToast(`Decks need exactly ${REQUIRED_LANDS} lands.`, 'warning');
        return;
      }
      draft.lands = [...draft.lands, card];
      return;
    }

    draft.cards = [...draft.cards, card];
  }

  function removeCard(card: CardTemplate) {
    if (!draft) return;
    if (isLandCard(card)) {
      draft.lands = draft.lands.filter((c) => c.id !== card.id);
      return;
    }
    draft.cards = draft.cards.filter((c) => c.id !== card.id);
  }

  function save() {
    if (!draft || !canSave) return;

    const saved: DeckModel = {
      key: draft.key,
      name: draft.name.trim(),
      cards: [...draft.cards],
      lands: [...draft.lands],
    };

    if (isNew) {
      gs.player.decks.push(saved);
    } else {
      const index = gs.player.decks.findIndex((deck) => deck.key === saved.key);
      if (index === -1) {
        return;
      }
      gs.player.decks[index] = saved;
    }

    close();
  }
</script>

{#if visible && draft}
  <div class="deck-editor">
    <header class="toolbar">
      <div class="toolbar-left">
        <button type="button" class="btn" onclick={close}>Cancel</button>
        <h1 class="title">{isNew ? 'Create deck' : 'Edit deck'}</h1>
      </div>

      <div class="toolbar-right">
        <button type="button" class="btn primary" disabled={!canSave} onclick={save}>Save</button>
      </div>
    </header>

    <div class="panels">
      <section class="panel">
        <h2 class="panel-title">Collection</h2>
        <div class="panel-body">
          <Collection onSelect={addCard} {selectedIds} />
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Deck</h2>
        <div class="panel-body">
          <DeckView
            deck={draft}
            onCardClick={removeCard}
            onNameChange={(name) => {
              if (draft) draft.name = name;
            }}
            compact
            requiredLands={REQUIRED_LANDS}
            minCards={MIN_CARDS}
          />
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  .deck-editor {
    --editor-align-bar: 2.5rem;
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: white;
  }

  .toolbar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .btn {
    padding: 0.45rem 0.85rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #cccccc;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  .btn.primary {
    background: rgba(255, 255, 255, 0.14);
    color: white;
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .panels {
    flex: 1 1 auto;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  .panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: 0.5rem 0.65rem 0.65rem;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .panel:last-child {
    border-right: none;
  }

  .panel-title {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #cccccc;
  }

  .panel-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-body > :global(*) {
    flex: 1 1 auto;
    min-height: 0;
  }
</style>
