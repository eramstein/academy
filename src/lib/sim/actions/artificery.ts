import {
  CardColor,
  CardType,
  isUnitCard,
  ResourceType,
  type CardTemplate,
  type Character,
  type SpellCardTemplate,
  type UnitCardTemplate,
  type UnitKeywords,
  type UnitType,
} from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getAbilityActionNames, type AbilityPick } from '../cards/ability-templates';
import { getActionTemplateMeta } from '../cards/action-templates';
import { getCardBudget, getCostFromBudget } from '../cards/card-budget';
import { buildSpellCard, buildUnitCard } from '../cards/creation';
import { filterFlavorTemplates } from '../cards/flavor-filters';
import { loadFlavorTemplates } from '../cards/flavor-templates';
import { getActingCharacter } from '../characters';
import { narrateCardConjured } from '../narration';
import { spendResources } from '../resources';

export type { AbilityPick } from '../cards/ability-templates';

export interface CardCreationParameters {
  cardType?: CardType;
  colors?: CardColor[];
  cost?: number;
  power?: number;
  hp?: number;
  retaliate?: number;
  keywords?: UnitKeywords;
  ability?: AbilityPick;
  actions?: string[];
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
  template: CardTemplate;
  bonusBudget: number;
  learningChance: number;
  actionName?: string[];
}

export function getNewCardTemplate(
  parameters: CardCreationParameters,
  spend = true,
  characterKey = 'player',
  prune = false
): CardCreationResult | null {
  if (!parameters.resources) {
    parameters.resources = [];
  }
  if (spend && !spendResources(parameters.resources)) {
    return null;
  }
  const character = getActingCharacter(characterKey);
  const bonuses = getCardCreationBonuses(parameters.resources, characterKey);
  const prunedParams = prune ? limitParametersToSkills(parameters, character) : parameters;
  const cardType = resolveCardType(prunedParams);
  const typedParams = { ...prunedParams, cardType };
  if (cardType === CardType.Spell) {
    const { template, bonusBudget, actionName } = getSpellTemplate(typedParams, bonuses);
    return { template, bonusBudget, learningChance: bonuses.learningChance, actionName };
  }
  const { template, bonusBudget, actionName } = getUnitTemplate(typedParams, bonuses, character);
  return { template, bonusBudget, learningChance: bonuses.learningChance, actionName };
}

export function invokeCard(parameters: CardCreationParameters, characterKey = 'player'): string {
  const result = getNewCardTemplate(parameters, true, characterKey, true);
  if (!result) {
    return '';
  }
  const { template, bonusBudget, learningChance, actionName } = result;
  if (!template) {
    return '';
  }
  learnCard(template, learningChance, bonusBudget, getActingCharacter(characterKey), actionName);
  return '';
}

export function conjureCard(parameters: CardCreationResult, characterKey = 'player'): string {
  learnCard(
    parameters.template,
    parameters.learningChance,
    parameters.bonusBudget,
    getActingCharacter(characterKey),
    parameters.actionName
  );
  return '';
}

