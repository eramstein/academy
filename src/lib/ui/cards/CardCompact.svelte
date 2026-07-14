<script lang="ts">
  import { isLandCard } from '@/lib/_model';
  import { CardType } from '@/lib/_model/enums-battle';
  import { DataEffectTemplates } from '@/lib/battle/effects/effect-templates';
  import { CARD_HEIGHT, CARD_WIDTH } from '@lib/_config/ui-config';
  import type { CardTemplate, SpellCardTemplate, UnitCardTemplate } from '@lib/_model/model-battle';
  import { uiState } from '@lib/_state';
  import { getAssetPath, getCardImagePath } from '@lib/_utils/asset-paths';
  import Abilities from '../battle/Abilities.svelte';
  import Keywords from '../battle/Keywords.svelte';
  import Stats from '../battle/Stats.svelte';

  let { card }: { card: CardTemplate } = $props();

  // Create the background image path using the card id
  let cardImagePath = $derived(getCardImagePath(card.imageFileName));

  // Calculate font size based on name length
  let nameFontSize = $derived(() => {
    return card.name.length > 20 ? 0.75 : 0.9;
  });

  function isSpellCard(card: CardTemplate): card is SpellCardTemplate {
    return card.type === CardType.Spell;
  }

  function isUnitCard(card: CardTemplate): card is UnitCardTemplate {
    return card.type === CardType.Unit;
  }

  // Get concatenated text from all actions
  function getSpellText(): string {
    if (isSpellCard(card)) {
      let label = '';
      card.actions.forEach((action) => {
        label +=
          DataEffectTemplates[action.effect.name](action.effect.args).label(action.targets || []) +
          '\n';
      });
      return label;
    }
    return '';
  }

  // Handle right-click to show CardFull
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    uiState.cardFullOverlay.visible = true;
    uiState.cardFullOverlay.card = card;
  }
</script>

<div
  class="card"
  style="--card-width: {CARD_WIDTH}px; --card-height: {CARD_HEIGHT +
    40}px; --name-font-size: {nameFontSize()}rem;"
  oncontextmenu={handleContextMenu}
