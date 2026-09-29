import type { BattleState } from '@/lib/_model';
import AiWorker from './ai.worker?worker';
import { applyCandidate, candidateLabel } from './apply';
import { generateCandidates } from './candidates';
import { emptyCredits, scorePosition, setActivePreset } from './evaluate';
import { capQueue, survivalInserts, threatenedRows } from './heuristic';
import { AI_PLAYER_ID, WeightPreset, type Candidate, type ScoreBreakdown } from './model';
import { snapshotBattle } from './snapshot';
import { getWeightPreset } from './strategy';

export interface SearchDecision {
  candidate: Candidate;
  result: ScoreBreakdown;
  queue: Candidate[];
}

export async function chooseAction(): Promise<SearchDecision> {
  const preset = getWeightPreset();
  setActivePreset(preset);
  const baseline = snapshotBattle();
  const live = scorePosition(baseline, AI_PLAYER_ID, emptyCredits());
  const generated = generateCandidates();
  const threats = threatenedRows();
  const answerMode = threats.player.length > 0 || threats.land.length > 0;
  const queue = capQueue(generated, answerMode);
  console.log(
    'AI decision',
    preset,
    'position',
    live.score.toFixed(1),
    'queue',
    queue.length,
    answerMode ? 'answers' : 'normal'
  );

  const worker = new AiWorker();
  try {
    let results = await evaluateOn(worker, baseline, queue, preset);
    let simulated = [...queue];
    const pass = results.find((result) => result.id === 'pass');
    if (pass?.terminal === 'loss') {
      const extra = survivalInserts(generated, simulated);
      if (extra.length > 0) {
        const more = await evaluateOn(worker, baseline, extra, preset);
        results = results.concat(more);
        simulated = simulated.concat(extra);
        console.log('AI survival inserts', extra.map(candidateLabel));
      }
    }
    results.sort(compareScores);
    const best = results[0];
    const candidate = simulated.find((entry) => entry.id === best?.id) ?? {
      id: 'pass',
      kind: 'pass' as const,
    };
    console.log(
      'AI chooses',
      candidateLabel(candidate),
      best?.terminal,
      Number.isFinite(best?.score) ? best.score.toFixed(1) : best?.score,
      'pass',
      pass?.terminal
    );
    return {
      candidate,
      result: best ?? {
        id: 'pass',
        terminal: 'none',
        score: 0,
        life: 0,
        board: 0,
        lands: 0,
        hand: 0,
        color: 0,
        mana: 0,
        latent: 0,
      },
      queue: simulated,
    };
  } finally {
    worker.terminate();
  }
}

function evaluateOn(
  worker: Worker,
  baseline: BattleState,
  candidates: Candidate[],
  preset: WeightPreset
): Promise<ScoreBreakdown[]> {
  if (candidates.length === 0) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'EVALUATE_RESULT' || !event.data.results) return;
      worker.removeEventListener('message', onMessage);
      resolve(event.data.results as ScoreBreakdown[]);
    };
    worker.addEventListener('message', onMessage);
    worker.onerror = (error) => {
      worker.removeEventListener('message', onMessage);
      reject(error);
    };
    worker.postMessage({
      type: 'EVALUATE_CANDIDATES',
      baseline,
      candidates,
      preset,
    });
  });
}

function compareScores(a: ScoreBreakdown, b: ScoreBreakdown): number {
  const order = { win: 2, none: 1, loss: 0 };
  if (order[a.terminal] !== order[b.terminal]) return order[b.terminal] - order[a.terminal];
  return b.score - a.score;
}
