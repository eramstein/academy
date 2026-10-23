import type { Land, Player, UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import {
  attackLand,
  attackPlayer,
  attackUnit,
  canAttack,
  validAttackTargets,
} from '../combat';
import { nextTurn } from '../turn';
import { valueUnit } from './evaluate';
import { HUMAN_PLAYER_ID } from './model';

type AttackTarget = UnitDeployed | Land | Player;

let epilogueDepth = 0;

export function isInsideEpilogue() {
  return epilogueDepth > 0;
}

/**
 * End the AI turn, start the opponent's turn, then swing only with opponent
 * attacks that would kill a unit, raze a land, or kill the player — alone or
 * together with other still-ready attackers that share that target.
 * Among those lethal targets it picks the greediest (player, then highest
 * valueUnit, then land). Multi-attacker kills reserve the partners so an early
 * chip is finished. Non-lethal chips that cannot finish a kill are skipped so
 * inevitable counterswings do not punish trading. Row then column order among
 * attackers. Lethal swings still use real combat: stun, armor, retaliate, trample.
 * Does not cast their spells or move their units. playAiTurn is gated on headless mode.
 */
export function runEpilogue() {
  if (bs.playerIdWon !== null) return;
  epilogueDepth++;
  try {
    if (!bs.isPlayersTurn) {
      nextTurn();
    }
    if (bs.playerIdWon !== null) return;
    swingLethalAttackers();
  } finally {
    epilogueDepth--;
  }
}

function swingLethalAttackers() {
  const ids = bs.units
    .filter((unit) => unit.ownerPlayerId === HUMAN_PLAYER_ID && canAttack(unit))
    .sort((a, b) => a.position.row - b.position.row || a.position.column - b.position.column)
    .map((unit) => unit.instanceId);
  /** Attacker instanceId → target key they must finish for a coalition kill. */
  const reserved = new Map<string, string>();

  for (const id of ids) {
    if (bs.playerIdWon !== null) return;
    const live = bs.units.find((unit) => unit.instanceId === id);
    if (!live || !canAttack(live)) continue;
    const ready = ids
      .map((attackerId) => bs.units.find((unit) => unit.instanceId === attackerId))
      .filter((unit): unit is UnitDeployed => !!unit && canAttack(unit));

    const forcedKey = reserved.get(id);
    if (forcedKey) {
      const forced = resolveTargetKey(live, forcedKey);
      reserved.delete(id);
      if (forced && hitPoints(forced) < Infinity) {
        resolveAttack(live, forced);
        continue;
      }
    }

    const target = pickLethalTarget(live, ready, reserved);
    if (!target) continue;
    if (!swingKills(live, target)) {
      reservePartners(live, target, ready, reserved);
    }
    resolveAttack(live, target);
  }
}

/**
 * Among legal attack targets, the best lethal one for the opponent: player first,
 * then highest valueUnit, then land. A target counts as lethal when this attacker
 * alone kills it, or when remaining unreserved attackers who can hit it deal enough
 * combined damage (armor applied per swing).
 */
function pickLethalTarget(
  attacker: UnitDeployed,
  readyAttackers: UnitDeployed[],
  reserved: Map<string, string>
): AttackTarget | null {
  const lethal = validAttackTargets(attacker).filter(
    (target) =>
      swingKills(attacker, target) || coalitionKills(attacker, target, readyAttackers, reserved)
  );
  if (lethal.length === 0) return null;
  lethal.sort((a, b) => lethalPriority(b) - lethalPriority(a));
  return lethal[0];
}

function lethalPriority(target: AttackTarget): number {
  if ('isPlayer' in target) return 1e9 + target.life;
  if ('isRuined' in target) return 1e6 + target.health;
  return valueUnit(target);
}

function swingKills(attacker: UnitDeployed, target: AttackTarget): boolean {
  return swingDamage(attacker, target) >= hitPoints(target);
}

/** True when this attacker plus free (or already-reserved-for-this) allies kill it. */
function coalitionKills(
  attacker: UnitDeployed,
  target: AttackTarget,
  readyAttackers: UnitDeployed[],
  reserved: Map<string, string>
): boolean {
  const key = targetKey(target);
  let damage = 0;
  for (const ally of readyAttackers) {
    if (ally.instanceId === attacker.instanceId) {
      damage += swingDamage(ally, target);
    } else if (!canJoinCoalition(ally, target, key, reserved)) {
      continue;
    } else {
      damage += swingDamage(ally, target);
    }
    if (damage >= hitPoints(target)) return true;
  }
  return false;
}

function canJoinCoalition(
  ally: UnitDeployed,
  target: AttackTarget,
  key: string,
  reserved: Map<string, string>
): boolean {
  const prior = reserved.get(ally.instanceId);
  if (prior !== undefined && prior !== key) return false;
  return canTarget(ally, target);
}

/** Reserve the cheapest later allies so this chip is finished. */
function reservePartners(
  attacker: UnitDeployed,
  target: AttackTarget,
  readyAttackers: UnitDeployed[],
  reserved: Map<string, string>
) {
  const key = targetKey(target);
  let needed = hitPoints(target) - swingDamage(attacker, target);
  if (needed <= 0) return;
  const partners = readyAttackers.filter(
    (ally) =>
      ally.instanceId !== attacker.instanceId &&
      !reserved.has(ally.instanceId) &&
      canTarget(ally, target)
  );
  for (const ally of partners) {
    if (needed <= 0) break;
    reserved.set(ally.instanceId, key);
    needed -= swingDamage(ally, target);
  }
}

function canTarget(attacker: UnitDeployed, target: AttackTarget): boolean {
  return validAttackTargets(attacker).some((entry) => sameTarget(entry, target));
}

function resolveTargetKey(attacker: UnitDeployed, key: string): AttackTarget | null {
  return validAttackTargets(attacker).find((target) => targetKey(target) === key) ?? null;
}

function sameTarget(a: AttackTarget, b: AttackTarget): boolean {
  return targetKey(a) === targetKey(b);
}

function targetKey(target: AttackTarget): string {
  if ('isPlayer' in target) return `player:${target.id}`;
  return `id:${target.instanceId}`;
}

function hitPoints(target: AttackTarget): number {
  if ('isPlayer' in target) return target.life;
  if ('isRuined' in target) return target.isRuined ? Infinity : target.health;
  return target.health;
}

function swingDamage(attacker: UnitDeployed, target: AttackTarget): number {
  const swing = attacker.power + (attacker.counters?.rage ?? 0);
  if ('hasAttacked' in target) {
    const armor = attacker.keywords?.armorPiercing ? 0 : (target.keywords?.armor ?? 0);
    return Math.max(0, swing - armor);
  }
  return swing;
}

function resolveAttack(attacker: UnitDeployed, target: AttackTarget) {
  if ('hasAttacked' in target) {
    attackUnit(attacker, target);
    return;
  }
  if ('isRuined' in target) {
    attackLand(attacker, target);
    return;
  }
  attackPlayer(attacker, target.id);
}
