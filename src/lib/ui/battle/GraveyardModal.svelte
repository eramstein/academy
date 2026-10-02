<script lang="ts">
  import type { Card as BattleCard } from '@/lib/_model';
  import { TargetType } from '@/lib/_model/enums-battle';
  import { CARD_WIDTH } from '@lib/_config/ui-config';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { bs } from '@lib/_state';
  import { uiState } from '@lib/_state/state-ui.svelte';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import { targetCard } from '@lib/ui/_helpers/targetting';
  import Card from './Card.svelte';

  let player = $derived(
    uiState.battle.graveyardModal.playerId !== null
      ? bs.players[uiState.battle.graveyardModal.playerId]
      : null
  );

  let graveyardCards = $derived(player?.graveyard || []);

  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');

  $effect(() => {
    if (uiState.battle.targetBeingSelected?.type === TargetType.GraveyardCard) {
      const currentPlayer = bs.isPlayersTurn ? bs.players[0] : bs.players[1];
      if (currentPlayer) {
        uiState.battle.graveyardModal.visible = true;
        uiState.battle.graveyardModal.playerId = currentPlayer.id;
      }
    }
  });

  $effect(() => {
    if (!uiState.battle.targetBeingSelected) {
      uiState.battle.graveyardModal.visible = false;
      uiState.battle.graveyardModal.playerId = null;
    }
  });

  function closeModal() {
    uiState.battle.graveyardModal.visible = false;
    uiState.battle.graveyardModal.playerId = null;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeModal();
  }

  function selectCard(card: BattleCard) {
    targetCard(card);
    closeModal();
  }

  $effect(() => {
    if (!uiState.battle.graveyardModal.visible) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

{#if uiState.battle.graveyardModal.visible && player}
  <div class="overlay" role="presentation" onclick={handleBackdropClick}>
    <div
      class="frame"
      role="dialog"
      aria-modal="true"
      aria-labelledby="graveyard-title"
      style="--table: url('{tablePath}'); --parchment: url('{parchmentPath}'); --card-col: {CARD_WIDTH}px"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="panel">
        <header class="heading">
          <h2 id="graveyard-title" class="title">
            <span class="star" aria-hidden="true"></span>
            {player.name}'s Graveyard
            <span class="star" aria-hidden="true"></span>
          </h2>
          <p class="subtitle">
            {graveyardCards.length}
            {graveyardCards.length === 1 ? 'card' : 'cards'}
          </p>
        </header>

        <div class="body">
          {#if graveyardCards.length === 0}
            <p class="empty">The graveyard is empty.</p>
          {:else}
            <div class="cards-grid">
              {#each graveyardCards as card (card.id)}
                <div class="card-wrapper" onclick={() => selectCard(card)}>
                  <Card {card} displayKeywords={true} inHand={false} />
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <footer class="actions">
        <OrnateButton icon="arrow-left" onclick={closeModal}>Close</OrnateButton>
      </footer>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .frame {
    position: relative;
    /* 6 cards + gaps + panel/frame padding + scrollbar */
    width: min(calc(6 * var(--card-col) + 5 * 0.75rem + 72px), calc(100vw - 48px));
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    padding: 10px 10px 8px;
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .panel {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: var(--color-ink);
    padding: 16px 20px 18px;
    box-sizing: border-box;
    font-family: var(--font-narrative);
    border-radius: 3px;
    box-shadow: inset 0 0 28px rgba(90, 75, 60, 0.12);
    overflow-x: hidden;
  }

  .heading {
    flex: 0 0 auto;
    margin-bottom: 12px;
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink);
    text-align: center;
  }

  .star {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    background: #4a3f32;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .subtitle {
    margin: 4px 0 0;
    text-align: center;
    font-size: 0.95rem;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .empty {
    margin: 2rem 0;
    text-align: center;
    font-size: 1.05rem;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(6, var(--card-col));
    gap: 0.75rem;
    justify-content: center;
    justify-items: center;
    max-height: min(70vh, 640px);
    overflow-x: hidden;
    overflow-y: auto;
    padding: 4px 6px 8px;
    width: 100%;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
  }

  .cards-grid::-webkit-scrollbar {
    width: 6px;
  }

  .cards-grid::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .cards-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .cards-grid::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.4);
    border-radius: 3px;
  }

  .cards-grid::-webkit-scrollbar-thumb:hover {
    background: rgba(90, 75, 60, 0.6);
  }

  .card-wrapper {
    display: flex;
    justify-content: center;
    width: var(--card-col);
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 8px;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease;
  }

  .card-wrapper:hover,
  .card-wrapper:focus-visible {
    transform: translateY(-6px);
    box-shadow:
      0 4px 8px rgba(44, 37, 29, 0.22),
      0 12px 22px rgba(44, 37, 29, 0.32);
    outline: none;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 3.2rem;
    padding: 10px 8px 4px;
  }

  @media (max-width: 1400px) {
    .frame {
      width: min(calc(4 * var(--card-col) + 3 * 0.75rem + 72px), calc(100vw - 48px));
    }

    .cards-grid {
      grid-template-columns: repeat(4, var(--card-col));
    }
  }

  @media (max-width: 900px) {
    .frame {
      width: min(calc(3 * var(--card-col) + 2 * 0.75rem + 72px), calc(100vw - 48px));
    }

    .cards-grid {
      grid-template-columns: repeat(3, var(--card-col));
    }
  }

  @media (max-width: 768px) {
    .overlay {
      padding: 12px;
    }

    .frame {
      width: min(calc(2 * var(--card-col) + 0.75rem + 56px), calc(100vw - 24px));
      max-height: 94vh;
    }

    .cards-grid {
      grid-template-columns: repeat(2, var(--card-col));
      gap: 0.5rem;
      max-height: 60vh;
    }

    .title {
      font-size: 1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-wrapper {
      transition: none;
    }
  }
</style>
