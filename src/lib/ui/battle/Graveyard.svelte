<script lang="ts">
  import type { Player } from '@lib/_model';
  import { uiState } from '@lib/_state/state-ui.svelte';
  import Tooltip from '../Tooltip.svelte';
  import { getCardImagePath } from '@lib/_utils/asset-paths';

  let { player }: { player: Player } = $props();

  // Show tooltip on hover
  let isHovered = $state(false);

  // Get the top card from graveyard (last card in the array)
  let topCard = $derived(
    player.graveyard.length > 0 ? player.graveyard[player.graveyard.length - 1] : null
  );

  // Create the background image path using the card id
  let cardImagePath = $derived(topCard ? getCardImagePath(topCard.imageFileName) : '');

  function handleGraveyardClick() {
    uiState.battle.graveyardModal.visible = true;
    uiState.battle.graveyardModal.playerId = player.id;
  }
</script>

<Tooltip content="{player.graveyard.length} cards in graveyard" show={isHovered} placement="bottom">
  <div
    class="graveyard-container"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
    onclick={handleGraveyardClick}
  >
    {#if topCard}
      <!-- Show the top card from graveyard -->
      <div class="graveyard-card" style="background-image: url('{cardImagePath}');"></div>
    {:else}
      <!-- Show empty dotted placeholder -->
      <div class="empty-graveyard">
        <div class="dotted-border">
          <div class="placeholder-text">Graveyard</div>
        </div>
      </div>
    {/if}
  </div>
</Tooltip>

<style>
  .graveyard-container {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .graveyard-card {
    width: 120px;
    height: 180px;
    transition: opacity 0.3s ease;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 8px;
    border: 2px solid #222;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.4),
      0 8px 16px rgba(0, 0, 0, 0.3);
  }

  .graveyard-card:hover {
    opacity: 1;
  }

  .empty-graveyard {
    width: 120px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dotted-border {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.2);
    box-shadow:
      inset 0 4px 10px rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.05);
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease;
  }

  .dotted-border:hover {
    border-color: rgba(0, 0, 0, 0.8);
    background-color: rgba(0, 0, 0, 0.3);
  }

  .placeholder-text {
    color: rgba(255, 255, 255, 0.3);
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
  }
</style>
