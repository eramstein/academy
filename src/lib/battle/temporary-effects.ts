import type { UnitDeployed, UnitEndOfTurnEffects, UnitKeywords } from '../_model';

export function applyTemporaryEffect(unit: UnitDeployed, effect: UnitEndOfTurnEffects) {
  console.log('applyTemporaryEffect', unit, effect);

  Object.keys(effect).forEach((key) => {
    const value = effect[key as keyof UnitEndOfTurnEffects];
    if (key === 'power' || key === 'retaliate') {
      unit[key] += value as number;
      unit.untilEndOfTurn[key] = value as number;
    } else {
      if (!unit.keywords) {
        unit.keywords = {};
      }
      if (value === true) {
        // boolean
        // if the unit already had that keyword, do nothing (else it gets removed EOT)
        if (unit.keywords[key as keyof UnitKeywords] !== true) {
          (unit.keywords as any)[key] = true;
          (unit.untilEndOfTurn as any)[key] = true;
        }
        // numeric
      } else {
        (unit.keywords as any)[key] += value;
        (unit.untilEndOfTurn as any)[key] = value;
      }
    }
  });
}

export function removeTemporaryEffects(unit: UnitDeployed) {
  Object.keys(unit.untilEndOfTurn).forEach((key) => {
    const value = (unit.untilEndOfTurn as any)[key];
    if (key === 'power' || key === 'retaliate') {
      unit[key] -= (value || 0) as number;
    } else {
      if (value === true) {
        (unit.keywords as any)[key] = false;
      } else {
        (unit.keywords as any)[key] -= value;
      }
    }
  });
  unit.untilEndOfTurn = {};
}

export function getTemporaryEffectLabel(effect: UnitEndOfTurnEffects) {
  return Object.keys(effect).map((key) => {
    const value = effect[key as keyof UnitEndOfTurnEffects];
    if (key === 'power' || key === 'retaliate') {
      return `+${value} ${key}`;
    }
    return `${key} ${value === true ? '' : value}`;
  }).join(', ');
}