import type { BattleState } from '@/lib/_model';
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
  const includeMana = options.includeMana !== false;
  const credits = measureCredits(baseline, favoringPlayerId, includeLatent, includeMana);
  const healthBefore = new Map(bs.units.map((unit) => [unit.instanceId, unit.health]));
  if (!isInsideEpilogue()) {
    runEpilogue();
  }
  credits.latent = includeLatent ? reconcileLatent(credits.latentHits, healthBefore) : 0;
  return scorePosition(baseline, favoringPlayerId, credits);
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
