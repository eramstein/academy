import { config } from '../_config';
import type { Land, Player, UnitDeployed } from '../_model/model-battle';
import {
  isAttackingLand,
  isAttackingPlayer,
  isAttackingUnitDeployed,
} from '../_model/type-lookup-battle';
import { bs } from '../_state';
import { uiState } from '../_state/state-ui.svelte';
import { damageLand } from './land';
import { onCombatResolution, onUnitReach } from './listeners';
import { damagePlayer, getOpposingPlayer } from './player';
import { soundManager } from './sound';
import { applyTemporaryEffect } from './temporary-effects';
import { damageUnit, getAdjacentAlliesInRow, getAdjacentUnitsInColumn } from './unit';

export function canAttack(unit: UnitDeployed) {
  return (
    !unit.exhausted &&
    !unit.hasAttacked &&
    !unit.statuses.stun &&
    !unit.statuses.mezz &&
    !unit.statuses.daze
  );
}

export function validAttackTargets(unit: UnitDeployed): (UnitDeployed | Land | Player)[] {
  let blockers: UnitDeployed[] = [];
  const ennemyUnits = bs.units.filter((u) => u.ownerPlayerId !== unit.ownerPlayerId);
  if (unit.keywords?.ranged) {
    const unitsInRow = ennemyUnits.filter((u) => u.position.row === unit.position.row);
    if (unitsInRow.length > 0) {
      blockers = unitsInRow;
    }
  } else {
    const firstBlocker = getClosestBlocker(unit);
    if (firstBlocker) {
      blockers.push(firstBlocker);
    }
  }
  if (blockers.length > 0) {
    if (unit.keywords?.flying) {
      return ennemyUnits;
    }
    return blockers;
  }
  const opponent = getOpposingPlayer(unit.ownerPlayerId);
  const landBlocker = opponent.lands.find((l) => l.position === unit.position.row && !l.isRuined);
  let targets: (UnitDeployed | Land | Player)[] = [];
  if (landBlocker) {
    targets.push(landBlocker);
  } else {
    targets.push(opponent);
  }
  if (unit.keywords?.flying) {
    targets = targets.concat(ennemyUnits);
  }
  return targets;
}

function getClosestBlocker(unit: UnitDeployed): UnitDeployed | null {
  const blockers = bs.units.filter(
    (u) => u.ownerPlayerId !== unit.ownerPlayerId && u.position.row === unit.position.row
  );
  if (blockers.length === 0) return null;
  if (blockers.length === 1) return blockers[0];
  return unit.position.column < config.boardColumns / 2
    ? blockers.sort((a, b) => a.position.column - b.position.column)[0]
    : blockers.sort((a, b) => b.position.column - a.position.column)[0];
}

function isValidTarget(unit: UnitDeployed, target: UnitDeployed | Land | Player): boolean {
  const validTargets = validAttackTargets(unit);
  return validTargets.some((t) => t === target);
}

export function attackUnit(unit: UnitDeployed, target: UnitDeployed) {
  if (!isValidTarget(unit, target)) {
    throw new Error('Invalid attack target');
  }
  useRage(unit);

  let attackedUnits = [target];
  if (unit.keywords?.cleave) {
    attackedUnits = attackedUnits.concat(getAdjacentUnitsInColumn(target));
  }
  if (unit.keywords?.lance) {
    attackedUnits = attackedUnits.concat(getAdjacentAlliesInRow(target));
  }

  attackedUnits.forEach((attackedUnit) => {
    const preventedDamage = (!unit.keywords?.armorPiercing && attackedUnit.keywords?.armor) || 0;
    const dealtDamage = unit.power - preventedDamage;
    const excessDamage = dealtDamage - attackedUnit.health;
    if (unit.keywords?.poisonous) {
      attackedUnit.statuses.poison = (attackedUnit.statuses.poison || 0) + unit.keywords.poisonous;
    }
    const wasDestroyed = damageUnit(attackedUnit, dealtDamage, true);
    if (!wasDestroyed && attackedUnit.retaliate && !unit.keywords?.ranged) {
      damageUnit(unit, attackedUnit.retaliate, true);
    }
    if (excessDamage && unit.keywords?.trample) {
      const nextUnit = getClosestBlocker(unit);
      if (nextUnit) {
        damageUnit(nextUnit, excessDamage);
      } else {
        damageLand(bs.players[attackedUnit.ownerPlayerId].lands[unit.position.row], excessDamage);
      }
    }
  });
  onCombatResolution(unit, target);
  recordUnitHasAttacked(unit);
}

export function attackLand(unit: UnitDeployed, target: Land) {
  if (!isValidTarget(unit, target)) {
    throw new Error('Invalid attack target');
  }
  useRage(unit);
  const wasDestroyed = damageLand(target, unit.power);
  if (!wasDestroyed && target.retaliate) {
    damageUnit(unit, target.retaliate);
  }
  const excessDamage = unit.power - target.health;
  if (excessDamage && unit.keywords?.trample) {
    damagePlayer(bs.players[target.ownerPlayerId], excessDamage);
  }
  onCombatResolution(unit, target);
  onUnitReach(unit);
  recordUnitHasAttacked(unit);
}

export function attackPlayer(unit: UnitDeployed, playerId: number) {
  const targetPlayer = bs.players[playerId];
  if (!isValidTarget(unit, targetPlayer)) {
    throw new Error('Invalid attack target');
  }

  useRage(unit);
  damagePlayer(targetPlayer, unit.power);
  onCombatResolution(unit, targetPlayer);
  onUnitReach(unit);
  recordUnitHasAttacked(unit);
}

function recordUnitHasAttacked(unit: UnitDeployed) {
  // Update unit state
  unit.hasAttacked = true;
  if (!unit.keywords?.moveAndAttack || unit.hasMoved) {
    unit.exhausted = true;
  }
  if (!uiState.isHeadless) {
    // Play attack sound based on unit power
    soundManager.playAttackSound(unit.power);
    // Trigger attack animation
    uiState.battle.attackingUnitId = unit.instanceId;
    // Reset animation after a short delay
    setTimeout(() => {
      uiState.battle.attackingUnitId = null;
    }, 300);
  }
}

export function autoAttack(unit: UnitDeployed) {
  if (!canAttack(unit)) {
    return;
  }
  const validTargets = validAttackTargets(unit);
  if (!validTargets || validTargets.length === 0) return;
  if (isAttackingUnitDeployed(validTargets[0])) {
    attackUnit(unit, validTargets[0]);
    return;
  }
  if (isAttackingLand(validTargets[0])) {
    attackLand(unit, validTargets[0]);
    return;
  }
  if (isAttackingPlayer(validTargets[0])) {
    attackPlayer(unit, validTargets[0].id);
    return;
  }
}

function useRage(unit: UnitDeployed) {
  if (unit.counters?.rage) {
    applyTemporaryEffect(unit, { power: unit.counters.rage });
    unit.counters.rage = 0;
  }
}

export function fightUnit(unit1: UnitDeployed, unit2: UnitDeployed) {
  const preventedDamage = (!unit1.keywords?.armorPiercing && unit2.keywords?.armor) || 0;
  const dealtDamage = unit1.power - preventedDamage;
  const retaliation = unit2.retaliate;
  if (retaliation) {
    damageUnit(unit1, retaliation);
  }
  damageUnit(unit2, dealtDamage);
}
