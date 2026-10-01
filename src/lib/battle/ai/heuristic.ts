import { config } from '@/lib/_config';
import type { BattleState, Land, Player, Position, UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { canAttack } from '../combat';
import { getActivePreset, weightsFor } from './evaluate';
import { type LaneBody, laneSides } from './lane';
import { AI_PLAYER_ID, HUMAN_PLAYER_ID, type Candidate, type RankedCandidate } from './model';
import { getDangerLevelPerRow } from './rows';
import { landDestructionValue } from './valuations/config';

const QUOTAS: Record<string, number> = {
  pass: 1,
  color: 4,
  land: 2,
  spell: 4,
  deploy: 3,
  move: 3,
  attack: 4,
  activate: 2,
};

export function cellScore(
  unit: (LaneBody & { position?: Position }) | null,
  cell: Position,
  state: BattleState = bs
): number {
  const danger = getDangerLevelPerRow(state, standingUnit(unit));
  const dest = danger[cell.row] ?? 0;
  const origin = unit?.position ? (danger[unit.position.row] ?? 0) : 0;
  let score = 0;
  if (origin === Infinity && dest !== Infinity) score = -1e9;
  else if (dest === Infinity) score = 1e9;
  else if (origin === landDestructionValue && dest < landDestructionValue) score = -1e6;
  else if (dest === landDestructionValue) score = 1e6;
  if (unit) {
    const weights = weightsFor(getActivePreset());
    const sides = laneSides(unit, cell);
    score +=
      weights.boardWeight *
      (weights.ownUnitWeight * sides.own - weights.enemyUnitWeight * sides.enemy);
  }
  score += (config.boardRows - cell.row) * 0.01 + (config.boardColumns - cell.column) * 0.001;
  return score;
}

function standingUnit(unit: (LaneBody & { position?: Position }) | null): UnitDeployed | undefined {
  if (!unit?.position) return undefined;
  return bs.units.find((entry) => entry.instanceId === unit.instanceId);
}

export function isObviousLethal(unit: UnitDeployed, target: UnitDeployed | Land | Player): boolean {
  const swing = swingOf(unit);
  const opponent = bs.players[HUMAN_PLAYER_ID];
  if ('isPlayer' in target && target.isPlayer && target.id === HUMAN_PLAYER_ID) {
    return swing >= opponent.life;
  }
  if (!('hasAttacked' in (target as UnitDeployed))) return false;
  const blocker = target as UnitDeployed;
  const blockers = bs.units.filter(
    (entry) => entry.ownerPlayerId !== unit.ownerPlayerId && entry.position.row === unit.position.row
  );
  if (blockers.length !== 1 || blockers[0].instanceId !== blocker.instanceId) return false;
  if (!attackKills(unit, blocker)) return false;
  const land = opponent.lands.find((entry) => entry.position === unit.position.row && !entry.isRuined);
  const needed = (land ? land.health : 0) + opponent.life;
  let behind = bs.units
    .filter(
      (entry) =>
        entry.ownerPlayerId === AI_PLAYER_ID &&
        entry.position.row === unit.position.row &&
        entry.instanceId !== unit.instanceId &&
        canAttack(entry)
    )
    .reduce((sum, entry) => sum + swingOf(entry), 0);
  if (unit.keywords?.trample) {
    const armor = unit.keywords.armorPiercing ? 0 : (blocker.keywords?.armor ?? 0);
    behind += Math.max(0, swing - armor - blocker.health);
  }
  return behind >= needed;
}

export function threatenedRows(state: BattleState = bs): { player: number[]; land: number[] } {
  const danger = getDangerLevelPerRow(state);
  const player: number[] = [];
  const land: number[] = [];
  for (let row = 0; row < config.boardRows; row++) {
    if (danger[row] === Infinity) player.push(row);
    else if (danger[row] === landDestructionValue) land.push(row);
  }
  return { player, land };
}

export function compareRanked(a: RankedCandidate, b: RankedCandidate, answerMode: boolean): number {
  const delta = sortRank(b, answerMode) - sortRank(a, answerMode);
  if (delta !== 0) return delta;
  if (b.manaCost !== a.manaCost) return b.manaCost - a.manaCost;
  return a.instanceId.localeCompare(b.instanceId);
}

/** Reserved quotas, then leftover slots, then forced lethal attacks up to the absolute ceiling. */
export function capQueue(generated: RankedCandidate[], answerMode: boolean): Candidate[] {
  const selected: RankedCandidate[] = [];
  const taken = new Set<string>();
  for (const kind of Object.keys(QUOTAS)) {
    const group = generated
      .filter((entry) => entry.primary && quotaKey(entry) === kind)
      .sort((a, b) => compareRanked(a, b, answerMode));
    for (const entry of group.slice(0, QUOTAS[kind])) {
      selected.push(entry);
      taken.add(entry.candidate.id);
    }
  }
  const leftover = config.maxSimulations - selected.length;
  if (leftover > 0) {
    const rest = generated
      .filter((entry) => !taken.has(entry.candidate.id))
      .sort((a, b) => compareRanked(a, b, answerMode));
    for (const entry of rest.slice(0, leftover)) {
      selected.push(entry);
      taken.add(entry.candidate.id);
    }
  }
  for (const entry of generated) {
    if (!entry.obviousLethal || taken.has(entry.candidate.id)) continue;
    if (selected.length >= config.maxAbsoluteSimulations) break;
    selected.push(entry);
    taken.add(entry.candidate.id);
  }
  return selected.map((entry) => entry.candidate);
}

/** When passing dies, add a block into the killing row and answer spells the first cap missed. */
export function survivalInserts(
  generated: RankedCandidate[],
  already: Candidate[]
): Candidate[] {
  const room = config.maxAbsoluteSimulations - already.length;
  if (room <= 0) return [];
  const seen = new Set(already.map((candidate) => candidate.id));
  const killing = killingRowSet();
  const inserts: RankedCandidate[] = [];
  const block = generated
    .filter(
      (entry) =>
        (entry.candidate.kind === 'move' || entry.candidate.kind === 'deploy') &&
        entry.row !== undefined &&
        killing.has(entry.row) &&
        !seen.has(entry.candidate.id)
    )
    .sort((a, b) => compareRanked(a, b, true));
  if (block[0] && !already.some((candidate) => isBlockInto(candidate, killing))) {
    inserts.push(block[0]);
    seen.add(block[0].candidate.id);
  }
  for (const kind of ['spell', 'activate', 'land']) {
    const group = generated
      .filter((entry) => entry.primary && quotaKey(entry) === kind && !seen.has(entry.candidate.id))
      .sort((a, b) => compareRanked(a, b, true))
      .slice(0, QUOTAS[kind]);
    inserts.push(...group);
  }
  return inserts.slice(0, room).map((entry) => entry.candidate);
}

function killingRowSet(): Set<number> {
  const danger = getDangerLevelPerRow(bs);
  const infinite: number[] = [];
  let hottest = 0;
  let hottestDanger = -1;
  for (let row = 0; row < config.boardRows; row++) {
    const level = danger[row] ?? 0;
    if (level === Infinity) infinite.push(row);
    if (level > hottestDanger) {
      hottestDanger = level;
      hottest = row;
    }
  }
  if (infinite.length > 0) return new Set(infinite);
  if (hottestDanger > 0) return new Set([hottest]);
  return new Set();
}

function quotaKey(entry: RankedCandidate): string {
  if (entry.candidate.kind === 'activate') {
    return entry.candidate.sourceKind === 'land' ? 'land' : 'activate';
  }
  return entry.candidate.kind;
}

function isBlockInto(candidate: Candidate, rows: Set<number>): boolean {
  if (candidate.kind !== 'move' && candidate.kind !== 'deploy') return false;
  return rows.has(candidate.row);
}

function sortRank(item: RankedCandidate, answerMode: boolean): number {
  if (item.candidate.kind === 'spell' || item.candidate.kind === 'activate') {
    if (item.killValue > 0) return (answerMode ? 1e9 : 1e6) + item.killValue;
    return item.manaCost;
  }
  return item.rank;
}

function attackKills(attacker: UnitDeployed, target: UnitDeployed): boolean {
  const armor = attacker.keywords?.armorPiercing ? 0 : (target.keywords?.armor ?? 0);
  return swingOf(attacker) - armor >= target.health;
}

function swingOf(unit: UnitDeployed): number {
  return unit.power + (unit.counters?.rage ?? 0);
}
