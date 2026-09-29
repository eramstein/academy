import { config } from '@/lib/_config/config';
import { isUnitCard, type BattleState, type UnitCard, type UnitDeployed } from '@/lib/_model';
import { canAttack } from '../combat';
import { canMove } from '../move';
import { AI_PLAYER_ID, HUMAN_PLAYER_ID } from './model';
import { landDestructionValue, landLifeValue, playerLifeValue } from './valuations/config';
import { getDamagePotential, getNonUnitDamagePotential } from './valuations/unit';

function unitsOf(state: BattleState, playerId: number, except?: UnitDeployed): UnitDeployed[] {
  return state.units.filter(
    (unit) => unit.ownerPlayerId === playerId && (!except || unit.instanceId !== except.instanceId)
  );
}

function powerByRow(units: UnitDeployed[], includeCleave: boolean): Record<number, number> {
  return units.reduce(
    (acc, unit) => {
      const damage = includeCleave ? getDamagePotential(unit) : getNonUnitDamagePotential(unit);
      acc[unit.position.row] = (acc[unit.position.row] || 0) + damage;
      if (includeCleave && unit.keywords?.cleave) {
        acc[unit.position.row - 1] = (acc[unit.position.row - 1] || 0) + damage;
        acc[unit.position.row + 1] = (acc[unit.position.row + 1] || 0) + damage;
      }
      return acc;
    },
    {} as Record<number, number>
  );
}

export function getOpponentUnitDamagePerRow(state: BattleState): Record<number, number> {
  return powerByRow(unitsOf(state, HUMAN_PLAYER_ID), true);
}

export function getOpponentCountPerRow(state: BattleState): Record<number, number> {
  return unitsOf(state, HUMAN_PLAYER_ID).reduce(
    (acc, unit) => {
      acc[unit.position.row] = (acc[unit.position.row] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );
}

export function getAlliedHealthPerRow(
  state: BattleState,
  unitWhoWouldMove?: UnitDeployed
): Record<number, number> {
  return unitsOf(state, AI_PLAYER_ID, unitWhoWouldMove).reduce(
    (acc, unit) => {
      acc[unit.position.row] = (acc[unit.position.row] || 0) + unit.health;
      return acc;
    },
    {} as Record<number, number>
  );
}

/** Queue hint only. Compares total power to total health on `state`. */
export function getDangerLevelPerRow(
  state: BattleState,
  unitWhoWouldMove?: UnitDeployed
): Record<number, number> {
  const health = getAlliedHealthPerRow(state, unitWhoWouldMove);
  const power = powerByRow(unitsOf(state, HUMAN_PLAYER_ID), false);
  const player = state.players[AI_PLAYER_ID];
  const dangerLevels: Record<number, number> = {};
  for (let row = 0; row < config.boardRows; row++) {
    const diff = (power[row] ?? 0) - (health[row] ?? 0);
    if (diff <= 0) {
      dangerLevels[row] = 0;
      continue;
    }
    const landInRow = player.lands.find((land) => land.position === row && !land.isRuined);
    if (landInRow) {
      dangerLevels[row] =
        landInRow.health <= (power[row] ?? 0) ? landDestructionValue : landLifeValue;
    } else {
      dangerLevels[row] = player.life <= (power[row] ?? 0) ? Infinity : playerLifeValue;
    }
  }
  return dangerLevels;
}

export function lookForLethalRow(state: BattleState): number | null {
  const opponent = state.players[HUMAN_PLAYER_ID];
  const ai = state.players[AI_PLAYER_ID];
  const alliedPower = powerByRow(unitsOf(state, AI_PLAYER_ID), false);
  for (let row = 0; row < config.boardRows; row++) {
    const hasteUnitsMaxPower = ai.hand
      .filter((card) => isUnitCard(card) && card.keywords?.haste)
      .reduce((max, card) => Math.max(max, (card as UnitCard).power), 0);
    const moveAndAttackUnitsMaxPower = state.units
      .filter(
        (unit) =>
          unit.ownerPlayerId === AI_PLAYER_ID &&
          unit.keywords?.moveAndAttack &&
          canMove(unit) &&
          canAttack(unit)
      )
      .reduce((max, unit) => Math.max(max, unit.power), 0);
    const powerInRow = alliedPower[row] ?? 0;
    if (powerInRow + hasteUnitsMaxPower + moveAndAttackUnitsMaxPower < opponent.life) {
      continue;
    }
    const land = opponent.lands.find((entry) => entry.position === row);
    if (!land || land.health + opponent.life <= powerInRow) return row;
  }
  return null;
}
