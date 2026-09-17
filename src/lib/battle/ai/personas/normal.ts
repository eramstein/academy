import {
  AiTurnGoal,
  CardType,
  type Card,
  type Land,
  type Player,
  type SpellCard,
  type UnitCard,
  type UnitDeployed,
} from '@/lib/_model';
import { bs } from '@/lib/_state';
import { getRandomFromArray } from '../../../_utils/random';
import { getEmptyCells } from '../../boards';
import { attackLand, attackPlayer, attackUnit } from '../../combat';
import { moveUnit } from '../../move';
import { playSpell } from '../../spell';
import { deployUnit, getAdjacentUnitsInColumn, getClosestEnnemyInRow } from '../../unit';
import type { PossibleActions } from '../model';
import { type AiPersona } from '../model';
import { spellWouldKillUnit } from '../spells';
import { selectAiSpellTargets } from '../target';
import { isAttackTargetLand, isAttackTargetPlayer, isAttackTargetUnit } from '../type-checks';
import { getHighestValueTarget } from '../valuations/attack';
import { getCounterAttackValue } from '../valuations/counter-attack';
import { getHighestMoveValue, getHighestMoveValueInRow } from '../valuations/move';
import { valueUnit, wouldBeDestroyed } from '../valuations/unit';

export const AiPersonaNormal: AiPersona = {
  executeAction(possibleActions: PossibleActions) {
    // TODO: for now we give arbitrary priority to cards in hand vs units in play
    // it is usually preferable to play spells first but not always
    // ideally we would evaluate all options together, e.g. clear a blocker before attacking
    if (handleCardsToPlay(possibleActions)) return true;
    if (handleDeployedUnits(possibleActions)) return true;
    return false;
  },
};

function handleCardsToPlay(possibleActions: PossibleActions): boolean {
  // LethalAttackRow: deploy strongest haste into the winning row before other plays
  const lethalGoal = bs.aiState.goals.find((g) => g.goal === AiTurnGoal.LethalAttackRow);
  if (lethalGoal && possibleActions.deployableUnits.length > 0) {
    const hasteUnits = possibleActions.deployableUnits
      .filter((u) => u.keywords?.haste)
      .sort((a, b) => b.power - a.power);
    if (hasteUnits.length > 0) {
      const bestPosition = getHighestMoveValueInRow(
        hasteUnits[0] as UnitDeployed,
        lethalGoal.args.row
      );
      if (bestPosition && bestPosition.value > -Infinity) {
        deployUnit(hasteUnits[0], bestPosition.cell);
        return true;
      }
    }
  }

  // priority 1: cards that match a goal
  if (bs.aiState.goals.length > 0) {
    for (const goalEntry of bs.aiState.goals) {
      const matchingSpells = possibleActions.playableSpells.filter((spell) =>
        spell.aiHints?.includes(goalEntry.goal)
      );
      const best = selectBestSpellForGoal(goalEntry.goal, goalEntry.args, matchingSpells);
      if (best) {
        const targets = selectAiSpellTargets(best);
        if (targets) {
          playSpell(best, targets);
          return true;
        } else {
          bs.aiState.dismissedCards[best.id] = true;
        }
      }
    }
    for (const goalEntry of bs.aiState.goals) {
      const matchingUnits = possibleActions.deployableUnits
        .filter((unit) => unit.aiHints?.includes(goalEntry.goal))
        .sort((a, b) => b.cost - a.cost);
      for (const unit of matchingUnits) {
        const bestPosition =
          goalEntry.goal === AiTurnGoal.BreachRow ||
          goalEntry.goal === AiTurnGoal.LethalAttackRow
            ? getHighestMoveValueInRow(unit as UnitDeployed, goalEntry.args.row)
            : getHighestMoveValue(unit as UnitDeployed);
        if (bestPosition) {
          deployUnit(unit, bestPosition.cell);
          return true;
        }
      }
    }
  }
  // priority 2: highest mana cost card (we assume for now it's the best value)
  const possiblePositions = getEmptyCells(false);
  // for board clear spells we do them only in the step before if it was a goal
  const spellsToConsider = possibleActions.playableSpells.filter((spell) => {
    return !spell.aiHints?.some((hint) => hint === AiTurnGoal.Reset);
  });
  let cardsToConsider: Card[] = [...spellsToConsider];
  if (possiblePositions.length > 0) {
    cardsToConsider = cardsToConsider.concat(possibleActions.deployableUnits);
  }
  if (cardsToConsider.length === 0) return false;
  const cardToPlay = cardsToConsider.sort((a, b) => b.cost - a.cost)[0];
  if (cardToPlay.type === CardType.Unit) {
    const bestPosition = getHighestMoveValue(cardToPlay as UnitDeployed);
    if (bestPosition) {
      deployUnit(cardToPlay as UnitCard, bestPosition.cell);
      return true;
    }
  }
  if (cardToPlay.type === CardType.Spell) {
    const targets = selectAiSpellTargets(cardToPlay as SpellCard);
    if (targets) {
      playSpell(cardToPlay as SpellCard, targets);
      return true;
    } else {
      bs.aiState.dismissedCards[cardToPlay.id] = true;
    }
  }
  return false;
}

