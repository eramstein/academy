<script lang="ts">
  import type { Player } from '@lib/_model';
  import { uiState } from '@lib/_state/state-ui.svelte';
  import { getCardBackImagePath } from '@lib/_utils/asset-paths';
  import { isHumanPlayer } from '@lib/battle/player';
  import Tooltip from '../Tooltip.svelte';

  let { player }: { player: Player } = $props();

  // Number of cards to show in the stack (max 3 for visual effect)
  let stackSize = $derived(Math.min(player.deck.length, 3));

  // Show tooltip on hover
  let isHovered = $state(false);

  function handleDeckClick() {
    // Only show modal for human players
    if (isHumanPlayer(player.id)) {
      uiState.battle.deckModal.visible = true;
      uiState.battle.deckModal.playerId = player.id;
    }
  }
</script>

<Tooltip content="{player.deck.length} cards in deck" show={isHovered} placement="bottom">
  <div
    class="deck-container {isHumanPlayer(player.id) ? 'clickable' : ''}"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
    onclick={handleDeckClick}
  >
    <div class="deck-stack">
      {#each Array(stackSize) as _, index}
        <div
          class="card-back"
          style="z-index: {stackSize - index}; transform: translateY({index * 3}px);"
        >
          <img src={getCardBackImagePath()} alt="Card Back" class="card-image" />
        </div>
      {/each}
    </div>
  </div>
</Tooltip>

<style>
  .deck-container {
    position: relative;
    display: inline-block;
  }

  .deck-container.clickable {
    cursor: pointer;
  }

  .deck-stack {
    position: relative;
    width: 92px;
    height: 126px;
  }

  .deck-stack::after {
    content: '';
    position: absolute;
    left: 8%;
    right: 4%;
    bottom: -10px;
    height: 16px;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55), transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .card-back {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 6px;
    border: 1px solid rgba(232, 210, 160, 0.28);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.12),
      -2px 3px 0 #1a120c,
      -4px 7px 8px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
    transition: transform 0.3s ease;
  }

  .card-back:hover {
    transform: translateY(-8px) !important;
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.3),
      0 16px 32px rgba(0, 0, 0, 0.2),
      0 32px 64px rgba(0, 0, 0, 0.1);
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
  }
</style>
