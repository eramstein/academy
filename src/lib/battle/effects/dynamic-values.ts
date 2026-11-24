import { CardType, UnitType, type Player, type UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';

export enum DynamicValue {
  Units = 'units',
  UnitsInGraveyard = 'units in graveyards',
  Ennemies = 'ennemy units',
  Buildings = 'buildings',
  UnitsWithStatus = 'units with status',
  EnergyCounters = 'energy counters',
  Turns = 'turns',
  CardsInHand = 'cards in hand',
  Allies = 'allied units',
  MaxHealth = 'max health',
  Retaliate = 'retaliate',
}

export type DynamicValueArgs = Record<string, any>;

export type DynamicValueConfig =
  | DynamicValue
  | {
      value: DynamicValue;
      args?: DynamicValueArgs;
    };

export type DynamicValueContext = {
  unit?: UnitDeployed;
  player?: Player;
  args?: DynamicValueArgs;
};

export function getDynamicValueKey(config: DynamicValueConfig): DynamicValue {
  return typeof config === 'string' ? config : config.value;
}

export function getDynamicValueArgs(config: DynamicValueConfig): DynamicValueArgs | undefined {
  return typeof config === 'string' ? undefined : config.args;
}

export function resolveDynamicValue(
  config: DynamicValueConfig,
  context: { unit?: UnitDeployed; player?: Player }
): number {
  const value = getDynamicValueKey(config);
  const args = getDynamicValueArgs(config);
  return DynamicValues[value]({ ...context, args });
}

function matchesUnitType(u: UnitDeployed, unitType?: UnitType): boolean {
  return !unitType || !!u.unitTypes?.includes(unitType);
}

export const DynamicValues: Record<DynamicValue, (ctx: DynamicValueContext) => number> = {
  [DynamicValue.MaxHealth]: ({ unit }) => {
    return unit?.maxHealth ?? 0;
  },
  [DynamicValue.Retaliate]: ({ unit }) => {
    return unit?.retaliate ?? 0;
  },
  [DynamicValue.Units]: ({ args }) => {
    const unitType = args?.unitType as UnitType | undefined;
    return bs.units.filter((u) => matchesUnitType(u, unitType)).length;
  },
  [DynamicValue.UnitsInGraveyard]: () => {
    return bs.players.reduce(
      (acc, player) => acc + player.graveyard.filter((c) => c.type === CardType.Unit).length,
      0
    );
  },
  [DynamicValue.Allies]: ({ unit, player, args }) => {
    const playerId = player ? player.id : unit?.ownerPlayerId;
    const unitType = args?.unitType as UnitType | undefined;
    return bs.units.filter(
      (u) => u.ownerPlayerId === playerId && matchesUnitType(u, unitType)
    ).length;
  },
  [DynamicValue.Ennemies]: ({ unit, player, args }) => {
    const playerId = player ? player.id : unit?.ownerPlayerId;
    const unitType = args?.unitType as UnitType | undefined;
    return bs.units.filter(
      (u) => u.ownerPlayerId !== playerId && matchesUnitType(u, unitType)
    ).length;
  },
  [DynamicValue.Buildings]: () => {
    return bs.units.filter((u) => u.unitTypes?.includes(UnitType.Building)).length;
  },
  [DynamicValue.UnitsWithStatus]: () => {
    return bs.units.filter((u) => Object.keys(u.statuses).length > 0).length;
  },
  [DynamicValue.EnergyCounters]: ({ unit, player }) => {
    const playerId = player ? player.id : unit?.ownerPlayerId;
    return bs.units
      .filter((u) => u.ownerPlayerId === playerId)
      .reduce((acc, u) => acc + (u.counters.energy || 0), 0);
  },
  [DynamicValue.Turns]: () => {
    return Math.ceil(bs.turn / 2);
  },
  [DynamicValue.CardsInHand]: ({ unit, player }) => {
    if (player) return player.hand?.length ?? 0;
    const playerId = unit?.ownerPlayerId;
    if (playerId === undefined) return 0;
    return bs.players.find((p) => p.id === playerId)?.hand?.length ?? 0;
  },
};