function selectBestSpellForGoal(
  goal: AiTurnGoal,
  args: any,
  spells: SpellCard[]
): SpellCard | null {
  if (spells.length === 0) return null;
  if (goal === AiTurnGoal.RemoveUnit) {
    return selectBestSpellForRemoveUnit(args.unit as UnitDeployed, spells);
  }
  // default: cheapest spell
  return spells.slice().sort((a, b) => a.cost - b.cost)[0];
}

function selectBestSpellForRemoveUnit(unit: UnitDeployed, spells: SpellCard[]): SpellCard | null {
  const killers = spells.filter((s) => spellWouldKillUnit(s, unit) >= 1);
  if (killers.length > 0) {
    // prefer the cheapest kill
    return killers.slice().sort((a, b) => a.cost - b.cost)[0];
  }
  // no kill available: pick the spell that deals the most damage
  return spells
    .slice()
    .sort((a, b) => spellWouldKillUnit(b, unit) - spellWouldKillUnit(a, unit))[0];
}

function handleDeployedUnits(possibleActions: PossibleActions): boolean {
  // Move the strongest moveAndAttack unit into a BreachRow / LethalAttackRow target
  const rowGoal = bs.aiState.goals.find(
    (g) => g.goal === AiTurnGoal.BreachRow || g.goal === AiTurnGoal.LethalAttackRow
  );
  if (rowGoal && possibleActions.unitsWhoCanAttack?.length > 0) {
    const candidates = possibleActions.unitsWhoCanAttack.filter(
      (u) =>
        u.keywords?.moveAndAttack &&
        u.position.row !== rowGoal.args.row &&
        possibleActions.unitsWhoCanMove?.some((m) => m.id === u.id)
    );
    if (candidates.length > 0) {
      const strongest = candidates.slice().sort((a, b) => b.power - a.power)[0];
      const bestPosition = getHighestMoveValueInRow(strongest, rowGoal.args.row);
      if (bestPosition && bestPosition.value > -Infinity) {
        moveUnit(strongest, bestPosition.cell);
        return true;
      }
    }
  }

  if (possibleActions.unitsWhoCanAttack?.length > 0) {
    const unit = getUnitWhoShouldAttackFirst(possibleActions.unitsWhoCanAttack);
    const canAlsoMove = possibleActions.unitsWhoCanMove?.findIndex((u) => u.id === unit.id) !== -1;
    attackOrMove(unit, canAlsoMove);
    return true;
  }
  if (possibleActions.unitsWhoCanMove?.length > 0) {
    const possiblePositions = getEmptyCells(false);
    if (possiblePositions.length === 0) return false;
    const mover = getRandomFromArray(possibleActions.unitsWhoCanMove);
    const bestMove = getHighestMoveValue(mover);
    if (bestMove) {
      moveUnit(mover, bestMove.cell);
      return true;
    }
  }
  return false;
}

