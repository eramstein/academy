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

let epilogueDepth = 0;

export function isInsideEpilogue() {
  return epilogueDepth > 0;
}

/**
 * End the AI turn, start the opponent's turn, then swing only with opponent
 * attacks that would kill a unit, raze a land, or kill the player.
 * Among legal targets, picks a lethal one (not merely targets[0]), so a ranged
 * unit that can kill a 2-HP blocker is not skipped because a 3-HP body is listed first.
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
  for (const id of ids) {
    if (bs.playerIdWon !== null) return;
    const live = bs.units.find((unit) => unit.instanceId === id);
    if (!live || !canAttack(live)) continue;
    const target = pickLethalTarget(live);
    if (!target) continue;
    resolveAttack(live, target);
  }
}

/**
 * Among legal attack targets, the best lethal one for the opponent: player first,
 * then highest valueUnit, then land. Non-lethal targets are ignored.
 */
function pickLethalTarget(attacker: UnitDeployed): UnitDeployed | Land | Player | null {
  const lethal = validAttackTargets(attacker).filter((target) => swingKills(attacker, target));
  if (lethal.length === 0) return null;
  lethal.sort((a, b) => lethalPriority(b) - lethalPriority(a));
  return lethal[0];
}

function lethalPriority(target: UnitDeployed | Land | Player): number {
  if ('isPlayer' in target) return 1e9 + target.life;
  if ('isRuined' in target) return 1e6 + target.health;
  return valueUnit(target);
}

function swingKills(attacker: UnitDeployed, target: UnitDeployed | Land | Player): boolean {
  const swing = attacker.power + (attacker.counters?.rage ?? 0);
  if ('isPlayer' in target) {
    return swing >= target.life;
  }
  if ('isRuined' in target) {
    return !target.isRuined && swing >= target.health;
  }
  const armor = attacker.keywords?.armorPiercing ? 0 : (target.keywords?.armor ?? 0);
  return swing - armor >= target.health;
}

function resolveAttack(attacker: UnitDeployed, target: UnitDeployed | Land | Player) {
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
