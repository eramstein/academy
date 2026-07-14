<script lang="ts">
  import type { Land } from '@lib/_model';
  import { TargetType } from '@lib/_model';
  import { bs, uiState } from '@lib/_state';
  import { getLandImagePath } from '@lib/_utils/asset-paths';
  import { attackLand } from '@lib/battle/combat';
  import { isHumanPlayer, usePlayerColorAbility } from '@lib/battle/player';
  import { clearSelections, setUnitsTargets } from '@lib/ui/_helpers/selections';
  import { activateAbility, targetLand } from '@lib/ui/_helpers/targetting';
  import Abilities from './Abilities.svelte';

  let { land }: { land: Land } = $props();

  let imagePath = $derived(getLandImagePath(land.imageFileName));
  let isValidTarget = $derived(uiState.battle.validTargets?.lands?.[land.instanceId] === true);

  // Check if this land should show the color increment animation
  let showColorAnimation = $derived(() => {
    const colorBeingIncremented = uiState.battle.colorBeingIncremented;
    if (!colorBeingIncremented) return false;

    // Only show animation if the land owner is the current player
    if (
      (bs.isPlayersTurn && land.ownerPlayerId !== bs.players[0].id) ||
      (!bs.isPlayersTurn && land.ownerPlayerId !== bs.players[1].id)
    )
      return false;

    // Check if this land has the color that's being incremented
    return land.colors.some((c) => c.color === colorBeingIncremented);
  });

  // Check if this land should show the golden border (ability available)
  let showGoldenBorder = $derived(() => {
    // Only show for player's lands when ability is not used
    return land.ownerPlayerId === 0 && !bs.players[0].abilityUsed;
  });

  function handleLandClick() {
    const selectedUnit = uiState.battle.selectedUnit;
    // case targetting land
    if (
      uiState.battle.targetBeingSelected &&
      uiState.battle.targetBeingSelected.type === TargetType.Land
    ) {
      targetLand(land);
      return;
    }
    // case attacking land
    if (selectedUnit && isValidTarget) {
      attackLand(selectedUnit, land);
      if (selectedUnit.keywords?.moveAndAttack && !selectedUnit.hasMoved) {
        setUnitsTargets(selectedUnit);
      } else {
        clearSelections();
      }
      return;
    }
    // case activating land
    if (land.abilities?.length) {
      activateAbility(land, land.abilities[0]);
    }
    // case using color ability
    if (land.colors[0] && isHumanPlayer(land.ownerPlayerId)) {
      usePlayerColorAbility(bs.players[land.ownerPlayerId], land.colors[0].color);
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    uiState.cardFullOverlay.visible = true;
    uiState.cardFullOverlay.card = land;
  }
</script>

<div
  class="land {isValidTarget ? 'valid-target' : ''} {showColorAnimation()
    ? 'color-increment'
    : ''} {showGoldenBorder() ? 'ability-available' : ''} {land.isRuined ? 'ruined' : ''}"
  style="background-image: url('{imagePath}')"
  data-land-instance-id={land.instanceId}
  onclick={handleLandClick}
  oncontextmenu={handleContextMenu}
>
  {#if !land.isRuined}
    <div class="land-stats">
      {#if land.retaliate && land.retaliate > 0}
        <div class="retaliate retaliate-bg">{land.retaliate}</div>
      {/if}
      <div class="health">{land.health}</div>
    </div>
  {/if}
  {#if land.abilities && land.abilities.length > 0}
    <div class="abilities-container">
      <Abilities abilities={land.abilities} />
    </div>
  {/if}
</div>

<style>
  .land {
    position: relative;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 2px solid #333;
    border-radius: 8px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
  }

  .land.valid-target {
    border: 2px solid #ff0000;
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.5);
  }

  .health {
    background: url('/assets/images/health-icon.png') center/cover no-repeat;
    color: white;
    padding: 0;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    min-width: 0;
    width: 28px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-bottom: 3px;
  }

  .land-stats {
    position: absolute;
    bottom: 4px;
    left: 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .retaliate {
    background: rgba(19, 16, 16, 0.8);
    color: white;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.9rem;
    text-shadow: 0 1px 2px #000;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px solid #bfa14a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    padding-bottom: 2px;
  }

  .retaliate.retaliate-bg {
    background: url('/assets/images/retaliate-icon.png') center/contain no-repeat;
    border: none;
    box-shadow: none;
    width: 34px;
    height: 32px;
    transform: translateX(-3px);
  }

  .land.ability-available {
    border: 2px solid var(--color-golden);
    box-shadow: 0 0 8px rgba(191, 161, 74, 0.3);
  }

  .land.color-increment {
    animation: colorIncrementPulse 0.3s ease-in-out;
  }

  .land.ruined {
    filter: grayscale(1);
  }

  @keyframes colorIncrementPulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 20px 5px rgba(255, 215, 0, 0.8);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
    }
  }

  .abilities-container {
    position: absolute;
    top: 8px;
    right: 4px;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .land:hover .abilities-container {
    opacity: 1;
  }
</style>
