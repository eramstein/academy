<script lang="ts">
  import { CARD_WIDTH } from '@lib/_config/ui-config';
  import type { Player } from '@lib/_model';
  import { getCardBackImagePath } from '@lib/_utils/asset-paths';
  import Card from './Card.svelte';

  let { player }: { player: Player } = $props();

  // Track previous hand size to detect new cards
  let previousHandIds = $state<string[]>([]);
  let newCardIds = $state<string[]>([]);

  function arraysShallowEqual(a: string[], b: string[]) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Effect to detect new cards when hand changes
  $effect(() => {
    const currentHandIds = player.hand.map((c) => c.instanceId);
    const addedIds = currentHandIds.filter((id) => !previousHandIds.includes(id));
    if (addedIds.length > 0) {
      newCardIds = [...new Set([...newCardIds, ...addedIds])];
      setTimeout(() => {
        newCardIds = newCardIds.filter((id) => !addedIds.includes(id));
      }, 750);
    }
    if (!arraysShallowEqual(previousHandIds, currentHandIds)) {
      previousHandIds = currentHandIds;
    }
  });

  // Calculate overlap based on number of cards
  function calculateOverlap() {
    const cardWidth = CARD_WIDTH; // Use shared constant
    const availableWidth = 588;
    const numCards = player.hand.length;

    if (numCards <= 1) return 0;

    // Calculate how much overlap is needed
    const totalCardWidth = numCards * cardWidth;
    const overlapNeeded = totalCardWidth - availableWidth;
    return Math.max(0, overlapNeeded / (numCards - 1));
  }
</script>

<div class="hand" class:player-hand={player.isPlayer}>
  {#each player.hand as card, index (card.instanceId)}
    <div
      class="card-wrapper"
      class:new-card={newCardIds.includes(card.instanceId)}
      style="margin-left: {index === 0 ? 0 : -calculateOverlap()}px;"
    >
      {#if player.isPlayer}
        <Card {card} />
      {:else}
        <div class="gray-card" style="background-image: url('{getCardBackImagePath()}');"></div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .hand {
    position: relative;
    display: flex;
    gap: 0;
    box-sizing: border-box;
    padding: 0 16px 0.4rem;
    overflow: visible;
    min-height: 200px;
    align-items: flex-end;
    /* Opponent hand: pack toward the end-turn button (left). */
    justify-content: flex-start;
    width: 620px;
  }

  /* Player hand: pack toward the end-turn button (right). */
  .hand.player-hand {
    justify-content: flex-end;
  }

  .hand::after {
    content: '';
    position: absolute;
    left: 12%;
    right: 12%;
    bottom: 2px;
    height: 18px;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.5), transparent 72%);
    pointer-events: none;
    z-index: 0;
  }

  .hand::-webkit-scrollbar {
    height: 8px;
  }

  .hand::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .hand::-webkit-scrollbar-thumb {
    background: #bfa14a;
    border-radius: 4px;
  }

  .hand::-webkit-scrollbar-thumb:hover {
    background: #d4b85a;
  }

  .card-wrapper {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }

  /* Only apply hover effects and transitions to player hands. */
  .hand.player-hand .card-wrapper {
    transition:
      margin-left 0.2s ease,
      margin-top 0.2s ease;
  }

  .hand.player-hand .card-wrapper:hover {
    margin-left: -10px !important;
    margin-top: -14px !important;
    z-index: 10;
  }

  /* When a card is hovered, only shift the immediately adjacent card to the right */
  .hand.player-hand .card-wrapper:hover + .card-wrapper {
    margin-left: -5px !important;
  }

  /* New card highlight animation */
  .hand.player-hand .card-wrapper.new-card {
    animation: newCardHighlight 0.75s ease-in;
    z-index: 20;
    position: relative;
  }

  @keyframes newCardHighlight {
    0% {
      transform: scale(1.5) translateY(-40px);
      box-shadow: 0 0 30px rgba(191, 161, 74, 0.9);
    }
    100% {
      transform: scale(1) translateY(0);
      box-shadow: none;
    }
  }

  /* Ensure cards don't shrink too much */
  .hand :global(.card) {
    flex-shrink: 0;
  }

  .gray-card {
    width: var(--card-width, 180px);
    height: var(--card-height, 240px);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 10px;
    border: 1px solid rgba(232, 210, 160, 0.3);
    flex-shrink: 0;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.14),
      0 3px 0 #1a120c,
      0 8px 12px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      inset 0 -10px 14px rgba(0, 0, 0, 0.35);
  }
</style>
