import { type CardColor, type UnitCard, type UnitKeywords } from '../../lib/_model';
import { getRandomWeighted } from '../../lib/_utils/random';
import { getDominantColor } from './_utils';
import { keywordColorPreferences } from './color-pie';

// Keyword configuration to eliminate repetition
interface KeywordDefinition {
  type?: 'number'; // boolean is default, only specify for numeric keywords
  baseCost: number;
  prevalence: number;
  scalesWithPower?: boolean;
  requiresSomePower?: boolean;
  requiresSomeHealth?: boolean;
}

interface KeywordPrevalence {
  key: keyof UnitKeywords;
  prevalence: number;
}

interface KeywordMetadata extends KeywordPrevalence {
  cost: number;
}

export const keywordConfig: Record<keyof UnitKeywords, KeywordDefinition> = {
  ranged: { baseCost: 3, prevalence: 8 },
  haste: { baseCost: 3, scalesWithPower: true, requiresSomePower: true, prevalence: 3 },
  moveAndAttack: { baseCost: 2, scalesWithPower: true, requiresSomePower: true, prevalence: 3 },
  retaliate: { type: 'number', baseCost: 1, prevalence: 9, requiresSomeHealth: true },
  armor: { type: 'number', baseCost: 3, prevalence: 6 },
  resist: { type: 'number', baseCost: 2, prevalence: 6 },
  poisonous: { type: 'number', baseCost: 3, prevalence: 3 },
  regeneration: { type: 'number', baseCost: 2, prevalence: 3, requiresSomeHealth: true },
  trample: { baseCost: 3, prevalence: 4, requiresSomePower: true },
  zerk: { baseCost: -3, prevalence: 1, requiresSomePower: true },
  cleave: { baseCost: 7, prevalence: 3, scalesWithPower: true, requiresSomePower: true },
  lance: { baseCost: 5, prevalence: 3, scalesWithPower: true, requiresSomePower: true },
  flying: { baseCost: 6, prevalence: 3, scalesWithPower: true, requiresSomePower: true },
  immobile: { baseCost: -3, prevalence: 3 },
  armorPiercing: { baseCost: 2, prevalence: 3 },
  raid: { type: 'number', baseCost: 3, prevalence: 3 },
};

// Extract prevalence from definitions
const keywordPrevalence: Record<keyof UnitKeywords, number> = Object.fromEntries(
  Object.entries(keywordConfig).map(([key, def]) => [key, def.prevalence])
) as Record<keyof UnitKeywords, number>;

// keywords costs depend on the unit sometimes (e.g. haste is more expensive for a 5/1 unit than a 1/1 unit)
// for keywords with numeric values this is the cost of 1 point
export function costPerKeywordForUnit(unit: Partial<UnitCard>): Record<keyof UnitKeywords, number> {
  const colorPieTax = 2;
  const dominantColor = getDominantColor(unit.colors ?? []);
  const colorPrefs = keywordColorPreferences[dominantColor];

  const costs = {} as Record<keyof UnitKeywords, number>;

  Object.entries(keywordConfig).forEach(([key, def]) => {
    const keywordKey = key as keyof UnitKeywords;
    let cost = def.baseCost;

    // Add power scaling if applicable
    if (def.scalesWithPower) {
      cost += Math.floor((unit.power ?? 0) / 2);
    }

    // Add color tax if not in color preferences
    const hasColorPreference =
      colorPrefs?.[keywordKey] !== undefined && colorPrefs?.[keywordKey] > 0;
    const isScalingKeyword = def.type === 'number';
    const colorTax = hasColorPreference ? 0 : isScalingKeyword ? 1 : colorPieTax;

    costs[keywordKey] = cost + colorTax;
  });

  return costs;
}

