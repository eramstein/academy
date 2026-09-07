import { CardColor, type UnitKeywords } from '@/lib/_model';
import type { PartialConjuredUnit } from './creation';

type FeatureCostKey = 'power' | 'maxHealth' | 'retaliate' | keyof UnitKeywords;

export const cardBudget: Record<number, number> = {
  0: 4,
  1: 8,
  2: 12,
  3: 18,
  4: 22,
  5: 26,
  6: 30,
  7: 34,
  8: 38,
  9: 42,
};

export const featureCosts: Record<FeatureCostKey, (card: PartialConjuredUnit) => number> = {
  power: () => 4,
  maxHealth: () => 2,
  retaliate: () => 1,
  // keywords
  ranged: () => 3,
  haste: (card) => Math.ceil(card.power / 2) * 3,
  moveAndAttack: (card) => Math.ceil(card.power / 2) * 2,
  armor: () => 3,
  resist: () => 2,
  poisonous: () => 3,
  regeneration: () => 2,
  trample: () => 3,
  zerk: () => -3,
  cleave: () => 7,
  lance: () => 5,
  flying: () => 6,
  immobile: () => -3,
  armorPiercing: () => 2,
};

export function getCardBudget(card: PartialConjuredUnit): number {
  let budget =
    card.power * featureCosts.power(card) +
    card.maxHealth * featureCosts.maxHealth(card) +
    (card.retaliate || 0) * featureCosts.retaliate(card);

  for (const [key, value] of Object.entries(card.keywords ?? {}) as [
    keyof UnitKeywords,
    boolean | number | undefined,
  ][]) {
    if (!value) continue;
    const cost = featureCosts[key](card);
    budget += typeof value === 'number' ? cost * value : cost;
  }

  return budget;
}

export function getCostFromBudget(budget: number): {
  cost: number;
  extraHealth: number;
} {
  const entries = Object.entries(cardBudget)
    .map(([key, value]) => [Number(key), value] as const)
    .sort(([a], [b]) => a - b);
  const match = entries.find(([, value]) => value >= budget) ?? entries.at(-1)!;
  const [cost, allocated] = match;
  const rest = allocated - budget;
  const extraHealth = Math.max(0, Math.floor(rest / 2));
  return { cost, extraHealth };
}

export function getBudgetFromCost(
  manaCost: number,
  colors: { color: CardColor; count: number }[]
): number {
  const manaBudget = cardBudget[manaCost];
  const colorsCount = colors.reduce((sum, color) => sum + (color.count ?? 0), 0);
  let colorsBudget = 0;
  if (colorsCount >= manaCost) {
    colorsBudget += 4;
  }
  if (colorsCount > 1) {
    colorsBudget++;
  }
  if (colorsCount > 2) {
    colorsBudget += (colorsCount - 2) * 2;
  }
  return manaBudget + colorsBudget;
}
