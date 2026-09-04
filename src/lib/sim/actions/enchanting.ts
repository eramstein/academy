import {
  isUnitCard,
  type CardTemplate,
  type UnitCardTemplate,
  type UnitKeywords,
} from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromObjectWeights } from '@/lib/_utils/random';
import { cardBudget, featureCosts, getCardBudget } from '../cards/card-budget';
import { colorPie, getCardDominantColor } from '../cards/color-pie';
import { addKeyword, KEYWORD_KEYS } from '../cards/keywords';
import { narrateCardEncanted } from '../narration';

export interface AugmentParameters {
  cardId: string;
  costIncrease?: number;
  maxHealth?: number;
  power?: number;
  keywords?: Partial<Record<keyof UnitKeywords, number>>;
}

export interface AugmentPreview {
  error: string;
  card: UnitCardTemplate | null;
  preview: UnitCardTemplate | null;
  upgradeBudget: number;
  spent: number;
  extraBudget: number;
}

export function getAugmentPreview(parameters: AugmentParameters): AugmentPreview {
  const card = gs.player.collection.find((c) => c.id === parameters.cardId);

  if (!card) {
    return emptyPreview(`Card not found: ${parameters.cardId}.`);
  }
  if (!isUnitCard(card)) {
    return emptyPreview(`Card is not a unit: ${parameters.cardId}.`);
  }

  const costIncrease = parameters.costIncrease || 1;
  if (card.cost > 9 - costIncrease) {
    return {
      error: `Card is already at max cost: ${card.cost}.`,
      card,
      preview: null,
      upgradeBudget: 0,
      spent: 0,
      extraBudget: 0,
    };
  }

  const upgradeBudget = cardBudget[card.cost + costIncrease] - cardBudget[card.cost];
  const preview = makeNewCardTemplate(card, { ...parameters, costIncrease });
  const spent = getCardBudget(preview) - getCardBudget(card);
  if (spent > upgradeBudget) {
    return {
      error: `New card budget is greater than upgrade budget: ${getCardBudget(preview)} > ${upgradeBudget}.`,
      card,
      preview,
      upgradeBudget,
      spent,
      extraBudget: 0,
    };
  }

  return {
    error: '',
    card,
    preview,
    upgradeBudget,
    spent,
    extraBudget: upgradeBudget - spent,
  };
}

export function augmentUnit(parameters: AugmentParameters): string {
  const result = getAugmentPreview(parameters);
  if (result.error || !result.card) {
    return result.error;
  }
  if (!parameters.costIncrease) {
    parameters.costIncrease = 1;
  }

  const card = result.card;
  const oldCard: UnitCardTemplate = {
    ...card,
    keywords: card.keywords ? { ...card.keywords } : undefined,
  };

  const costs: Record<string, number> = {
    power: featureCosts.power(card),
    maxHealth: featureCosts.maxHealth(card),
    ret: featureCosts.retaliate(card),
  };

  let extraBudget = result.extraBudget;

  // mutate card to become newCardTemplate
  makeNewCardTemplate(card, parameters, true);

  // automatically use remaining budget points based on color preferences
  while (extraBudget > 0) {
    const upgradePreference = getUpgradePreference(card, costs, extraBudget);
    if (upgradePreference === '') {
      break;
    }
    extraBudget -= costs[upgradePreference];
    switch (upgradePreference) {
      case 'power':
        card.power++;
        break;
      case 'maxHealth':
        card.maxHealth++;
        break;
      case 'ret':
        addKeyword(card, 'retaliate', 1);
        break;
    }
  }

  narrateCardEncanted(oldCard, card, describeAugment(oldCard, card));

  return '';
}

function describeAugment(oldCard: UnitCardTemplate, newCard: UnitCardTemplate): string {
  const changes = describeAugmentChanges(oldCard, newCard);
  if (!changes) {
    return `You augmented ${newCard.name}.`;
  }
  return `You augmented ${newCard.name}. ${changes}`;
}

function describeAugmentChanges(oldCard: UnitCardTemplate, newCard: UnitCardTemplate): string {
  const parts: string[] = [];

  if (oldCard.cost !== newCard.cost) {
    parts.push(`cost ${oldCard.cost} → ${newCard.cost}`);
  }
  if (oldCard.power !== newCard.power) {
    parts.push(`power ${oldCard.power} → ${newCard.power}`);
  }
  if (oldCard.maxHealth !== newCard.maxHealth) {
    parts.push(`health ${oldCard.maxHealth} → ${newCard.maxHealth}`);
  }
  parts.push(...describeKeywordChanges(oldCard.keywords, newCard.keywords));

  if (!parts.length) {
    return '';
  }

  const [first, ...rest] = parts;
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}${rest.length ? `, ${rest.join(', ')}` : ''}.`;
}

function describeKeywordChanges(
  oldKeywords: UnitKeywords | undefined,
  newKeywords: UnitKeywords | undefined
): string[] {
  const parts: string[] = [];
  for (const key of KEYWORD_KEYS) {
    const oldValue = oldKeywords?.[key];
    const newValue = newKeywords?.[key];
    if (oldValue === newValue) {
      continue;
    }
    const name = formatKeywordName(key);
    if (!oldValue && newValue) {
      parts.push(typeof newValue === 'number' ? `gained ${name} ${newValue}` : `gained ${name}`);
    } else if (oldValue && !newValue) {
      parts.push(`lost ${name}`);
    } else if (typeof oldValue === 'number' && typeof newValue === 'number') {
      parts.push(`${name} ${oldValue} → ${newValue}`);
    }
  }
  return parts;
}

function formatKeywordName(keyword: string): string {
  return keyword.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function emptyPreview(error: string): AugmentPreview {
  return {
    error,
    card: null,
    preview: null,
    upgradeBudget: 0,
    spent: 0,
    extraBudget: 0,
  };
}

function getUpgradePreference(
  card: CardTemplate,
  costs: Record<string, number>,
  budget: number
): string {
  const preferences = Object.fromEntries(
    Object.entries(colorPie[getCardDominantColor(card)].statsPreference).filter(
      ([key]) => costs[key] <= budget
    )
  );
  if (Object.keys(preferences).length === 0) {
    return '';
  }
  return getRandomFromObjectWeights(preferences);
}

function makeNewCardTemplate(
  card: UnitCardTemplate,
  parameters: AugmentParameters,
  mutate = false
): UnitCardTemplate {
  const target: UnitCardTemplate = mutate
    ? card
    : {
        ...card,
        keywords: card.keywords ? { ...card.keywords } : undefined,
      };

  target.cost += parameters.costIncrease ?? 0;
  target.maxHealth += parameters.maxHealth ?? 0;
  target.power += parameters.power ?? 0;

  if (parameters.keywords) {
    for (const [keyword, value] of Object.entries(parameters.keywords) as [
      keyof UnitKeywords,
      number,
    ][]) {
      if (value) {
        addKeyword(target, keyword, value);
      }
    }
  }

  return target;
}
