import {
  isCard,
  isDeployedUnit,
  isLand,
  isPosition,
  TargetType,
  type Ability,
  type Card,
  type EffectTargets,
  type Land,
  type Position,
  type SpellCard,
  type UnitDeployed,
} from '@/lib/_model';
import { bs, uiState } from '@/lib/_state';
import { getHumanPlayer, playAbility } from '@/lib/battle';
import { selectAiAbilityTargets } from '@/lib/battle/ai/target';
import { getPositionKey } from '@/lib/battle/boards';
import { isActivityPayable } from '@/lib/battle/cost';
import { DataEffectTemplates } from '@/lib/battle/effects/effect-templates';
import { playSpell } from '@/lib/battle/spell';
import { getEligibleTargets } from '@/lib/battle/target';

export function activateAbility(source: UnitDeployed | Land, ability: Ability) {
  if (isActivityPayable(source, ability) === false) {
    return;
  }
  const ui = uiState.battle;
  if (
    ui.abilityPending &&
    ((ui.abilityPending.unit && ui.abilityPending.unit.instanceId === source.instanceId) ||
      (ui.abilityPending.land && ui.abilityPending.land.instanceId === source.instanceId)) &&
    ui.abilityPending.ability === ability
  ) {
    clearUiState();
    return;
  }

  // Set the appropriate source type
  if ('position' in source) {
    // It's a UnitDeployed
    ui.abilityPending = { unit: source as UnitDeployed, ability };
  } else {
    // It's a Land
    ui.abilityPending = { land: source as Land, ability };
  }

  ui.currentEffectIndex = 0;
  ui.currentTargetIndex = 0;
  ui.selectedTargets = [];

  const actions = ability.actions || [];
  if (actions.length > 0) {
    const firstEffect = actions[0];
    if (firstEffect.targets && firstEffect.targets.length > 0) {
      ui.targetBeingSelected = firstEffect.targets[0];
      if (!highlightEligibleTargets(getEligibleTargets(source, firstEffect.targets[0]))) {
        clearUiState();
      }
    } else {
      ui.targetBeingSelected = null;
      playAbility(source, ability, []);
      clearUiState();
    }
  } else {
    ui.targetBeingSelected = null;
    playAbility(source, ability, []);
    clearUiState();
  }
}

export function activateSpell(spell: SpellCard) {
  const ui = uiState.battle;
  if (ui.spellPending && ui.spellPending.instanceId === spell.instanceId) {
    clearUiState();
    return;
  }
  ui.spellPending = spell;
  ui.currentEffectIndex = 0;
  ui.currentTargetIndex = 0;
  ui.selectedTargets = [];

  const actions = spell.actions || [];
  if (actions.length > 0) {
    const firstEffect = actions[0];
    if (firstEffect.targets && firstEffect.targets.length > 0) {
      ui.targetBeingSelected = firstEffect.targets[0];
      if (!highlightEligibleTargets(getEligibleSpellTargetsForIndex(spell, 0, 0))) {
        clearUiState();
      }
    } else {
      ui.targetBeingSelected = null;
      playSpell(spell, []);
      clearUiState();
    }
  } else {
    ui.targetBeingSelected = null;
    playSpell(spell, []);
    clearUiState();
  }
}

export function activateTriggeredAbility(unit: UnitDeployed, ability: Ability, triggerParams: any) {
  if (
    (uiState.isHeadless || unit.ownerPlayerId !== getHumanPlayer().id) &&
    ability.actions.length > 0 &&
    ability.actions.some((action) => action.targets && action.targets.length > 0)
  ) {
    const targets = selectAiAbilityTargets(unit, ability, triggerParams);
    playTriggeredAbility(unit, ability, targets, triggerParams);
    return;
  }

  const ui = uiState.battle;
  ui.triggeredAbilityPending = { unit, ability, triggerParams };
  ui.currentEffectIndex = 0;
  ui.currentTargetIndex = 0;
  ui.selectedTargets = [];

  const actions = ability.actions || [];
  if (actions.length > 0) {
    const firstEffect = actions[0];
    if (firstEffect.targets && firstEffect.targets.length > 0) {
      ui.targetBeingSelected = firstEffect.targets[0];
      if (!highlightEligibleTargets(getEligibleTargets(unit, firstEffect.targets[0]))) {
        clearUiState();
      }
    } else {
      ui.targetBeingSelected = null;
      playTriggeredAbility(unit, ability, [], triggerParams);
      clearUiState();
    }
  }
}

