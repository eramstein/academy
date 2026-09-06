import type { UnitCardTemplate, UnitKeywords } from "@/lib/_model";

export function addKeyword(card: UnitCardTemplate, keyword: keyof UnitKeywords, value: number) {
  if (!card.keywords) {
    card.keywords = {};
  }
  const current = card.keywords[keyword];
  if (typeof current === 'number') {
    (card.keywords[keyword] as number) = current + value;
  } else {
    (card.keywords[keyword] as number) = value;
  }
}

export const keywordConfig: Record<keyof UnitKeywords, { baseCost: number; prevalence: number }> = {
  ranged: { baseCost: 3, prevalence: 8 },
  haste: { baseCost: 3, prevalence: 3 },
  moveAndAttack: { baseCost: 2, prevalence: 3 },
  armor: { baseCost: 3, prevalence: 6 },
  resist: { baseCost: 2, prevalence: 6 },
  poisonous: { baseCost: 3, prevalence: 3 },
  regeneration: { baseCost: 2, prevalence: 3 },
  trample: { baseCost: 3, prevalence: 4 },
  zerk: { baseCost: -3, prevalence: 1 },
  cleave: { baseCost: 7, prevalence: 3 },
  lance: { baseCost: 5, prevalence: 3 },
  flying: { baseCost: 6, prevalence: 3 },
  immobile: { baseCost: -3, prevalence: 3 },
  armorPiercing: { baseCost: 2, prevalence: 3 },
};

export const NUMERIC_KEYWORDS = new Set<keyof UnitKeywords>([
  "armor",
  "resist",
  "poisonous",
  "regeneration",
]);

export const KEYWORD_KEYS: (keyof UnitKeywords)[] = [
  "ranged",
  "haste",
  "moveAndAttack",
  "armor",
  "resist",
  "poisonous",
  "regeneration",
  "trample",
  "zerk",
  "cleave",
  "lance",
  "flying",
  "immobile",
  "armorPiercing",
];