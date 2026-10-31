<script lang="ts">
  import type { Card, Player } from '@lib/_model';
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

  // While a spell/ability animates targeting a card here, lift that card onto the pile.
  // Match by graveyard membership — dead units still have hasAttacked/position.
  let targetedCards = $derived.by(() => {
    const t = uiState.battle.playedSpellTargets;
    if (!t) return [] as Card[];
    const byId = new Map(player.graveyard.map((c) => [c.instanceId, c]));
    const out: Card[] = [];
    const seen = new Set<string>();
    for (const action of t) {
      for (const effectGroup of action) {
        for (const target of effectGroup as unknown[]) {
          if (!target || typeof target !== 'object' || !('instanceId' in target)) continue;
          const id = (target as Card).instanceId;
          const card = byId.get(id);
          if (card && !seen.has(id)) {
            seen.add(id);
            out.push(card);
          }
        }
      }
    }
    return out;
  });

  let targetedCard = $derived(targetedCards[0] ?? null);
  let isSpellTarget = $derived(targetedCards.length > 0);
  let underCard = $derived(
    isSpellTarget && topCard && targetedCard && topCard.instanceId !== targetedCard.instanceId
      ? topCard
      : null
  );

  let underCardImagePath = $derived(underCard ? getCardImagePath(underCard.imageFileName) : '');
  let faceCard = $derived(targetedCard ?? topCard);
  let faceCardImagePath = $derived(faceCard ? getCardImagePath(faceCard.imageFileName) : '');

  function handleGraveyardClick() {
    uiState.battle.graveyardModal.visible = true;
    uiState.battle.graveyardModal.playerId = player.id;
  }
</script>

<Tooltip content="{player.graveyard.length} cards in graveyard" show={isHovered} placement="bottom">
  <div
    class="graveyard-container"
    class:spell-target={isSpellTarget}
    data-graveyard-player-id={player.id}
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
    onclick={handleGraveyardClick}
  >
    {#if faceCard}
      <div class="graveyard-stack">
        {#if underCard}
          <div
            class="graveyard-card under"
            style="background-image: url('{underCardImagePath}');"
            aria-hidden="true"
          ></div>
        {/if}
        <div
          class="graveyard-card"
          class:lifted={isSpellTarget}
          style="background-image: url('{faceCardImagePath}');"
        ></div>
      </div>
    {:else}
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

  .graveyard-container.spell-target {
    z-index: 20;
  }

  .graveyard-stack {
    position: relative;
    width: 92px;
    height: 126px;
  }

  .graveyard-card {
    width: 92px;
    height: 126px;
    transition:
      opacity 0.3s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
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

  .graveyard-card.under {
    position: absolute;
    inset: 0;
    opacity: 0.75;
    transform: translate(5px, 6px) rotate(2deg);
    z-index: 0;
  }

  .graveyard-card.lifted {
    position: relative;
    z-index: 2;
    transform: translateY(-10px) scale(1.06);
    box-shadow:
      0 0 0 2px #1a120c,
      0 0 0 5px #f1c40f,
      0 10px 18px rgba(0, 0, 0, 0.55),
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