export function playTriggeredAbility(
  unit: UnitDeployed,
  ability: Ability,
  targets: EffectTargets[][],
  triggerParams: any
) {
  // Execute each effect in the ability
  ability.actions.forEach((actionDef, actionIndex) => {
    const effectTargets = [...targets[actionIndex]];
    // If any TargetType is Self, replace the corresponding targets entry with [unit]
    if (actionDef.targets) {
      actionDef.targets.forEach((def, i) => {
        if (def.type === TargetType.Self) {
          effectTargets[i] = [unit];
        }
      });
    }
    DataEffectTemplates[actionDef.effect.name](actionDef.effect.args).fn({
      unit,
      targets: effectTargets,
      triggerParams,
      player: bs.players[unit.ownerPlayerId],
    });
  });
}

function highlightEligibleTargets(eligibleTargets: EffectTargets): boolean {
  const ui = uiState.battle;
  if (ui.targetBeingSelected && ui.targetBeingSelected.type !== TargetType.Self) {
    ui.validTargets = {
      units: {},
      lands: {},
      players: {},
      cells: {},
      cards: {},
    };
    let hasEligibleTargets = false;
    if (Array.isArray(eligibleTargets)) {
      if (isDeployedUnit(eligibleTargets)) {
        (eligibleTargets as UnitDeployed[]).forEach((target) => {
          ui.validTargets!.units![target.instanceId] = true;
          hasEligibleTargets = true;
        });
      } else if (isPosition(eligibleTargets)) {
        (eligibleTargets as Position[]).forEach((position) => {
          const positionKey = getPositionKey(position);
          ui.validTargets!.cells![positionKey] = true;
          hasEligibleTargets = true;
        });
      } else if (isLand(eligibleTargets)) {
        (eligibleTargets as Land[]).forEach((land) => {
          ui.validTargets!.lands![land.instanceId] = true;
          hasEligibleTargets = true;
        });
      } else if (isCard(eligibleTargets)) {
        (eligibleTargets as Card[]).forEach((card) => {
          ui.validTargets!.cards![card.instanceId] = true;
          hasEligibleTargets = true;
        });
      }
    }
    return hasEligibleTargets;
  } else {
    ui.validTargets = null;
    return true; // Self targets don't need validation
  }
}

function getEligibleSpellTargetsForIndex(
  spell: SpellCard,
  effectIndex: number,
  targetIndex: number
): EffectTargets {
  const actions = spell.actions || [];
  if (actions[effectIndex]) {
    const effect = actions[effectIndex];
    const targets = effect.targets || [];
    if (targets[targetIndex]) {
      return getEligibleTargets(spell, targets[targetIndex]);
    }
  }
  return [];
}

function clearUiState() {
  const ui = uiState.battle;
  ui.selectedTargets = [];
  ui.currentEffectIndex = 0;
  ui.currentTargetIndex = 0;
  ui.targetBeingSelected = null;
  ui.abilityPending = null;
  ui.spellPending = null;
  ui.triggeredAbilityPending = null;
  ui.validTargets = null;
}

