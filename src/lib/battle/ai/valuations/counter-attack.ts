import type { UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { simulatedNextTurn } from '../ai';
import { unitLifeValue } from './config';
import { valueUnit, wouldBeDestroyed, wouldBeDestroyedByCounterAttack } from './unit';

// this evaluates how much value would be lost if the attacker doesn't move and gets counter attacked
// if attackTarget is set we assume we attack it first
export function getCounterAttackValue(attacker: UnitDeployed, attackTarget?: UnitDeployed) {
  const defenders = (simulatedNextTurn ?? bs).units
    .filter(
      (u) =>
        u.ownerPlayerId !== attacker.ownerPlayerId && u.position?.row === attacker.position?.row
    )
    .filter((defender) => {
      return (
        !attackTarget ||
        defender.instanceId !== attackTarget.instanceId ||
        !wouldBeDestroyed(attackTarget, attacker)
      );
    });
  const destroyed = wouldBeDestroyedByCounterAttack(attacker, defenders);
  if (destroyed) {
    return valueUnit(attacker);
  }
  if (attacker.retaliate && attackTarget) {
    return -attacker.retaliate * unitLifeValue * defenders.length;
  }
  return 0;
}