// figure out whether to attack or move based on expected values
// TODO: use current AiStrategy to weight alternatives
function attackOrMove(unit: UnitDeployed, canAlsoMove: boolean) {
  const bestAttack = getHighestValueTarget(unit);
  let bestAttackValue = bestAttack.value;
  if (
    bestAttack.target &&
    isAttackTargetUnit(bestAttack.target) &&
    !wouldBeDestroyed(bestAttack.target as UnitDeployed, unit)
  ) {
    bestAttackValue = valueUnit(bestAttack.target as UnitDeployed) / 2;
  }
  let counterAttackValue = 0;
  if (bestAttack.target && isAttackTargetUnit(bestAttack.target)) {
    counterAttackValue = getCounterAttackValue(unit, bestAttack.target as UnitDeployed);
  }
  const attackValue = bestAttackValue - counterAttackValue;
  const bestMove = getHighestMoveValue(unit);
  const counterattackAfterBestMove = bestMove
    ? getCounterAttackValue({ ...unit, position: bestMove.cell })
    : 0;

  if (
    !bestMove ||
    !canAlsoMove ||
    bestMove.value === -Infinity ||
    (attackValue >= -counterattackAfterBestMove && bestMove.value !== Infinity)
  ) {
    if (isAttackTargetUnit(bestAttack.target as UnitDeployed)) {
      attackUnit(unit, bestAttack.target as UnitDeployed);
    } else if (isAttackTargetLand(bestAttack.target as Land)) {
      attackLand(unit, bestAttack.target as Land);
    } else if (isAttackTargetPlayer(bestAttack.target as Player)) {
      attackPlayer(unit, bestAttack.target!.id as number);
    }
  } else if (canAlsoMove) {
    moveUnit(unit, bestMove.cell);
  }
}

// if there are allies in the same row, attack in the correct order which doesn't overkill a blocker
function getUnitWhoShouldAttackFirst(unitsWhoCanAttack: UnitDeployed[]): UnitDeployed {
  const unit = getRandomFromArray(unitsWhoCanAttack);
  const attackersInSameRow = unitsWhoCanAttack?.filter((u) => u.position.row === unit.position.row);

  // if there is only one attacker in the row, or if there are no blockers, just attack
  // ------------------------------------------------------------------------------------
  if (attackersInSameRow.length === 1) {
    return unit;
  }
  const blockers = bs.units.filter(
    (u) => u.ownerPlayerId !== unit.ownerPlayerId && u.position.row === unit.position.row
  );
  if (blockers.length === 0) {
    return unit;
  }

  // else, considering attacking with the other attacker in the row
  // ------------------------------------------------------------------------------------

  // if an attacker has lance and there are several blockers, use it
  const lanceAttackers = attackersInSameRow.filter((u) => u.keywords?.lance);
  if (lanceAttackers.length > 0 && blockers.length > 1) {
    return lanceAttackers[0];
  }

  // if an attacker has cleave and the closest blocker has neighbors above or below, use it
  const cleaveAttackers = attackersInSameRow.filter((u) => u.keywords?.cleave);
  if (cleaveAttackers.length > 0) {
    const closestBlocker = getClosestEnnemyInRow(unit);
    if (closestBlocker) {
      const neighbors = getAdjacentUnitsInColumn(closestBlocker);
      if (neighbors.length > 0) {
        return cleaveAttackers[0];
      }
    }
  }

  // can our smallest attacker kill the front blocker? if yes do it, else attack with the big one
  const frontBlocker = blockers.sort((a, b) => b.position.column - a.position.column)[0];
  const smallestAttacker = attackersInSameRow.sort((a, b) => a.power - b.power)[0];
  const biggestAttacker = attackersInSameRow.sort((a, b) => a.power - b.power)[1];
  if (wouldBeDestroyed(frontBlocker, smallestAttacker)) {
    return smallestAttacker;
  } else {
    return biggestAttacker;
  }
}
