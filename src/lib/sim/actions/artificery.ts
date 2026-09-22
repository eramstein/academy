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
import { getAbilityActionNames, type AbilityPick } from '../cards/ability-templates';
import { getActionTemplateMeta } from '../cards/action-templates';
import { getCardBudget, getCostFromBudget } from '../cards/card-budget';
import { buildSpellCard, buildUnitCard, randomUnitTypes } from '../cards/creation';
import {
  resolveFlavorTemplate,
  toGameplayTemplate,
  type UsedFlavorsBatch,
} from '../cards/flavor-generation-pipeline';
import { formatKeywordLabel } from '../cards/keywords';
import { getActingCharacter } from '../characters';
import { narrateCardConjured } from '../narration';
import { spendResources } from '../resources';

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

export type UsedFlavors = UsedFlavorsBatch;

/** Progressive summoning reveal stages for the conjure UI. */
export type SummonRevealStage = 'frame' | 'gameplay' | 'name' | 'image';

export interface CardSummonProgress {
  index: number;
  total: number;
  stage: SummonRevealStage;
  template: CardTemplate;
}

export type CardSummonProgressHandler = (progress: CardSummonProgress) => void;

export function getConjurationOptionCount(characterKey = 'player'): number {
  const character = getActingCharacter(characterKey);
  return 1 + Math.floor(character.craftingSkills.inspiration);
}

export async function getNewCardTemplate(
  parameters: CardCreationParameters,
  spend = true,
  characterKey = 'player',
  prune = false,
  usedFlavors?: UsedFlavors,
  onSummonProgress?: (stage: SummonRevealStage, template: CardTemplate) => void
): Promise<CardCreationResult | null> {
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
    const { template, bonusBudget, actionName } = await getSpellTemplate(
      typedParams,
      bonuses,
      usedFlavors,
      onSummonProgress
    );
    return { template, bonusBudget, learningChance: bonuses.learningChance, actionName };
  }
  const { template, bonusBudget, actionName } = await getUnitTemplate(
    typedParams,
    bonuses,
    character,
    usedFlavors,
    onSummonProgress
  );
  return { template, bonusBudget, learningChance: bonuses.learningChance, actionName };
}

