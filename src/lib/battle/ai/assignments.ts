import { config } from '@/lib/_config';
import { TargetType, type ActionDefinition, type Land, type SpellCard, type UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { getEligibleTargets } from '../target';
import { valueUnit } from './evaluate';
import type { TargetAssignment, TargetRef } from './model';
import { refKey, toRef } from './refs';

interface Slot {
  actionIndex: number;
  defIndex: number;
  count: number;
  ranked: TargetRef[];
}

/** Greedy target lists, best assignment first. At most `maxTargetAssignments`. */
export function buildAssignments(
  source: UnitDeployed | SpellCard | Land,
  actions: ActionDefinition[]
): TargetAssignment[] {
  const slots: Slot[] = [];
  actions.forEach((action, actionIndex) => {
    (action.targets ?? []).forEach((definition, defIndex) => {
      const count = definition.count || 1;
      const eligible =
        definition.type === TargetType.Self
          ? [source]
          : (getEligibleTargets(source, definition) as unknown[]);
      const ranked = eligible
        .map((entity) => toRef(entity as UnitDeployed))
        .sort((a, b) => compareTargets(action, a, b));
      const unique: TargetRef[] = [];
      const seen = new Set<string>();
      for (const ref of ranked) {
        const key = refKey(ref);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(ref);
      }
      slots.push({ actionIndex, defIndex, count, ranked: unique });
    });
  });
  if (slots.length === 0) {
    return [actions.map(() => [])];
  }
  if (slots.some((slot) => slot.ranked.length < slot.count)) return [];

  const primary = slots.reduce((best, slot) =>
    slot.ranked.length - slot.count > best.ranked.length - best.count ? slot : best
  );
  const limit = Math.min(
    config.maxTargetAssignments,
    Math.max(1, primary.ranked.length - primary.count + 1)
  );
  const assignments: TargetAssignment[] = [];
  for (let offset = 0; offset < limit; offset++) {
    const byAction: TargetRef[][][] = actions.map(() => []);
    let filled = true;
    for (const slot of slots) {
      const start = slot === primary ? offset : 0;
      const chosen = slot.ranked.slice(start, start + slot.count);
      if (chosen.length < slot.count) {
        filled = false;
        break;
      }
      byAction[slot.actionIndex][slot.defIndex] = chosen;
    }
    if (filled) assignments.push(byAction);
  }
  return assignments;
}

function compareTargets(action: ActionDefinition, a: TargetRef, b: TargetRef): number {
  const delta = targetRank(action, b) - targetRank(action, a);
  if (delta !== 0) return delta;
  return refKey(a).localeCompare(refKey(b));
}

function targetRank(action: ActionDefinition, ref: TargetRef): number {
  if (ref.kind !== 'unit') return 0;
  const unit = bs.units.find((entry) => entry.instanceId === ref.instanceId);
  if (!unit) return 0;
  if (wouldKill(action, unit)) return 1000 + valueUnit(unit);
  return 0;
}

export function recognizedKillValue(
  actions: ActionDefinition[],
  assignment: TargetAssignment
): number {
  let total = 0;
  actions.forEach((action, actionIndex) => {
    for (const group of assignment[actionIndex] ?? []) {
      for (const ref of group) {
        if (ref.kind !== 'unit') continue;
        const unit = bs.units.find((entry) => entry.instanceId === ref.instanceId);
        if (unit && wouldKill(action, unit)) total += valueUnit(unit);
      }
    }
  });
  return total;
}

function wouldKill(action: ActionDefinition, unit: UnitDeployed): boolean {
  if (action.effect.name === 'destroyUnit') return true;
  if (action.effect.name !== 'damageUnit') return false;
  const damage = Number(action.effect.args?.damage ?? 0);
  return damage >= unit.health + (unit.keywords?.resist ?? 0);
}
