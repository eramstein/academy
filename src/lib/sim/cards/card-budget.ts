import { CardColor, type UnitKeywords } from "@/lib/_model";
import { getRandomFromArray } from "@/lib/_utils/random";
import type { PartialConjuredUnit } from "./conjuration";

type FeatureCostKey = "power" | "maxHealth" | keyof UnitKeywords;

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
  // keywords
  ranged: () => 3,
  haste: (card) => Math.ceil(card.power / 2) * 3,
  moveAndAttack: (card) => Math.ceil(card.power / 2) * 2,
  retaliate: () => 1,
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
  let budget = card.power * featureCosts.power(card) + card.maxHealth * featureCosts.maxHealth(card);

  if (card.power >= card.maxHealth) {
    budget += 4;
  }
  for (const [key, value] of Object.entries(card.keywords ?? {}) as [
    keyof UnitKeywords,
    boolean | number | undefined,
  ][]) {
    if (!value) continue;
    const cost = featureCosts[key](card);
    budget += typeof value === "number" ? cost * value : cost;
  }

  return budget;
}

export function getCostFromBudget(budget: number, colors: CardColor[]): {
  cost: number;
  colors: { color: CardColor; count: number }[];
  extraHealth: number;
} {
  const matchingCosts = Object.entries(cardBudget)
    .filter(([, value]) => value <= budget)
    .map(([key]) => Number(key));
  const cost = matchingCosts.length > 0 ? Math.max(...matchingCosts) : 0;
  const allocated = matchingCosts.length > 0 ? cardBudget[cost] : 0;
  let rest = budget - allocated;

  const resultColors = [...new Set(colors)].map((color) => ({ color, count: 1 }));
  if (resultColors.length === 0) {
    resultColors.push({ color: getRandomFromArray(Object.values(CardColor)), count: 1 });
  }

  let grantedOffCurveBonus = false;
  while (rest > 0) {
    getRandomFromArray(resultColors).count++;
    rest -= 2;
    const totalColorCount = resultColors.reduce((sum, entry) => sum + entry.count, 0);
    if (!grantedOffCurveBonus && totalColorCount > cost) {
      rest -= 4;
      grantedOffCurveBonus = true;
    }
  }

  const extraHealth = rest < -1 ? Math.floor(-rest / 2) : 0;
  return { cost, colors: resultColors, extraHealth };
}