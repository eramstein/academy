import {
  CardColor,
  ResourceType,
  type Character,
  type UnitCardTemplate,
  type UnitKeywords,
  type UnitType,
} from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getCardBudget, getCostFromBudget } from '../cards/card-budget';
import { buildUnitCard } from '../cards/creation';
import { filterFlavorTemplates } from '../cards/flavor-filters';
import { loadFlavorTemplates } from '../cards/flavor-templates';
import { getActingCharacter } from '../characters';
import { narrateCardConjured } from '../narration';
import { spendResources } from '../resources';

export interface CardCreationParameters {
  colors?: CardColor[];
  cost?: number;
  power?: number;
  hp?: number;
  retaliate?: number;
  keywords?: UnitKeywords;
  unitTypes?: UnitType[];
  resources: { type: ResourceType; count: number }[];
}

export interface CardCreationBonuses {
  learningChance: number; // get new knowledge (conjure), or level up (upgrade)
  extraBudgetChance: number;
  // legendaryChance: number;
  // consumableBuffChance: number;
  // uniqueAbilityChance: number;
}

export interface CardCreationResult {
  template: UnitCardTemplate;
  bonusBudget: number;
  learningChance: number;
}

export function getNewUnitTemplate(
  parameters: CardCreationParameters,
  spend = true,
  characterKey = 'player'
): CardCreationResult | null {
  if (!parameters.resources) {
    parameters.resources = [];
  }
  if (spend && !spendResources(parameters.resources)) {
    return null;
  }
  const character = getActingCharacter(characterKey);
  const bonuses = getCardCreationBonuses(parameters.resources, characterKey);
  const prunedParams = limitParametersToSkills(parameters, character);
  const { template, bonusBudget } = getUnitTemplate(prunedParams, bonuses, character);
  return { template, bonusBudget, learningChance: bonuses.learningChance };
}

export function invokeUnit(parameters: CardCreationParameters, characterKey = 'player'): string {
  const result = getNewUnitTemplate(parameters, true, characterKey);
  if (!result) {
    return '';
  }
  const { template, bonusBudget, learningChance } = result;
  if (!template) {
    return '';
  }
  learnUnitCard(template, learningChance, bonusBudget, getActingCharacter(characterKey));
  return '';
}

export function conjureUnit(parameters: CardCreationResult, characterKey = 'player'): string {
  learnUnitCard(
    parameters.template,
    parameters.learningChance,
    parameters.bonusBudget,
    getActingCharacter(characterKey)
  );
  return '';
}

export function getConjurationOtions(
  parameters: CardCreationParameters,
  characterKey = 'player'
): CardCreationResult[] {
  const character = getActingCharacter(characterKey);
  const optionsCount = 2 + Math.floor(character.craftingSkills.inspiration);
  if (!spendResources(parameters.resources ?? [])) {
    return [];
  }
  const options: CardCreationResult[] = [];
  for (let i = 0; i < optionsCount; i++) {
    const result = getNewUnitTemplate(parameters, false, characterKey);
    if (result) {
      options.push(result);
    }
  }
  return options;
}

function limitParametersToSkills(
  parameters: CardCreationParameters,
  character: Character
): CardCreationParameters {
  const knownColors = character.craftingKnowledge.colors;
  const knownKeywords = character.craftingKnowledge.keywords;

  let colors = parameters.colors?.filter((color) => knownColors?.[color]);
  if (!colors?.length) {
    colors = knownColors ? Object.keys(knownColors).map((color) => color as CardColor) : undefined;
  }

  let keywords = parameters.keywords;
  if (keywords) {
    const pruned = Object.fromEntries(
      Object.entries(keywords).filter(([key]) => knownKeywords?.[key as keyof UnitKeywords])
    ) as UnitKeywords;
    keywords = Object.keys(pruned).length ? pruned : undefined;
  }

  return {
    ...parameters,
    colors,
    keywords,
  };
}

export function getCardCreationBonuses(
  resources: { type: ResourceType; count: number }[],
  characterKey = 'player'
): CardCreationBonuses {
  const character = getActingCharacter(characterKey);
  let learningChance = 0.1;
  let extraBudgetChance = 0;
  // skills bonuses
  learningChance += character.craftingSkills.inspiration * 0.1;
  extraBudgetChance += character.craftingSkills.mastery * 0.1;
  // resources bonuses
  for (const resource of resources) {
    if (resource.type === ResourceType.MagicDust) {
      learningChance += resource.count * 0.1;
    }
    if (resource.type === ResourceType.Mithril) {
      extraBudgetChance += resource.count * 0.1;
    }
  }
  return { learningChance, extraBudgetChance };
}

function learnUnitCard(
  template: UnitCardTemplate,
  learningChance: number,
  bonusBudget: number,
  character: Character
) {
  const learntKeywords: string[] = [];
  const improvedKeywords: string[] = [];
  // add card's keywords to character's known keywords
  if (template.keywords && Math.random() < learningChance) {
    if (!character.craftingKnowledge.keywords) {
      character.craftingKnowledge.keywords = {};
    }
    const known = character.craftingKnowledge.keywords;
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
  // add card to collection
  character.collection.push(template);
  if (character.key === gs.player.key) {
    narrateUnitLearnt(template, bonusBudget, learntKeywords, improvedKeywords);
  }
}

function narrateUnitLearnt(
  template: UnitCardTemplate,
  bonusBudget: number,
  learntKeywords: string[],
  improvedKeywords: string[]
) {
  const parts: string[] = [];
  if (learntKeywords.length) {
    parts.push(`You learnt ${joinKeywordNames(learntKeywords)}`);
  }
  if (improvedKeywords.length) {
    parts.push(`You improved ${joinKeywordNames(improvedKeywords)}`);
  }
  const learnt = parts.length ? `${parts.join('. ')}.` : '';
  let text = learnt
    ? `You created ${template.name}. ${learnt}`
    : `You created ${template.name}.`;
  if (bonusBudget) {
    text += ` Your mastery granted it ${bonusBudget} bonus budget.`;
  }
  narrateCardConjured(template.id, text);
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

function getUnitTemplate(
  parameters: CardCreationParameters,
  bonuses: CardCreationBonuses,
  character: Character
): {
  template: UnitCardTemplate;
  bonusBudget: number;
} {
  const flavorTemplates = loadFlavorTemplates();

  // 1. create card template based on parameters (randomize rest)
  const cardBase = buildUnitCard(parameters, character);
  // 2. get budget for card
  const sureMastery = Math.floor(bonuses.extraBudgetChance);
  const extraBudget = Math.random() < bonuses.extraBudgetChance - sureMastery ? 1 : 0;
  const budget = getCardBudget(cardBase) - sureMastery - extraBudget;
  // 3. define mana cost based on budget
  const { cost, extraPower, extraHealth, extraRetaliate } = getCostFromBudget(budget);
  const colors = cardBase.colors.map((entry) => ({ color: entry.color, count: 1 }));
  const conjured: Omit<UnitCardTemplate, 'id' | 'name' | 'imageFileName'> = {
    ...cardBase,
    cost,
    colors,
    power: cardBase.power + extraPower,
    maxHealth: cardBase.maxHealth + extraHealth,
    retaliate: cardBase.retaliate + extraRetaliate,
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
    template: {
      ...conjured,
      id: template.name + crypto.randomUUID(),
      imageFileName: template.imageName,
      name: template.name,
    },
    bonusBudget: sureMastery + extraBudget,
  };
}
