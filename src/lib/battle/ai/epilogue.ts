import type { Land, Player, UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { canAttack, autoAttack, validAttackTargets } from '../combat';
import { nextTurn } from '../turn';
import { HUMAN_PLAYER_ID } from './model';

let epilogueDepth = 0;

export function isInsideEpilogue() {
  return epilogueDepth > 0;
}

/**
 * End the AI turn, start the opponent's turn, then swing only with opponent
 * attacks that would kill a unit, raze a land, or kill the player.
 * Non-lethal chips are skipped so inevitable counterswings do not punish trading.
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
    if (!attackWouldKill(live)) continue;
    autoAttack(live);
  }
}

/** True when autoAttack's first legal target would die / be ruined / lose the game. */
function attackWouldKill(attacker: UnitDeployed): boolean {
  const targets = validAttackTargets(attacker);
  if (targets.length === 0) return false;
  return swingKills(attacker, targets[0]);
}

function swingKills(
  attacker: UnitDeployed,
  target: UnitDeployed | Land | Player
): boolean {
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
