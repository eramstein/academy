import {
  CardType,
  TargetType,
  type Ability,
  type ActionDefinition,
  type EffectArgs,
  type EffectTargets,
  type Land,
  type TargetDefinition,
  type UnitDeployed,
} from '../_model';
import { bs, uiState } from '../_state';
import { DataEffectTemplates } from './effects/effect-templates';
import { isUnitsTurn } from './player';
import { soundManager } from './sound';
import { checkTargets } from './target';

export function playAbility(
  source: UnitDeployed | Land,
  ability: Ability,
  targets: EffectTargets[][]
) {
  if ('exhausted' in source && !isUnitsTurn(source)) return;
  const sourceName = 'name' in source ? source.name : 'Land';
  console.log(
    sourceName + ' uses ability on ' + (targets && targets.map((t) => JSON.stringify(t)).join(', '))
  );

  // CHECKS + COSTS
  // ----------------------------------------------------------------------
  // Only check stun/mezz for units, not lands
  if ('statuses' in source && (source.statuses.stun || source.statuses.mezz)) {
    console.log('UNIT IS STUNNED OR MEZZED');
    return;
  }
  if (checkExhaustion(source, ability) === false) {
    console.log('EXHAUSTED');
    return;
  }
  if (!checkMultipleEffectsTargets(source, ability.actions, targets)) {
    console.log('INVALID TARGETS', ability.actions, targets);
    return;
  }
  if (payAbilityCost(source, ability) === false) {
    console.log('NOT ENOUGH MANA');
    return;
  }

  if (source.type === CardType.Land && !uiState.isHeadless) {
    soundManager.playSound('button2');
    uiState.battle.landAbilityAnimating = source.instanceId;
    setTimeout(() => {
      if (uiState.battle.landAbilityAnimating === source.instanceId) {
        uiState.battle.landAbilityAnimating = null;
      }
    }, 600);
  }

  // EFFECTS
  // ----------------------------------------------------------------------
  ability.actions.forEach((actionDef, actionIndex) => {
    const effectTargets = targets[actionIndex] ? [...targets[actionIndex]] : [];
    // If TargetType is Self, replace the corresponding targets entry with [source]
    if (actionDef.targets) {
      actionDef.targets.forEach((def, i) => {
        if (def.type === TargetType.Self) {
          effectTargets[i] = [source] as EffectTargets;
        }
      });
    }
    const params: EffectArgs = {
      targets: effectTargets,
      triggerParams: {},
      player: bs.players[source.ownerPlayerId],
    };
    if (source.type === CardType.Unit) {
      params.unit = source as UnitDeployed;
    } else if (source.type === CardType.Land) {
      params.land = source as Land;
    }
    DataEffectTemplates[actionDef.effect.name](actionDef.effect.args).fn(params);
  });
}

function checkExhaustion(source: UnitDeployed | Land, ability: Ability): boolean {
  // Only units can be exhausted, lands cannot
  if ('exhausted' in source) {
    if (source.exhausted && ability.exhausts) {
      return false;
    }
    if (ability.exhausts) {
      if (source.exhausted) {
        return false;
      }
      source.exhausted = true;
    }
    // using a land use up hero ability for the turn
  } else {
    if (bs.players[source.ownerPlayerId].abilityUsed) {
      return false;
    }
    bs.players[source.ownerPlayerId].abilityUsed = true;
  }
  return true;
}

function payAbilityCost(source: UnitDeployed | Land, ability: Ability): boolean {
  const player = bs.players[source.ownerPlayerId];
  if (ability.cost) {
    if (!player.mana || player.mana < ability.cost) {
      return false;
    }
    player.mana -= ability.cost;
  }
  return true;
}

export function canSourcePlayAbility(source: UnitDeployed | Land, ability: Ability): boolean {
  const player = bs.players[source.ownerPlayerId];
  const manaCheck = (player.mana || 0) >= (ability.cost || 0) || !ability.cost;

  // Only units can be exhausted, lands cannot
  if ('exhausted' in source) {
    return manaCheck && (!source.exhausted || !ability.exhausts);
  }

  return manaCheck;
}

function checkMultipleTargets(
  source: UnitDeployed | Land,
  defs: TargetDefinition[],
  targets: EffectTargets[]
): boolean {
  if (!Array.isArray(targets) || targets.length !== defs.length) return false;
  for (let i = 0; i < defs.length; i++) {
    if (!checkTargets(source, defs[i], targets[i])) return false;
  }
  return true;
}

function checkMultipleEffectsTargets(
  source: UnitDeployed | Land,
  actionDefs: ActionDefinition[],
  targets: EffectTargets[][]
): boolean {
  let hasTargets = false;
  actionDefs.forEach((actionDef) => {
    if (actionDef.targets) {
      hasTargets = true;
    }
  });
  if (!hasTargets) return true;
  if (!Array.isArray(targets) || targets.length !== actionDefs.length) return false;
  for (let i = 0; i < actionDefs.length; i++) {
    if (!actionDefs[i].targets) continue;
    if (!checkMultipleTargets(source, actionDefs[i].targets || [], targets[i])) return false;
  }
  return true;
}
