import { config } from '../_config';
import type { Player, Position } from '../_model';
import { bs } from '../_state';

// unique string identifier for a position
export function getPositionKey(position: Position) {
  return `${position.row}-${position.column}`;
}

export function isCellFree(position: Position) {
  if (!position) return false;
  return !bs.units.some(
    (unit) => unit.position.row === position.row && unit.position.column === position.column
  );
}

export function isOnPlayersSide(position: Position, playerId: number) {
  if (playerId === 0) {
    return position.column < config.boardColumns / 2;
  }
  return position.column >= config.boardColumns / 2;
}

export function positionPlayerId(position: Position) {
  return position.column < config.boardColumns / 2 ? 0 : 1;
}

export function isBoardSizeFull(player: Player): boolean {
  return (
    bs.units.filter((u) => u.ownerPlayerId === player.id).length ===
    (config.boardColumns * config.boardRows) / 2
  );
}

export function getEmptyCells(isPlayer: boolean): Position[] {
  const positions: Position[] = [];
  // Determine which columns to check based on unit's side
  const startCol = isPlayer ? 0 : config.boardColumns / 2;
  const endCol = isPlayer ? config.boardColumns / 2 : config.boardColumns;

  // Iterate through only the relevant columns
  for (let row = 0; row < config.boardRows; row++) {
    for (let col = startCol; col < endCol; col++) {
      const position = { row, column: col };

      // Check if the cell is free
      if (isCellFree(position)) {
        positions.push(position);
      }
    }
  }
  return positions;
}
export function getRandomEmptyAlliedCells(isPlayer: boolean, count: number = 1): Position[] {
  const emptyCells = getEmptyCells(isPlayer);
  const alliedCells = emptyCells.filter((cell) => isOnPlayersSide(cell, isPlayer ? 0 : 1));
  return alliedCells.sort(() => Math.random() - 0.5).slice(0, count);
}

export function getAllPositions(): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < config.boardRows; row++) {
    for (let col = 0; col < config.boardColumns; col++) {
      positions.push({ row, column: col });
    }
  }
  return positions;
}
