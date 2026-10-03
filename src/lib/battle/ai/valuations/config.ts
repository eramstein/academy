// note: base unit values range from 5 to 80
// here dealing 5 damage to a land is about as valuable as an average unit

import { CardColor } from '@/lib/_model';
import { getBudgetFromCost } from '@/lib/sim/cards/card-budget';

// Queue-only weights for the old heuristic and for ordering blocks.
export const landDestructionValue = 1000000;
export const playerLifeValue = 8;
/** Budget points per point of land health in the position score (and queue ranks). */
export const landLifeValue = 4;
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
  /** Flat budget points per card in the AI hand (not a fraction of card budget). */
  handCard: 10,
  opponentCard: 4,
  manaPoint: 3,
  colorUnlockFraction: 0.25,
  colorPartialFraction: 0.1,
  latentFactor: 0.85,
  /**
   * Budget points per point of power that can actually reach, and per point of
   * enemy power a body is effectively walling. Small on purpose: it breaks
   * "this square is the same as passing" ties, and it loses to a real deploy or trade.
   */
  lanePoint: 1,
  boardWeight: 1,
  boardWeightAggro: 0.7,
  /**
   * Board term is boardWeight * (ownUnitWeight * aiUnits - enemyUnitWeight * theirUnits).
   * own < 1 / enemy > 1 makes chipping into retaliate look better without multi-turn search
   * (retaliate is just own durability loss; there is no separate counterattack term).
   */
  ownUnitWeight: 0.85,
  enemyUnitWeight: 1.2,
  ownUnitWeightAggro: 0.7,
  enemyUnitWeightAggro: 1.35,
  ownUnitWeightDefend: 1,
  enemyUnitWeightDefend: 1,
  landWeight: 1,
  handWeight: 1,
  colorWeight: 1,
};
