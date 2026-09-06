import {
  CardColor,
  CardType,
  UnitType,
  type UnitCardTemplate,
  type UnitKeywords,
} from '@/lib/_model';
import {
  getRandomFromArray,
  getRandomFromObjectWeights,
  getRandomInteger,
  getRandomWeighted,
} from '@/lib/_utils/random';
import type { CardCreationParameters } from '../actions';
import { colorPie, type StatsPreference } from './color-pie';
import { KEYWORD_KEYS, NUMERIC_KEYWORDS, keywordConfig } from './keywords';

type UnitIdentityKeys = 'id' | 'cost' | 'name' | 'imageFileName';
export type PartialConjuredUnit = Omit<UnitCardTemplate, UnitIdentityKeys>;

export function buildUnitCard(parameters: CardCreationParameters): PartialConjuredUnit {
  const card = getRandomUnitCardTemplate(parameters.colors);
  if (isInvocation(parameters)) {
    card.keywords = {};
    card.abilities = [];
  }
  if (parameters.keywords) {
    card.keywords = parameters.keywords;
  }
  if (parameters.unitTypes) {
    card.unitTypes = parameters.unitTypes;
  }
  if (parameters.power !== undefined) {
    card.power = parameters.power;
  }
  if (parameters.hp !== undefined) {
    card.maxHealth = parameters.hp;
  }
  if (parameters.retaliate !== undefined) {
    card.retaliate = parameters.retaliate;
  }
  return card;
}

// if there is more than just color, it is an invocation, else it's a conjuration
function isInvocation(parameters: CardCreationParameters): boolean {
  return !!(Object.keys(parameters).length > 1);
}

function getRandomUnitCardTemplate(colors?: CardColor[]): PartialConjuredUnit {
  const cardColors = colors?.length
    ? colors.map((color) => ({ color, count: 1 }))
    : [{ color: getRandomFromArray(Object.values(CardColor)), count: 1 }];
  const { power, maxHealth, retaliate } = randomCombatStats(cardColors.map((entry) => entry.color));
  return {
    type: CardType.Unit,
    colors: cardColors,
    power,
    maxHealth,
    retaliate,
    keywords: randomKeywords(cardColors.map((entry) => entry.color)),
    unitTypes: randomUnitTypes(cardColors.map((entry) => entry.color)),
  };
}

function randomCombatStats(colors: CardColor[]): {
  power: number;
  maxHealth: number;
  retaliate: number;
} {
  const preference = combinedStatsPreference(colors);
  const allocatable = Object.fromEntries(
    Object.entries(preference).filter(([, weight]) => weight > 0)
  );
  const stats: StatsPreference = { power: 0, hp: 0, ret: 0 };
  const total = getRandomInteger(4, 12);
  for (let i = 0; i < total; i++) {
    const key = getRandomFromObjectWeights(allocatable) as keyof StatsPreference;
    stats[key]++;
  }
  return {
    power: stats.power,
    maxHealth: Math.max(1, stats.hp),
    retaliate: stats.ret,
  };
}

function combinedStatsPreference(colors: CardColor[]): StatsPreference {
  return colors.reduce(
    (acc, color) => {
      const preference = colorPie[color].statsPreference;
      acc.power += preference.power;
      acc.hp += preference.hp;
      acc.ret += preference.ret;
      return acc;
    },
    { power: 0, hp: 0, ret: 0 }
  );
}

function randomUnitTypes(colors: CardColor[]): UnitType[] {
  return [getRandomFromArray(allowedUnitTypesForColors(colors))];
}

function allowedUnitTypesForColors(colors: CardColor[]): UnitType[] {
  const restrictedTypes = new Set(Object.values(colorPie).flatMap((pie) => pie.unitTypes));
  const typesForCardColors = new Set(colors.flatMap((color) => colorPie[color].unitTypes));
  return Object.values(UnitType).filter(
    (unitType) => !restrictedTypes.has(unitType) || typesForCardColors.has(unitType)
  );
}

function randomKeywords(colors: CardColor[], existing: UnitKeywords = {}): UnitKeywords {
  const keywords: UnitKeywords = { ...existing };
  const colorBonus = combinedKeywordPreferences(colors);
  const weightedKeys = KEYWORD_KEYS.filter((key) => keywords[key] === undefined)
    .map((key) => ({
      item: key,
      weight: Math.max(0, keywordConfig[key].prevalence + (colorBonus[key] ?? 0)),
    }))
    .filter(({ weight }) => weight > 0);
  if (weightedKeys.length === 0) {
    return keywords;
  }
  const key = getRandomWeighted(weightedKeys);
  if (NUMERIC_KEYWORDS.has(key)) {
    (keywords[key] as number) = getRandomInteger(1, 3);
  } else {
    (keywords[key] as boolean) = true;
  }
  return keywords;
}

function combinedKeywordPreferences(
  colors: CardColor[]
): Partial<Record<keyof UnitKeywords, number>> {
  const combined: Partial<Record<keyof UnitKeywords, number>> = {};
  for (const color of colors) {
    for (const [key, value] of Object.entries(colorPie[color].keywordsPreferences) as [
      keyof UnitKeywords,
      number,
    ][]) {
      combined[key] = (combined[key] ?? 0) + value;
    }
  }
  return combined;
}
