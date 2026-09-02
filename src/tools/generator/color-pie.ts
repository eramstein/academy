import { CardColor, type UnitKeywords } from '../../lib/_model';

// each color allocates different amounts of budget to power and health
// numbers are a % of the budget, they don't need to add up to 1, the rest will go into keywords and abilities
export const powerAndHealthPreferences: Record<CardColor, { power: number; health: number }> = {
  [CardColor.Red]: {
    power: 0.4,
    health: 0.2,
  },
  [CardColor.Blue]: {
    power: 0.2,
    health: 0.2,
  },
  [CardColor.Green]: {
    power: 0.4,
    health: 0.4,
  },
  [CardColor.Black]: {
    power: 0.2,
    health: 0.4,
  },
};

export const keywordColorPreferences: Record<
  CardColor,
  Partial<Record<keyof UnitKeywords, number>>
> = {
  [CardColor.Red]: {
    haste: 9,
    moveAndAttack: 6,
    retaliate: 3,
    zerk: 3,
  },
  [CardColor.Blue]: {
    ranged: 9,
    moveAndAttack: 6,
    resist: 6,
    cleave: -3,
    flying: 3,
  },
  [CardColor.Green]: {
    retaliate: 2,
    regeneration: 6,
    trample: 6,
    poisonous: 5,
    moveAndAttack: -3,
    cleave: 3,
  },
  [CardColor.Black]: {
    ranged: 3,
    retaliate: 9,
    armor: 6,
    poisonous: 3,
    moveAndAttack: -3,
    lance: 3,
    flying: -3,
  },
};
