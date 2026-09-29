import type { Ability, EffectTargets, UnitDeployed } from '@/lib/_model';
import { bs, uiState } from '@/lib/_state';
import { playTriggeredAbility } from '@/lib/ui/_helpers/targetting';
import { buildAssignments } from './assignments';
import { isInsideEpilogue } from './epilogue';
import type { ScoreBreakdown } from './model';
import { resolveAssignment } from './refs';
import { replaceBattleState, resetBattleUiPending, snapshotBattle } from './snapshot';
import { scoreLine } from './simulate';

let triggerPlyDepth = 0;

/**
 * Pick targets for a trigger by scoring up to four assignments.
 * One ply: nested triggers, and triggers that fire during the epilogue, take the greedy assignment.
 */
export function chooseTriggerTargets(
  unit: UnitDeployed,
  ability: Ability,
  triggerParams: unknown = {}
): EffectTargets[][] {
  const abilityIndex = unit.abilities?.indexOf(ability) ?? -1;
  const assignments = buildAssignments(unit, ability.actions);
  if (assignments.length === 0) return ability.actions.map(() => []);
  if (assignments.length === 1 || triggerPlyDepth > 0 || isInsideEpilogue()) {
    return resolveAssignment(assignments[0]);
  }

  triggerPlyDepth++;
  const snapshot = snapshotBattle();
  const wasHeadless = uiState.isHeadless === true;
  let best = assignments[0];
  let bestResult: Omit<ScoreBreakdown, 'id'> | null = null;
  try {
    for (const assignment of assignments) {
      try {
        replaceBattleState(snapshot);
        resetBattleUiPending();
        uiState.isHeadless = true;
        const live = bs.units.find((entry) => entry.instanceId === unit.instanceId);
        if (!live) continue;
        const liveAbility =
          abilityIndex >= 0 ? (live.abilities?.[abilityIndex] ?? ability) : ability;
        const params = remapTriggerParams(triggerParams);
        playTriggeredAbility(live, liveAbility, resolveAssignment(assignment), params);
        const result = scoreLine(snapshot, live.ownerPlayerId);
        if (isBetter(result, bestResult)) {
          best = assignment;
          bestResult = result;
        }
      } catch (error) {
        console.warn('AI trigger target failed', error);
      }
    }
  } finally {
    triggerPlyDepth--;
    replaceBattleState(snapshot);
    uiState.isHeadless = wasHeadless;
    resetBattleUiPending();
  }
  return resolveAssignment(best);
}

function isBetter(
  next: Omit<ScoreBreakdown, 'id'>,
  prev: Omit<ScoreBreakdown, 'id'> | null
): boolean {
  if (!prev) return true;
  const order = { win: 2, none: 1, loss: 0 };
  if (order[next.terminal] !== order[prev.terminal]) {
    return order[next.terminal] > order[prev.terminal];
  }
  return next.score > prev.score;
}

function remapTriggerParams(params: unknown): unknown {
  if (!params || typeof params !== 'object') return params;
  const copy: Record<string, unknown> = { ...(params as Record<string, unknown>) };
  copy.unit = remapUnit(copy.unit);
  copy.attacker = remapUnit(copy.attacker);
  copy.mover = remapUnit(copy.mover);
  copy.defender = remapCombatant(copy.defender);
  copy.land = remapLand(copy.land);
  if (copy.player && typeof copy.player === 'object' && 'id' in copy.player) {
    const id = (copy.player as { id: number }).id;
    copy.player = bs.players[id] ?? copy.player;
  }
  return copy;
}

function remapCombatant(value: unknown) {
  if (!value || typeof value !== 'object') return value;
  if ('isPlayer' in value && 'id' in value) {
    return bs.players[(value as { id: number }).id] ?? value;
  }
  if ('instanceId' in value) {
    const id = (value as { instanceId: string }).instanceId;
    return (
      bs.units.find((unit) => unit.instanceId === id) ??
      bs.players.flatMap((player) => player.lands).find((land) => land.instanceId === id) ??
      value
    );
  }
  return value;
}

function remapUnit(value: unknown) {
  if (!value || typeof value !== 'object' || !('instanceId' in value)) return value;
  const id = (value as { instanceId: string }).instanceId;
  return bs.units.find((unit) => unit.instanceId === id) ?? value;
}

function remapLand(value: unknown) {
  if (!value || typeof value !== 'object' || !('instanceId' in value)) return value;
  const id = (value as { instanceId: string }).instanceId;
  return (
    bs.players.flatMap((player) => player.lands).find((land) => land.instanceId === id) ?? value
  );
}
