import type { CardTemplate, UnitCard } from "@/lib/_model";

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

export const featureCosts: Record<string, (card: CardTemplate) => number> = {
  power: () => 4,
  hp: () => 2,
  ret: () => 1,
  ranged: (card: CardTemplate) => Math.ceil((card as UnitCard).power / 2) * 2,
};