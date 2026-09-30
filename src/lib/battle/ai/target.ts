import {
  AiTurnGoal,
  type Ability,
  type Card,
  type EffectTargets,
  type Land,
  type Player,
  type Position,
  type SpellCard,
  type UnitDeployed,
} from '@/lib/_model';
import { bs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getUnitsInRange, type UnitFilterArgs } from '../effects/unit-filters';
import { getEligibleTargets } from '../target';
import { chooseTriggerTargets } from './trigger-targets';
import { valueUnit, wouldBeDestroyedBySpell } from './valuations/unit';

/** Effects that should aim at the opponent's side under the heuristic policy. */
const HOSTILE_UNIT_EFFECTS = new Set([
  'damageUnit',
  'destroyUnit',
  'stun',
  'mezz',
  'daze',
  'root',
  'bounceUnit',
  'addDecayCounters',
  'forceMoveUnit',
  'fight',
]);

export function selectAiAbilityTargets(
  unit: UnitDeployed,
  ability: Ability,
  triggerParams: unknown = {}
): EffectTargets[][] {
  return chooseTriggerTargets(unit, ability, triggerParams);
}

export function selectAiSpellTargets(spell: SpellCard): EffectTargets[][] | null {
  const targets: EffectTargets[][] = [];
  let notEnoughTargets = false;
  const hostile = isHostileUnitSpell(spell);
  spell.actions
    .filter((action) => action.targets)
    .forEach((action) => {
      const actionTargets: EffectTargets[] = [];
      if (action.targets) {
        action.targets.forEach((targetDefinition) => {
          const actionTargetGroup: UnitDeployed[] | Position[] | Land[] | Player[] | Card[] = [];
          const eligibleTargets = getEligibleTargets(spell, targetDefinition).filter((target) => {
            return (
              !('ownerPlayerId' in target) ||
              (hostile && target.ownerPlayerId !== spell.ownerPlayerId) ||
              (!hostile && target.ownerPlayerId === spell.ownerPlayerId)
            );
          });
          const count = targetDefinition.count || 1;
          if (eligibleTargets.length < count) {
            notEnoughTargets = true;
            return;
          }
          for (let i = 0; i < count; i++) {
            const t: any = selectTarget(spell, eligibleTargets, hostile);
            actionTargetGroup.push(t);
          }
          actionTargets.push(actionTargetGroup);
        });
      }
      targets.push(actionTargets);
    });
  if (notEnoughTargets) {
    return null;
  }
  return targets;
}

export function isHostileUnitSpell(spell: SpellCard): boolean {
  return spell.actions.some((action) => HOSTILE_UNIT_EFFECTS.has(action.effect.name));
}

function selectTarget(
  spell: SpellCard,
  potentialTargets: (UnitDeployed | Position | Land | Player | Card)[],
  hostile: boolean
): UnitDeployed | Position | Land | Player | Card {
  if (hostile) {
    const creaturesToRemoveIds = bs.aiState.goals
      .filter((goal) => goal.goal === 'Remove Unit')
      .map((goal) => goal.args.unit.instanceId);
    const creaturesToRemove: UnitDeployed[] = potentialTargets.filter(
      (t) => 'instanceId' in t && creaturesToRemoveIds.includes(t.instanceId)
    ) as UnitDeployed[];
    if (creaturesToRemove.length > 0) {
      return getHighestKillValueTarget(spell, creaturesToRemove);
    }
    return getHighestKillValueTarget(spell, potentialTargets as (UnitDeployed | Position)[]);
  }
  return getRandomFromArray(potentialTargets);
}

function getHighestKillValueTarget(
  spell: SpellCard,
  potentialTargets: (UnitDeployed | Position)[]
): UnitDeployed | Position {
  let range: UnitFilterArgs | null = null;
  spell.actions.forEach((action) => {
    if (action.effect.args.range) {
      range = action.effect.args.range as UnitFilterArgs;
    }
  });
  if (!range) {
    return getBestSingleTarget(spell, potentialTargets);
  }
  return getBestRangeTarget(spell, potentialTargets, range);
}

function getBestSingleTarget(
  spell: SpellCard,
  potentialTargets: (UnitDeployed | Position)[]
): UnitDeployed | Position {
  const units = potentialTargets.filter((t) => 'instanceId' in t) as UnitDeployed[];
  if (units.length === 0) {
    return getRandomFromArray(potentialTargets);
  }
  const killableTargets = units.filter((t) => wouldBeDestroyedBySpell(t, spell));
  if (killableTargets.length === 0) {
    return units.sort((b, a) => valueUnit(a) - valueUnit(b))[0];
  }
  return killableTargets.sort((b, a) => valueUnit(a) - valueUnit(b))[0];
}

function getBestRangeTarget(
  spell: SpellCard,
  potentialTargets: (UnitDeployed | Position)[],
  range: UnitFilterArgs
): UnitDeployed | Position {
  const targetValues: Record<string, number> = {};
  potentialTargets.forEach((t) => {
    const targetsInRange = getUnitsInRange(
      [[t]] as any,
      range,
      t as any,
      bs.players[spell.ownerPlayerId]
    );
    const key = 'instanceId' in t ? t.instanceId : `${t.row},${t.column}`;
    targetValues[key] = targetsInRange.reduce((acc, u) => acc + valueUnit(u), 0);
  });
  const highestValueTargetKey = Object.entries(targetValues).sort((b, a) => a[1] - b[1])[0][0];
  return potentialTargets.find((t) => {
    if ('instanceId' in t) {
      return t.instanceId === highestValueTargetKey;
    }
    return `${t.row},${t.column}` === highestValueTargetKey;
  }) as UnitDeployed | Position;
}
