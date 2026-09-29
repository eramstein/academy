// note: base unit values range from 5 to 80
// here dealing 5 damage to a land is about as valuable as an average unit

import { CardColor } from '@/lib/_model';
import { getBudgetFromCost } from '@/lib/sim/cards/card-budget';

// Queue-only weights for the old heuristic and for ordering blocks. Not used in the position score.
export const landDestructionValue = 1000000;
export const playerLifeValue = 20;
export const landLifeValue = 10;
export const unitLifeValue = 2;
// how much unit value the opponent needs to be ahead of us to consider board wiping
export const baordWipeThreshold = 2 * getBudgetFromCost(4, [{ color: CardColor.Blue, count: 1 }]);

/** Position-score exchange rates, in card-budget points. */
export const exchange = {
  opponentLife: 4,
  aiLifeNormal: 4,
  aiLifeAggro: 2,
  opponentLifeAggro: 6,
  aiLifeDefend: 6,
  opponentLifeDefend: 3,
  standingLand: 22,
  ruinedLand: 4,
  handFraction: 0.35,
  opponentCard: 4,
  manaPoint: 3,
  colorUnlockFraction: 0.25,
  colorPartialFraction: 0.1,
  latentFactor: 0.85,
  boardWeight: 1,
  boardWeightAggro: 0.7,
  landWeight: 1,
  handWeight: 1,
  colorWeight: 1,
};
