import {
  CardType,
  TriggerType,
  type Ability,
  type Card,
  type EffectArgs,
  type EffectTargets,
  type Land,
  type Player,
  type Position,
  type UnitDeployed,
} from '@/lib/_model';
import { bs } from '@/lib/_state';
import { activateTriggeredAbility } from '@/lib/ui/_helpers/targetting';
import { DataEffectTemplates, filterUnits } from './effects';

function triggerAbilities(type: TriggerType, { ...rest }) {
  const permanents = [
    ...bs.units,
    ...bs.players
      .flatMap((p) => p.lands)
      .filter(
        (l) => (!l.isRuined && l.abilities?.length) || (l.isRuined && l.ruinsAbilities?.length)
      ),
  ];
  permanents.forEach((p) => {
    p.abilities
      ?.filter((a) => checkTriggerType(a, type))
      .filter((a) => checkTriggerCondition(a, p, { ...rest }))
      .forEach((a) => {
        const triggerParams: any = { ...rest };
        // Check if any action in the ability requires targeting
        const hasTargets = a.actions.some(
          (actionDef) => actionDef.targets && actionDef.targets.length > 0
        );

        if (hasTargets) {
          // If targeting is required, set up the UI state for user selection
          // no supported for Lands for now
          activateTriggeredAbility(p as UnitDeployed, a, triggerParams);
        } else {
          // If no targeting is required, execute immediately
          a.actions.forEach((actionDef) => {
            let targets: EffectTargets = [];
            const params: EffectArgs = {
              targets: [targets],
              triggerParams,
              player: bs.players[p.ownerPlayerId],
            };
            if (p.type === CardType.Unit) {
              params.unit = p as UnitDeployed;
            } else if (p.type === CardType.Land) {
              params.land = p as Land;
            }
            DataEffectTemplates[actionDef.effect.name](actionDef.effect.args).fn(params);
          });
        }
      });
  });
}

function checkTriggerType(ability: Ability, triggerType: TriggerType): boolean {
  // static abilities are always re-triggering unless specified otherwise in staticRecompute
  // for permanent buffs they have to clean up and re-apply them
  return (
    (ability.trigger.type === TriggerType.Static &&
      (!ability.trigger.staticRecompute ||
        ability.trigger.staticRecompute.includes(triggerType))) ||
    ability.trigger.type === triggerType
  );
}

// This is checking if a given ability gets triggered by trigger args
// For example, an ability with trigger type "After Moving" and range { allies: true } will trigger if the moving unit in triggerArgs is an ally
function checkTriggerCondition(
  ability: Ability,
  permanentWithAbility: UnitDeployed | Land,
  triggerArgs: any
): boolean {
  // if no range is specified, the ability is always triggered
  if (!ability.trigger.range) {
    return true;
  }

  // case triggerer is a player, here Self means the player
  if (
    [TriggerType.OnCardDrawn, TriggerType.OnTurnStart, TriggerType.OnGoldGained].includes(
      ability.trigger.type
    ) &&
    ability.trigger.range.self
  ) {
    return triggerArgs.player.id === permanentWithAbility.ownerPlayerId;
  }

  // case triggerer is a land, here Self means the land
  if ([TriggerType.OnLandDestroyed].includes(ability.trigger.type) && ability.trigger.range.self) {
    return triggerArgs.land.instanceId === permanentWithAbility.instanceId;
  }

  // all others check if the unit causing the trigger is in the range
  let unitCausingTrigger = null;
  if (
    [TriggerType.OnDeath, TriggerType.OnDeploy, TriggerType.BeforeDamage].includes(
      ability.trigger.type
    )
  ) {
    unitCausingTrigger = triggerArgs.unit;
  }
  if (
    ability.trigger.type === TriggerType.AfterMove ||
    ability.trigger.type === TriggerType.BeforeMove
  ) {
    unitCausingTrigger = triggerArgs.mover;
  }
  if (
    ability.trigger.type === TriggerType.AfterCombat ||
    ability.trigger.type === TriggerType.OnReach
  ) {
    unitCausingTrigger = triggerArgs.attacker;
  }

  const params = {
    ...ability.trigger.range,
  };

  if (permanentWithAbility.type === CardType.Land) {
    params.land = permanentWithAbility as Land;
  }

  if (permanentWithAbility.type === CardType.Unit) {
    params.unit = permanentWithAbility as UnitDeployed;
  }

  const validTriggeringUnits = filterUnits(params).map((u) => u.instanceId);
  return validTriggeringUnits
    ? validTriggeringUnits.includes(unitCausingTrigger.instanceId)
    : false;
}

/* 
  LISTENERS
*/
export function onDamageUnit(unit: UnitDeployed, damage: number, isCombatDamage: boolean) {
  triggerAbilities(TriggerType.BeforeDamage, { damage, isCombatDamage, unit });
}

export function onCombatResolution(attacker: UnitDeployed, defender: UnitDeployed | Land | Player) {
  triggerAbilities(TriggerType.AfterCombat, { attacker, defender });
}

export function onUnitReach(attacker: UnitDeployed) {
  triggerAbilities(TriggerType.OnReach, { attacker });
}

export function onAfterMoveUnit(unit: UnitDeployed, pos: Position) {
  triggerAbilities(TriggerType.AfterMove, { mover: unit, pos });
}

export function onBeforeMoveUnit(unit: UnitDeployed, pos: Position) {
  triggerAbilities(TriggerType.BeforeMove, { mover: unit, pos });
}

export function onDeployUnit(unit: UnitDeployed) {
  triggerAbilities(TriggerType.OnDeploy, { unit });
}

export function onUnitDeath(unit: UnitDeployed) {
  triggerAbilities(TriggerType.OnDeath, { unit });
}

export function onTurnStart(player: Player) {
  triggerAbilities(TriggerType.OnTurnStart, { player });
}

export function onCardDrawn(player: Player, card: Card) {
  triggerAbilities(TriggerType.OnCardDrawn, { player, card });
}

export function onLandDestroyed(land: Land) {
  triggerAbilities(TriggerType.OnLandDestroyed, { land });
}