export async function invokeCard(
  parameters: CardCreationParameters,
  characterKey = 'player'
): Promise<string> {
  const result = await getNewCardTemplate(parameters, true, characterKey, true);
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

export async function getConjurationOtions(
  parameters: CardCreationParameters,
  characterKey = 'player',
  onProgress?: CardSummonProgressHandler
): Promise<CardCreationResult[]> {
  const character = getActingCharacter(characterKey);
  const optionsCount = getConjurationOptionCount(characterKey);
  if (!spendResources(parameters.resources ?? [])) {
    return [];
  }
  const usedFlavors: UsedFlavors = {
    names: new Set(character.collection.map((card) => card.name)),
    images: new Set(character.collection.map((card) => card.imageFileName)),
  };
  const options: CardCreationResult[] = [];
  for (let i = 0; i < optionsCount; i++) {
    const result = await getNewCardTemplate(
      parameters,
      false,
      characterKey,
      false,
      usedFlavors,
      (stage, template) => {
        onProgress?.({ index: i, total: optionsCount, stage, template });
      }
    );
    if (result) {
      usedFlavors.names.add(result.template.name);
      usedFlavors.images.add(result.template.imageFileName);
      options.push(result);
      onProgress?.({
        index: i,
        total: optionsCount,
        stage: 'image',
        template: result.template,
      });
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
      const name = formatKeywordLabel(keyword);
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
      const name = getActionTemplateMeta(action)?.label ?? formatKeywordLabel(action);
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

async function getUnitTemplate(
  parameters: CardCreationParameters,
  bonuses: CardCreationBonuses,
  character: Character,
  usedFlavors?: UsedFlavors,
  onSummonProgress?: (stage: SummonRevealStage, template: CardTemplate) => void
): Promise<{
  template: UnitCardTemplate;
  bonusBudget: number;
  actionName: string[];
}> {
  const unitParams = { ...parameters };
  delete unitParams.cardType;

  const cardBase = buildUnitCard(unitParams, character);
  const sureMastery = Math.floor(bonuses.extraBudgetChance);
  const extraBudget = Math.random() < bonuses.extraBudgetChance - sureMastery ? 1 : 0;
  const budget = getCardBudget(cardBase) - sureMastery - extraBudget;
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
  const actionName = (conjured.abilities ?? []).flatMap(getAbilityActionNames);
  const templateParameters: CardCreationParameters = {
    resources: parameters.resources,
    cardType: CardType.Unit,
    colors: colors.map((entry) => entry.color),
    cost,
    power: conjured.power,
    hp: conjured.maxHealth,
    retaliate: conjured.retaliate,
    keywords: conjured.keywords,
    unitTypes: conjured.unitTypes,
    actions: actionName.length ? actionName : undefined,
  };

  const draftId = `summoning-${crypto.randomUUID()}`;
  const draft: UnitCardTemplate = {
    ...conjured,
    id: draftId,
    name: '',
    imageFileName: '',
    unitTypes: conjured.unitTypes?.length
      ? conjured.unitTypes
      : randomUnitTypes(colors.map((entry) => entry.color)),
  };
  onSummonProgress?.('frame', draft);
  onSummonProgress?.('gameplay', draft);

  const flavor = await resolveFlavorTemplate(toGameplayTemplate(templateParameters), {
    batch: usedFlavors,
    onProgress: (event) => {
      if (event.stage === 'name_ready') {
        draft.name = event.name;
        draft.imageFileName = '';
        if (!draft.unitTypes?.length && event.unitTypes?.length) {
          draft.unitTypes = event.unitTypes;
        }
        onSummonProgress?.('name', draft);
        return;
      }
      if (event.stage === 'reuse' || event.stage === 'fallback') {
        draft.name = event.flavor.name;
        draft.imageFileName = '';
        if (!draft.unitTypes?.length && event.flavor.unitTypes?.length) {
          draft.unitTypes = event.flavor.unitTypes;
        }
        onSummonProgress?.('name', draft);
        draft.imageFileName = event.flavor.imageName;
        onSummonProgress?.('image', draft);
        return;
      }
      if (event.stage === 'image_ready') {
        draft.name = event.flavor.name;
        draft.imageFileName = event.flavor.imageName;
        if (!draft.unitTypes?.length && event.flavor.unitTypes?.length) {
          draft.unitTypes = event.flavor.unitTypes;
        }
        onSummonProgress?.('image', draft);
      }
    },
  });

  draft.id = flavor.name + crypto.randomUUID();
  draft.name = flavor.name;
  draft.imageFileName = flavor.imageName;
  draft.unitTypes = conjured.unitTypes?.length
    ? conjured.unitTypes
    : flavor.unitTypes?.length
      ? flavor.unitTypes
      : draft.unitTypes;
  onSummonProgress?.('image', draft);
  return {
    template: draft,
    bonusBudget: sureMastery + extraBudget,
    actionName,
  };
}

async function getSpellTemplate(
  parameters: CardCreationParameters,
  bonuses: CardCreationBonuses,
  usedFlavors?: UsedFlavors,
  onSummonProgress?: (stage: SummonRevealStage, template: CardTemplate) => void
): Promise<{
  template: SpellCardTemplate;
  bonusBudget: number;
  actionName: string[];
}> {
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
    resources: parameters.resources,
    cardType: CardType.Spell,
    colors: conjured.colors.map((entry) => entry.color),
    cost,
    actions: actionName.length ? actionName : undefined,
  };

  const draftId = `summoning-${crypto.randomUUID()}`;
  const draft: SpellCardTemplate = {
    ...conjured,
    id: draftId,
    name: '',
    imageFileName: '',
  };
  onSummonProgress?.('frame', draft);
  onSummonProgress?.('gameplay', draft);

  const flavor = await resolveFlavorTemplate(toGameplayTemplate(templateParameters), {
    batch: usedFlavors,
    onProgress: (event) => {
      if (event.stage === 'name_ready') {
        draft.name = event.name;
        draft.imageFileName = '';
        onSummonProgress?.('name', draft);
        return;
      }
      if (event.stage === 'reuse' || event.stage === 'fallback') {
        draft.name = event.flavor.name;
        draft.imageFileName = '';
        onSummonProgress?.('name', draft);
        draft.imageFileName = event.flavor.imageName;
        onSummonProgress?.('image', draft);
        return;
      }
      if (event.stage === 'image_ready') {
        draft.name = event.flavor.name;
        draft.imageFileName = event.flavor.imageName;
        onSummonProgress?.('image', draft);
      }
    },
  });

  draft.id = flavor.name + crypto.randomUUID();
  draft.name = flavor.name;
  draft.imageFileName = flavor.imageName;
  onSummonProgress?.('image', draft);
  return {
    template: draft,
    bonusBudget: sureMastery + extraBudget,
    actionName,
  };
}
