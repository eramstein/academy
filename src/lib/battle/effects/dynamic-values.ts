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
}

export const DynamicValues: Record<
  DynamicValue,
  ({ unit, player }: { unit?: UnitDeployed; player?: Player }) => number
> = {
  [DynamicValue.Units]: () => {
    return bs.units.length;
  },
  [DynamicValue.UnitsInGraveyard]: () => {
    return bs.players.reduce(
      (acc, player) => acc + player.graveyard.filter((c) => c.type === CardType.Unit).length,
      0
    );
  },
  [DynamicValue.Allies]: ({ unit, player }: { unit?: UnitDeployed; player?: Player }) => {
    const playerId = player ? player.id : unit?.ownerPlayerId;
    return bs.units.filter((u) => u.ownerPlayerId === playerId).length;
  },
  [DynamicValue.Ennemies]: ({ unit, player }: { unit?: UnitDeployed; player?: Player }) => {
    const playerId = player ? player.id : unit?.ownerPlayerId;
    return bs.units.filter((u) => u.ownerPlayerId !== playerId).length;
  },
  [DynamicValue.Buildings]: () => {
    return bs.units.filter((u) => u.unitTypes?.includes(UnitType.Building)).length;
  },
  [DynamicValue.UnitsWithStatus]: () => {
    return bs.units.filter((u) => Object.keys(u.statuses).length > 0).length;
  },
  [DynamicValue.EnergyCounters]: ({ unit, player }: { unit?: UnitDeployed; player?: Player }) => {
    const playerId = player ? player.id : unit?.ownerPlayerId;
    return bs.units
      .filter((u) => u.ownerPlayerId === playerId)
      .reduce((acc, u) => acc + (u.counters.energy || 0), 0);
  },
  [DynamicValue.Turns]: () => {
    return Math.ceil(bs.turn / 2);
  },
  [DynamicValue.CardsInHand]: ({ unit, player }: { unit?: UnitDeployed; player?: Player }) => {
    if (player) return player.hand?.length ?? 0;
    const playerId = unit?.ownerPlayerId;
    if (playerId === undefined) return 0;
    return bs.players.find((p) => p.id === playerId)?.hand?.length ?? 0;
  },
};
