// note: base unit values range from 5 to 80
// here dealing 5 damage to a land is about as valuable as an average unit

import { CardColor } from '@/lib/_model';
import { getBudgetFromCost } from '@/lib/sim/cards/card-budget';

// TODO: adjust based on AI persona
export const landDestructionValue = 1000000;
export const playerLifeValue = 20;
export const landLifeValue = 10;
export const unitLifeValue = 2;
// how much unit value the opponent needs to be ahead of us to consider board wiping
export const baordWipeThreshold = 2 * getBudgetFromCost(4, [{ color: CardColor.Blue, count: 1 }]);
