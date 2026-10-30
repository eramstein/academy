import { config } from '@/lib/_config';
import type { BattleState } from '@/lib/_model';
import { bs, uiState } from '@/lib/_state';
import { applyCandidate } from './apply';
import { generateCandidates } from './candidates';
import { emptyCredits, scorePosition } from './evaluate';
import { compareRanked, threatenedRows } from './heuristic';
import {
  AI_PLAYER_ID,
  type Candidate,
  type RankedCandidate,
  type ScoreBreakdown,
} from './model';
import { replaceBattleState, resetBattleUiPending, snapshotBattle } from './snapshot';
import { scoreLine } from './simulate';

/**
 * After the first action is already applied, keep playing a short greedy line and
 * return the end-of-turn score (epilogue, no latent — damage is taken by real swings).
 */
export function continueGreedy(baseline: BattleState): Omit<ScoreBreakdown, 'id'> {
  if (isTerminal()) {
    return scorePosition(baseline, AI_PLAYER_ID, emptyCredits());
  }

  for (let step = 0; step < config.continuationSteps; step++) {
    if (isTerminal()) break;

    const generated = generateCandidates();
    const threats = threatenedRows();
    const answerMode = threats.player.length > 0 || threats.land.length > 0;
    const options = pickContinuationCandidates(generated, answerMode);
    const before = snapshotBattle();

    let best: Candidate = { id: 'pass', kind: 'pass' };
    let bestScore: Omit<ScoreBreakdown, 'id'> | null = null;

    for (const candidate of options) {
      try {
        replaceBattleState(before);
        resetBattleUiPending();
        uiState.isHeadless = true;
        applyCandidate(candidate);
        const scored = scoreLine(baseline, AI_PLAYER_ID, {
          includeLatent: false,
          includeMana: candidate.kind !== 'pass',
        });
        if (!bestScore || isBetter(scored, bestScore)) {
          best = candidate;
          bestScore = scored;
        }
      } catch (error) {
        console.warn('AI continuation candidate failed', candidate.id, error);
      }
    }

    replaceBattleState(before);
    resetBattleUiPending();
    uiState.isHeadless = true;

    if (!bestScore || best.kind === 'pass') {
      return (
        bestScore ??
        scoreLine(baseline, AI_PLAYER_ID, { includeLatent: false, includeMana: false })
      );
    }

    applyCandidate(best);
  }

  return scoreLine(baseline, AI_PLAYER_ID, { includeLatent: false, includeMana: true });
}

/**
 * Small beam for the next action: always try pass, prefer attacks (kills first),
 * keep at least one primary spell, then fill from the normal heuristic order.
 */
export function pickContinuationCandidates(
  generated: RankedCandidate[],
  answerMode: boolean
): Candidate[] {
  const branch = Math.max(1, config.continuationBranch);
  const pass = generated.find((entry) => entry.candidate.kind === 'pass')?.candidate;
  const byImpact = (a: RankedCandidate, b: RankedCandidate) => {
    const tierDelta = continuationTier(b) - continuationTier(a);
    if (tierDelta !== 0) return tierDelta;
    if (a.primary !== b.primary) return a.primary ? -1 : 1;
    return compareRanked(a, b, answerMode);
  };

  const attacks = generated
    .filter((entry) => entry.candidate.kind === 'attack')
    .sort(byImpact);
  const spells = generated
    .filter((entry) => entry.candidate.kind === 'spell' && entry.primary)
    .sort(byImpact);
  const rest = generated
    .filter(
      (entry) =>
        entry.candidate.kind !== 'pass' &&
        entry.candidate.kind !== 'attack' &&
        !(entry.candidate.kind === 'spell' && entry.primary)
    )
    .sort(byImpact);

  const selected: Candidate[] = [];
  const seen = new Set<string>();
  const push = (entry: RankedCandidate | Candidate | undefined) => {
    if (!entry || selected.length >= branch + (pass ? 1 : 0)) return;
    const candidate = 'candidate' in entry ? entry.candidate : entry;
    if (seen.has(candidate.id)) return;
    seen.add(candidate.id);
    selected.push(candidate);
  };

  if (pass) push(pass);

  const attackSlots = Math.min(2, attacks.length, branch);
  for (const entry of attacks.slice(0, attackSlots)) push(entry);

  if (spells[0] && selected.length < branch + (pass ? 1 : 0)) push(spells[0]);

  for (const entry of [...attacks.slice(attackSlots), ...spells.slice(1), ...rest]) {
    push(entry);
  }

  return selected;
}

function continuationTier(entry: RankedCandidate): number {
  if (entry.obviousLethal) return 40;
  if (entry.candidate.kind === 'attack') {
    // attackRank uses 1e6+ for kills; chips stay lower but still above spells
    return entry.rank >= 1e6 ? 35 : 30;
  }
  if (entry.killValue > 0) return 25;
  if (entry.candidate.kind === 'spell') return 18;
  if (entry.candidate.kind === 'activate') return 16;
  if (entry.candidate.kind === 'deploy') return 12;
  if (entry.candidate.kind === 'move') return 10;
  if (entry.candidate.kind === 'color') return 6;
  return 0;
}

function isBetter(a: Omit<ScoreBreakdown, 'id'>, b: Omit<ScoreBreakdown, 'id'>): boolean {
  const order = { win: 2, none: 1, loss: 0 };
  if (order[a.terminal] !== order[b.terminal]) return order[a.terminal] > order[b.terminal];
  return a.score > b.score;
}

function isTerminal(): boolean {
  return bs.playerIdWon !== null || bs.players[0].life <= 0 || bs.players[1].life <= 0;
}
