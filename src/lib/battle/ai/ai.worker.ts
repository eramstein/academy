import type { BattleState } from '@/lib/_model';
import { bs } from '@/lib/_state/main.svelte';
import { uiState } from '@/lib/_state/state-ui.svelte';
import { nextTurn } from '../turn';
import { applyCandidate } from './apply';
import { setActivePreset } from './evaluate';
import { failedCandidate, scoreLine, withId } from './simulate';
import { replaceBattleState, resetBattleUiPending } from './snapshot';
import { AI_PLAYER_ID, type Candidate, type ScoreBreakdown, type WeightPreset } from './model';

uiState.isHeadless = true;

self.onmessage = (event: MessageEvent) => {
  const { type, snapshot, baseline, candidates, preset } = event.data as {
    type: string;
    snapshot?: BattleState;
    baseline?: BattleState;
    candidates?: Candidate[];
    preset?: WeightPreset;
  };

  if (type === 'EVALUATE_PASS_TURN' && snapshot) {
    replaceBattleState(snapshot);
    resetBattleUiPending();
    nextTurn();
    self.postMessage({
      type: 'EVALUATE_RESULT',
      resultingState: JSON.parse(JSON.stringify(bs)),
    });
    return;
  }

  if (type === 'EVALUATE_CANDIDATES' && baseline && candidates && preset) {
    setActivePreset(preset);
    const results: ScoreBreakdown[] = candidates.map((candidate) => {
      try {
        replaceBattleState(baseline);
        resetBattleUiPending();
        uiState.isHeadless = true;
        applyCandidate(candidate);
        return withId(
          candidate.id,
          scoreLine(baseline, AI_PLAYER_ID, {
            includeLatent: candidate.kind !== 'pass',
            includeMana: candidate.kind !== 'pass',
          })
        );
      } catch (error) {
        console.warn('AI candidate failed', candidate.id, error);
        return failedCandidate(candidate.id);
      }
    });
    self.postMessage({ type: 'EVALUATE_RESULT', results });
  }
};
