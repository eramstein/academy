import type { BattleState, UnitDeployed } from '@/lib/_model';
import { bs } from '@/lib/_state';
import { runEpilogue, isInsideEpilogue } from './epilogue';
import {
  colorProgress,
  emptyCredits,
  lossBreakdown,
  manaCreditFor,
  scorePosition,
  weightsFor,
  getActivePreset,
  type ScoreCredits,
} from './evaluate';
import { latentCredit, reconcileLatent, type LatentHit } from './latent';
import { AI_PLAYER_ID, type ScoreBreakdown } from './model';

/** Score the current board for `favoringPlayerId`. Runs the epilogue unless one is already in progress. */
export function scoreLine(
  baseline: BattleState,
  favoringPlayerId: number,
  options: { includeLatent?: boolean; includeMana?: boolean } = {}
): Omit<ScoreBreakdown, 'id'> {
  if (isTerminal()) {
    return scorePosition(baseline, favoringPlayerId, emptyCredits());
  }
  // Pass ends the turn: leftover attacks and unspent mana are gone.
  const includeLatent = options.includeLatent !== false;
  // No-op spells (e.g. heal on full HP) must not keep leftover-mana credit vs pass.
  const includeMana =
    options.includeMana !== false && !spellWasNoOp(baseline, favoringPlayerId);
  const credits = measureCredits(baseline, favoringPlayerId, includeLatent, includeMana);
  const healthBefore = new Map(bs.units.map((unit) => [unit.instanceId, unit.health]));
  if (!isInsideEpilogue()) {
    runEpilogue();
  }
  credits.latent = includeLatent ? reconcileLatent(credits.latentHits, healthBefore) : 0;
  return scorePosition(baseline, favoringPlayerId, credits);
}

/**
 * True when the only zone change since baseline is the caster spending exactly one hand
 * card into their graveyard, with no battlefield / life / color / other zone changes.
 */
export function spellWasNoOp(baseline: BattleState, casterId: number): boolean {
  if (!battlefieldUnchanged(baseline)) return false;
  if (!colorsUnchanged(baseline)) return false;
  for (let playerId = 0; playerId < bs.players.length; playerId++) {
    if (playerId === casterId) continue;
    if (!sameIds(baseline.players[playerId].hand, bs.players[playerId].hand)) return false;
    if (!sameIds(baseline.players[playerId].graveyard, bs.players[playerId].graveyard)) {
      return false;
    }
    if (!sameIds(baseline.players[playerId].deck, bs.players[playerId].deck)) return false;
  }
  const before = baseline.players[casterId];
  const after = bs.players[casterId];
  if (!sameIds(before.deck, after.deck)) return false;
  const leftHand = idSet(before.hand);
  const nowHand = idSet(after.hand);
  const leftGy = idSet(before.graveyard);
  const nowGy = idSet(after.graveyard);
  const lostHand = [...leftHand].filter((id) => !nowHand.has(id));
  const gainedHand = [...nowHand].filter((id) => !leftHand.has(id));
  const lostGy = [...leftGy].filter((id) => !nowGy.has(id));
  const gainedGy = [...nowGy].filter((id) => !leftGy.has(id));
  return (
    lostHand.length === 1 &&
    gainedGy.length === 1 &&
    lostHand[0] === gainedGy[0] &&
    gainedHand.length === 0 &&
    lostGy.length === 0
  );
}

function battlefieldUnchanged(baseline: BattleState): boolean {
  if (baseline.players.some((player, i) => player.life !== bs.players[i].life)) return false;
  if (baseline.units.length !== bs.units.length) return false;
  const nowById = new Map(bs.units.map((unit) => [unit.instanceId, unit]));
  for (const before of baseline.units) {
    const now = nowById.get(before.instanceId);
    if (!now || !sameUnitCombatState(before, now)) return false;
  }
  for (let playerId = 0; playerId < bs.players.length; playerId++) {
    const beforeLands = baseline.players[playerId].lands;
    const afterLands = bs.players[playerId].lands;
    if (beforeLands.length !== afterLands.length) return false;
    for (let i = 0; i < beforeLands.length; i++) {
      const b = beforeLands[i];
      const a = afterLands[i];
      if (b.instanceId !== a.instanceId || b.health !== a.health || b.isRuined !== a.isRuined) {
        return false;
      }
    }
  }
  return true;
}

function colorsUnchanged(baseline: BattleState): boolean {
  return baseline.players.every(
    (player, i) => JSON.stringify(player.colors) === JSON.stringify(bs.players[i].colors)
  );
}

function sameUnitCombatState(a: UnitDeployed, b: UnitDeployed): boolean {
  return (
    a.health === b.health &&
    a.power === b.power &&
    a.ownerPlayerId === b.ownerPlayerId &&
    a.position.row === b.position.row &&
    a.position.column === b.position.column &&
    JSON.stringify(a.statuses) === JSON.stringify(b.statuses) &&
    JSON.stringify(a.counters) === JSON.stringify(b.counters) &&
    JSON.stringify(a.keywords) === JSON.stringify(b.keywords)
  );
}

function sameIds(before: { instanceId: string }[], after: { instanceId: string }[]): boolean {
  if (before.length !== after.length) return false;
  const a = idSet(before);
  return after.every((card) => a.has(card.instanceId));
}

function idSet(cards: { instanceId: string }[]): Set<string> {
  return new Set(cards.map((card) => card.instanceId));
}

export function withId(id: string, breakdown: Omit<ScoreBreakdown, 'id'>): ScoreBreakdown {
  return { id, ...breakdown };
}

export function failedCandidate(id: string): ScoreBreakdown {
  return withId(id, lossBreakdown());
}

function measureCredits(
  baseline: BattleState,
  favoringPlayerId: number,
  includeLatent: boolean,
  includeMana: boolean
): ScoreCredits & { latentHits: LatentHit[] } {
  const player = bs.players[favoringPlayerId];
  const mana = includeMana ? manaCreditFor(player) : 0;
  const color = colorProgress(baseline, favoringPlayerId);
  const plan =
    includeLatent && favoringPlayerId === AI_PLAYER_ID && !bs.isPlayersTurn
      ? latentCredit(weightsFor(getActivePreset()))
      : { total: 0, hits: [] };
  return { mana, color, latent: plan.total, latentHits: plan.hits };
}

function isTerminal(): boolean {
  return bs.playerIdWon !== null || bs.players[0].life <= 0 || bs.players[1].life <= 0;
}
