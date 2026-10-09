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

  // Color pips left of the name: keep within ~3-pip width, stack tighter beyond that
  const COLOR_PIP_SIZE = 18;
  const COLOR_PIP_OVERLAP_DEFAULT = 6;
  const COLOR_PIPS_MAX_WIDTH =
    COLOR_PIP_SIZE + (COLOR_PIP_SIZE - COLOR_PIP_OVERLAP_DEFAULT) * 2; // 42px

  let colorCount = $derived(card.colors?.reduce((sum, c) => sum + c.count, 0) ?? 0);
  let colorPipOverlap = $derived(
    colorCount <= 3
      ? COLOR_PIP_OVERLAP_DEFAULT
      : COLOR_PIP_SIZE - (COLOR_PIPS_MAX_WIDTH - COLOR_PIP_SIZE) / (colorCount - 1)
  );
  // Trim name-bar left padding when many pips so the name keeps more room
  let nameLeftPadding = $derived(colorCount > 3 ? 2 : 10);

  // Check if card is a unit card (works with Card type)
  function isUnitCard(card: Card): card is Card & {
    power: number;
    maxHealth: number;
    retaliate: number;
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
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  // Check if this card is currently being dragged
  let isDragging = $derived(inHand && uiState.battle.draggingCard?.instanceId === card.instanceId);
  let suppressClick = $state(false);
  const DRAG_THRESHOLD_PX = 8;

  function canDragCard(): boolean {
    if (!inHand || !bs.isPlayersTurn) return false;
    const colorRequirementMet = isPayableAfterColorIncrementation(card);
    return (isUnitCard(card) || isDraggableSpell(card)) && colorRequirementMet !== false;
  }

  // Pointer drag — HTML5 DnD is cancelled by CSS filter/transform/style churn in Chrome.
  function handlePointerDown(event: PointerEvent) {
    if (!canDragCard() || event.button !== 0) return;

    const startX = event.clientX;
    const startY = event.clientY;
    let started = false;

    const onMove = (moveEvent: PointerEvent) => {
      if (started) return;
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      started = true;
      suppressClick = true;
      uiState.battle.draggingCard = card;
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      // Board owns drop + clearing draggingCard once a drag has started.
      if (!started) return;
      setTimeout(() => {
        suppressClick = false;
      }, 0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  // Handle card click
  function handleClick(event?: MouseEvent) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }

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

  // Handle right-click to show CardFull
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    uiState.cardFullOverlay.visible = true;
    uiState.cardFullOverlay.card = card;
  }
</script>

<div
  class="card {inHand ? 'in-hand' : ''} {isPendingSpell ? 'pending-spell' : ''} {isDragging ? 'dragging' : ''} {isPayable
    ? 'payable'
    : ''} {canDragCard() ? 'draggable' : ''}"
  style="--card-width: {CARD_WIDTH}px; --card-height: {CARD_HEIGHT +
    40}px; --name-font-size: {nameFontSize()}rem;"
  onpointerdown={handlePointerDown}
  onclick={handleClick}
  oncontextmenu={handleContextMenu}
>
  <!-- Card name bar -->
  <div class="name has-unit-types" style="--name-padding-left: {nameLeftPadding}px;">
    {#if card.colors && card.colors.length > 0}
      <div
        class="header-colors"
        style="--color-pip-overlap: {colorPipOverlap}px; --color-pips-max-width: {COLOR_PIPS_MAX_WIDTH}px;"
      >
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
            retaliate={card.retaliate}
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
    /* Keep the body sans when a parent (graveyard panel) sets the narrative serif.
       Georgia's digits sit lower in the mana circle. */
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    border-radius: 12px;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.14),
      0 3px 0 #1a120c,
      0 8px 12px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    background: #444 url('/assets/images/ui/backgrounds/cardboard.png') center/cover;
    background-blend-mode: multiply;
    border: 1px solid rgba(232, 210, 160, 0.28);
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

  .card.in-hand:hover {
    margin-top: -8px;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.16),
      0 3px 0 #1a120c,
      0 16px 18px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .card.draggable:active {
    filter: none;
  }

  .name {
    background: #e8dcc4 url('/assets/images/ui/backgrounds/parchment.png') center/cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 6px 10px 2px var(--name-padding-left, 10px);
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

  .name-content {
    flex: 1;
    min-width: 0;
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
    max-width: var(--color-pips-max-width, 42px);
    flex-shrink: 0;
  }

  .color-indicator {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid #3a2e24;
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.5),
      inset 0 -1px 2px rgba(0, 0, 0, 0.9),
      0 2px 3px rgba(0, 0, 0, 0.6);
    margin-left: calc(-1 * var(--color-pip-overlap, 6px));
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
    opacity: 0.3;
    border-color: var(--color-golden);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .card.draggable {
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .card.draggable.dragging {
    cursor: grabbing;
  }

  .card.draggable * {
    -webkit-user-drag: none;
    user-select: none;
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
