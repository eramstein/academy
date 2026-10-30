import { config } from '@/lib/_config';
import {
  CounterType,
  TargetType,
  isUnitCard,
  type ActionDefinition,
  type Card,
  type Land,
  type SpellCard,
  type UnitDeployed,
} from '@/lib/_model';
import { bs } from '@/lib/_state';
import { getCardBudget } from '@/lib/sim/cards/card-budget';
import { positionPlayerId } from '../boards';
import { getEligibleTargets } from '../target';
import { valueUnit } from './evaluate';
import { cellScore } from './heuristic';
import { AI_PLAYER_ID, type TargetAssignment, type TargetRef } from './model';
import { refKey, resolveRef, toRef } from './refs';

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
  const ownerId = source.ownerPlayerId;
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
        .sort((a, b) => compareTargets(action, ownerId, a, b));
      const unique: TargetRef[] = [];
      const seen = new Set<string>();
      for (const ref of ranked) {
        // Drop hard rejects (e.g. reanimate on a spell) so they do not burn assignment slots.
        if (targetRank(action, ownerId, ref) <= -1000) continue;
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

function compareTargets(
  action: ActionDefinition,
  ownerId: number,
  a: TargetRef,
  b: TargetRef
): number {
  const delta = targetRank(action, ownerId, b) - targetRank(action, ownerId, a);
  if (delta !== 0) return delta;
  return refKey(a).localeCompare(refKey(b));
}

function targetRank(action: ActionDefinition, ownerId: number, ref: TargetRef): number {
  const effect = action.effect.name;
  const args = action.effect.args ?? {};

  if (ref.kind === 'unit') {
    const unit = bs.units.find((entry) => entry.instanceId === ref.instanceId);
    if (!unit) return 0;
    const ally = unit.ownerPlayerId === ownerId;
    const enemy = !ally;
    const vu = valueUnit(unit);

    if (effect === 'destroyUnit') {
      return enemy ? 1000 + vu : -1000 - vu;
    }
    if (effect === 'damageUnit') {
      if (wouldKill(action, unit)) return (enemy ? 1000 : -1000) + vu;
      const damage = Number(args.damage ?? 0);
      const dealt = Math.max(0, Math.min(damage, unit.health + (unit.keywords?.resist ?? 0)));
      if (enemy) return 100 + dealt + vu * 0.05;
      return -500 - vu;
    }
    if (effect === 'healUnit') {
      const heal = Number(args.health ?? 0);
      const missing = Math.max(0, unit.maxHealth - unit.health);
      if (missing <= 0) return ally ? -50 : -1000;
      const healed = Math.min(heal, missing);
      // Prefer allies that actually receive healing; weight by amount and body value.
      if (ally) return 500 + healed * 20 + vu * 0.2;
      return -500 - vu;
    }
    if (effect === 'refreshUnit') {
      if (!ally) return -500 - vu;
      const spent = unit.hasAttacked || unit.hasMoved || unit.exhausted ? 200 : 0;
      return 300 + spent + vu * 0.1;
    }
    if (effect === 'bounceUnit' || effect === 'controlUnit') {
      return enemy ? 500 + vu : -500 - vu;
    }
    if (effect === 'applyUnitStatus') {
      const statusType = args.statusType as keyof typeof unit.statuses | undefined;
      const already = statusType ? Number(unit.statuses[statusType] ?? 0) > 0 : false;
      if (already) return enemy ? -50 : -200;
      if (enemy) return 400 + vu;
      return -400 - vu;
    }
    if (effect === 'addCounters') {
      const counterType = args.counterType as CounterType | undefined;
      if (counterType === CounterType.Growth || counterType === CounterType.Rage) {
        return ally ? 300 + vu : -300 - vu;
      }
      if (counterType === CounterType.Decay) {
        return enemy ? 300 + vu : -300 - vu;
      }
      return ally ? 100 + vu : 100 + vu * 0.5;
    }
    // Buff auras / pumps: prefer own bodies.
    if (effect === 'staticStats' || effect === 'staticKeyword' || effect === 'temporaryEffect') {
      return ally ? 300 + vu : -300 - vu;
    }
    if (effect === 'forceMoveUnit' || effect === 'fight') {
      return enemy ? vu : vu * 0.25;
    }
    return 0;
  }

  if (ref.kind === 'land') {
    const land = bs.players
      .flatMap((player) => player.lands)
      .find((entry) => entry.instanceId === ref.instanceId);
    if (!land || land.isRuined) return -1000;
    const ally = land.ownerPlayerId === ownerId;
    if (effect === 'damageLand') {
      const damage = Number(args.damage ?? 0);
      if (!ally) return 400 + Math.min(damage, land.health) * 10 + (land.health <= damage ? 200 : 0);
      return -400;
    }
    if (effect === 'fortifyLand') {
      if (!ally) return -400;
      const amount = Number(args.amount ?? 0);
      return 300 + amount * 5 - land.health;
    }
    return ally ? 1 : -1;
  }

  if (ref.kind === 'card') {
    let card: Card | undefined;
    try {
      card = resolveRef(ref) as Card;
    } catch {
      return 0;
    }
    if (!card || !('cost' in card)) return 0;
    const budget = getCardBudget(card);
    const own = card.ownerPlayerId === ownerId;
    if (effect === 'reanimate') {
      // Body ownership follows the cell; any graveyard unit is fair game. Spells no-op.
      if (!isUnitCard(card)) return -1000;
      return 200 + Number(card.cost ?? 0);
    }
    if (effect === 'regrowCard' || effect === 'tutorCard') {
      return (own ? 1 : 0.25) * (200 + budget);
    }
    if (effect === 'recycleCard') {
      return (own ? 1 : 0.25) * (50 + budget * 0.25);
    }
    if (effect === 'cycleCards') {
      // Prefer discarding low-budget cards.
      return own ? 100 - budget : -100;
    }
    return budget;
  }

  if (ref.kind === 'player') {
    if (effect === 'damagePlayer') {
      return ref.playerId === ownerId ? -1000 : 500 + Number(args.damage ?? 0) * 10;
    }
    return ref.playerId === ownerId ? 1 : -1;
  }

  if (ref.kind === 'cell') {
    const cell = { row: ref.row, column: ref.column };
    const ally = positionPlayerId(cell) === ownerId;
    const seat = ally ? 500 : -500;
    // Place a friendly body: own half first, then better lanes via cellScore.
    if (effect === 'reanimate' || effect === 'controlUnit' || effect === 'summon') {
      return seat + cellScore(null, cell);
    }
    // Push / shove destinations are almost always onto the enemy half.
    if (effect === 'forceMoveUnit') {
      return ally ? -500 : 500 + cellScore(null, cell);
    }
    // Unknown cell effects: slight bias to own half so lexicographic human cells lose.
    return seat;
  }

  return 0;
}

/** Positive impact used to prioritize spell/activate candidates in the capped queue. */
export function recognizedKillValue(
  actions: ActionDefinition[],
  assignment: TargetAssignment
): number {
  let total = 0;
  actions.forEach((action, actionIndex) => {
    for (const group of assignment[actionIndex] ?? []) {
      for (const ref of group) {
        total += impactForTarget(action, ref);
      }
    }
  });
  return total;
}

function impactForTarget(action: ActionDefinition, ref: TargetRef): number {
  if (ref.kind === 'unit') {
    const unit = bs.units.find((entry) => entry.instanceId === ref.instanceId);
    if (!unit) return 0;
    if (wouldKill(action, unit)) return valueUnit(unit);
    if (action.effect.name === 'healUnit') {
      if (unit.ownerPlayerId !== AI_PLAYER_ID) return 0;
      const heal = Number(action.effect.args?.health ?? 0);
      const missing = Math.max(0, unit.maxHealth - unit.health);
      if (missing <= 0) return 0;
      return Math.min(heal, missing) * 2;
    }
    return 0;
  }
  return 0;
}

function wouldKill(action: ActionDefinition, unit: UnitDeployed): boolean {
  if (action.effect.name === 'destroyUnit') return true;
  if (action.effect.name !== 'damageUnit') return false;
  const damage = Number(action.effect.args?.damage ?? 0);
  return damage >= unit.health + (unit.keywords?.resist ?? 0);
}
