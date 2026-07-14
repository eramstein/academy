<script lang="ts">
  import { getAssetPath, getCardImagePath } from '@lib/_utils/asset-paths';
  import { CardColor, CardType, UnitType } from '../../_model/enums-battle';
  import type { CardTemplate, Land, SpellCard } from '../../_model/model-battle';
  import { DataEffectTemplates } from '../../battle/effects/effect-templates';
  import { KEYWORD_TOOLTIPS } from '../_helpers/keywordTooltips';
  import { TRIGGER_ICONS } from '../_helpers/triggerIcons';
  import Tooltip from '../Tooltip.svelte';
  let { card }: { card: CardTemplate | Land } = $props();

  // Tooltip state
  let hoveredKeyword = $state<string | null>(null);

  function handleMouseEnter(keyword: string) {
    hoveredKeyword = keyword;
  }

  function handleMouseLeave() {
    hoveredKeyword = null;
  }

  // Create the background image path using the card id
  let cardImagePath = $derived(getCardImagePath(card.imageFileName));

  // Calculate font size based on name length
  let nameFontSize = $derived(() => {
    return card.name.length > 20 ? 1.5 : 1.8;
  });

  // Check if card is a unit card (works with CardTemplate type)
  function isUnitCard(card: CardTemplate | Land): card is CardTemplate & {
    power: number;
    maxHealth: number;
    keywords?: any;
    abilities?: any;
    unitTypes?: UnitType[];
  } {
    return card.type === CardType.Unit;
  }

  // Check if card is a spell card
  function isSpellCard(card: CardTemplate | Land): card is SpellCard {
    return card.type === CardType.Spell;
  }

  // Check if card is a land card
  function isLandCard(card: CardTemplate | Land): card is (CardTemplate | Land) & {
    health: number;
    abilities?: any;
    ruinsAbilities?: any;
    retaliate?: number;
  } {
    return card.type === CardType.Land;
  }

  // Helper function to get color image path
  function getColorImagePath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  // Get concatenated text from all actions for spells
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

  // Get full ability text
  function getAbilityText(ability: any) {
    let label = ability.trigger.type + ': ';
    ability.actions.forEach((action: any) => {
      label +=
        DataEffectTemplates[action.effect.name](action.effect.args).label(action.targets || []) +
        '\n';
    });
    return label;
  }

  // Full keyword names
  const keywordNames = {
    ranged: 'Ranged',
    haste: 'Haste',
    moveAndAttack: 'Move and Attack',
    retaliate: 'Retaliate',
    armor: 'Armor',
    resist: 'Resist',
    poisonous: 'Poisonous',
    regeneration: 'Regeneration',
    trample: 'Trample',
    zerk: 'Zerk',
    cleave: 'Cleave',
    lance: 'Lance',
    flying: 'Flying',
    immobile: 'Immobile',
  };

  // Get all active keywords with their values
  let activeKeywords = $derived(() => {
    if (!isUnitCard(card) || !card.keywords) return [];

    const result: Array<{ key: string; value?: number; icon: string; name: string }> = [];

    Object.entries(card.keywords).forEach(([key, value]) => {
      if (value && key in keywordNames) {
        const icon = `/assets/images/keywords/${key}.png`;
        if (typeof value === 'number') {
          result.push({
            key,
            value,
            icon,
            name: keywordNames[key as keyof typeof keywordNames],
          });
        } else if (value === true) {
          result.push({
            key,
            icon,
            name: keywordNames[key as keyof typeof keywordNames],
          });
        }
      }
    });

    return result;
  });
</script>

