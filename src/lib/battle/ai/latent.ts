import type { Land, UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { canAttack, validAttackTargets } from '../combat';
import { valueUnit, type PositionWeights } from './evaluate';
import { AI_PLAYER_ID } from './model';
import { exchange } from './valuations/config';

export interface LatentHit {
  kind: 'unit' | 'land' | 'player';
  id: string;
  credit: number;
}

/**
 * Discounted value of attacks the AI can still make this turn, in budget points.
 * `hits` names each credit so a later epilogue can drop a kill it already applied.
 * Callers must skip this for the pass candidate (the turn is ending; those swings are not taken).
 */
export function latentCredit(weights: PositionWeights): { total: number; hits: LatentHit[] } {
  const hits: LatentHit[] = [];
  const attackers = bs.units
    .filter(
      (unit) => unit.ownerPlayerId === AI_PLAYER_ID && canAttack(unit) && swingOf(unit) > 0
    )
    .sort((a, b) => swingOf(b) - swingOf(a) || a.instanceId.localeCompare(b.instanceId));
  const originalUnits = bs.units;
  const dead = new Set<string>();
  const unitHealth = new Map<string, number>();
  const landDamage = new Map<string, number>();
  const ruined: Land[] = [];
  let credit = 0;
  try {
    for (const attacker of attackers) {
      if (dead.has(attacker.instanceId)) continue;
      bs.units = originalUnits.filter((unit) => !dead.has(unit.instanceId));
      const targets = validAttackTargets(attacker);
      const target = targets.find((entry) => !isDeadTarget(entry, dead));
      if (!target) continue;
      const swing = swingOf(attacker);
      if ('isPlayer' in target) {
        const amount = swing * weights.opponentLifeWeight * exchange.latentFactor;
        credit += amount;
        hits.push({ kind: 'player', id: String(target.id), credit: amount });
      } else if ('isRuined' in target) {
        const amount = latentLand(attacker, target, swing, landDamage, ruined);
        credit += amount;
        hits.push({ kind: 'land', id: target.instanceId, credit: amount });
      } else if ('hasAttacked' in target) {
        const amount = latentUnit(attacker, target, swing, unitHealth, dead);
        credit += amount;
        hits.push({ kind: 'unit', id: target.instanceId, credit: amount });
      }
    }
  } finally {
    bs.units = originalUnits;
    for (const land of ruined) land.isRuined = false;
  }
  return { total: credit, hits };
}

/**
 * Drop latent credit the epilogue already put on the board.
 * A unit that dies to retaliate or poison is gone; counting that kill again makes passing
 * look better than taking the attack.
 */
export function reconcileLatent(hits: LatentHit[], healthBefore: Map<string, number>): number {
  let total = 0;
  for (const hit of hits) {
    if (hit.kind !== 'unit') {
      total += hit.credit;
      continue;
    }
    const live = bs.units.find((unit) => unit.instanceId === hit.id);
    const before = healthBefore.get(hit.id);
    if (!live || live.health <= 0 || before === undefined) continue;
    if (live.health < before) {
      const overlapped =
        (durability(live, before) - durability(live, live.health)) * exchange.latentFactor;
      total += Math.max(0, hit.credit - overlapped);
      continue;
    }
    total += hit.credit;
  }
  return total;
}

function latentUnit(
  attacker: UnitDeployed,
  target: UnitDeployed,
  swing: number,
  unitHealth: Map<string, number>,
  dead: Set<string>
): number {
  const armor = attacker.keywords?.armorPiercing ? 0 : (target.keywords?.armor ?? 0);
  const dealt = Math.max(0, swing - armor);
  const current = unitHealth.get(target.instanceId) ?? target.health;
  const next = current - dealt;
  let credit = 0;
  if (next <= 0) {
    credit += valueAtHealth(target, current) * exchange.latentFactor;
    dead.add(target.instanceId);
  } else {
    unitHealth.set(target.instanceId, next);
    const drop = durability(target, current) - durability(target, next);
    credit += drop * exchange.latentFactor;
  }
  const retaliate = !attacker.keywords?.ranged && (target.retaliate ?? 0) >= attacker.health;
  if (retaliate) {
    credit -= valueUnit(attacker) * exchange.latentFactor;
    dead.add(attacker.instanceId);
  }
  return credit;
}

function latentLand(
  attacker: UnitDeployed,
  land: Land,
  swing: number,
  landDamage: Map<string, number>,
  ruined: Land[]
): number {
  const gap = exchange.standingLand - exchange.ruinedLand;
  const already = landDamage.get(land.instanceId) ?? 0;
  const room = Math.max(0, land.health - already);
  const applied = Math.min(swing, room);
  const next = already + applied;
  landDamage.set(land.instanceId, next);
  const before = land.health > 0 ? Math.min(1, already / land.health) : 1;
  const after = land.health > 0 ? Math.min(1, next / land.health) : 1;
  if (next >= land.health && !land.isRuined) {
    land.isRuined = true;
    ruined.push(land);
  }
  let credit = gap * (after - before) * exchange.latentFactor;
  if ((land.retaliate ?? 0) >= attacker.health) {
    credit -= valueUnit(attacker) * exchange.latentFactor;
  }
  return credit;
}

function valueAtHealth(unit: UnitDeployed, health: number): number {
  return valueUnit(unit) - durability(unit, unit.health) + durability(unit, health);
}

function durability(unit: UnitDeployed, health: number): number {
  if (unit.maxHealth <= 0) return 0;
  return unit.maxHealth * 2 * Math.sqrt(Math.max(0, health) / unit.maxHealth);
}

function swingOf(unit: UnitDeployed): number {
  return unit.power + (unit.counters?.rage ?? 0);
}

function isDeadTarget(target: UnitDeployed | Land | { id: number }, dead: Set<string>): boolean {
  return 'instanceId' in target && dead.has(target.instanceId);
}
