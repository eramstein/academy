<script lang="ts">
  import { CardColor } from '@/lib/_model/enums-battle';
  import type { Player } from '@lib/_model';
  import { uiState } from '@lib/_state';
  import { getAssetPath, getCharacterImagePath } from '@lib/_utils/asset-paths';
  import { attackPlayer } from '@lib/battle/combat';
  import { isHumanPlayer, usePlayerColorAbility } from '@lib/battle/player';
  import { clearSelections, setUnitsTargets } from '@lib/ui/_helpers/selections';
  import { fade } from 'svelte/transition';
  import Deck from './Deck.svelte';
  import Graveyard from './Graveyard.svelte';

  let {
    player,
    greeting = null,
    onDismissGreeting,
  }: {
    player: Player;
    greeting?: string | null;
    onDismissGreeting?: () => void;
  } = $props();

  // Convert player name to filename format (lowercase with underscores)
  let characterImageName = $derived(player.name.toLowerCase().replace(/\s+/g, '_'));

  // Create the image path
  let characterImagePath = $derived(getCharacterImagePath(characterImageName));

  // Helper function to get color image path
  function getColorImagePath(color: string): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  // Get available colors for the player
  let availableColors = $derived(Object.entries(player.colors || {}));

  // Check if this player is a valid target
  let isValidTarget = $derived(uiState.battle.validTargets?.players?.[player.id] === true);

  // Check if player has used their ability
  let hasUsedAbility = $derived(player.abilityUsed === true);

  // Check if this is a human player
  let isHuman = $derived(isHumanPlayer(player.id));

  function handlePlayerClick() {
    const selectedUnit = uiState.battle.selectedUnit;
    if (selectedUnit && isValidTarget) {
      attackPlayer(selectedUnit, player.id);
      if (selectedUnit.keywords?.moveAndAttack && !selectedUnit.hasMoved) {
        setUnitsTargets(selectedUnit);
      } else {
        clearSelections();
      }
    }
  }

  function handleColorClick(color: string) {
    if (!isHuman || hasUsedAbility) return;
    const cardColor = color as CardColor;
    usePlayerColorAbility(player, cardColor);
    // Trigger lightweight UI animation on click only
    clickIncrementActive = { ...clickIncrementActive, [color]: true };
    const localColor = color;
    clearTimeout(clickIncrementTimers[localColor]);
    clickIncrementTimers[localColor] = setTimeout(() => {
      clickIncrementActive = { ...clickIncrementActive, [localColor]: false };
    }, 800);
  }

  // Click-only animation state (avoids reactive effects)
  let clickIncrementActive = $state<Record<string, boolean>>({});
  let clickIncrementTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  // Life change animation (mirrors UnitDeployed pattern)
  let previousLife = $state(player.life);
  let lifeChangeAmount = $state(0);
  let lifeChangeType: 'inc' | 'dec' | null = $state(null);
  $effect(() => {
    const diff = player.life - previousLife;
    if (diff !== 0 && Number.isFinite(diff)) {
      lifeChangeAmount = Math.abs(diff);
      lifeChangeType = diff > 0 ? 'inc' : 'dec';
      setTimeout(() => {
        lifeChangeType = null;
      }, 900);
    }
    previousLife = player.life;
  });
</script>

