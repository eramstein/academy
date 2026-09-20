<script lang="ts">
  import { TriggerType } from '../../_model/enums-battle';
  import type { Ability, UnitDeployed } from '../../_model/model-battle';
  import { uiState } from '../../_state';
  import { getAssetPath } from '../../_utils/asset-paths';
  import { getRangeLabel } from '../../battle/effects';
  import { DataEffectTemplates } from '../../battle/effects/effect-templates';
  import Tooltip from '../Tooltip.svelte';
  import { activateAbility } from '../_helpers/targetting';
  import { TRIGGER_ICONS } from '../_helpers/triggerIcons';
  let { abilities, unit }: { abilities: Ability[]; unit?: UnitDeployed } = $props();

  // Tooltip state
  let hoveredAbility = $state<string | null>(null);

  // Clear tooltip when ability becomes pending
  $effect(() => {
    if (uiState.battle.abilityPending) {
      hoveredAbility = null;
    }
  });

  function getAbilityText(ability: Ability) {
    let label = ability.trigger.type + ': ';
    if (ability.trigger.range) {
      label += getRangeLabel(ability.trigger.range) + ' ';
    }
    ability.actions.forEach((action) => {
      label +=
        DataEffectTemplates[action.effect.name](action.effect.args).label(action.targets || []) +
        '\n';
    });
    return label;
  }

  // Get the icon for each ability based on trigger type
  let abilityIcons = $derived(() => {
    return abilities.map((ability) => ({
      triggerIcon: TRIGGER_ICONS[ability.trigger.type],
      text: getAbilityText(ability),
      isActivated: ability.trigger.type === TriggerType.Activated,
      ability: ability,
      isPending:
        uiState.battle.abilityPending?.unit?.instanceId === unit?.instanceId &&
        uiState.battle.abilityPending?.ability === ability,
      cost: ability.cost,
      exhausts: ability.exhausts,
    }));
  });

  function handleMouseEnter(abilityName: string) {
    hoveredAbility = abilityName;
  }

  function handleMouseLeave() {
    hoveredAbility = null;
  }

  function onAbilityClick(ability: Ability, e: MouseEvent) {
    e.stopPropagation();
    // Clear tooltip when clicking
    hoveredAbility = null;
    if (unit) {
      activateAbility(unit, ability);
    }
  }

  function getTooltipContent(text: string, cost?: number, exhausts?: boolean): string {
    const costText = cost ? `(${cost}): ` : '';
    const exhaustText = exhausts ? '↻ ' : '';
    return `${exhaustText}${costText}${text}`;
  }

  function getAbilityIconPath(exhausts?: boolean): string {
    return getAssetPath(exhausts ? 'images/ui/icons/tap.png' : 'images/ui/icons/activate.png');
  }
</script>

<div class="abilities">
  {#each abilityIcons() as { triggerIcon, text, isActivated, ability, isPending, cost, exhausts }}
    <Tooltip content={getTooltipContent(text, cost, exhausts)} show={hoveredAbility === text}>
      <div
        class="ability"
        class:activated={isActivated}
        class:pending={isPending}
        class:has-trigger-icon={triggerIcon}
        style={triggerIcon ? `background-image: url('${triggerIcon}')` : ''}
        onmouseenter={() => handleMouseEnter(text)}
        onmouseleave={handleMouseLeave}
        onclick={(e) => isActivated && onAbilityClick(ability, e)}
      >
        {#if !triggerIcon}
          <img class="ability-icon" src={getAbilityIconPath(exhausts)} alt="ability" />
        {/if}
        {#if cost !== undefined && cost > 0}
          <span class="ability-cost">{cost}</span>
        {/if}
      </div>
    </Tooltip>
  {/each}
</div>

<style>
  .abilities {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .ability {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-golden);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    position: relative;
    transition: all 0.2s ease;
  }

  .ability.has-trigger-icon {
    background-size: 16px;
    background-repeat: no-repeat;
    background-position: center;
    background-color: white;
    border-radius: 50%;
    padding: 2px;
    border: 1px solid black;
    box-shadow: 0 0 0 1px var(--color-golden);
  }

  .ability.activated {
    cursor: pointer;
  }

  .ability.activated:not(.pending):hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
  }

  .ability.pending {
    background: rgba(255, 215, 0, 0.8);
    color: black;
    border-color: #ffd700;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    animation: pulse 0.5s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from {
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }
    to {
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
    }
  }

  .ability-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .ability-cost {
    position: absolute;
    top: -4px;
    left: -4px;
    background: radial-gradient(ellipse at 60% 40%, #444 60%, #222 100%);
    color: white;
    font-weight: bold;
    font-size: 0.6rem;
    min-width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #bfa14a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    z-index: 1;
    text-shadow: 0 1px 2px #000;
  }
</style>
