import type { Position, UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { AI_PLAYER_ID } from './model';
import { exchange } from './valuations/config';

/** Stats the lane term needs. A deployed unit satisfies this; a card in hand can too. */
export interface LaneBody {
  instanceId: string;
  ownerPlayerId: number;
  power: number;
  health: number;
  retaliate?: number;
  keywords?: UnitDeployed['keywords'];
  counters?: UnitDeployed['counters'];
}

interface Spot extends LaneBody {
  position: Position;
}

/**
 * Extra board value from where a body is standing.
 * Offense follows attack rules: a friend in front does not stop the swing. Non-ranged
 * (and non-flying) units look at the closest enemy in the row; retaliate that would
 * kill them zeros the credit. Stall is only for the front body, and only when that
 * body survives the row's power or its retaliate kills the attacker.
 */
export function laneValue(unit: UnitDeployed): number {
  const spots = roster();
  const spot = spots.find((entry) => entry.instanceId === unit.instanceId);
  if (!spot) return 0;
  return contribution(spot, spots);
}

/** Lane points for every body if `body` were standing on `at` (a move or a deploy). */
export function laneSides(body: LaneBody, at: Position): { own: number; enemy: number } {
  const spots = roster(body, at);
  let own = 0;
  let enemy = 0;
  for (const spot of spots) {
    const points = contribution(spot, spots);
    if (spot.ownerPlayerId === AI_PLAYER_ID) own += points;
    else enemy += points;
  }
  return { own, enemy };
}

function roster(overlay?: LaneBody, at?: Position): Spot[] {
  const spots: Spot[] = [];
  for (const unit of bs.units) {
    if (unit.health <= 0) continue;
    if (overlay && unit.instanceId === overlay.instanceId) continue;
    spots.push({
      instanceId: unit.instanceId,
      ownerPlayerId: unit.ownerPlayerId,
      power: unit.power,
      health: unit.health,
      retaliate: unit.retaliate,
      keywords: unit.keywords,
      counters: unit.counters,
      position: unit.position,
    });
  }
  if (overlay && at && overlay.health > 0) {
    spots.push({ ...overlay, position: at });
  }
  return spots;
}

function contribution(unit: Spot, spots: Spot[]): number {
  const row = spots.filter((other) => other.position.row === unit.position.row);
  const foes = row.filter((other) => other.ownerPlayerId !== unit.ownerPlayerId);
  const allies = row.filter((other) => other.ownerPlayerId === unit.ownerPlayerId);
  const swing = swingOf(unit);
  // Non-ranged / non-flying: same as getClosestBlocker. Ranged could pick any foe;
  // the softest one is enough for this cheap term.
  const target = unit.keywords?.ranged ? softestFoe(foes) : closestFoe(unit, foes);
  const frontAlly = !hasAllyCloser(unit, allies);

  let offense = 0;
  if (swing > 0) {
    if (!target || unit.keywords?.flying) {
      offense = swing;
    } else if (!unit.keywords?.ranged && (target.retaliate ?? 0) >= unit.health) {
      offense = 0;
    } else {
      offense = (swing * swing) / (swing + target.health);
    }
  }

  let stall = 0;
  const threat = foes.reduce((sum, foe) => sum + swingOf(foe), 0);
  if (frontAlly && threat > 0 && target) {
    const survives = unit.health > threat;
    const punishes = (unit.retaliate ?? 0) >= target.health;
    if (survives || punishes) {
      stall = Math.min(unit.health + (unit.retaliate ?? 0), threat);
    }
  }

  return exchange.lanePoint * (offense + stall);
}

function closestFoe(unit: Spot, foes: Spot[]): Spot | undefined {
  let best: Spot | undefined;
  for (const foe of foes) {
    if (!best || closerToEnemy(foe, best)) best = foe;
  }
  return best;
}

function softestFoe(foes: Spot[]): Spot | undefined {
  let best: Spot | undefined;
  for (const foe of foes) {
    if (!best || foe.health < best.health) best = foe;
  }
  return best;
}

function hasAllyCloser(unit: Spot, allies: Spot[]): boolean {
  return allies.some((ally) => ally.instanceId !== unit.instanceId && closerToEnemy(ally, unit));
}

/** True when `a` stands nearer the opposing half than `b`. */
function closerToEnemy(a: Spot, b: Spot): boolean {
  if (a.ownerPlayerId === AI_PLAYER_ID) return a.position.column < b.position.column;
  return a.position.column > b.position.column;
}

function swingOf(unit: LaneBody): number {
  return unit.power + (unit.counters?.rage ?? 0);
}
