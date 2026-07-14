<script lang="ts">
  import { bs } from '@lib/_state';
  import { uiState } from '@lib/_state/state-ui.svelte';
  import { getTableImagePath } from '@lib/_utils/asset-paths';
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

  // Derived value to check if game is won
  let gameWon = $derived(bs.playerIdWon !== null);
  let winningPlayer = $derived(gameWon ? bs.players[bs.playerIdWon!] : null);

  // ref to measure the floating card center for arrows
  let playedCardEl: HTMLElement | null = $state(null);
</script>

<div class="battle" style="background-image: url('{getTableImagePath()}');">
  <div class="top-section">
    <div class="player-turn-area">
      <button
        class="chip-btn end-turn-btn"
        class:disabled={!bs.isPlayersTurn}
        onclick={handleEndTurn}
        disabled={!bs.isPlayersTurn}
      >
        <span>End<br />Turn</span>
      </button>
      <Player player={bs.players[0]} />
    </div>
    <Board />
    <Player player={bs.players[1]} />
  </div>
  <div class="bottom-section">
    <div class="hands-container">
      <Hand player={bs.players[0]} />
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
    overflow: hidden;
  }

  .top-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    width: 100%;
    margin-bottom: 1rem;
  }

  .player-turn-area {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chip-btn {
    background: url('/assets/images/wood_chip_base.png') center/cover no-repeat;
    border: 1px solid rgba(0, 0, 0, 0.4);
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow:
      0 4px 0px #3a221f,
      0 8px 12px rgba(0, 0, 0, 0.5);
    position: relative;

    /* Text styling */
    color: #2a110a; /* Dark brown ink */
    font-family: inherit;
    font-weight: 800;
    line-height: 1.1;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.3);
  }

  .chip-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    box-shadow:
      inset 0 2px 5px rgba(255, 255, 255, 0.3),
      inset 0 -5px 8px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .end-turn-btn {
    width: 72px;
    height: 72px;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .chip-btn:not(:disabled):hover {
    filter: brightness(1.1);
    box-shadow:
      0 6px 0px #3a221f,
      0 10px 15px rgba(0, 0, 0, 0.4);
  }

  .chip-btn:not(:disabled):active {
    transform: translateY(4px);
    box-shadow:
      0 0px 0px #3a221f,
      0 2px 6px rgba(0, 0, 0, 0.4);
  }

  .chip-btn.disabled,
  .chip-btn:disabled {
    cursor: not-allowed;
    filter: grayscale(80%) brightness(0.8);
    box-shadow:
      0 2px 0px #1a1a1a,
      0 4px 6px rgba(0, 0, 0, 0.4);
    color: #777;
    text-shadow: none;
  }

  .bottom-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 0;
  }

  .hands-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    padding: 0 2rem;
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
