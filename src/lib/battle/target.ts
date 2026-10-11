import {
  isUnitCard,
  TargetType,
  type Card,
  type EffectTargets,
  type Land,
  type Position,
  type SpellCard,
  type TargetDefinition,
  type UnitDeployed,
} from '../_model';
import { bs } from '../_state';
import { getAllPositions, getEmptyCells, getPositionKey } from './boards';
import { getAllDecksCards } from './deck';
import { getAllGraveyardsCards } from './graveyard';
import { getAllLands } from './land';
import { getHumanPlayer } from './player';

export function areAllTargetsValid(
  tentativeTargets: Card[] | UnitDeployed[] | Land[],
  validTargets: Card[] | UnitDeployed[] | Land[]
): boolean {
  if (validTargets === null) {
    return true;
  }
  for (let index = 0; index < tentativeTargets.length; index++) {
    const t = tentativeTargets[index];
    let found = false;
    validTargets.forEach((e) => {
      if (e.instanceId === t.instanceId) {
        found = true;
      }
    });
    return found;
  }
  return true;
}

export function areAllCellsValid(tentativeTargets: Position[], validTargets: Position[]): boolean {
  const validPositions: Record<string, Position> = {};
  validTargets.forEach((p) => {
    validPositions[getPositionKey(p)] = p;
  });
  for (let index = 0; index < tentativeTargets.length; index++) {
    if (!validPositions[getPositionKey(tentativeTargets[index])]) {
      return false;
    }
  }
  return true;
}

export function checkTargets(
  source: UnitDeployed | SpellCard | Land,
  targetDefinition: TargetDefinition,
  tentativeTargets: EffectTargets
): boolean {
  if (!targetDefinition) {
    return true;
  }
  if (targetDefinition.count && targetDefinition.count !== tentativeTargets.length) {
    console.log('WRONG NUMBER OF TARGETS', targetDefinition, tentativeTargets);
    return false;
  }
  const eligibleTargets = getEligibleTargets(source, targetDefinition);
  // target has an instanceId
  if (
    targetDefinition.type.includes('unit') ||
    targetDefinition.type === TargetType.Land ||
    targetDefinition.type === TargetType.GraveyardCard ||
    targetDefinition.type === TargetType.DeckCard
  ) {
    const targetsValid = areAllTargetsValid(
      tentativeTargets as Card[] | UnitDeployed[] | Land[],
      eligibleTargets as Card[] | UnitDeployed[] | Land[]
    );
    if (targetsValid === false) {
      return false;
    }
    return true;
  }
  // target is cells
  if (targetDefinition.type.includes('cell')) {
    const targetsValid = areAllCellsValid(
      tentativeTargets as Position[],
      eligibleTargets as Position[]
    );
    if (targetsValid === false) {
      console.log('INVALID CELLS', targetDefinition, tentativeTargets);
      return false;
    }
    return true;
  }
  return true;
}

export function getEligibleTargets(
  source: UnitDeployed | SpellCard | Land,
  target: TargetDefinition
): EffectTargets {
  if (!target) {
    return [];
  }
  if (isUnitCard(source) && target.type === TargetType.Self) {
    return [source];
  }
  let eligibleTargets: EffectTargets = [];
  if (target.type === TargetType.Units) {
    eligibleTargets = bs.units;
  }
  if (target.type === TargetType.Ennemies) {
    eligibleTargets = bs.units.filter((u) => u.ownerPlayerId !== source.ownerPlayerId);
  }
  if (target.type === TargetType.Allies) {
    eligibleTargets = bs.units.filter((u) => u.ownerPlayerId === source.ownerPlayerId);
  }
  if (target.type === TargetType.Cell) {
    eligibleTargets = getAllPositions();
  }
  if (target.type === TargetType.AllyCell) {
    eligibleTargets = [...getEmptyCells(true)];
  }
  if (target.type === TargetType.EnemyCell) {
    eligibleTargets = [...getEmptyCells(false)];
  }
  if (target.type === TargetType.EmptyCell) {
    eligibleTargets = [...getEmptyCells(true), ...getEmptyCells(false)];
  }
  if (target.type === TargetType.Land) {
    eligibleTargets = getAllLands();
  }
  if (target.type === TargetType.Player) {
    eligibleTargets = bs.players;
  }
  if (target.type === TargetType.HandCard) {
    eligibleTargets = getHumanPlayer().hand;
  }
  if (target.type === TargetType.GraveyardCard) {
    eligibleTargets = getAllGraveyardsCards();
  }
  if (target.type === TargetType.DeckCard) {
    eligibleTargets = getAllDecksCards();
  }
  return eligibleTargets;
}

export function getTargetLabel(target: TargetDefinition): string {
  const count = target.count ?? 1;
  const n = count > 1 ? `${count} ` : '';
  const s = count === 1 ? '' : 's';
  if (target.type === TargetType.Units) {
    return `to ${n}target unit${s}`;
  }
  if (target.type === TargetType.Ennemies) {
    return `to ${n}target ${count === 1 ? 'enemy' : 'enemies'}`;
  }
  if (target.type === TargetType.Allies) {
    return `to ${n}target ${count === 1 ? 'ally' : 'allies'}`;
  }
  if (target.type === TargetType.Cell) {
    return `to ${n}target cell${s}`;
  }
  if (target.type === TargetType.AllyCell) {
    return `to ${n}target allied cell${s}`;
  }
  if (target.type === TargetType.EnemyCell) {
    return `to ${n}target enemy cell${s}`;
  }
  if (target.type === TargetType.EmptyCell) {
    return `to ${n}target empty cell${s}`;
  }
  if (target.type === TargetType.Land) {
    return `to ${n}target land${s}`;
  }
  if (target.type === TargetType.GraveyardCard) {
    return `to ${n}target graveyard card${s}`;
  }
  if (target.type === TargetType.DeckCard) {
    return `to ${n}target deck card${s}`;
  }
  if (target.type === TargetType.Player) {
    return `to ${n}target player${s}`;
  }
  if (target.type === TargetType.HandCard) {
    return `${n}card${s} in hand`;
  }
  return '';
}
