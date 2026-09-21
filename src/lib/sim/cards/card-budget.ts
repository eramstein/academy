import { CardColor, type UnitKeywords } from '@/lib/_model';
import type { Ability, ActionDefinition } from '@/lib/_model/model-battle';
import { getTriggerCostMultiplier } from './ability-templates';
import { getActionDefinitionBudget, getActionTemplateNameForEffect } from './action-templates';
import { colorPie } from './color-pie';
import type { PartialConjuredSpell, PartialConjuredUnit } from './creation';

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
  moveAndAttack: (card) => Math.ceil(card.power / 2) * 2 + 1,
  armor: () => 3,
  resist: () => 2,
  poisonous: () => 3,
  regeneration: () => 2,
  trample: () => 3,
  zerk: () => -3,
  cleave: () => 7,
  lance: () => 5,
  flying: () => 6,
  immobile: () => -4,
  armorPiercing: () => 2,
};

// this is extra cost for keywords and actions to keep colors asymetric
// e.g. 1.5 means the budget for that keyword or action is multiplied by 1.5
// based on colorPie preferences
const colorTax: Record<string, number> = {
  '-3': 3,
  '-2': 2,
  '-1': 1.5,
};

export function getCardBudget(card: PartialConjuredUnit | PartialConjuredSpell): number {
  if ('actions' in card) {
    return getSpellBudget(card);
  }
  return getUnitBudget(card);
}

function getSpellBudget(card: PartialConjuredSpell): number {
  const colors = uniqueColors(card);
  return card.actions.reduce((sum, action) => sum + getActionBudget(action, colors), 0);
}

export function getActionBudget(definition: ActionDefinition, colors: CardColor[]): number {
  const base = getActionDefinitionBudget(definition);
  const name = getActionTemplateNameForEffect(definition.effect.name);
  const preference = name ? actionPreference(colors, name) : 0;
  return applyColorTax(base, preference);
}

export function getAbilityCost(ability: Ability, colors: CardColor[]): number {
  const triggerCost = getTriggerCostMultiplier(ability.trigger);
  const actionsCost = ability.actions.reduce(
    (acc, action) => acc + getActionBudget(action, colors),
    0
  );
  return Math.ceil(triggerCost * actionsCost);
}

export function getKeywordBudget(
  key: keyof UnitKeywords,
  card: PartialConjuredUnit,
  amount = 1
): number {
  if (!amount) return 0;
  const base = featureCosts[key](card) * amount;
  return applyColorTax(base, keywordPreference(uniqueColors(card), key));
}

function getUnitBudget(card: PartialConjuredUnit): number {
  let budget =
    card.power * featureCosts.power(card) +
    card.maxHealth * featureCosts.maxHealth(card) +
    (card.retaliate || 0) * featureCosts.retaliate(card);

  for (const [key, value] of Object.entries(card.keywords ?? {}) as [
    keyof UnitKeywords,
    boolean | number | undefined,
  ][]) {
    if (!value) continue;
    budget += getKeywordBudget(key, card, typeof value === 'number' ? value : 1);
  }

  const colors = uniqueColors(card);
  for (const ability of card.abilities ?? []) {
    budget += getAbilityCost(ability, colors);
  }

  return budget;
}

function applyColorTax(cost: number, preference: number): number {
  if (preference >= 0) return cost;
  // Only the defined tiers apply; stronger negative sums still cap at the -3 tier
  const multiplier = colorTax[String(Math.max(preference, -3))];
  if (!multiplier) return cost;
  return Math.ceil(cost * multiplier);
}

function uniqueColors(card: PartialConjuredUnit | PartialConjuredSpell): CardColor[] {
  return [...new Set(card.colors.map((entry) => entry.color))];
}

function keywordPreference(colors: CardColor[], key: keyof UnitKeywords): number {
  return colors.reduce((sum, color) => sum + (colorPie[color].keywordsPreferences[key] ?? 0), 0);
}

function actionPreference(colors: CardColor[], actionName: string): number {
  return colors.reduce(
    (sum, color) => sum + (colorPie[color].actionPreferences[actionName] ?? 0),
    0
  );
}

export function getCostFromBudget(budget: number): {
  cost: number;
  extraPower: number;
  extraHealth: number;
  extraRetaliate: number;
} {
  const entries = Object.entries(cardBudget)
    .map(([key, value]) => [Number(key), value] as const)
    .sort(([a], [b]) => a - b);
  const match = entries.find(([, value]) => value >= budget) ?? entries.at(-1)!;
  const [cost, allocated] = match;
  let rest = allocated - budget;
  let extraPower = 0;
  let extraHealth = 0;
  let extraRetaliate = 0;
  if (rest > 4) {
    extraPower += Math.max(0, Math.floor(rest / 4));
    rest -= extraPower * 4;
  }
  if (rest > 2) {
    extraHealth += Math.max(0, Math.floor(rest / 2));
    rest -= extraHealth * 2;
  }
  if (rest > 0) {
    extraRetaliate += Math.max(0, Math.floor(rest));
  }
  return { cost, extraPower, extraHealth, extraRetaliate };
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
