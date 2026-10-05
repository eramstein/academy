<script lang="ts">
  import type { Player } from '@lib/_model';
  import { uiState } from '@lib/_state/state-ui.svelte';
  import { getCardImagePath } from '@lib/_utils/asset-paths';
  import Tooltip from '../Tooltip.svelte';

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
    width: 92px;
    height: 126px;
    transition: opacity 0.3s ease;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 6px;
    border: 1px solid rgba(232, 210, 160, 0.3);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.14),
      0 4px 0 #1a120c,
      0 8px 10px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .graveyard-card:hover {
    opacity: 1;
  }

  .empty-graveyard {
    width: 92px;
    height: 126px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dotted-border {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(214, 184, 120, 0.28);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.16) 100%);
    box-shadow:
      inset 0 5px 10px rgba(0, 0, 0, 0.5),
      inset 0 -1px 0 rgba(255, 255, 255, 0.05),
      0 1px 0 rgba(255, 255, 255, 0.04);
    transition:
      background 0.3s ease,
      border-color 0.3s ease;
  }

  .dotted-border:hover {
    border-color: rgba(232, 208, 150, 0.5);
  }

  .placeholder-text {
    color: rgba(240, 230, 200, 0.38);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
  }
</style>