>
  <!-- Card name bar -->
  <div
    class="name {isUnitCard(card) && card.unitTypes && card.unitTypes.length > 0
      ? 'has-unit-types'
      : ''}"
  >
    <div class="name-content">
      <span class="name-text">{card.name}</span>
      <!-- Unit types display - only for Unit cards with unitTypes -->
      {#if isUnitCard(card) && card.unitTypes && card.unitTypes.length > 0}
        <div class="unit-types-inline">
          {#each card.unitTypes as unitType}
            <span class="unit-type-text">{unitType}</span>
          {/each}
        </div>
      {:else}
        <div class="unit-types-inline">
          <span class="unit-type-text">{card.type}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Mana Bar (Separator) -->
  <div class="mana-bar">
    <div class="mana-line"></div>
    <div class="mana-content">
      {#if card.cost > 0}
        <div class="mana-cost-circle">
          {card.cost}
        </div>
      {/if}

      <div class="mana-spacer"></div>

      {#if card.colors && card.colors.length > 0}
        <div class="mana-colors">
          {#each card.colors as colorInfo}
            {#each Array(colorInfo.count) as _}
              <div
                class="color-indicator"
                style="background-image: url('{getAssetPath(
                  `images/color_${colorInfo.color}.png`
                )}');"
              ></div>
            {/each}
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Content area with card image background -->
  <div class="content" style="background-image: url('{cardImagePath}');">
    <!-- Bottom section with abilities and bottom row -->
    <div class="bottom-section">
      <!-- Abilities display - only for Unit cards with abilities -->
      {#if (isUnitCard(card) || isLandCard(card)) && card.abilities && card.abilities.length > 0}
        <div class="abilities-container">
          <Abilities abilities={card.abilities} />
        </div>
      {/if}
      {#if isLandCard(card) && card.ruinsAbilities && card.ruinsAbilities.length > 0}
        <div class="abilities-container">
          <Abilities abilities={card.ruinsAbilities} />
        </div>
      {/if}

      <!-- Bottom row: stats on left, keywords on right -->
      <div class="bottom-row">
        <!-- Stats display - only for Unit cards -->
        {#if isUnitCard(card)}
          <Stats
            power={card.power}
            health={card.maxHealth}
            armor={card.keywords?.armor}
            retaliate={card.keywords?.retaliate}
          />
        {/if}

        <!-- Keywords display - only for Unit cards with keywords -->
        {#if isUnitCard(card) && card.keywords}
          <div class="keywords-container">
            <Keywords keywords={card.keywords} />
          </div>
        {/if}
      </div>
    </div>

    <!-- Spell effect display for SpellCard -->
    {#if isSpellCard(card)}
      <div class="spell-effect">{getSpellText()}</div>
    {/if}
  </div>
</div>

<style>
  .card {
    width: var(--card-width);
    height: var(--card-height);
    border-radius: 12px;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    background: #444 url('/assets/images/cardboard.png') center/cover;
    background-blend-mode: multiply;
    border: 1px solid #1a1a1a;
    padding: 6px;
    box-sizing: border-box;
    --left-margin: 12px;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }

  .content {
    flex: 1;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 8px var(--left-margin);
    overflow: hidden;
    border-top: none;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .card:active {
    transform: scale(0.95);
  }

  .name {
    background: #e8dcc4 url('/assets/images/parchment.png') center/cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 6px 10px 2px 10px;
    font-weight: 800;
    font-size: 0.9rem;
    flex-shrink: 0;
    border-radius: 6px 6px 0 0;
    border: 1px solid #5a4b3c;
    border-bottom: 2px solid #2c251d;
    box-shadow:
      inset 0 1px 3px rgba(255, 255, 255, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.3);
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
    position: relative;
    z-index: 2;
  }

  .name.has-unit-types .name-text {
    font-size: 0.85rem;
  }

  .name.has-unit-types {
    padding: 6px 10px 2px 10px;
  }

  .name-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .unit-types-inline {
    display: flex;
    justify-content: center;
  }

  .unit-type-text {
    color: #554838;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: capitalize;
  }

  .name-text {
    font-size: var(--name-font-size, 0.9rem);
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    text-align: center;
  }

  .bottom-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  .abilities-container {
    display: flex;
    justify-content: flex-end;
  }

  .spell-effect {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px var(--left-margin) 8px var(--left-margin);
    font-size: 0.75rem;
    line-height: 1.2;
    text-align: center;
    border-top: 1px solid var(--color-golden);
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.5);
    margin-top: auto;
    margin-bottom: -8px;
    margin-left: calc(var(--left-margin) * -1);
    margin-right: calc(var(--left-margin) * -1);
    word-wrap: break-word;
    backdrop-filter: blur(2px);
  }

  /* Mana Bar Separator Styles */
  .mana-bar {
    position: relative;
    height: 0;
    z-index: 10;
  }

  .mana-line {
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #2c251d;
    box-shadow: 0 1px 1px rgba(255, 255, 255, 0.1);
  }

  .mana-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    padding: 0 8px;
    box-sizing: border-box;
    pointer-events: none;
  }

  .mana-spacer {
    flex: 1;
  }

  .mana-cost-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2a2a2a;
    background-image: radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a);
    border: 2px solid #5a4b3c;
    color: #f5eedf;
    font-weight: 900;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.4),
      inset 0 -2px 3px rgba(0, 0, 0, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.6);
    z-index: 2;
  }

  .mana-colors {
    display: flex;
    z-index: 2;
  }

  .color-indicator {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid #3a2e24;
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.5),
      inset 0 -1px 2px rgba(0, 0, 0, 0.9),
      0 2px 3px rgba(0, 0, 0, 0.6);
    margin-left: -6px;
    position: relative;
    filter: contrast(1.1) brightness(1.3);
  }

  .color-indicator:first-child {
    margin-left: 0;
  }
</style>