<div class="card-full" style="--name-font-size: {nameFontSize()}rem;">
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
      {#if !isLandCard(card)}
        {#if card.cost !== undefined && card.cost > 0}
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
      {/if}
    </div>
  </div>

  <!-- Content area with card image background -->
  <div class="content" style="background-image: url('{cardImagePath}');">
    <!-- Bottom section with stats -->
    <div class="bottom-section">
      <!-- Stats display - Unit cards -->
      {#if isUnitCard(card)}
        <div class="stats-container">
          <div class="stat">
            <span class="stat-label">Power:</span>
            <span class="stat-value">{card.power}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Health:</span>
            <span class="stat-value">{card.maxHealth}</span>
          </div>
        </div>
      {:else if isLandCard(card)}
        <div class="stats-container">
          <div class="stat">
            <span class="stat-label">Retaliate:</span>
            <span class="stat-value">{card.retaliate || 0}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Health:</span>
            <span class="stat-value">{card.health}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
  <!-- Abilities and Keywords section below the image -->
  <div class="details-section">
    <!-- Abilities display - only for Unit and Land cards with abilities -->
    {#if (isUnitCard(card) || isLandCard(card)) && card.abilities && card.abilities.length > 0}
      {#each card.abilities as ability}
        <div class="ability-item">
          <div class="ability-header">
            <span
              class="ability-icon"
              class:has-trigger-icon={TRIGGER_ICONS[
                ability.trigger.type as keyof typeof TRIGGER_ICONS
              ]}
              style={TRIGGER_ICONS[ability.trigger.type as keyof typeof TRIGGER_ICONS]
                ? `background-image: url('${TRIGGER_ICONS[ability.trigger.type as keyof typeof TRIGGER_ICONS]}')`
                : ''}
            ></span>
            <span class="ability-trigger">{ability.trigger.type}</span>
            {#if ability.cost !== undefined && ability.cost > 0}
              <span class="ability-cost">({ability.cost})</span>
            {/if}
            {#if ability.exhausts}
              <span class="ability-exhausts">↻</span>
            {/if}
          </div>
          <div class="ability-text">{getAbilityText(ability)}</div>
        </div>
      {/each}
    {/if}

    <!-- Ruins Abilities display - only for Land cards with ruinsAbilities -->
    {#if isLandCard(card) && card.ruinsAbilities && card.ruinsAbilities.length > 0}
      {#each card.ruinsAbilities as ability}
        <div class="ability-item ruins-ability">
          <div class="ability-header">
            <span
              class="ability-icon"
              class:has-trigger-icon={TRIGGER_ICONS[
                ability.trigger.type as keyof typeof TRIGGER_ICONS
              ]}
              style={TRIGGER_ICONS[ability.trigger.type as keyof typeof TRIGGER_ICONS]
                ? `background-image: url('${TRIGGER_ICONS[ability.trigger.type as keyof typeof TRIGGER_ICONS]}')`
                : ''}
            ></span>
            <span class="ability-trigger">{ability.trigger.type}</span>
            {#if ability.cost !== undefined && ability.cost > 0}
              <span class="ability-cost">({ability.cost})</span>
            {/if}
            {#if ability.exhausts}
              <span class="ability-exhausts">↻</span>
            {/if}
          </div>
          <div class="ability-text">{getAbilityText(ability)}</div>
        </div>
      {/each}
    {/if}

    <!-- Keywords display - only for Unit cards with keywords -->
    {#if isUnitCard(card) && card.keywords && activeKeywords().length > 0}
      {#each activeKeywords() as { key, value, icon, name }}
        <Tooltip
          content={typeof KEYWORD_TOOLTIPS[key as keyof typeof KEYWORD_TOOLTIPS] === 'function'
            ? (KEYWORD_TOOLTIPS[key as keyof typeof KEYWORD_TOOLTIPS] as Function)(value)
            : KEYWORD_TOOLTIPS[key as keyof typeof KEYWORD_TOOLTIPS]}
          show={hoveredKeyword === key}
        >
          <div
            class="keyword-item"
            onmouseenter={() => handleMouseEnter(key)}
            onmouseleave={handleMouseLeave}
          >
            <img src={icon} alt={name} class="keyword-icon" />
            <span class="keyword-name">{name} {value}</span>
          </div>
        </Tooltip>
      {/each}
    {/if}

    <!-- Spell effect display for SpellCard -->
    {#if isSpellCard(card)}
      <div class="spell-effect-item">
        <div class="spell-text">{getSpellText()}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .card-full {
    width: 512px;
    border-radius: 16px;
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.4),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 1px solid #1a1a1a;
    background: #444 url('/assets/images/cardboard.png') center/cover;
    background-blend-mode: multiply;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  .content {
    height: 512px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px;
    position: relative;
    flex-shrink: 0;
  }

  .content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    pointer-events: none;
  }

  .name {
    background: #e8dcc4 url('/assets/images/parchment.png') center/cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 12px 20px 4px 20px;
    font-weight: 800;
    font-size: 1.8rem;
    flex-shrink: 0;
    border-radius: 8px 8px 0 0;
    border: 1px solid #5a4b3c;
    border-bottom: 3px solid #2c251d;
    box-shadow:
      inset 0 1px 3px rgba(255, 255, 255, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.3);
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
    position: relative;
    z-index: 2;
  }

  .name.has-unit-types .name-text {
    font-size: 1.7rem;
  }

  .name.has-unit-types {
    padding: 12px 20px 4px 20px;
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
    font-size: 1.4rem;
    font-weight: bold;
    text-transform: capitalize;
  }

  .name-text {
    font-size: var(--name-font-size, 1.8rem);
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
    height: 3px;
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
    padding: 0 16px;
    box-sizing: border-box;
    pointer-events: none;
  }

  .mana-spacer {
    flex: 1;
  }

  .mana-cost-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #2a2a2a;
    background-image: radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a);
    border: 3px solid #5a4b3c;
    color: #f5eedf;
    font-weight: 900;
    font-size: 1.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      inset 0 2px 2px rgba(255, 255, 255, 0.4),
      inset 0 -3px 4px rgba(0, 0, 0, 0.8),
      0 3px 6px rgba(0, 0, 0, 0.6);
    z-index: 2;
  }

  .mana-colors {
    display: flex;
    z-index: 2;
  }

  .color-indicator {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 2px solid #3a2e24;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.9),
      0 3px 5px rgba(0, 0, 0, 0.6);
    margin-left: -12px;
    position: relative;
    filter: contrast(1.1) brightness(1.3);
  }

  .color-indicator:first-child {
    margin-left: 0;
  }

  .details-section {
    background: #000;
    padding: 16px;
    border-radius: 0 0 8px 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 200px;
    overflow-y: auto;
    flex-shrink: 0;
    border: 1px solid #5a4b3c;
    border-top: none;
  }

  .ability-item {
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }

  .ability-item.ruins-ability {
    background: rgba(139, 69, 19, 0.2);
    border: 1px solid rgba(139, 69, 19, 0.5);
  }

  .ability-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .ability-icon {
    font-size: 1.2rem;
    width: 24px;
    height: 24px;
    display: inline-block;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .ability-icon.has-trigger-icon {
    background-color: white;
    border-radius: 50%;
    border: 2px solid black;
    box-shadow: 0 0 0 1px var(--color-golden);
    background-size: 20px;
  }

  .ability-trigger {
    font-weight: bold;
    color: var(--color-golden);
  }

  .ability-cost {
    background: radial-gradient(ellipse at 60% 40%, #444 60%, #222 100%);
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.8rem;
    border: 1px solid #bfa14a;
  }

  .ability-exhausts {
    color: var(--color-golden);
    font-weight: bold;
  }

  .ability-text {
    font-size: 0.9rem;
    line-height: 1.3;
    white-space: pre-line;
    color: white;
  }

  .keyword-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }

  .keyword-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .keyword-name {
    font-weight: bold;
    color: white;
  }

  .spell-effect-item {
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }

  .bottom-section {
    position: relative;
    z-index: 2;
  }

  .stats-container {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid var(--color-golden);
  }

  .stat-label {
    font-weight: bold;
    color: var(--color-golden);
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: bold;
  }

  .spell-text {
    font-size: 0.9rem;
    line-height: 1.3;
    white-space: pre-line;
    color: white;
  }
</style>
