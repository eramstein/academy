import type { Position, StatusType, UnitCard, UnitCardTemplate, UnitDeployed } from '@/lib/_model';
import { config } from '../_config';
import { bs } from '../_state';
import { uiState } from '../_state/state-ui.svelte';
import { clearUnitStaticAbilities } from './ability-static';
import { isCellFree, isOnPlayersSide } from './boards';
import { isPayable, payCost } from './cost';
import { onDamageUnit, onDeployUnit, onUnitDeath } from './listeners';
import { soundManager } from './sound';

export function deployUnit(unit: UnitCard, position: Position) {
  // Check and pay costs
  if (!isPayable(unit) || !isCellFree(position) || !isOnPlayersSide(position, unit.ownerPlayerId)) {
    return;
  }
  payCost(unit);

  // Create and deploy unit
  bs.units.push(makeDeployedUnit(unit, position));
  bs.players[unit.ownerPlayerId].hand = bs.players[unit.ownerPlayerId].hand.filter(
    (card) => card.instanceId !== unit.instanceId
  );

  if (!uiState.isHeadless) {
    // Play deploy sound
    soundManager.playDeploySound();
  }

  // Trigger activated abilities
  onDeployUnit(bs.units[bs.units.length - 1]);
}

export function makeUnit(leaderIndex: number, core: UnitCardTemplate): UnitCard {
  return {
    ...core,
    ownerPlayerId: leaderIndex,
    instanceId: Math.floor(Date.now() * Math.random()).toString(),
  };
}

export function summonUnit(unit: UnitCard, targetPosition: Position) {
  const unitDeployed = makeDeployedUnit(unit, targetPosition);
  bs.units.push(unitDeployed);
}

export function makeDeployedUnit(unit: UnitCard, position: Position) {
  return {
    ...unit,
    position,
    health: unit.maxHealth,
    hasAttacked: false,
    hasMoved: false,
    exhausted: !unit.keywords?.haste,
    statuses: {},
    untilEndOfTurn: {},
    staticModifiers: [],
    counters: {},
    isDying: false,
  };
}

export function isUnitActive(unit: UnitDeployed) {
  return !unit.exhausted;
}

export function damageUnit(unit: UnitDeployed, damage: number, isCombatDamage = false): boolean {
  let damageDealt = damage - ((!isCombatDamage && unit.keywords?.resist) || 0);
  if (damageDealt < 0) {
    damageDealt = 0;
  }
  if (unit.statuses.mezz && damageDealt > 0) {
    unit.statuses.mezz = 0;
  }
  onDamageUnit(unit, damageDealt, isCombatDamage);
  unit.health -= damageDealt;
  if (unit.health <= 0) {
    destroyUnit(unit);
    return true;
  }
  return false;
}

export function healUnit(unit: UnitDeployed, amount: number) {
  unit.health += amount;
  if (unit.health > unit.maxHealth) {
    unit.health = unit.maxHealth;
  }
}

export function destroyUnit(unit: UnitDeployed) {
  // prevent infinite loop in case the onUnitDeath triggers the same unit to die again
  if (unit.isDying) {
    return;
  }
  unit.isDying = true;
  bs.players[unit.ownerPlayerId].graveyard.push(unit);
  onUnitDeath(unit);
  clearUnitStaticAbilities(unit);
  bs.units = bs.units.filter((u) => u.instanceId !== unit.instanceId);
}

export function getAdjacentUnits(position: Position): UnitDeployed[] {
  return bs.units.filter(
    (u) =>
      (u.position.column === position.column - 1 && u.position.row === position.row) ||
      (u.position.column === position.column + 1 && u.position.row === position.row) ||
      (u.position.column === position.column && u.position.row === position.row - 1) ||
      (u.position.column === position.column && u.position.row === position.row + 1)
  );
}

export function getAdjacentUnitsInColumn(unit: UnitDeployed): UnitDeployed[] {
  return bs.units.filter(
    (u) =>
      u.position.column === unit.position.column &&
      (u.position.row === unit.position.row + 1 || u.position.row === unit.position.row - 1)
  );
}

export function getAdjacentAlliesInRow(unit: UnitDeployed): UnitDeployed[] {
  return bs.units.filter(
    (u) =>
      u.position.row === unit.position.row &&
      (u.position.column === unit.position.column + 1 ||
        u.position.column === unit.position.column - 1) &&
      u.ownerPlayerId === unit.ownerPlayerId
  );
}

export function getClosestEnnemyInRow(unit: UnitDeployed): UnitDeployed | undefined {
  const ennemiesInRow = bs.units.filter(
    (u) => u.ownerPlayerId !== unit.ownerPlayerId && u.position.row === unit.position.row
  );
  if (ennemiesInRow.length === 0) {
    return undefined;
  }
  return ennemiesInRow.sort(
    (a, b) =>
      Math.abs(unit.position.column - a.position.column) -
      Math.abs(unit.position.column - b.position.column)
  )[0];
}

export function getOwnUnits(playerId: number): UnitDeployed[] {
  return bs.units.filter((u) => u.ownerPlayerId === playerId);
}

export function getEnnemyUnits(playerId: number): UnitDeployed[] {
  return bs.units.filter((u) => u.ownerPlayerId !== playerId);
}

export function getEnnemyUnitsInRow(unit: UnitDeployed): UnitDeployed[] {
  return bs.units.filter(
    (u) => u.ownerPlayerId !== unit.ownerPlayerId && u.position?.row === unit.position?.row
  );
}

export function applyUnitStatus(unit: UnitDeployed, status: StatusType, duration: number) {
  if (!unit.statuses[status]) {
    unit.statuses[status] = 0;
  }
  unit.statuses[status] = (unit.statuses[status] || 0) + duration;
}

export const modifyUnitHealth = (unit: UnitDeployed, amount: number) => {
  unit.health += amount;
  unit.maxHealth += amount;
  if (unit.health > unit.maxHealth) {
    unit.health = unit.maxHealth;
  }
  if (unit.health <= 0) {
    destroyUnit(unit);
  }
};

export function refreshUnit(unit: UnitDeployed) {
  unit.exhausted = false;
}

export function bounceUnit(unit: UnitDeployed) {
  clearUnitStaticAbilities(unit);
  bs.units = bs.units.filter((u) => u.instanceId !== unit.instanceId);
  bs.players[unit.ownerPlayerId].hand.push(unit);
}

export function controlUnit(unit: UnitDeployed, position: Position) {
  const positionOwnerPlayerId = position.column < config.boardColumns / 2 ? 0 : 1;
  unit.ownerPlayerId = positionOwnerPlayerId;
  unit.position = position;
}