<div class="player-container">
  <div class="portrait-wrap">
    {#if greeting}
      <button
        type="button"
        class="speech-bubble"
        aria-label="Dismiss greeting"
        onclick={(e) => {
          e.stopPropagation();
          onDismissGreeting?.();
        }}
        transition:fade={{ duration: 200 }}
      >
        <span class="speech-bubble-text">{greeting}</span>
        <span class="speech-bubble-tail" aria-hidden="true"></span>
      </button>
    {/if}

    <div
      class="player {isValidTarget ? 'valid-target' : ''}"
      data-player-id={player.id}
      onclick={handlePlayerClick}
    >
      <div class="player-info" style="background-image: url('{characterImagePath}')">
        <div class="mana-display">
          <div class="mana-value">{player.mana}</div>
        </div>
        <div
          class="life-display {lifeChangeType === 'inc' ? 'highlight-inc' : ''} {lifeChangeType ===
          'dec'
            ? 'highlight-dec'
            : ''}"
        >
          <span class="life-value">{player.life}</span>
          {#if lifeChangeType}
            <span class="life-float {lifeChangeType}"
              >{lifeChangeType === 'inc' ? '+' : '-'}{lifeChangeAmount}</span
            >
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="player-actions {isHuman && !hasUsedAbility ? 'abilities-available' : ''}">
    {#each availableColors as [color, count]}
      <div
        class="color-item {!isHuman || hasUsedAbility ? 'disabled' : ''}"
        data-color={color}
        onclick={() => handleColorClick(color)}
      >
        <div
          class="color-symbol {clickIncrementActive[color] ? 'increment' : ''}"
          style="background-image: url('{getColorImagePath(color)}')"
        >
          {#if clickIncrementActive[color]}
            <span class="float-plus">+1</span>
          {/if}
        </div>
        <span class="color-count">{count}</span>
      </div>
    {/each}
  </div>

  <div class="deck-section">
    <Deck {player} />
    <Graveyard {player} />
  </div>

  <div class="hand-count">
    Hand: {player.hand?.length || 0}
  </div>
</div>

<style>
  .player-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.5rem;
  }

  .portrait-wrap {
    position: relative;
  }

  /* Right-aligned so the bubble grows over the board, not past the viewport edge. */
  .speech-bubble {
    position: absolute;
    bottom: calc(100% + 0.35rem);
    right: 0;
    left: auto;
    z-index: 20;
    max-width: 480px;
    min-width: 280px;
    width: max-content;
    padding: 0.55rem 0.75rem 0.7rem;
    margin: 0;
    border: 2px solid #5a4b3c;
    border-radius: 14px;
    background: #f0e6c8;
    color: #2c251d;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    line-height: 1.35;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
    appearance: none;
  }

  .speech-bubble:hover {
    filter: brightness(1.03);
  }

  .speech-bubble-text {
    display: block;
  }

  .speech-bubble-tail {
    position: absolute;
    right: 90px;
    bottom: -10px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #f0e6c8;
    filter: drop-shadow(0 2px 0 #5a4b3c);
  }

  .player {
    padding: 6px;
    width: 200px;
    height: 200px;
    position: relative;
    box-sizing: border-box;
    border-radius: 8px;
    border: 1px solid rgba(232, 208, 150, 0.5);
    background: linear-gradient(165deg, #8d734c 0%, #3d2c1e 26%, #1c140f 68%, #110e0b 100%);
    box-shadow:
      0 12px 16px rgba(0, 0, 0, 0.5),
      0 3px 0 #1a120c,
      inset 0 1px 0 rgba(255, 230, 180, 0.5),
      inset 0 -3px 6px rgba(0, 0, 0, 0.45);
  }

  .player.valid-target {
    border-color: #ff5a4a;
    box-shadow:
      0 12px 16px rgba(0, 0, 0, 0.5),
      0 3px 0 #1a120c,
      inset 0 0 16px rgba(255, 40, 30, 0.45),
      0 0 12px rgba(255, 40, 30, 0.45);
    cursor: pointer;
  }

  .mana-display {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background: url('/assets/images/ui/decorations/mana-contour.png') center/contain no-repeat;
    padding: 0;
    border-radius: 50%;
    font-weight: bold;
    z-index: 3;
    width: 3rem;
    height: 3rem;
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.5));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .player-info {
    position: relative;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 8px;
    width: 100%;
    height: 100%;
  }

  .player-info::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 40%, rgba(0, 0, 0, 0.28) 100%);
    border-radius: 8px;
    z-index: 1;
  }

  .life-display {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: url('/assets/images/ui/icons/health-icon.png') center/cover no-repeat;
    color: white;
    padding: 0.4rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    z-index: 2;
    min-width: 2rem;
    text-align: center;
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.55));
  }

  .mana-value {
    font-size: 1.6rem;
    color: #184a76;
    line-height: 1;
    font-weight: 900;
    text-shadow:
      0 1px 2px rgba(0, 0, 0, 0.35),
      0 0 1px rgba(255, 255, 255, 0.35);
    margin-bottom: 0.3rem;
    margin-right: 0.1rem;
  }

  .life-value {
    color: white;
  }

  /* Life change highlight */
  .life-display.highlight-inc {
    box-shadow:
      0 0 14px rgba(46, 204, 113, 0.95),
      inset 0 0 10px rgba(46, 204, 113, 0.75);
    animation: life-pulse-inc 0.9s ease-out;
  }
  .life-display.highlight-dec {
    box-shadow:
      0 0 14px rgba(231, 76, 60, 0.95),
      inset 0 0 10px rgba(231, 76, 60, 0.75);
    animation: life-pulse-dec 0.9s ease-out;
  }

  /* Floating life delta near the badge; reuse float-up */
  .life-float {
    position: absolute;
    left: 50%;
    top: -0.8rem;
    transform: translateX(-50%);
    font-weight: 900;
    text-shadow:
      0 2px 6px rgba(0, 0, 0, 0.9),
      0 0 2px rgba(255, 255, 255, 0.9);
    -webkit-text-stroke: 1px rgba(0, 0, 0, 0.6);
    animation: life-float 0.9s ease-out forwards;
    pointer-events: none;
    font-size: 1.2rem;
    z-index: 3;
  }
  .life-float.inc {
    color: #2ecc71;
  }
  .life-float.dec {
    color: #e74c3c;
  }

  @keyframes life-pulse-inc {
    0% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes life-pulse-dec {
    0% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes life-float {
    0% {
      opacity: 0;
      transform: translate(-50%, 0) scale(0.7);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -6px) scale(1.15);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -22px) scale(1);
    }
  }

  .player-actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.45rem;
    margin-bottom: 0.35rem;
    padding: 0.4rem 0.45rem 0.2rem;
    width: 200px;
    box-sizing: border-box;
    border-radius: 6px;
    border: 1px solid rgba(196, 164, 96, 0.28);
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0%, rgba(28, 18, 12, 0.28) 100%);
    box-shadow:
      inset 0 4px 8px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(0, 0, 0, 0.35),
      0 1px 0 rgba(255, 255, 255, 0.06);
    transition: border-color 0.3s ease;
  }

  .player-actions.abilities-available {
    border-color: #bfa14a;
    box-shadow: 0 0 8px rgba(191, 161, 74, 0.3);
  }

  .color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .color-symbol {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1px solid rgba(255, 236, 200, 0.35);
    box-shadow:
      0 3px 0 rgba(0, 0, 0, 0.45),
      0 4px 6px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: brightness(1.2) contrast(1.3);
    transition: all 0.2s ease;
  }

  .color-symbol.increment {
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.4) inset,
      0 0 10px rgba(255, 255, 255, 0.6),
      0 2px 6px rgba(0, 0, 0, 0.4);
    transform: scale(1.08);
  }

  .color-item .color-symbol {
    cursor: pointer;
    transition:
      transform 0.2s ease,
      background-color 0.2s ease;
  }

  .color-item.disabled .color-symbol {
    cursor: default;
    opacity: 0.75;
  }

  .color-item.disabled .color-symbol:hover {
    transform: none;
  }

  .color-count {
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--color-cream);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    text-align: center;
  }

  .float-plus {
    position: absolute;
    top: -0.4rem;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-weight: 900;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
    animation: float-up 0.8s ease-out forwards;
    pointer-events: none;
  }

  @keyframes float-up {
    0% {
      opacity: 0;
      transform: translate(-50%, 0) scale(0.9);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -4px) scale(1.02);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -18px) scale(1.08);
    }
  }

  .deck-section {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .hand-count {
    margin-top: 0.45rem;
    padding: 0.2rem 0.7rem;
    color: var(--color-cream);
    border-radius: 4px;
    border: 1px solid rgba(214, 184, 120, 0.38);
    background: linear-gradient(180deg, #4a3b2c 0%, #2a2118 100%);
    box-shadow:
      0 3px 0 #1a120c,
      0 6px 8px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.85rem;
    text-align: center;
  }
</style>
