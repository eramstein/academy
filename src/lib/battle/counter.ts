import { CounterType } from '../_model';
import type { UnitDeployed } from '../_model/model-battle';
import { modifyUnitHealth } from './unit';

export function addCounters(unit: UnitDeployed, counterType: CounterType, value: number) {
  unit.counters[counterType] = (unit.counters[counterType] || 0) + value;

  switch (counterType) {
    case CounterType.Growth:
      unit.power += value;
      modifyUnitHealth(unit, value);
      break;
    case CounterType.Decay:
      unit.power -= value;
      modifyUnitHealth(unit, -value);
      break;
  }
}

export function removeCounters(unit: UnitDeployed, counterType: CounterType, value: number) {
  unit.counters[counterType] = (unit.counters[counterType] || 0) - value;

  switch (counterType) {
    case CounterType.Growth:
      unit.power -= value;
      modifyUnitHealth(unit, -value);
      break;
    case CounterType.Decay:
      unit.power += value;
      modifyUnitHealth(unit, value);
      break;
  }
}

export function removeAllCounters(unit: UnitDeployed) {
  if (unit.counters.growth) {
    removeCounters(unit, CounterType.Growth, unit.counters.growth);
  }
  if (unit.counters.decay) {
    removeCounters(unit, CounterType.Decay, unit.counters.decay);
  }
  unit.counters = {};
}
