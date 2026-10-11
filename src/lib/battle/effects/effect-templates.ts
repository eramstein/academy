import { CardType, CounterType, isUnitCard, StatusType } from '@/lib/_model';
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
  healUnit,
  incrementColor,
  makeUnit,
  putToDeckBottom,
  refreshUnit,
  removeCounters,
  shuffleDeck,
  summonUnit,
  tutorCard,
  untapPlayer,
} from '@/lib/battle';
import { fightUnit } from '../combat';
import { getAllGraveyardsUnits, reanimate, recycleCard, regrowCard } from '../graveyard';
import { damageLand, fortifyLand } from '../land';
import { forceMoveUnit } from '../move';
import { soundManager } from '../sound';
import { DynamicValue, DynamicValues } from './dynamic-values';
import {
  affectedPhrase,
  countedCards,
  describeAmount,
  describeTemporaryBonus,
  getsClause,
  isPluralTarget,
  joinList,
  magnitudeLabel,
  sentence,
  statFragment,
  targetNoun,
  words,
} from './effect-labels';
import { DataEffectPrimers } from './effect-primers';
import {
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
        getRandomFromArray(getAllGraveyardsUnits())) as UnitCard;
      const position = (targets[1]?.[0] || getRandomFromArray(getEmptyCells(isPlayer))) as Position;
      if (reanimatedUnit && position && isUnitCard(reanimatedUnit)) {
        reanimate(reanimatedUnit, position, playerId);
      }
    },
    label: (targets: TargetDefinition[]) => {
      const unit = targets[0] ? targetNoun(targets[0]) : 'a random graveyard unit';
      const cell = targets[1] ? targetNoun(targets[1]) : 'a random empty cell';
      return sentence(`Reanimate ${unit} onto ${cell}`);
    },
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
    label: () => {
      const described = describeAmount(damage);
      const amount = magnitudeLabel(described);
      const who = opposingPlayer ? 'your opponent' : 'yourself';
      if (described.number !== undefined && described.number < 0) {
        return sentence(
          opposingPlayer ? `Heal your opponent for ${amount}` : `Heal yourself for ${amount}`
        );
      }
      if (described.equalTo) {
        return sentence(`Deal damage ${described.equalTo} to ${who}`);
      }
      return sentence(`Deal ${amount} damage to ${who}`);
    },
  }),
  damageLand: ({ damage }: { damage: number }) => ({
    fn: ({ targets }) => {
      targets.forEach((t) => {
        t.forEach((l) => {
          damageLand(l as unknown as Land, damage);
        });
      });
    },
    label: (targets: TargetDefinition[]) => {
      const land = targets[0] ? targetNoun(targets[0]) : 'target land';
      const described = describeAmount(damage);
      if (described.equalTo) {
        return sentence(`Deal damage ${described.equalTo} to ${land}`);
      }
      return sentence(`Deal ${magnitudeLabel(described)} damage to ${land}`);
    },
  }),
  damageUnit: ({
    damage,
    range,
    fromTriggerParam,
    dynamicValue,
    randomTargets,
  }: {
    damage: number;
    range?: UnitFilterArgs;
    fromTriggerParam?: string;
    dynamicValue?: DynamicValue;
    randomTargets?: number;
  }) => ({
    fn: ({ targets, unit, land, player, triggerParams }) => {
      const value = dynamicValue ? DynamicValues[dynamicValue]({ unit, player }) * damage : damage;
      const sourcePermanent = unit ?? (land as UnitDeployed | Land);
      let unitsInRange = [];
      if (fromTriggerParam) {
        unitsInRange = getUnitFromTriggerParam(triggerParams, fromTriggerParam);
      } else {
        unitsInRange = getUnitsInRange(targets as UnitDeployed[][], range, sourcePermanent, player);
      }
      if (randomTargets) {
        const randomUnits = [];
        for (let i = 0; i < randomTargets; i++) {
          randomUnits.push(getRandomFromArray(unitsInRange));
        }
        unitsInRange = randomUnits;
      }
      unitsInRange.forEach((u) => {
        damageUnit(u, value);
      });
      soundManager.playDamageSound();
    },
    label: (targets: TargetDefinition[]) => {
      const described = describeAmount(damage, dynamicValue);
      const amount = magnitudeLabel(described);
      const affected = affectedPhrase(targets, { fromTriggerParam, range, randomTargets });
      const dealt = described.number !== undefined ? String(described.number) : amount;
      if (affected.self) {
        if (described.equalTo) {
          return sentence(`Takes damage ${described.equalTo}`, affected.range);
        }
        return sentence(`Takes ${dealt} damage`, affected.range);
      }
      if (described.equalTo) {
        return sentence(
          affected.phrase
            ? `Deal damage ${described.equalTo} to ${affected.phrase}`
            : `Deal damage ${described.equalTo}`,
          affected.range
        );
      }
      return sentence(
        affected.phrase ? `Deal ${dealt} damage to ${affected.phrase}` : `Deal ${dealt} damage`,
        affected.range
      );
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
      const described = describeAmount(health);
      const amount = magnitudeLabel(described);
      const affected = affectedPhrase(targets, { range });
      const healthText = described.equalTo ? `health ${described.equalTo}` : `${amount} health`;
      if (affected.self) {
        return sentence(`Restore ${healthText}`, affected.range);
      }
      return sentence(
        affected.phrase ? `Restore ${healthText} to ${affected.phrase}` : `Restore ${healthText}`,
        affected.range
      );
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
      const described = describeAmount(counterValue, dynamicValue);
      const affected = affectedPhrase(targets, { fromTriggerParam, range });
      const counter = `${counterType} counter`;
      if (valueIsMultiplier) {
        const factor = described.equalTo
          ? described.equalTo.replace(/^equal to /, '')
          : String(described.number ?? counterValue);
        const body = affected.self
          ? `Multiply this unit's ${counter}s by ${factor}`
          : affected.phrase
            ? `Multiply ${counter}s on ${affected.phrase} by ${factor}`
            : `Multiply ${counter}s by ${factor}`;
        return sentence(body, affected.range);
      }
      const plural = described.equalTo || described.number !== 1;
      const counters = `${counter}${plural ? 's' : ''}`;
      const amount = described.equalTo
        ? `${counters} ${described.equalTo}`
        : `${described.number ?? counterValue} ${counters}`;
      if (affected.self) {
        return sentence(`Gets ${amount}`, affected.range);
      }
      return sentence(
        affected.phrase ? `Add ${amount} to ${affected.phrase}` : `Add ${amount}`,
        affected.range
      );
    },
  }),
  staticStats: ({
    power,
    maxHealth,
    retaliate,
    range,
    dynamicValue,
    fromTriggerParam,
  }: {
    power?: number;
    maxHealth?: number;
    retaliate?: number;
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
      const effectiveRetaliate = dynamicValue
        ? DynamicValues[dynamicValue]({ unit, player }) * (retaliate ?? 0)
        : retaliate;
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
        if (effectiveRetaliate) {
          u.retaliate += effectiveRetaliate;
        }
      });
    },
    label: (targets: TargetDefinition[]) => {
      const affected = affectedPhrase(targets, { fromTriggerParam, range });
      const parts = [
        statFragment('power', power, dynamicValue),
        statFragment('health', maxHealth, dynamicValue),
        statFragment('retaliate', retaliate, dynamicValue),
      ].filter((part): part is string => !!part);
      const change = parts.length > 0 ? joinList(parts) : 'no stats';
      return sentence(getsClause(affected.phrase, change, affected.self), affected.range);
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
      const affected = affectedPhrase(targets, { fromTriggerParam, range });
      const name = words(keyword);
      const value =
        typeof keyWordValue === 'number' ? ` ${keyWordValue > 0 ? '+' : ''}${keyWordValue}` : '';
      const keywordText = `${name}${value}`;
      if (affected.self) {
        return sentence(`Gets ${keywordText}`, affected.range);
      }
      return sentence(
        affected.phrase ? `Give ${keywordText} to ${affected.phrase}` : `Give ${keywordText}`,
        affected.range
      );
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
      const affected = affectedPhrase(targets, { range });
      const bonus = describeTemporaryBonus(effect);
      return sentence(
        `${getsClause(affected.phrase, bonus, affected.self)} until end of turn`,
        affected.range
      );
    },
  }),
  untapPlayer: () => ({
    fn: ({ player }) => {
      untapPlayer(player);
    },
    label: () => `This player may use their color ability again.`,
  }),
  incrementColor: ({ color }) => ({
    fn: ({ player }) => {
      incrementColor(player, color, 1);
    },
    label: () => sentence(`Add 1 ${color} mana`),
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
      const affected = affectedPhrase(targets, { fromTriggerParam, range });
      const turns = `${duration} turn${Number(duration) === 1 ? '' : 's'}`;
      if (affected.self) {
        return sentence(`Apply ${statusType} for ${turns}`, affected.range);
      }
      return sentence(
        affected.phrase
          ? `Apply ${statusType} to ${affected.phrase} for ${turns}`
          : `Apply ${statusType} for ${turns}`,
        affected.range
      );
    },
  }),
  summon: ({
    summonedUnit,
    isRespawn,
    randomPositions,
  }: {
    summonedUnit?: UnitCardTemplate;
    isRespawn?: boolean;
    randomPositions?: number;
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
    label: (targets: TargetDefinition[]) => {
      const name = summonedUnit?.name ?? 'a unit';
      if (isRespawn) {
        return sentence(`Summon ${name} at this unit's position`);
      }
      const count = typeof randomPositions === 'number' ? randomPositions : randomPositions ? 1 : 0;
      if (count > 0) {
        const cells = count === 1 ? 'a random allied cell' : `${count} random allied cells`;
        return sentence(`Summon ${name} onto ${cells}`);
      }
      const cell = targets[0] ? targetNoun(targets[0]) : 'target cell';
      return sentence(`Summon ${name} onto ${cell}`);
    },
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
    label: (targets: TargetDefinition[]) => {
      const sacrifice = targets[0] ? targetNoun(targets[0]) : 'a unit';
      const other = targets[1] ? targetNoun(targets[1]) : 'another unit';
      if (effect === 'heal') {
        return sentence(`Sacrifice ${sacrifice} and restore its health to ${other}`);
      }
      return sentence(`Sacrifice ${sacrifice} and deal its health as damage to ${other}`);
    },
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
    label: (targets: TargetDefinition[]) => {
      const dest = targets[0] ? targetNoun(targets[0]) : 'this unit';
      return sentence(`Move all ${counterType} counters from other units onto ${dest}`);
    },
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
      const affected = affectedPhrase(targets, { range });
      const where = affected.self ? 'this unit' : (affected.phrase ?? 'units in range');
      return sentence(
        `Convert all ${fromCounterType} counters on ${where} into ${toCounterType} counters`,
        affected.range
      );
    },
  }),
  drawCard: ({ cardCount = 1 }) => ({
    fn: ({ player }) => {
      for (let i = 0; i < cardCount; i++) {
        drawCard(player);
      }
    },
    label: () => sentence(`Draw ${countedCards(cardCount)}`),
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
      const affected = affectedPhrase(targets, { range });
      if (affected.self) {
        return sentence('Destroy this unit', affected.range);
      }
      return sentence(
        affected.phrase ? `Destroy ${affected.phrase}` : 'Destroy units in range',
        affected.range
      );
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
      unitsInRange
        .filter((u) => !u.isDying)
        .forEach((u) => {
          bounceUnit(u);
        });
    },
    label: (targets: TargetDefinition[]) => {
      const affected = affectedPhrase(targets, { range });
      if (affected.self) {
        return sentence("Return this unit to its owner's hand", affected.range);
      }
      const owners = isPluralTarget(affected.phrase) ? "their owners' hands" : "its owner's hand";
      return sentence(`Return ${affected.phrase ?? 'units in range'} to ${owners}`, affected.range);
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
    label: (targets: TargetDefinition[]) => {
      const land = targets[0] ? targetNoun(targets[0]) : 'this land';
      return sentence(`Fortify ${land} by ${amount}`);
    },
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
      const affected = affectedPhrase(targets, { range });
      if (affected.self) {
        return sentence('Refresh this unit', affected.range);
      }
      return sentence(
        affected.phrase ? `Refresh ${affected.phrase}` : 'Refresh units in range',
        affected.range
      );
    },
  }),
  forceMoveUnit: () => ({
    fn: ({ targets }) => {
      const unit = targets[0][0] as UnitDeployed;
      const position = targets[1][0] as Position;
      forceMoveUnit(unit, position);
    },
    label: (targets: TargetDefinition[]) => {
      const unit = targets[0] ? targetNoun(targets[0]) : 'target unit';
      const cell = targets[1] ? targetNoun(targets[1]) : 'target cell';
      return sentence(`Move ${unit} to ${cell}`);
    },
  }),
  controlUnit: () => ({
    fn: ({ targets }) => {
      const unit = targets[0][0] as UnitDeployed;
      const position = targets[1][0] as Position;
      controlUnit(unit, position);
    },
    label: (targets: TargetDefinition[]) => {
      const unit = targets[0] ? targetNoun(targets[0]) : 'target unit';
      const cell = targets[1] ? targetNoun(targets[1]) : 'target cell';
      return sentence(`Take control of ${unit} and move it to ${cell}`);
    },
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
    label: () => `Swap the positions of two units on the same side.`,
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
      if (!unit1 || !unit2) {
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
    label: (targets: TargetDefinition[]) => {
      const sideNote = sameSidePossible ? ' Units on the same side can be chosen.' : '';
      if (targetInFront) {
        return mutual
          ? `This unit fights the closest enemy in front.${sideNote}`
          : `This unit attacks the closest enemy in front. That unit does not fight back.${sideNote}`;
      }
      const twoTargets = (targets[0]?.count ?? 0) > 1;
      if (twoTargets) {
        return mutual
          ? `Two target units fight each other.${sideNote}`
          : `The first target unit attacks the second. The second does not fight back.${sideNote}`;
      }
      return mutual
        ? `This unit fights target unit.${sideNote}`
        : `This unit attacks target unit. That unit does not fight back.${sideNote}`;
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
      const count = targets[0]?.count;
      const n = !count || count < 1 ? 1 : count;
      const chosen = n === 1 ? 'a card' : `${n} cards`;
      const drawn = n === 1 ? 'a card' : `${n} cards`;
      const pronoun = n === 1 ? 'it' : 'them';
      return sentence(`Cycle ${chosen}: draw ${drawn}, then discard ${pronoun}`);
    },
  }),
  tutorCard: () => ({
    fn: ({ targets, player }) => {
      const card = targets[0][0] as Card;
      tutorCard(card.instanceId, player);
    },
    label: (targets: TargetDefinition[]) => {
      const card = targets[0] ? targetNoun(targets[0]) : 'a card from your deck';
      return sentence(`Put ${card} into your hand`);
    },
  }),
  regrowCard: () => ({
    fn: ({ targets, player }) => {
      const card = targets[0][0] as Card;
      regrowCard(card.instanceId, player);
    },
    label: (targets: TargetDefinition[]) => {
      const card = targets[0] ? targetNoun(targets[0]) : 'a card from your graveyard';
      return sentence(`Put ${card} into your hand`);
    },
  }),
  putToDeckBottom: () => ({
    fn: ({ targets, player, unit }) => {
      const target = targets[0][0] as Card;
      const card = target ? target : (unit as Card);
      putToDeckBottom(card, player);
    },
    label: (targets: TargetDefinition[]) => {
      const card = targets[0] ? targetNoun(targets[0]) : 'this card';
      return sentence(`Put ${card} on the bottom of your deck`);
    },
  }),
  addMana: ({ amount }: { amount: number }) => ({
    fn: ({ player }) => {
      addMana(player, amount);
    },
    label: () => sentence(`Add ${amount} mana`),
  }),
  reshuffleGraveyard: () => ({
    fn: ({ player }) => {
      player.deck.push(...player.graveyard);
      player.deck = shuffleDeck(player.deck);
      player.graveyard = [];
    },
    label: () => `Shuffle your graveyard into your deck.`,
  }),
  recycleCard: () => ({
    fn: ({ targets, player }) => {
      const cards = targets[0] as Card[];
      cards.forEach((c) => {
        recycleCard(c.instanceId, player);
      });
    },
    label: (targets: TargetDefinition[]) =>
      sentence(`Shuffle ${countedCards(targets[0]?.count)} from your graveyard into your deck`),
  }),
};
