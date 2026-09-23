import {
  CardColor,
  CardType,
  UnitType,
  type Character,
  type SpellCardTemplate,
  type UnitCardTemplate,
  type UnitKeywords,
} from '@/lib/_model';
import { gs } from '@/lib/_state';
import {
  getRandomFromArray,
  getRandomFromObjectWeights,
  getRandomInteger,
  getRandomWeighted,
} from '@/lib/_utils/random';
import type { CardCreationParameters } from '../actions';
import { buildAbility, pickRandomAbility } from './ability-templates';
import {
  createActionTemplate,
  defaultActionFactoryArgs,
  pickRandomActionTemplate,
} from './action-templates';
import { getBudgetFromCost, getCardBudget } from './card-budget';
import { colorPie, type StatsPreference } from './color-pie';
import { KEYWORD_KEYS, NUMERIC_KEYWORDS, keywordConfig } from './keywords';

type CardIdentityKeys = 'id' | 'cost' | 'name' | 'imageFileName';
export type PartialConjuredUnit = Omit<UnitCardTemplate, CardIdentityKeys>;
export type PartialConjuredSpell = Omit<SpellCardTemplate, CardIdentityKeys>;

// chance of creating a card of a given cost
const costDistribution = {
  1: 0.05,
  2: 0.1,
  3: 0.15,
  4: 0.15,
  5: 0.15,
  6: 0.15,
  7: 0.1,
  8: 0.1,
  9: 0.05,
};

const CARD_CANDIDATE_COUNT = 30;

export function buildUnitCard(
  parameters: CardCreationParameters,
  character: Character = gs.player
): PartialConjuredUnit {
  const card = getRandomUnitCardTemplate(parameters.colors, isConjuration(parameters), character);
  if (isInvocation(parameters)) {
    card.keywords = {};
    card.abilities = [];
  }
  if (parameters.keywords) {
    card.keywords = parameters.keywords;
  }
  if (parameters.ability) {
    const ability = buildAbility(parameters.ability);
    card.abilities = ability ? [ability] : [];
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

export function buildSpellCard(parameters: CardCreationParameters): {
  card: PartialConjuredSpell;
  budget: number;
  actionName: string[];
} {
  const cardColors = resolveCardColors(parameters.colors);

  // Invoke: player picked one action (and optional numeric args) — use it exactly.
  if (parameters.actions?.length === 1 && parameters.actionArgs !== undefined) {
    const name = parameters.actions[0];
    const action = createActionTemplate(
      name,
      parameters.actionArgs ?? defaultActionFactoryArgs(name)
    );
    const card: PartialConjuredSpell = {
      type: CardType.Spell,
      colors: cardColors,
      actions: [action.definition],
    };
    return {
      card,
      budget: getCardBudget(card),
      actionName: [name],
    };
  }

  const targetCost = Number(getRandomFromObjectWeights(costDistribution));
  const targetBudget = getBudgetFromCost(targetCost, cardColors);

  let best: { card: PartialConjuredSpell; actionName: string } | null = null;
  let bestDistance = Infinity;
  for (let i = 0; i < CARD_CANDIDATE_COUNT; i++) {
    const candidate = rollSpellCandidate(cardColors, parameters.actions);
    const distance = Math.abs(getCardBudget(candidate.card) - targetBudget);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return {
    card: best!.card,
    budget: getCardBudget(best!.card),
    actionName: [best!.actionName],
  };
}

function resolveCardColors(colors?: CardColor[]): { color: CardColor; count: number }[] {
  return colors?.length
    ? colors.map((color) => ({ color, count: 1 }))
    : [{ color: getRandomFromArray(Object.values(CardColor)), count: 1 }];
}

// if there is more than just color, it is an invocation, else it's a conjuration
function isInvocation(parameters: CardCreationParameters): boolean {
  return !!(Object.keys(parameters).length > 1);
}
function isConjuration(parameters: CardCreationParameters): boolean {
  return Object.keys(parameters).length === 0;
}

function getRandomUnitCardTemplate(
  colors?: CardColor[],
  isConjuration: boolean = true,
  character: Character = gs.player
): PartialConjuredUnit {
  const cardColors = resolveCardColors(colors);
  const targetCost = Number(getRandomFromObjectWeights(costDistribution));
  const targetBudget = getBudgetFromCost(targetCost, cardColors);

  let best: PartialConjuredUnit | null = null;
  let bestDistance = Infinity;
  for (let i = 0; i < CARD_CANDIDATE_COUNT; i++) {
    const candidate = rollUnitCandidate(cardColors, isConjuration, character);
    const distance = Math.abs(getCardBudget(candidate) - targetBudget);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best!;
}

function rollSpellCandidate(
  cardColors: { color: CardColor; count: number }[],
  allowedActions?: string[]
): { card: PartialConjuredSpell; actionName: string } {
  const action = pickRandomActionTemplate(
    cardColors.map((entry) => entry.color),
    allowedActions
  );
  return {
    card: {
      type: CardType.Spell,
      colors: cardColors,
      actions: [action.definition],
    },
    actionName: action.name,
  };
}

function rollUnitCandidate(
  cardColors: { color: CardColor; count: number }[],
  isConjuration: boolean,
  character: Character
): PartialConjuredUnit {
  const colorList = cardColors.map((entry) => entry.color);
  const { power, maxHealth, retaliate } = randomCombatStats(colorList);
  return {
    type: CardType.Unit,
    colors: cardColors,
    power,
    maxHealth,
    retaliate,
    keywords: randomKeywords(colorList, isConjuration, character),
    abilities: randomAbilities(colorList),
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

/** Fallback when neither creation params nor a flavor template provide unitTypes. */
export function randomUnitTypes(colors: CardColor[]): UnitType[] {
  return [getRandomFromArray(allowedUnitTypesForColors(colors))];
}

function allowedUnitTypesForColors(colors: CardColor[]): UnitType[] {
  const restrictedTypes = new Set(Object.values(colorPie).flatMap((pie) => pie.unitTypes));
  const typesForCardColors = new Set(colors.flatMap((color) => colorPie[color].unitTypes));
  return Object.values(UnitType).filter(
    (unitType) => !restrictedTypes.has(unitType) || typesForCardColors.has(unitType)
  );
}

function randomAbilities(colors: CardColor[]): UnitCardTemplate['abilities'] {
  if (Math.random() >= 0.5) {
    return undefined;
  }
  const picked = pickRandomAbility(colors);
  return picked ? [picked.ability] : undefined;
}

function randomKeywords(
  colors: CardColor[],
  isConjuration: boolean,
  character: Character
): UnitKeywords {
  const keywords: UnitKeywords = {};
  const colorBonus = combinedKeywordPreferences(colors);
  // if it's a conjuration we focus on new keywords
  const keywordsPool = isConjuration
    ? KEYWORD_KEYS.filter((key) => !character.craftingKnowledge.keywords?.[key])
    : KEYWORD_KEYS;
  const weightedKeys = keywordsPool
    .filter((key) => keywords[key] === undefined)
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