function advanceTargetStep() {
  const ui = uiState.battle;
  let actions: any[] = [];
  if (ui.abilityPending) {
    actions = ui.abilityPending.ability.actions || [];
  } else if (ui.spellPending) {
    actions = ui.spellPending.actions || [];
  } else if (ui.triggeredAbilityPending) {
    actions = ui.triggeredAbilityPending.ability.actions || [];
  }

  if (actions.length === 0) {
    // No actions, play immediately
    if (ui.abilityPending) {
      const source = ui.abilityPending.unit || ui.abilityPending.land;
      if (source) {
        playAbility(source, ui.abilityPending.ability, []);
      }
    } else if (ui.spellPending) {
      playSpell(ui.spellPending, []);
    } else if (ui.triggeredAbilityPending) {
      playTriggeredAbility(
        ui.triggeredAbilityPending.unit,
        ui.triggeredAbilityPending.ability,
        [],
        ui.triggeredAbilityPending.triggerParams
      );
    }
    clearUiState();
    return;
  }

  const currentEffect = actions[ui.currentEffectIndex];
  const targets = currentEffect?.targets || [];

  ui.currentTargetIndex++;
  if (ui.currentTargetIndex < targets.length) {
    ui.targetBeingSelected = targets[ui.currentTargetIndex];
    let hasEligibleTargets = false;
    if (ui.abilityPending) {
      const source = ui.abilityPending.unit || ui.abilityPending.land;
      if (source) {
        hasEligibleTargets = highlightEligibleTargets(
          getEligibleTargets(source, targets[ui.currentTargetIndex])
        );
      }
    } else if (ui.spellPending) {
      hasEligibleTargets = highlightEligibleTargets(
        getEligibleSpellTargetsForIndex(
          ui.spellPending,
          ui.currentEffectIndex,
          ui.currentTargetIndex
        )
      );
    } else if (ui.triggeredAbilityPending) {
      hasEligibleTargets = highlightEligibleTargets(
        getEligibleTargets(ui.triggeredAbilityPending.unit, targets[ui.currentTargetIndex])
      );
    }

    // If no eligible targets, end target selection and don't play the ability/spell
    if (!hasEligibleTargets) {
      clearUiState();
      return;
    }
  } else {
    // All targets for current effect selected, move to next effect
    ui.currentEffectIndex++;
    ui.currentTargetIndex = 0;

    if (ui.currentEffectIndex < actions.length) {
      const nextEffect = actions[ui.currentEffectIndex];
      if (nextEffect.targets && nextEffect.targets.length > 0) {
        ui.targetBeingSelected = nextEffect.targets[0];
        let hasEligibleTargets = false;
        if (ui.abilityPending) {
          const source = ui.abilityPending.unit || ui.abilityPending.land;
          if (source) {
            hasEligibleTargets = highlightEligibleTargets(
              getEligibleTargets(source, nextEffect.targets[0])
            );
          }
        } else if (ui.spellPending) {
          hasEligibleTargets = highlightEligibleTargets(
            getEligibleSpellTargetsForIndex(ui.spellPending, ui.currentEffectIndex, 0)
          );
        } else if (ui.triggeredAbilityPending) {
          hasEligibleTargets = highlightEligibleTargets(
            getEligibleTargets(ui.triggeredAbilityPending.unit, nextEffect.targets[0])
          );
        }

        // If no eligible targets, end target selection and don't play the ability/spell
        if (!hasEligibleTargets) {
          clearUiState();
          return;
        }
      } else {
        // Next effect has no targets, advance again
        advanceTargetStep();
      }
    } else {
      // All actions completed, play
      if (ui.abilityPending) {
        const source = ui.abilityPending.unit || ui.abilityPending.land;
        if (source) {
          playAbility(source, ui.abilityPending.ability, ui.selectedTargets);
        }
      } else if (ui.spellPending) {
        playSpell(ui.spellPending, ui.selectedTargets);
      } else if (ui.triggeredAbilityPending) {
        playTriggeredAbility(
          ui.triggeredAbilityPending.unit,
          ui.triggeredAbilityPending.ability,
          ui.selectedTargets,
          ui.triggeredAbilityPending.triggerParams
        );
      }
      clearUiState();
    }
  }
}