function prevalencesForUnit(
  dominantcolor: CardColor,
  unit: Partial<UnitCard>,
  suggestedKeywords: string[]
): {
  key: keyof UnitKeywords;
  prevalence: number;
}[] {
  const suggestedKeywordsSet = new Set(suggestedKeywords);
  const prevalences: { key: keyof UnitKeywords; prevalence: number }[] = Object.entries(
    keywordPrevalence
  ).map(([key, value]) => {
    // add color preferences to prevalences
    let baseVal =
      value + (keywordColorPreferences[dominantcolor]?.[key as keyof UnitKeywords] ?? 0);
    // special cases
    if (keywordConfig[key as keyof UnitKeywords].requiresSomePower && (unit.power ?? 0) < 1) {
      baseVal = Math.min(baseVal, 1);
    }
    if (keywordConfig[key as keyof UnitKeywords].requiresSomeHealth && (unit.maxHealth ?? 0) < 3) {
      baseVal = Math.min(baseVal, 1);
    }
    // adjust for LLM suggested keywords
    if (suggestedKeywordsSet.has(key)) {
      baseVal += 10;
    }
    return {
      key: key as keyof UnitKeywords,
      prevalence: baseVal,
    };
  }) as { key: keyof UnitKeywords; prevalence: number }[];
  return prevalences;
}

function selectKeyword(
  budget: number,
  options: KeywordPrevalence[],
  costs: Record<keyof UnitKeywords, number>,
  alreadySelectedKeywords: UnitKeywords = {}
): { keyword: keyof UnitKeywords | null; value: number | boolean; usedBudget: number } {
  let keyword: keyof UnitKeywords | null = null;
  let usedBudget: number = 0;
  let value: number | boolean = true;

  const affordableKeywords: KeywordMetadata[] = options
    .filter(({ key }) => costs[key] <= budget && !alreadySelectedKeywords[key])
    .map(({ key, prevalence }) => ({ key, prevalence, cost: Math.max(1, costs[key]) }));
  if (affordableKeywords.length === 0) {
    return { keyword: null, usedBudget: 0, value: true };
  }

  const selectedKeyword = getRandomWeighted(
    affordableKeywords.map(({ key, prevalence, cost }) => ({
      item: { key, prevalence, cost },
      weight: prevalence,
    }))
  );
  if (keywordConfig[selectedKeyword.key].type === 'number') {
    const kwValue = Math.floor(budget / selectedKeyword.cost);
    if (kwValue > 0) {
      keyword = selectedKeyword.key;
      usedBudget = selectedKeyword.cost * kwValue;
      value = kwValue;
    }
  } else {
    keyword = selectedKeyword.key;
    usedBudget = selectedKeyword.cost;
  }
  return { keyword, usedBudget, value };
}

export function getKeywordSuggestion(color: CardColor): keyof UnitKeywords | null {
  // Create weighted keyword options based on base prevalence and color preferences
  const keywordOptions = Object.entries(keywordPrevalence).map(([key, basePrevalence]) => {
    const keywordKey = key as keyof UnitKeywords;
    const colorBonus = keywordColorPreferences[color]?.[keywordKey] ?? 0;
    const totalWeight = Math.max(0, basePrevalence + colorBonus);

    return {
      keyword: keywordKey,
      weight: totalWeight,
    };
  });
  const selected = getRandomWeighted(
    keywordOptions.map((option) => ({
      item: option.keyword,
      weight: option.weight,
    }))
  );
  return selected;
}

export function getKeywords(
  budget: number,
  unit: Partial<UnitCard>,
  suggestedKeywords: string[]
): { keywords: UnitKeywords; unusedBudget: number } {
  const keywords: UnitKeywords = {};

  const colors = unit.colors ?? [];
  const dominantColor = getDominantColor(colors);

  // probabilities for each keyword
  const prevalences = prevalencesForUnit(dominantColor, unit, suggestedKeywords);

  // budget costs
  const costs = costPerKeywordForUnit(unit);

  // select keyword count
  let keywordscount = 1;
  if (budget >= 10 && Math.random() < 0.5) {
    keywordscount++;
  }
  if (budget >= 20 && Math.random() < 0.5) {
    keywordscount++;
  }

  // select keywords
  for (let i = 0; i < keywordscount; i++) {
    const allocatedBudget = i === keywordscount - 1 ? budget : Math.floor(budget / keywordscount);
    const selectedKeyword = selectKeyword(allocatedBudget, prevalences, costs, keywords);
    if (allocatedBudget > 0 && selectedKeyword.keyword) {
      (keywords as any)[selectedKeyword.keyword] = selectedKeyword.value;
      budget -= selectedKeyword.usedBudget;
    }
  }

  return { keywords, unusedBudget: budget };
}