export function getConjurationOtions(
  parameters: CardCreationParameters,
  characterKey = 'player'
): CardCreationResult[] {
  const character = getActingCharacter(characterKey);
  const optionsCount = 3 + Math.floor(character.craftingSkills.inspiration);
  if (!spendResources(parameters.resources ?? [])) {
    return [];
  }
  const options: CardCreationResult[] = [];
  for (let i = 0; i < optionsCount; i++) {
    const result = getNewCardTemplate(parameters, false, characterKey);
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
  const knownActions = character.craftingKnowledge.actions;

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

  let ability = parameters.ability;
  if (ability && !knownActions?.[ability.action]) {
    ability = undefined;
  }

  let actions = parameters.actions?.filter((action) => knownActions?.[action]);
  if (!actions?.length) {
    actions = knownActions ? Object.keys(knownActions) : undefined;
  }

  return {
    ...parameters,
    colors,
    keywords,
    ability,
    actions,
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

function learnCard(
  template: CardTemplate,
  learningChance: number,
  bonusBudget: number,
  character: Character,
  actionName?: string[]
) {
  const learntKeywords: string[] = [];
  const improvedKeywords: string[] = [];
  const learntActions: string[] = [];
  const improvedActions: string[] = [];
  if (isUnitCard(template) && template.keywords && Math.random() < learningChance) {
    if (!character.craftingKnowledge.keywords) {
      character.craftingKnowledge.keywords = {};
    }
    const known = character.craftingKnowledge.keywords;
    for (const keyword of Object.keys(template.keywords) as (keyof UnitKeywords)[]) {
      const name = formatKnowledgeName(keyword);
      if (known[keyword] === undefined) {
        known[keyword] = 1;
        learntKeywords.push(name);
      } else {
        known[keyword] += 1;
        improvedKeywords.push(`${name} (${known[keyword]})`);
      }
    }
  }
  if (actionName?.length && Math.random() < learningChance) {
    if (!character.craftingKnowledge.actions) {
      character.craftingKnowledge.actions = {};
    }
    const known = character.craftingKnowledge.actions;
    for (const action of actionName) {
      const name = getActionTemplateMeta(action)?.label ?? formatKnowledgeName(action);
      if (known[action] === undefined) {
        known[action] = 1;
        learntActions.push(name);
      } else {
        known[action] += 1;
        improvedActions.push(`${name} (${known[action]})`);
      }
    }
  }
  character.collection.push(template);
  if (character.key === gs.player.key) {
    narrateCardLearnt(
      template,
      bonusBudget,
      learntKeywords,
      improvedKeywords,
      learntActions,
      improvedActions
    );
  }
}

function narrateCardLearnt(
  template: CardTemplate,
  bonusBudget: number,
  learntKeywords: string[],
  improvedKeywords: string[],
  learntActions: string[],
  improvedActions: string[]
) {
  const parts: string[] = [];
  const learntNames = [...learntKeywords, ...learntActions];
  const improvedNames = [...improvedKeywords, ...improvedActions];
  if (learntNames.length) {
    parts.push(`You learnt ${joinKeywordNames(learntNames)}`);
  }
  if (improvedNames.length) {
    parts.push(`You improved ${joinKeywordNames(improvedNames)}`);
  }
  const learnt = parts.length ? `${parts.join('. ')}.` : '';
  let text = learnt ? `You created ${template.name}. ${learnt}` : `You created ${template.name}.`;
  if (bonusBudget) {
    text += ` Your mastery granted it ${bonusBudget} bonus budget.`;
  }
  narrateCardConjured(template.id, text);
}

function formatKnowledgeName(keyword: string): string {
  return keyword.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function resolveCardType(parameters: CardCreationParameters): CardType.Unit | CardType.Spell {
  if (parameters.cardType === CardType.Spell || parameters.cardType === CardType.Unit) {
    return parameters.cardType;
  }
  if (
    parameters.power !== undefined ||
    parameters.hp !== undefined ||
    parameters.keywords ||
    parameters.ability ||
    parameters.unitTypes
  ) {
    return CardType.Unit;
  }
  if (parameters.actions?.length) {
    return CardType.Spell;
  }
  return Math.random() < 0.25 ? CardType.Spell : CardType.Unit;
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
  actionName: string[];
} {
  const flavorTemplates = loadFlavorTemplates();
  const unitParams = { ...parameters };
  delete unitParams.cardType;

  // 1. create card template based on parameters (randomize rest)
  const cardBase = buildUnitCard(unitParams, character);
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
  const templateParameters: CardCreationParameters = {
    ...parameters,
    cardType: CardType.Unit,
    colors: colors.map((entry) => entry.color),
    cost,
  };

  // 4. pick template
  const flavor = pickFlavorTemplate(flavorTemplates, templateParameters);
  return {
    template: {
      ...conjured,
      id: flavor.name + crypto.randomUUID(),
      imageFileName: flavor.imageName,
      name: flavor.name,
    },
    bonusBudget: sureMastery + extraBudget,
    actionName: (conjured.abilities ?? []).flatMap(getAbilityActionNames),
  };
}

function getSpellTemplate(
  parameters: CardCreationParameters,
  bonuses: CardCreationBonuses
): {
  template: SpellCardTemplate;
  bonusBudget: number;
  actionName: string[];
} {
  const flavorTemplates = loadFlavorTemplates();
  const { card, actionName } = buildSpellCard(parameters);
  const sureMastery = Math.floor(bonuses.extraBudgetChance);
  const extraBudget = Math.random() < bonuses.extraBudgetChance - sureMastery ? 1 : 0;
  const budget = getCardBudget(card) - sureMastery - extraBudget;
  const { cost } = getCostFromBudget(budget);
  const conjured: Omit<SpellCardTemplate, 'id' | 'name' | 'imageFileName'> = {
    ...card,
    cost,
  };
  const templateParameters: CardCreationParameters = {
    ...parameters,
    cardType: CardType.Spell,
    colors: card.colors.map((entry) => entry.color),
    cost,
  };
  const flavor = pickFlavorTemplate(flavorTemplates, templateParameters);
  return {
    template: {
      ...conjured,
      id: flavor.name + crypto.randomUUID(),
      imageFileName: flavor.imageName,
      name: flavor.name,
    },
    bonusBudget: sureMastery + extraBudget,
    actionName,
  };
}

function pickFlavorTemplate(
  flavorTemplates: ReturnType<typeof loadFlavorTemplates>,
  parameters: CardCreationParameters
) {
  const filteredTemplates = filterFlavorTemplates(flavorTemplates, parameters);
  if (filteredTemplates.length) {
    return getRandomFromArray(filteredTemplates);
  }
  const typed = parameters.cardType
    ? flavorTemplates.filter((template) => template.cardType === parameters.cardType)
    : flavorTemplates;
  return getRandomFromArray(typed.length ? typed : flavorTemplates);
}
