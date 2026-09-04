import { CardColor, type UnitCardTemplate, type UnitKeywords, type UnitType } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getCardBudget, getCostFromBudget } from '../cards/card-budget';
import { createUnitCard } from '../cards/creation';
import { filterFlavorTemplates } from '../cards/flavor-filters';
import { loadFlavorTemplates } from '../cards/flavor-templates';
import { narrateCardConjured } from '../narration';

export interface CardCreationParameters {
  colors?: CardColor[];
  cost?: number;
  power?: number;
  hp?: number;
  keywords?: UnitKeywords;
  unitTypes?: UnitType[];
}

export function createUnit(parameters: CardCreationParameters): string {
  // limit card colors to known ones in crafting skills
  if (!parameters.colors?.length && gs.player.cardCrafting.colors) {
    parameters.colors = Object.keys(gs.player.cardCrafting.colors).map(
      (color) => color as CardColor
    );
  }
  const template = getUnitTemplate(parameters);
  const learnt = learnUnitCard(template);
  const text = learnt ? `You created ${template.name}. ${learnt}` : `You created ${template.name}`;
  narrateCardConjured(template.id, text);
  return '';
}

function learnUnitCard(template: UnitCardTemplate): string {
  const learntKeywords: string[] = [];
  const improvedKeywords: string[] = [];
  // add card's keywords to player's known keywords
  if (template.keywords) {
    if (!gs.player.cardCrafting.keywords) {
      gs.player.cardCrafting.keywords = {};
    }
    const known = gs.player.cardCrafting.keywords;
    for (const keyword of Object.keys(template.keywords) as (keyof UnitKeywords)[]) {
      const name = formatKeywordName(keyword);
      if (known[keyword] === undefined) {
        known[keyword] = 1;
        learntKeywords.push(name);
      } else {
        known[keyword] += 1;
        improvedKeywords.push(`${name} (${known[keyword]})`);
      }
    }
  }
  gs.player.collection.push(template);
  const parts: string[] = [];
  if (learntKeywords.length) {
    parts.push(`You learnt ${joinKeywordNames(learntKeywords)}`);
  }
  if (improvedKeywords.length) {
    parts.push(`You improved ${joinKeywordNames(improvedKeywords)}`);
  }
  return parts.length ? `${parts.join('. ')}.` : '';
}

function formatKeywordName(keyword: string): string {
  return keyword.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function joinKeywordNames(names: string[]): string {
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function getUnitTemplate(parameters: CardCreationParameters): UnitCardTemplate {
  const flavorTemplates = loadFlavorTemplates();

  // 1. create card template based on parameters (randomize rest)
  const cardBase = createUnitCard(parameters);
  // 2. get budget for card
  const budget = getCardBudget(cardBase);
  // 3. define mana cost based on budget
  const { cost, colors, extraHealth } = getCostFromBudget(
    budget,
    cardBase.colors.map((entry) => entry.color)
  );

  const conjured: Omit<UnitCardTemplate, 'id' | 'name' | 'imageFileName'> = {
    ...cardBase,
    cost,
    colors,
    maxHealth: cardBase.maxHealth + extraHealth,
  };
  const templateParameters = {
    ...parameters,
    colors: colors.map((entry) => entry.color),
    cost,
  };

  // 4. pick template
  const filteredTemplates = filterFlavorTemplates(flavorTemplates, templateParameters);
  const template = getRandomFromArray(filteredTemplates);

  return {
    ...conjured,
    id: template.name + crypto.randomUUID(),
    imageFileName: template.imageName,
    name: template.name,
  };
}
