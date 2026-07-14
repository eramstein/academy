<script lang="ts">
  import { CardColor, CardType, TargetType, UnitType } from '@/lib/_model/enums-battle';
  import { DataEffectTemplates } from '@/lib/battle/effects/effect-templates';
  import { CARD_HEIGHT, CARD_WIDTH } from '@lib/_config/ui-config';
  import type { Card, SpellCard } from '@lib/_model/model-battle';
  import { bs, uiState } from '@lib/_state';
  import { getAssetPath, getCardImagePath } from '@lib/_utils/asset-paths';
  import { isPayableAfterColorIncrementation } from '@lib/battle/cost';
  import { usePlayerColorAbility } from '@lib/battle/player';
  import { activateSpell, targetCard } from '@lib/ui/_helpers/targetting';
  import Abilities from './Abilities.svelte';
  import Keywords from './Keywords.svelte';
  import Stats from './Stats.svelte';

  let {
    card,
    displayKeywords = true,
    inHand = true,
  }: { card: Card; displayKeywords?: boolean; inHand?: boolean } = $props();

  // Create the background image path using the card id
  let cardImagePath = $derived(getCardImagePath(card.imageFileName));

  // Check if this card is the currently pending spell
  let isPendingSpell = $derived(
    uiState.battle.spellPending && uiState.battle.spellPending.instanceId === card.instanceId
  );

  // Calculate font size based on name length
  let nameFontSize = $derived(() => {
    return card.name.length > 20 ? 0.75 : 0.9;
  });

  // Check if card is a unit card (works with Card type)
  function isUnitCard(card: Card): card is Card & {
    power: number;
    maxHealth: number;
    keywords?: any;
    abilities?: any;
    unitTypes?: UnitType[];
  } {
    return card.type === CardType.Unit;
  }

  // Check if card is a spell card
  function isSpellCard(card: Card): card is SpellCard {
    return card.type === CardType.Spell;
  }

  // Check if the card is playable
  let isPayable = $derived(isPayableAfterColorIncrementation(card) !== false);

  // Helper function to get color image path
  function getColorImagePath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  // Handle card click
  function handleClick(event?: MouseEvent) {
    // If selecting a target and it's a hand card, treat this click as target selection
    if (
      inHand &&
      uiState.battle.targetBeingSelected &&
      uiState.battle.targetBeingSelected.type === TargetType.HandCard
    ) {
      targetCard(card);
      return;
    }

    const colorRequirementMet = isPayableAfterColorIncrementation(card);
    if (inHand && isSpellCard(card) && colorRequirementMet !== false) {
      if (colorRequirementMet !== true) {
        // this is the case when incrementing a color makes it playable
        usePlayerColorAbility(bs.players[card.ownerPlayerId], colorRequirementMet as CardColor);
      }
      // Check if any effect in the spell has targets
      const hasTargets = card.actions.some((action) => action.targets && action.targets.length > 0);

      if (!hasTargets) {
        const anchor = (event?.currentTarget as HTMLElement) ?? null;
        uiState.confirmPopover.visible = true;
        uiState.confirmPopover.title = 'Cast Spell?';
        uiState.confirmPopover.body = `Are you sure you want to cast <b>${card.name}</b>?<br><span class='spell-text'>${getSpellText()}</span>`;
        uiState.confirmPopover.anchorEl = anchor;
        uiState.confirmPopover.onConfirm = () => activateSpell(card);
        uiState.confirmPopover.onCancel = undefined;
      } else {
        activateSpell(card);
      }
    }
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

  // Check if spell is draggable (0 or 1 target)
  function isDraggableSpell(card: Card): boolean {
    if (!isSpellCard(card)) return false;
    const totalTargets = card.actions.reduce(
      (acc, action) => acc + (action.targets?.length || 0),
      0
    );
    return totalTargets <= 1;
  }

  // Check if this card is currently being dragged
  let isDragging = $derived(inHand && uiState.battle.draggingCard?.instanceId === card.instanceId);

  // Drag event handlers
  function handleDragStart(event: DragEvent) {
    const colorRequirementMet = isPayableAfterColorIncrementation(card);
    const canDrag = (isUnitCard(card) || isDraggableSpell(card)) && colorRequirementMet !== false;

    if (!canDrag) {
      event.preventDefault();
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(card));

      // Hide the default drag ghost image
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent pixel
      event.dataTransfer.setDragImage(img, 0, 0);

      // Initialize dragging state
      uiState.battle.draggingCard = card;
    }
  }

  function handleDrag(event: DragEvent) {
    // Add visual feedback during drag
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragEnd() {
    uiState.battle.draggingCard = null;
  }

  // Handle right-click to show CardFull
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    uiState.cardFullOverlay.visible = true;
    uiState.cardFullOverlay.card = card;
  }
