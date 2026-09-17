import { type Land, type Player, type UnitDeployed } from '@/lib/_model';
import { validAttackTargets } from '../../combat';
import { isAttackTargetLand, isAttackTargetUnit } from '../type-checks';
import { landDestructionValue, landLifeValue, playerLifeValue } from './config';
import { valueUnit, wouldBeDestroyed } from './unit';

export function getHighestValueTarget(attacker: UnitDeployed): {
  value: number;
  target: UnitDeployed | Land | Player | null;
} {
  const validTargets = validAttackTargets(attacker);
  if (validTargets.length === 0) {
    return { value: 0, target: null };
  }
  return pickTarget(attacker, validTargets);
}

// TODO: take retaliate and armor in consideration

function pickTarget(
  attacker: UnitDeployed,
  targets: (UnitDeployed | Land | Player)[]
): { target: UnitDeployed | Land | Player | null; value: number } {
  const playerTarget = targets.filter((t) => 'isPlayer' in t);
  const playerValue = playerTarget.length
    ? playerTarget[0].life <= attacker.power
      ? Infinity
      : attacker.power * playerLifeValue
    : -1;

  const landTargets: Land[] = targets.filter((t) => isAttackTargetLand(t)) as Land[];
  const landValue = landTargets.length
    ? landTargets[0].health <= attacker.power
      ? landDestructionValue
      : attacker.power * landLifeValue
    : -1;

  const unitTargets: UnitDeployed[] = targets.filter((t) =>
    isAttackTargetUnit(t)
  ) as UnitDeployed[];
  const unitTargetsValues = unitTargets
    .map((t) => {
      const wouldBeDestroyedFactor = wouldBeDestroyed(t, attacker) ? 2 : 1;
      return { value: valueUnit(t) * wouldBeDestroyedFactor, target: t };
    })
    .sort((a, b) => b.value - a.value);
  const unitValue = unitTargetsValues.length ? unitTargetsValues[0].value : -1;

  const maxValue = Math.max(playerValue, landValue, unitValue);

  if (maxValue === -1) {
    return { target: null, value: 0 };
  }

  if (maxValue === playerValue) {
    return { target: playerTarget[0], value: playerValue };
  } else if (maxValue === landValue) {
    return { target: landTargets[0], value: landValue };
  } else {
    return { target: unitTargetsValues[0].target, value: unitValue };
  }
}
