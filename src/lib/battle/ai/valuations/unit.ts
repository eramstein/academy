import { TriggerType, type SpellCard, type UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { getCardBudget } from '@/lib/sim/cards/card-budget';
import { simulatedNextTurn } from '../ai';

export function valueUnit(unit: UnitDeployed) {
  const baseValue = getCardBudget(unit);
  // damaged units are worth less
  const damageDiscount = (unit.maxHealth - unit.health) / (unit.maxHealth || 1) < 0.5 ? 0.5 : 1;
  // units which already used onDeploy effects are worth less
  const onDeployDiscount = unit.abilities?.some(
    (ability) => ability.trigger.type === TriggerType.OnDeploy
  )
    ? 0.5
    : 1;
  return baseValue * damageDiscount * onDeployDiscount;
}

export function getDamagePotential(unit: UnitDeployed): number {
  return getNonUnitDamagePotential(unit) + (unit.keywords?.poisonous || 0);
}

// this doesn't take into account damage that applies only to units like poison or decay counters
export function getNonUnitDamagePotential(unit: UnitDeployed): number {
  return unit.power + (unit.counters?.rage || 0);
}

export function wouldBeDestroyed(unit: UnitDeployed, attacker: UnitDeployed): boolean {
  return getDamagePotential(attacker) >= unit.health + (unit.keywords?.armor || 0);
}

export function wouldBeDestroyedBySpell(unit: UnitDeployed, spell: SpellCard) {
  let wouldBeDestroyed = false;
  spell.actions.forEach((action) => {
    if (action.effect.name === 'destroyUnit') {
      wouldBeDestroyed = true;
    }
    if (
      action.effect.name === 'damageUnit' &&
      action.effect.args.damage >= unit.health + (unit.keywords?.resist || 0)
    ) {
      wouldBeDestroyed = true;
    }
  });
  return wouldBeDestroyed;
}

export function wouldBeDestroyedByCounterAttack(
  unit: UnitDeployed,
  counterAttackers: UnitDeployed[]
) {
  let damage = 0;
  counterAttackers.forEach((attacker) => {
    damage += getDamagePotential(attacker) - (unit.keywords?.armor || 0);
  });
  return damage >= unit.health;
}

// returns total AI units values minus total player units values
export function valueBoard(): { abs: number; rel: number } {
  const playerId = (simulatedNextTurn ?? bs).players.filter((player) => player.isPlayer)[0].id;
  const aiUnits = (simulatedNextTurn ?? bs).units.filter((unit) => unit.ownerPlayerId !== playerId);
  const playerUnits = (simulatedNextTurn ?? bs).units.filter(
    (unit) => unit.ownerPlayerId === playerId
  );
  const aiUnitsValue = aiUnits.reduce((acc, unit) => acc + valueUnit(unit), 0);
  const playerUnitsValue = playerUnits.reduce((acc, unit) => acc + valueUnit(unit), 0);
  return {
    abs: aiUnitsValue - playerUnitsValue,
    rel: aiUnitsValue / (aiUnitsValue + playerUnitsValue),
  };
}