export function targetUnit(unit: UnitDeployed) {
  const ui = uiState.battle;
  if (
    (!ui.abilityPending && !ui.spellPending && !ui.triggeredAbilityPending) ||
    !ui.targetBeingSelected
  )
    return;
  const currentEffectIdx = ui.currentEffectIndex || 0;
  const currentTargetIdx = ui.currentTargetIndex || 0;

  if (!ui.selectedTargets[currentEffectIdx]) ui.selectedTargets[currentEffectIdx] = [];
  if (!ui.selectedTargets[currentEffectIdx][currentTargetIdx])
    ui.selectedTargets[currentEffectIdx][currentTargetIdx] = [];

  (ui.selectedTargets[currentEffectIdx][currentTargetIdx] as UnitDeployed[]).push(unit);
  if (
    ui.selectedTargets[currentEffectIdx][currentTargetIdx].length >=
    (ui.targetBeingSelected.count || 1)
  ) {
    advanceTargetStep();
  }
}

export function targetCell(position: Position) {
  const ui = uiState.battle;
  if (
    (!ui.abilityPending && !ui.spellPending && !ui.triggeredAbilityPending) ||
    !ui.targetBeingSelected ||
    ![TargetType.Cell, TargetType.AllyCell, TargetType.EmptyCell, TargetType.EnemyCell].includes(
      ui.targetBeingSelected.type
    )
  )
    return;
  const currentEffectIdx = ui.currentEffectIndex || 0;
  const currentTargetIdx = ui.currentTargetIndex || 0;

  if (!ui.selectedTargets[currentEffectIdx]) ui.selectedTargets[currentEffectIdx] = [];
  if (!ui.selectedTargets[currentEffectIdx][currentTargetIdx])
    ui.selectedTargets[currentEffectIdx][currentTargetIdx] = [];

  (ui.selectedTargets[currentEffectIdx][currentTargetIdx] as Position[]).push(position);
  if (
    ui.selectedTargets[currentEffectIdx][currentTargetIdx].length >=
    (ui.targetBeingSelected.count || 1)
  ) {
    advanceTargetStep();
  }
}

export function targetLand(land: Land) {
  const ui = uiState.battle;
  if (
    (!ui.abilityPending && !ui.spellPending && !ui.triggeredAbilityPending) ||
    !ui.targetBeingSelected
  )
    return;
  const currentEffectIdx = ui.currentEffectIndex || 0;
  const currentTargetIdx = ui.currentTargetIndex || 0;

  if (!ui.selectedTargets[currentEffectIdx]) ui.selectedTargets[currentEffectIdx] = [];
  if (!ui.selectedTargets[currentEffectIdx][currentTargetIdx])
    ui.selectedTargets[currentEffectIdx][currentTargetIdx] = [];

  (ui.selectedTargets[currentEffectIdx][currentTargetIdx] as Land[]).push(land);
  if (
    ui.selectedTargets[currentEffectIdx][currentTargetIdx].length >=
    (ui.targetBeingSelected.count || 1)
  ) {
    advanceTargetStep();
  }
}

export function targetCard(card: Card) {
  const ui = uiState.battle;
  if (
    (!ui.abilityPending && !ui.spellPending && !ui.triggeredAbilityPending) ||
    !ui.targetBeingSelected
  )
    return;
  const currentEffectIdx = ui.currentEffectIndex || 0;
  const currentTargetIdx = ui.currentTargetIndex || 0;

  if (!ui.selectedTargets[currentEffectIdx]) ui.selectedTargets[currentEffectIdx] = [];
  if (!ui.selectedTargets[currentEffectIdx][currentTargetIdx])
    ui.selectedTargets[currentEffectIdx][currentTargetIdx] = [];

  (ui.selectedTargets[currentEffectIdx][currentTargetIdx] as Card[]).push(card);
  if (
    ui.selectedTargets[currentEffectIdx][currentTargetIdx].length >=
    (ui.targetBeingSelected.count || 1)
  ) {
    if (ui.graveyardModal.visible) {
      ui.graveyardModal.visible = false;
      ui.graveyardModal.playerId = null;
    }
    advanceTargetStep();
  }
}