</script>

<div
  class="card {isPendingSpell ? 'pending-spell' : ''} {isDragging ? 'dragging' : ''} {isPayable
    ? 'payable'
    : ''}"
  style="--card-width: {CARD_WIDTH}px; --card-height: {CARD_HEIGHT +
    40}px; --name-font-size: {nameFontSize()}rem;"
  draggable={(isUnitCard(card) || isDraggableSpell(card)) && isPayable}
  ondragstart={handleDragStart}
  ondrag={handleDrag}
  ondragend={handleDragEnd}
  onclick={handleClick}
  oncontextmenu={handleContextMenu}
>
  <!-- Card name bar -->
  <div class="name has-unit-types">
    {#if card.colors && card.colors.length > 0}
      <div class="header-colors">
        {#each card.colors as colorInfo}
          {#each Array(colorInfo.count) as _}
            <div
              class="color-indicator"
              style="background-image: url('{getColorImagePath(colorInfo.color)}');"
            ></div>
          {/each}
        {/each}
      </div>
    {/if}
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
      {#if card.cost !== undefined && card.cost > 0}
        <div class="mana-cost-circle">
          {card.cost}
        </div>
      {/if}

      <div class="mana-spacer"></div>
    </div>
  </div>

  <!-- Content area with card image background -->
  <div class="content" style="background-image: url('{cardImagePath}');">
    <!-- Bottom section with abilities and bottom row -->
    <div class="bottom-section">
      <!-- Abilities display - only for Unit cards with abilities -->
      {#if isUnitCard(card) && card.abilities && card.abilities.length > 0}
        <div class="abilities-container">
          <Abilities abilities={card.abilities} />
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
        {#if isUnitCard(card) && card.keywords && displayKeywords}
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
    padding: 4px;
    box-sizing: border-box;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
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

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
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
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
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
    transition: all 0.2s ease;
  }

  .card.payable {
    border-color: var(--color-golden);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.5),
      0 0 8px rgba(255, 215, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .header-colors {
    display: flex;
    z-index: 2;
    margin-top: -13px;
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

  .bottom-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .abilities-container {
    display: flex;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .keywords-container {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .card:hover .abilities-container,
  .card:hover .keywords-container {
    opacity: 1;
  }

  .card.pending-spell {
    transform: translateY(-20px) scale(1.1);
    border-color: var(--color-golden);
    box-shadow:
      0 0 20px rgba(255, 215, 0, 0.8),
      0 8px 25px rgba(0, 0, 0, 0.5);
    z-index: 10;
    animation: spell-pulse 1s ease-in-out infinite alternate;
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
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .card:hover .spell-effect {
    opacity: 1;
  }

  .card.dragging {
    transform: translateY(-20px) scale(1.05);
    border-color: var(--color-golden);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    opacity: 0.3;
  }

  @keyframes spell-pulse {
    from {
      box-shadow:
        0 0 20px rgba(255, 215, 0, 0.8),
        0 8px 25px rgba(0, 0, 0, 0.5);
    }
    to {
      box-shadow:
        0 0 30px rgba(255, 215, 0, 1),
        0 12px 35px rgba(0, 0, 0, 0.6);
    }
  }
</style>
