import { CardType, CounterType, StatusType } from '@/lib/_model';
import type {
  Card,
  EffectArgs,
  Land,
  Position,
  TargetDefinition,
  UnitCard,
  UnitCardTemplate,
  UnitDeployed,
  UnitEndOfTurnEffects,
  UnitKeywords,
} from '@/lib/_model/model-battle';
import { bs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import {
  addCounters,
  addMana,
  addStaticKeyword,
  applyTemporaryEffect,
  applyUnitStatus,
  bounceUnit,
  clearUnitStaticAbilities,
  controlUnit,
  damagePlayer,
  damageUnit,
  destroyUnit,
  discard,
  drawCard,
  getClosestEnnemyInRow,
  getEmptyCells,
  getOpposingPlayer,
  getRandomEmptyAlliedCells,
  getTemporaryEffectLabel,
  healUnit,
  incrementColor,
  makeUnit,
  putToDeckBottom,
  refreshUnit,
  removeCounters,
  summonUnit,
  tutorCard,
  untapPlayer,
} from '@/lib/battle';
import { fightUnit } from '../combat';
import { getAllGraveyardsCards, reanimate, regrowCard } from '../graveyard';
import { damageLand, fortifyLand } from '../land';
import { forceMoveUnit } from '../move';
import { soundManager } from '../sound';
import { getTargetLabel } from '../target';
import { DynamicValue, DynamicValues } from './dynamic-values';
import { DataEffectPrimers } from './effect-primers';
import {
  getRangeLabel,
  getUnitFromTriggerParam,
  getUnitsInRange,
  type UnitFilterArgs,
} from './unit-filters';

export const DataEffectTemplates: Record<
  string,
  (args: any) => { fn: (p: EffectArgs) => void; label: (targets: TargetDefinition[]) => string }
> = {
  ...DataEffectPrimers,
  reanimate: () => ({
    fn: ({ unit, player, targets }) => {
      const playerId = player?.id ?? unit?.ownerPlayerId;
      const isPlayer = playerId === 0;
      const reanimatedUnit = (targets[0]?.[0] ||
        getRandomFromArray(getAllGraveyardsCards())) as UnitCard;
      const position = (targets[1]?.[0] || getRandomFromArray(getEmptyCells(isPlayer))) as Position;
      if (reanimatedUnit && position) {
        reanimate(reanimatedUnit, position, playerId);
      }
    },
    label: () => `Reanimate a unit to a position`,
  }),
  damagePlayer: ({
    damage,
    opposingPlayer = true,
  }: {
    damage: number;
    opposingPlayer?: boolean;
  }) => ({
    fn: ({ unit, player }) => {
      const targetPlayer = opposingPlayer
        ? getOpposingPlayer(player?.id ?? unit?.ownerPlayerId ?? 1)
        : player;
      console.log('damagePlayer', opposingPlayer, targetPlayer);
      damagePlayer(targetPlayer, damage);
    },
    label: () =>
      `${damage > 0 ? 'Deal' : 'Heal'} ${Math.abs(damage)} damage ${opposingPlayer ? 'to your opponent' : ''}.`,
  }),
  damageLand: ({ damage }: { damage: number }) => ({
    fn: ({ targets }) => {
      targets.forEach((t) => {
        damageLand(t as unknown as Land, damage);
      });
    },
    label: (targets: TargetDefinition[]) => {
      return `Deal ${damage} damage to ${getTargetLabel(targets[0])}`;
    },
  }),
  damageUnit: ({
    damage,
    range,
    fromTriggerParam,
    dynamicValue,
  }: {
    damage: number;
    range?: UnitFilterArgs;
    fromTriggerParam?: string;
    dynamicValue?: DynamicValue;
  }) => ({
    fn: ({ targets, unit, land, player, triggerParams }) => {
      const value = dynamicValue ? DynamicValues[dynamicValue]({ unit, player }) * damage : damage;
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = fromTriggerParam
        ? getUnitFromTriggerParam(triggerParams, fromTriggerParam)
        : getUnitsInRange(targets as UnitDeployed[][], range, sourcePermanent, player);
      unitsInRange.forEach((u) => {
        damageUnit(u, value);
      });
      soundManager.playDamageSound();
    },
    label: (targets: TargetDefinition[]) => {
      let targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : '';
      if (fromTriggerParam) {
        targetsLabel = ` to ${fromTriggerParam}`;
      }
      const valueLabel = dynamicValue
        ? `[${dynamicValue} ${damage !== 1 ? ' x ' + damage : ''}]`
        : damage;
      if (targets.length === 0 && (!range || range?.self)) {
        return `Takes ${valueLabel} damage.`;
      }
      return `Deal ${valueLabel} damage ${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  healUnit: ({ health, range }: { health: number; range?: UnitFilterArgs }) => ({
    fn: ({ targets, unit, land, player }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = getUnitsInRange(
        targets as UnitDeployed[][],
        range,
        sourcePermanent,
        player
      );
      unitsInRange.forEach((u) => {
        healUnit(u, health);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : '';
      return `Heal ${health} to ${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  addCounters: ({
    counterType = CounterType.Growth,
    counterValue = 1,
    range,
    fromTriggerParam,
    dynamicValue,
    valueIsMultiplier = false,
  }: {
    counterType: CounterType;
    counterValue: number;
    range?: UnitFilterArgs;
    fromTriggerParam?: string;
    dynamicValue?: DynamicValue;
    valueIsMultiplier?: boolean;
  }) => ({
    fn: ({ unit, land, targets, player, triggerParams }) => {
      const value = dynamicValue
        ? DynamicValues[dynamicValue]({ unit, player }) * counterValue
        : counterValue;
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = fromTriggerParam
        ? getUnitFromTriggerParam(triggerParams, fromTriggerParam)
        : getUnitsInRange(targets as UnitDeployed[][], range, sourcePermanent, player);
      unitsInRange.forEach((u: UnitDeployed) => {
        const count = valueIsMultiplier ? (value - 1) * (u.counters[counterType] ?? 0) : value;
        addCounters(u, counterType, count);
      });
    },
    label: (targets: TargetDefinition[]) => {
      let targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : '';
      if (fromTriggerParam) {
        targetsLabel = ` to ${fromTriggerParam}`;
      }
      const valueLabel = dynamicValue
        ? `[${dynamicValue} ${counterValue !== 1 ? ' x ' + counterValue : ''}]`
        : counterValue;
      const verb =
        targets.length === 0 && (!range || range?.self)
          ? 'Gets'
          : valueIsMultiplier
            ? 'Multiply by'
            : 'Add';
      return `${verb} ${valueLabel} ${counterType} counter${counterValue !== 1 ? 's' : ''}${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  staticStats: ({
    power,
    maxHealth,
    range,
    dynamicValue,
    fromTriggerParam,
  }: {
    power?: number;
    maxHealth?: number;
    range?: UnitFilterArgs;
    dynamicValue?: DynamicValue;
    fromTriggerParam?: string;
  }) => ({
    fn: ({ unit, land, targets, player, triggerParams }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const effectivePower = dynamicValue
        ? DynamicValues[dynamicValue]({ unit, player }) * (power ?? 0)
        : power;
      const effectiveMaxHealth = dynamicValue
        ? DynamicValues[dynamicValue]({ unit, player }) * (maxHealth ?? 0)
        : maxHealth;
      const unitsInRange = fromTriggerParam
        ? getUnitFromTriggerParam(triggerParams, fromTriggerParam)
        : getUnitsInRange(targets as UnitDeployed[][], range, sourcePermanent, player);
      unitsInRange.forEach((u) => {
        if (effectivePower) {
          u.power += effectivePower;
        }
        if (effectiveMaxHealth) {
          u.maxHealth += effectiveMaxHealth;
          u.health += effectiveMaxHealth;
        }
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` to ${getTargetLabel(targets[0])}` : '';
      const valueLabel = dynamicValue
        ? `[${dynamicValue} ${power !== 1 ? ' x ' + power : ''}]`
        : power;
      const maxHealthLabel = dynamicValue
        ? `[${dynamicValue} ${maxHealth !== 1 ? ' x ' + maxHealth : ''}]`
        : maxHealth;
      return `Add ${valueLabel ? `power ${valueLabel}` : ''}${maxHealthLabel ? ` health ${maxHealthLabel}` : ''}${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  staticKeyword: ({
    abilityName,
    keyword,
    keyWordValue,
    range,
    reset = true,
    fromTriggerParam,
  }: {
    abilityName: string;
    keyword: keyof UnitKeywords;
    keyWordValue?: number;
    range?: UnitFilterArgs;
    reset?: boolean;
    fromTriggerParam?: string;
  }) => ({
    fn: ({ unit, land, targets, player, triggerParams }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = fromTriggerParam
        ? getUnitFromTriggerParam(triggerParams, fromTriggerParam)
        : getUnitsInRange(targets as UnitDeployed[][], range, sourcePermanent, player);
      const keywordDef = { key: keyword, value: keyWordValue ?? true };
      if ((unit || land) && reset) {
        clearUnitStaticAbilities(sourcePermanent, abilityName);
      }
      unitsInRange.forEach((u) => {
        addStaticKeyword(u, keywordDef, false, abilityName, sourcePermanent);
      });
    },
    label: (targets: TargetDefinition[]) => {
      let targetsLabel = targets.length > 0 ? ` to ${getTargetLabel(targets[0])}` : '';
      if (fromTriggerParam) {
        targetsLabel = ` to ${fromTriggerParam}`;
      }
      return `Give ${keyword} ${keyWordValue ? keyWordValue : ''}${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  temporaryEffect: ({
    effect,
    range,
  }: {
    effect: UnitEndOfTurnEffects;
    range?: UnitFilterArgs;
  }) => ({
    fn: ({ unit, land, targets, player }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = getUnitsInRange(
        targets as UnitDeployed[][],
        range,
        sourcePermanent,
        player
      );
      unitsInRange.forEach((u) => {
        applyTemporaryEffect(u, effect);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` to ${getTargetLabel(targets[0])}` : '';
      return `Apply ${getTemporaryEffectLabel(effect)} effect ${targetsLabel} for 1 turn. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  untapPlayer: () => ({
    fn: ({ player }) => {
      untapPlayer(player);
    },
    label: () => `Untap this player`,
  }),
  incrementColor: ({ color }) => ({
    fn: ({ player }) => {
      incrementColor(player, color, 1);
    },
    label: () => `Add 1 ${color} mana`,
  }),
  applyUnitStatus: ({
    statusType,
    duration,
    range,
    fromTriggerParam,
  }: {
    statusType: StatusType;
    duration: number;
    range?: UnitFilterArgs;
    fromTriggerParam?: string;
  }) => ({
    fn: ({ targets, player, unit, land, triggerParams }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = fromTriggerParam
        ? getUnitFromTriggerParam(triggerParams, fromTriggerParam)
        : getUnitsInRange(targets as UnitDeployed[][], range, sourcePermanent, player);
      unitsInRange.forEach((u) => {
        if (u.statuses) {
          applyUnitStatus(u, statusType, duration);
        }
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : '';
      return `Apply ${statusType} for ${duration} turn${duration !== 1 ? 's' : ''}${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  summon: ({
    summonedUnit,
    isRespawn,
    randomPositions,
    randomManaCost,
  }: {
    summonedUnit?: UnitCardTemplate;
    isRespawn?: boolean;
    randomPositions?: number;
    randomManaCost?: number;
  }) => ({
    fn: ({ targets, player, unit }) => {
      const unitTemplate = summonedUnit as UnitCardTemplate;
      const createdUnit = makeUnit(player.id, unitTemplate);
      if (isRespawn && unit) {
        summonUnit(createdUnit, unit.position);
      } else {
        if (randomPositions) {
          const cells = getRandomEmptyAlliedCells(player.isPlayer, randomPositions);
          cells.forEach((cell) => {
            createdUnit.instanceId = crypto.randomUUID();
            summonUnit(createdUnit, cell);
          });
        } else {
          (targets[0] as Position[]).forEach((cell: Position) => {
            createdUnit.instanceId = crypto.randomUUID();
            summonUnit(createdUnit, cell);
          });
        }
      }
    },
    label: () =>
      isRespawn
        ? `Spawn ${summonedUnit ? summonedUnit.name : 'a random unit'} at this unit's position`
        : `Summon ${summonedUnit ? summonedUnit.name : 'a random unit'} to ${randomPositions ? 'random' : 'target'} position`,
  }),
  darkRitual: ({ effect = 'damage' }: { effect: 'damage' | 'heal' }) => ({
    fn: ({ targets }) => {
      const sacrificedUnit = targets[0][0] as UnitDeployed;
      const targetUnit = targets[1][0] as UnitDeployed;
      const sacrificedHealth = sacrificedUnit.health;
      if (effect === 'damage') {
        damageUnit(targetUnit, sacrificedHealth);
      } else {
        healUnit(targetUnit, sacrificedHealth);
      }
      destroyUnit(sacrificedUnit);
    },
    label: () =>
      `Sacrifice a unit to ${effect === 'damage' ? 'deal damage' : effect} equal to its health to another unit`,
  }),
  transferCounters: ({ counterType = CounterType.Growth }: { counterType: CounterType }) => ({
    fn: ({ targets, unit }) => {
      const targetUnit =
        targets[0].length > 0 && targets[0][0] ? (targets[0][0] as UnitDeployed) : unit;
      if (!targetUnit) {
        return;
      }
      let movedCounters = 0;
      bs.units.forEach((u) => {
        if (u.instanceId === targetUnit.instanceId) {
          return;
        }
        const counters = u.counters[counterType] || 0;
        removeCounters(u, counterType, counters);
        movedCounters += counters;
      });
      if (movedCounters > 0) {
        addCounters(targetUnit, counterType, movedCounters);
      }
    },
    label: () => `Transfer all ${counterType} counters from other units to this unit`,
  }),
  transformCounters: ({
    fromCounterType = CounterType.Growth,
    toCounterType = CounterType.Growth,
    range,
  }: {
    fromCounterType: CounterType;
    toCounterType: CounterType;
    range?: UnitFilterArgs;
  }) => ({
    fn: ({ targets, unit, land, player }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = getUnitsInRange(
        targets as UnitDeployed[][],
        range,
        sourcePermanent,
        player
      );
      unitsInRange.forEach((u) => {
        const fromCounters = u.counters[fromCounterType] || 0;
        removeCounters(u, fromCounterType, fromCounters);
        addCounters(u, toCounterType, fromCounters);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` to ${getTargetLabel(targets[0])}` : '';
      return `Transfer all ${fromCounterType} counters into ${toCounterType} counters${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  drawCard: ({ cardCount = 1 }) => ({
    fn: ({ player }) => {
      for (let i = 0; i < cardCount; i++) {
        drawCard(player);
      }
    },
    label: () => `Draw ${cardCount} card${cardCount !== 1 ? 's' : ''}.`,
  }),
  destroyUnit: ({ range }: { range?: UnitFilterArgs }) => ({
    fn: ({ targets, unit, land, player }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = getUnitsInRange(
        targets as UnitDeployed[][],
        range,
        sourcePermanent,
        player
      );
      unitsInRange.forEach((u) => {
        destroyUnit(u);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : 'units';
      return `Destroy ${targetsLabel}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  bounceUnit: ({ range }: { range?: UnitFilterArgs }) => ({
    fn: ({ targets, unit, land, player }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = getUnitsInRange(
        targets as UnitDeployed[][],
        range,
        sourcePermanent,
        player
      );
      unitsInRange.forEach((u) => {
        bounceUnit(u);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : '';
      return `Bounce ${targetsLabel.replace('to ', '')}. ${range ? getRangeLabel(range) : ''}`;
    },
  }),
  fortifyLand: ({ amount }: { amount: number }) => ({
    fn: ({ targets, unit, land }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const row =
        sourcePermanent?.type === CardType.Unit ? (sourcePermanent?.position as Position).row : 0;
      const targetLand =
        targets[0] && targets[0].length > 0
          ? (targets[0][0] as Land)
          : (bs.players[sourcePermanent.ownerPlayerId].lands[row] as Land);
      fortifyLand(targetLand, amount);
    },
    label: () => `Fortify land by ${amount}.`,
  }),
  refreshUnit: ({ range }: { range?: UnitFilterArgs }) => ({
    fn: ({ targets, unit, land, player }) => {
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      const unitsInRange = getUnitsInRange(
        targets as UnitDeployed[][],
        range,
        sourcePermanent,
        player
      );
      unitsInRange.forEach((u) => {
        refreshUnit(u);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const targetsLabel = targets.length > 0 ? ` ${getTargetLabel(targets[0])}` : '';
      return `Refresh ${targetsLabel}. ${range ? getRangeLabel(range) : ''}  `;
    },
  }),
  forceMoveUnit: () => ({
    fn: ({ targets }) => {
      const unit = targets[0][0] as UnitDeployed;
      const position = targets[1][0] as Position;
      forceMoveUnit(unit, position);
    },
    label: () => `Force move unit to target position.`,
  }),
  controlUnit: () => ({
    fn: ({ targets }) => {
      const unit = targets[0][0] as UnitDeployed;
      const position = targets[1][0] as Position;
      controlUnit(unit, position);
    },
    label: () => `Take control of target unit.`,
  }),
  swapUnits: () => ({
    fn: ({ targets }) => {
      const unit1 = targets[0][0] as UnitDeployed;
      const unit2 = targets[0][1] as UnitDeployed;
      if (!unit1 || !unit2 || unit1.ownerPlayerId !== unit2.ownerPlayerId) {
        return;
      }
      const position1 = unit1.position;
      unit1.position = unit2.position;
      unit2.position = position1;
    },
    label: () => `Swap positions of 2 units on the same side`,
  }),
  fight: ({
    mutual = true,
    sameSidePossible = false,
    targetInFront = false,
  }: {
    mutual?: boolean;
    sameSidePossible?: boolean;
    targetInFront?: boolean;
  }) => ({
    fn: ({ unit, targets }) => {
      const unit1 = (targets[0][1] ? targets[0][0] : unit) as UnitDeployed;
      const unit2 = targetInFront
        ? getClosestEnnemyInRow(unit1)
        : ((targets[0][1] ?? targets[0][0]) as UnitDeployed);
      if (!unit1 || !unit2 || unit1.ownerPlayerId === unit2.ownerPlayerId) {
        return;
      }
      if (!sameSidePossible && unit1.ownerPlayerId === unit2.ownerPlayerId) {
        return;
      }
      fightUnit(unit1, unit2);
      if (mutual) {
        fightUnit(unit2, unit1);
      }
    },
    label: (targets) => {
      if (targetInFront) {
        return `Attack the closest enemy unit in front of this unit`;
      }
      const subject = targets[0].count && targets[0].count > 1 ? 'Target unit' : 'This unit';
      const oppositeSideLabel = sameSidePossible ? ' on the opposite side' : '';
      return mutual
        ? `${subject} fights another unit${oppositeSideLabel}`
        : `Attack target unit${oppositeSideLabel} (no fight back)`;
    },
  }),
  cycleCards: () => ({
    fn: ({ targets }) => {
      const cards = targets[0] as Card[];
      const player = bs.players[cards[0].ownerPlayerId];
      cards.forEach((c) => {
        drawCard(player);
        discard(c.instanceId, player.id);
      });
    },
    label: (targets: TargetDefinition[]) => {
      const countLabel = targets[0].count ? ` ${targets[0].count}` : '';
      return `Cycle ${countLabel} card${countLabel !== '1' ? 's' : ''}`;
    },
  }),
  tutorCard: () => ({
    fn: ({ targets, player }) => {
      const card = targets[0][0] as Card;
      tutorCard(card.instanceId, player);
    },
    label: () => `Fetch a card from the deck`,
  }),
  regrowCard: () => ({
    fn: ({ targets, player }) => {
      const card = targets[0][0] as Card;
      regrowCard(card.instanceId, player);
    },
    label: () => `Fetch a card from the graveyard`,
  }),
  putToDeckBottom: () => ({
    fn: ({ targets, player, unit }) => {
      const target = targets[0][0] as Card;
      const card = target ? target : (unit as Card);
      putToDeckBottom(card, player);
    },
    label: () => `Put that card on the bottom of your deck`,
  }),
  addMana: ({ amount }: { amount: number }) => ({
    fn: ({ player }) => {
      addMana(player, amount);
    },
    label: () => `Add ${amount} mana`,
  }),
};
