import {
  CardType,
  type Card,
  type EffectTargets,
  type Land,
  type Player,
  type Position,
  type UnitDeployed,
} from '@/lib/_model';
import { bs } from '@/lib/_state';
import type { TargetAssignment, TargetRef } from './model';

export function refKey(ref: TargetRef): string {
  switch (ref.kind) {
    case 'cell':
      return `cell:${ref.row}-${ref.column}`;
    case 'player':
      return `player:${ref.playerId}`;
    default:
      return `${ref.kind}:${ref.instanceId}`;
  }
}

export function toRef(entity: UnitDeployed | Land | Player | Card | Position): TargetRef {
  if ('isPlayer' in entity && 'life' in entity && 'mana' in entity) {
    return { kind: 'player', playerId: (entity as Player).id };
  }
  if ('isRuined' in entity && typeof (entity as Land).position === 'number') {
    return { kind: 'land', instanceId: (entity as Land).instanceId };
  }
  if ('row' in entity && 'column' in entity && !('instanceId' in entity)) {
    const cell = entity as Position;
    return { kind: 'cell', row: cell.row, column: cell.column };
  }
  const id = (entity as Card).instanceId;
  if (bs.units.some((unit) => unit.instanceId === id)) {
    return { kind: 'unit', instanceId: id };
  }
  if ('type' in entity && entity.type === CardType.Land) {
    return { kind: 'land', instanceId: id };
  }
  return { kind: 'card', instanceId: id };
}

export function resolveRef(ref: TargetRef): UnitDeployed | Land | Player | Card | Position {
  if (ref.kind === 'cell') return { row: ref.row, column: ref.column };
  if (ref.kind === 'player') return bs.players[ref.playerId];
  if (ref.kind === 'unit') {
    const unit = bs.units.find((entry) => entry.instanceId === ref.instanceId);
    if (!unit) throw new Error(`Missing unit ${ref.instanceId}`);
    return unit;
  }
  if (ref.kind === 'land') {
    const land = bs.players
      .flatMap((player) => player.lands)
      .find((entry) => entry.instanceId === ref.instanceId);
    if (!land) throw new Error(`Missing land ${ref.instanceId}`);
    return land;
  }
  for (const player of bs.players) {
    const card =
      player.hand.find((entry) => entry.instanceId === ref.instanceId) ??
      player.graveyard.find((entry) => entry.instanceId === ref.instanceId) ??
      player.deck.find((entry) => entry.instanceId === ref.instanceId);
    if (card) return card;
  }
  throw new Error(`Missing card ${ref.instanceId}`);
}

export function resolveGroups(groups: TargetRef[][]): EffectTargets[] {
  return groups.map((group) => group.map((ref) => resolveRef(ref)) as EffectTargets);
}

export function resolveAssignment(assignment: TargetAssignment): EffectTargets[][] {
  return assignment.map((groups) => resolveGroups(groups));
}

export function refLabel(ref: TargetRef): string {
  if (ref.kind === 'cell') return `${ref.row},${ref.column}`;
  if (ref.kind === 'player') return `player ${ref.playerId}`;
  return ref.instanceId;
}
