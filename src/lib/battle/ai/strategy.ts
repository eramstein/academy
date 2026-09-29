import { config } from '@/lib/_config';
import { AiTurnStrategy } from '@/lib/_model';
import { boardShare } from './evaluate';
import { PersonaType, WeightPreset } from './model';
import { valueBoard } from './valuations/unit';

/*
The strategy is evaluated at the start of the turn
It sets a general stance depending on the board state
*/
export function getAiStrategy(persona: PersonaType): AiTurnStrategy {
  if (persona === PersonaType.Aggro) {
    return AiTurnStrategy.Attack;
  }
  const boardControl = valueBoard().rel;
  if (boardControl < 0.3) {
    return AiTurnStrategy.Defend;
  }
  if (boardControl > 0.7) {
    return AiTurnStrategy.Attack;
  }
  return AiTurnStrategy.Normal;
}

/** Weight preset for the search. Aggro stays Aggro for the match; otherwise it follows board share. */
export function getWeightPreset(): WeightPreset {
  if (config.aiPersona === 'aggro') return WeightPreset.Aggro;
  const share = boardShare();
  if (share < 0.3) return WeightPreset.Defend;
  if (share > 0.7) return WeightPreset.Aggro;
  return WeightPreset.Normal;
}
