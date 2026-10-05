<script lang="ts">
  import { bs, gs } from '@lib/_state';
  import { uiState } from '@lib/_state/state-ui.svelte';
  import { getAssetPath, getBattleBackgroundPath } from '@lib/_utils/asset-paths';
  import { generateBattleGreeting } from '@/lib/llm/prompts';
  import { handleEndTurn } from '@lib/ui/_helpers/end-turn';
  import { fade, scale } from 'svelte/transition';
  import CardFull from '../cards/CardFull.svelte';
  import ModalHost from '../ModalHost.svelte';
  import Board from './Board.svelte';
  import ConfirmPopover from './ConfirmPopover.svelte';
  import DeckModal from './DeckModal.svelte';
  import DragPreview from './DragPreview.svelte';
  import GameWonModal from './GameWonModal.svelte';
  import GraveyardModal from './GraveyardModal.svelte';
  import Hand from './Hand.svelte';
  import Player from './Player.svelte';
  import SpellDimOverlay from './SpellDimOverlay.svelte';
  import SpellTargetArrows from './SpellTargetArrows.svelte';
  import TargetPrompt from './TargetPrompt.svelte';

  const endTurnButtonPath = getAssetPath('images/ui/decorations/end-button.png');

  // Derived value to check if game is won
  let gameWon = $derived(bs.playerIdWon !== null);
  let winningPlayer = $derived(gameWon ? bs.players[bs.playerIdWon!] : null);

  // ref to measure the floating card center for arrows
  let playedCardEl: HTMLElement | null = $state(null);

  let opponentGreeting: string | null = $state(null);
  let greetingHideTimer: ReturnType<typeof setTimeout> | undefined;

  const GREETING_DISPLAY_MS = 7_000;

  $effect(() => {
    const opponentKey = gs.ongoingBattle?.opponentKey;
    if (!opponentKey) return;

    let cancelled = false;

    void generateBattleGreeting(opponentKey)
      .then((text) => {
        if (cancelled || !text) return;
        opponentGreeting = text;
        greetingHideTimer = setTimeout(() => {
          opponentGreeting = null;
          greetingHideTimer = undefined;
        }, GREETING_DISPLAY_MS);
      })
      .catch((error) => {
        console.warn('Failed to generate battle greeting', error);
      });

    return () => {
      cancelled = true;
      if (greetingHideTimer) {
        clearTimeout(greetingHideTimer);
        greetingHideTimer = undefined;
      }
    };
  });

  function dismissGreeting() {
    if (greetingHideTimer) {
      clearTimeout(greetingHideTimer);
      greetingHideTimer = undefined;
    }
    opponentGreeting = null;
  }
</script>

<div class="battle" style="background-image: url('{getBattleBackgroundPath()}');">
  <div class="top-section">
    <Player player={bs.players[0]} />
    <Board />
    <Player
      player={bs.players[1]}
      greeting={opponentGreeting}
      onDismissGreeting={dismissGreeting}
    />
  </div>
  <div class="bottom-section">
    <div class="hands-container">
      <Hand player={bs.players[0]} />
      <button
        class="end-turn-btn"
        class:disabled={!bs.isPlayersTurn}
        onclick={handleEndTurn}
        disabled={!bs.isPlayersTurn}
        aria-label="End Turn"
      >
        <img src={endTurnButtonPath} alt="" draggable="false" />
      </button>
      <Hand player={bs.players[1]} />
    </div>
  </div>
  <ConfirmPopover />
</div>

<TargetPrompt />
<DragPreview />

{#if gameWon && winningPlayer}
  <GameWonModal {winningPlayer} />
{/if}

<GraveyardModal />
<DeckModal />
<ModalHost />

<!-- Briefly show the played spell card -->
{#if uiState.battle.playedSpell}
  <div
    class="played-spell-flash"
    aria-live="polite"
    in:fade={{ duration: 120 }}
    out:fade={{ duration: 150 }}
  >
    <div
      class="played-spell-card"
      onclick={(e) => e.stopPropagation()}
      in:scale={{ duration: 120, start: 0.9 }}
      out:scale={{ duration: 120, start: 1.0 }}
      bind:this={playedCardEl}
    >
      <CardFull card={uiState.battle.playedSpell} />
    </div>
  </div>
{/if}

{#if uiState.battle.playedSpell}
  <SpellDimOverlay sourceEl={playedCardEl} />
  <SpellTargetArrows sourceEl={playedCardEl} />
{/if}

<!-- CardFull overlay -->
{#if uiState.cardFullOverlay.visible && uiState.cardFullOverlay.card}
  <div class="card-full-overlay" onclick={() => (uiState.cardFullOverlay.visible = false)}>
    <div class="card-full-container" onclick={(e) => e.stopPropagation()}>
      <CardFull card={uiState.cardFullOverlay.card} />
      <button class="close-button" onclick={() => (uiState.cardFullOverlay.visible = false)}
        >×</button
      >
    </div>
  </div>
{/if}

<style>
  .battle {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
    overflow: auto;
  }

  /* Pool of light over the table, darker toward the props in the corners. */
  .battle::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 42%, transparent 42%, rgba(0, 0, 0, 0.42) 100%);
    z-index: 0;
  }

  .top-section,
  .bottom-section {
    position: relative;
    z-index: 1;
  }

  .top-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    width: max-content;
  }

  .end-turn-btn {
    position: relative;
    width: 96px;
    height: 96px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45));
    transition:
      transform 0.12s ease,
      filter 0.12s ease;
  }

  .end-turn-btn img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }

  .end-turn-btn:not(:disabled):hover {
    filter: brightness(1.08) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
  }

  .end-turn-btn:not(:disabled):active {
    transform: translateY(3px);
    filter: brightness(0.96) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
  }

  .end-turn-btn.disabled,
  .end-turn-btn:disabled {
    cursor: not-allowed;
    filter: grayscale(0.55) brightness(0.7) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
  }

  .bottom-section {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: max-content;
    max-width: 100%;
    flex-shrink: 0;
    gap: 0;
  }

  .hands-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: max-content;
    max-width: 100%;
    gap: 1.25rem;
  }

  .hands-container .end-turn-btn {
    flex-shrink: 0;
  }

  .card-full-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    min-height: 100vh;
    min-width: 100vw;
  }

  .card-full-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #333;
    color: white;
    border: 2px solid var(--color-golden);
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1001;
  }

  .close-button:hover {
    background: #555;
    transform: scale(1.1);
  }

  /* Played spell flash */
  .played-spell-flash {
    position: fixed;
    top: 40%;
    right: 20px;
    transform: translateY(-40%);
    z-index: 1002;
    pointer-events: none;
  }

  .played-spell-card {
    transform: scale(0.9);
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.6));
  }
</style>
