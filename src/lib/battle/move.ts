import { config } from '../_config';
import type { Position, UnitDeployed } from '../_model/model-battle';
import { getPositionKey, isCellFree } from './boards';
import { onAfterMoveUnit, onBeforeMoveUnit } from './listeners';
import { isHumanPlayer, isUnitsTurn } from './player';

export function canMove(unit: UnitDeployed) {
  return (
    isUnitsTurn(unit) &&
    !unit.exhausted &&
    !unit.hasMoved &&
    !unit.statuses.stun &&
    !unit.statuses.mezz &&
    !unit.statuses.root &&
    !unit.keywords?.immobile
  );
}

export function validMoveTargets(unit: UnitDeployed): Record<string, boolean> {
  const targets: Record<string, boolean> = {};

  // Check if unit is on player's side
  const isOnPlayerSide = isHumanPlayer(unit.ownerPlayerId);

  // Determine which columns to check based on unit's side
  const startCol = isOnPlayerSide ? 0 : config.boardColumns / 2;
  const endCol = isOnPlayerSide ? config.boardColumns / 2 : config.boardColumns;

  // Iterate through only the relevant columns
  for (let row = 0; row < config.boardRows; row++) {
    for (let col = startCol; col < endCol; col++) {
      const position = { row, column: col };

      // Check if the cell is free
      if (isCellFree(position)) {
        targets[getPositionKey(position)] = true;
      }
    }
  }

  return targets;
}

export function moveUnit(unit: UnitDeployed, targetPosition: Position) {
  // check if possible
  if (!canMove(unit)) return;
  if (!validMoveTargets(unit)[getPositionKey(targetPosition)]) return;
  onBeforeMoveUnit(unit, targetPosition);
  // move unit
  unit.position = targetPosition;
  unit.hasMoved = true;
  if (!unit.keywords?.moveAndAttack || unit.hasAttacked) {
    unit.exhausted = true;
  }
  // triggers
  onAfterMoveUnit(unit, targetPosition);
}

export function forceMoveUnit(unit: UnitDeployed, targetPosition: Position) {
  const isOnPlayerSide = isHumanPlayer(unit.ownerPlayerId);
  if (!isOnPlayerSide) {
    if (targetPosition.column < config.boardColumns / 2) {
      console.log('Cannot move unit to column < config.boardColumns / 2', targetPosition);
      return;
    }
  } else {
    if (targetPosition.column >= config.boardColumns / 2) {
      console.log('Cannot move unit to column >= config.boardColumns / 2', targetPosition);
      return;
    }
  }
  onBeforeMoveUnit(unit, targetPosition);
  unit.position = targetPosition;
  onAfterMoveUnit(unit, targetPosition);
}
