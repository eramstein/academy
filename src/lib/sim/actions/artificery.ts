import {
  CardColor,
  CardType,
  ResourceType,
  type CardTemplate,
  type Character,
  type SpellCardTemplate,
  type UnitCardTemplate,
  type UnitKeywords,
  type UnitType,
} from '@/lib/_model';
import { gs, uiState } from '@/lib/_state';
import { getAbilityActionNames, type AbilityPick } from '../cards/ability-templates';
import { getCardBudget, getCostFromBudget } from '../cards/card-budget';
import {
  applyKnowledgeGains,
  craftProfile,
  describeKnowledgeGains,
  isNumericKeyword,
  knownKeys,
  rollConjureOptionCount,
  rollDiscoveryIndex,
  rollPoints,
  unknownActions,
  unknownKeywords,
  type CraftProfile,
} from '../cards/crafting-skills';
import { buildSpellCard, buildUnitCard, randomUnitTypes } from '../cards/creation';
import {
  generateGameplayFromFlavor,
  mergeGameplayIntoParameters,
  resolveFlavorTemplate,
  toGameplayTemplate,
  type UsedFlavorsBatch,
} from '../cards/flavor-generation-pipeline';
import { getActingCharacter } from '../characters';
import { narrateCardConjured } from '../narration';
import { spendResources } from '../resources';
import { rollExtraBudget } from './enchanting';

export type CardCreationSource = 'invoke' | 'conjure';

export interface CardCreationParameters {
  /** Card template */
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
  /** Meta (card creation options) */
  actionArgs?: Record<string, number>;
  source: CardCreationSource;
  resources: { type: ResourceType; count: number }[];
  /** Conjure: this option may include one unknown keyword or action. */
  discoverUnknown?: boolean;
}

export interface CardCreationBonuses {
  /** Expected knowledge points (base 25% plus erudition). */
  learningChance: number;
  /** Expected bonus budget from mastery. */
  extraBudgetChance: number;
  profile: CraftProfile;
}

export interface CardCreationResult {
  template: CardTemplate;
  bonusBudget: number;
  learningChance: number;
  actionName?: string[];
  /** Pre-rolled learning points. When set, commit uses this instead of rolling again. */
  learningRoll?: number;
}

/** Learning and fortune results shown before conjured cards appear. */
export interface ConjurationAugury {
  learning: number;
  fortuneBudget: number;
  /** Conjure: how many options to generate, including any extra vision. */
  optionCount?: number;
  /** Conjure: index of the option that may reveal new lore, or -1. */
  discoveryIndex?: number;
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

/** Guaranteed vision count before the inspiration roll (base 2 plus sure extras). */
export function getConjurationOptionCount(
  characterKey = 'player',
  resources: { type: ResourceType; count: number }[] = []
): number {
  const character = getActingCharacter(characterKey);
  return craftProfile(character.craftingSkills, resources, 'conjure').conjureOptions.sure;
}

export async function getNewCardTemplate(
  parameters: CardCreationParameters,
  spend = true,
  characterKey = 'player',
  prune = false,
  usedFlavors?: UsedFlavors,
  onSummonProgress?: (stage: SummonRevealStage, template: CardTemplate) => void,
  flavorText?: string,
  allowAiGenerate = true,
  fortuneBudget?: number
): Promise<CardCreationResult | null> {
  if (!parameters.resources) {
    parameters.resources = [];
  }
  if (spend && !spendResources(parameters.resources)) {
    return null;
  }
  const character = getActingCharacter(characterKey);
  const bonuses = getCardCreationBonuses(parameters.resources, characterKey, parameters.source);
  const prunedParams = prune ? limitParametersToSkills(parameters, character) : parameters;
  const cardType = resolveCardType(prunedParams);
  let typedParams = prepareConjureParameters(
    { ...prunedParams, cardType },
    character
  );
  if (
    typedParams.source === 'conjure' &&
    typedParams.cardType === CardType.Spell &&
    !typedParams.actions?.length
  ) {
    typedParams = { ...typedParams, cardType: CardType.Unit };
  }
  if (cardType === CardType.Spell) {
    const { template, bonusBudget, actionName } = await getSpellTemplate(
      typedParams,
      bonuses,
      usedFlavors,
      onSummonProgress,
      flavorText,
      allowAiGenerate,
      fortuneBudget
    );
    return { template, bonusBudget, learningChance: bonuses.learningChance, actionName };
  }
  const { template, bonusBudget, actionName } = await getUnitTemplate(
    typedParams,
    bonuses,
    character,
    usedFlavors,
    onSummonProgress,
    flavorText,
    allowAiGenerate,
    fortuneBudget
  );
  return { template, bonusBudget, learningChance: bonuses.learningChance, actionName };
}

/** Spend resources and build the card. Learning is deferred so the ritual can show it first. */
export async function summonInvokedCard(
  parameters: CardCreationParameters,
  characterKey = 'player',
  augury?: ConjurationAugury
): Promise<CardCreationResult | null> {
  const result = await getNewCardTemplate(
    { ...parameters, source: 'invoke' },
    true,
    characterKey,
    true,
    undefined,
    undefined,
    undefined,
    true,
    augury?.fortuneBudget
  );
  if (!result?.template) return null;
  if (!augury) return result;
  return { ...result, learningRoll: augury.learning };
}

export function commitInvokedCard(result: CardCreationResult, characterKey = 'player') {
  learnCard(
    result.template,
    result.learningChance,
    result.bonusBudget,
    getActingCharacter(characterKey),
    result.actionName,
    result.learningRoll
  );
}

export async function invokeCard(
  parameters: CardCreationParameters,
  characterKey = 'player'
): Promise<string> {
  if (uiState.sim.invokeCommitted) {
    uiState.sim.invokeCommitted = false;
    return '';
  }
  const result = await summonInvokedCard(parameters, characterKey);
  if (result) commitInvokedCard(result, characterKey);
  return '';
}

export function conjureCard(parameters: CardCreationResult, characterKey = 'player'): string {
  learnCard(
    parameters.template,
    parameters.learningChance,
    parameters.bonusBudget,
    getActingCharacter(characterKey),
    parameters.actionName,
    parameters.learningRoll
  );
  return '';
}

export async function getConjurationOtions(
  parameters: CardCreationParameters,
  characterKey = 'player',
  onProgress?: CardSummonProgressHandler,
  flavorText?: string,
  augury?: ConjurationAugury
): Promise<CardCreationResult[]> {
  const character = getActingCharacter(characterKey);
  const profile = craftProfile(character.craftingSkills, parameters.resources ?? [], 'conjure');
  const optionsCount = augury?.optionCount ?? rollConjureOptionCount(profile.inspiration.total);
  const discoveryIndex =
    augury?.discoveryIndex ?? rollDiscoveryIndex(profile.discoveryChance, optionsCount);
  const conjureParameters: CardCreationParameters = { ...parameters, source: 'conjure' };
  if (!spendResources(conjureParameters.resources ?? [])) {
    return [];
  }

  const trimmedFlavor = flavorText?.trim() || undefined;
  // Each option gets its own gameplay params (LLM ok for all slots).
  const optionParameters = await Promise.all(
    Array.from({ length: optionsCount }, async () => {
      const base = trimmedFlavor
        ? mergeGameplayIntoParameters(
            conjureParameters,
            await generateGameplayFromFlavor(trimmedFlavor)
          )
        : conjureParameters;
      return limitParametersToKnownColors(base, character);
    })
  );

  const usedFlavors: UsedFlavors = {
    names: new Set(character.collection.map((card) => card.name)),
    images: new Set(character.collection.map((card) => card.imageFileName)),
  };
  // Player: at most one option may use AI for name/image. NPCs: catalog only.
  const allowAiGenerate = characterKey === 'player';
  const aiOptionIndex = optionsCount > 1 ? Math.floor(Math.random() * optionsCount) : 0;
  const options: CardCreationResult[] = [];
  for (let i = 0; i < optionsCount; i++) {
    const useAi = allowAiGenerate && i === aiOptionIndex;
    const result = await getNewCardTemplate(
      { ...optionParameters[i], discoverUnknown: i === discoveryIndex },
      false,
      characterKey,
      false,
      usedFlavors,
      (stage, template) => {
        onProgress?.({ index: i, total: optionsCount, stage, template });
      },
      useAi ? trimmedFlavor : undefined,
      useAi,
      augury?.fortuneBudget
    );
    if (result) {
      usedFlavors.names.add(result.template.name);
      usedFlavors.images.add(result.template.imageFileName);
      options.push(augury ? { ...result, learningRoll: augury.learning } : result);
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

function limitParametersToKnownColors(
  parameters: CardCreationParameters,
  character: Character
): CardCreationParameters {
  const knownColors = character.craftingKnowledge.colors;
  let colors = parameters.colors?.filter((color) => knownColors?.[color]);
  if (!colors?.length) {
    colors = knownColors ? Object.keys(knownColors).map((color) => color as CardColor) : undefined;
  }
  return { ...parameters, colors };
}

function limitParametersToSkills(
  parameters: CardCreationParameters,
  character: Character
): CardCreationParameters {
  const knownKeywords = character.craftingKnowledge.keywords;
  const knownActions = character.craftingKnowledge.actions;
  const { colors } = limitParametersToKnownColors(parameters, character);

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

  return limitInvokeIngredients(
    {
      ...parameters,
      colors,
      keywords,
      ability,
      actions,
    },
    character
  );
}

function prepareConjureParameters(
  parameters: CardCreationParameters,
  character: Character
): CardCreationParameters {
  if (parameters.source !== 'conjure') return parameters;
  const discover = !!parameters.discoverUnknown;
  const knownKeywords = knownKeys(character.craftingKnowledge?.keywords);
  const knownActions = knownKeys(character.craftingKnowledge?.actions);
  const newKeywords = unknownKeywords(character);
  const newActions = unknownActions(character);
  const flavored = !!(parameters.keywords || parameters.actions?.length);

  if (!flavored) {
    if (parameters.cardType !== CardType.Spell) return parameters;
    const pool = discover
      ? newActions.length
        ? newActions
        : [...knownActions]
      : [...knownActions];
    return { ...parameters, actions: pool };
  }

  let keywords = parameters.keywords ? { ...parameters.keywords } : undefined;
  let actions = parameters.actions ? [...parameters.actions] : undefined;
  if (!discover) {
    if (keywords) {
      const kept = Object.fromEntries(
        Object.entries(keywords).filter(([key]) => knownKeywords.has(key))
      ) as UnitKeywords;
      keywords = Object.keys(kept).length ? kept : undefined;
    }
    if (actions) {
      actions = actions.filter((action) => knownActions.has(action));
      if (!actions.length) actions = undefined;
    }
    return { ...parameters, keywords, actions };
  }

  const hasNewKeyword = keywords
    ? Object.keys(keywords).some((key) => !knownKeywords.has(key) && keywords?.[key as keyof UnitKeywords])
    : false;
  const hasNewAction = actions?.some((action) => !knownActions.has(action)) ?? false;
  if (!hasNewKeyword && !hasNewAction) {
    if (newKeywords.length) {
      const key = newKeywords[Math.floor(Math.random() * newKeywords.length)];
      keywords = {
        ...(keywords ?? {}),
        [key]: isNumericKeyword(key) ? 1 : true,
      };
    } else if (newActions.length) {
      const action = newActions[Math.floor(Math.random() * newActions.length)];
      if (parameters.cardType === CardType.Unit) {
        return {
          ...parameters,
          keywords,
          ability: { trigger: 'onDeploy', action },
        };
      }
      actions = [action];
    }
  }
  return { ...parameters, keywords, actions };
}

function countInvokeIngredients(parameters: CardCreationParameters): number {
  let count = parameters.colors?.length ?? 0;
  if ((parameters.power ?? 0) > 0) count++;
  if ((parameters.hp ?? 1) > 1) count++;
  if ((parameters.retaliate ?? 0) > 0) count++;
  if (parameters.keywords) {
    count += Object.values(parameters.keywords).filter(Boolean).length;
  }
  if (parameters.ability || parameters.actions?.length) count++;
  return count;
}

/** Inspiration (plus magic dust) is how many definition ingredients an invocation may use. */
function limitInvokeIngredients(
  parameters: CardCreationParameters,
  character: Character
): CardCreationParameters {
  if (parameters.source !== 'invoke') return parameters;
  const cap = craftProfile(character.craftingSkills, parameters.resources, 'invoke').scope;
  let next = parameters;
  if (countInvokeIngredients(next) <= cap) return next;

  if (next.ability) next = { ...next, ability: undefined };
  if (countInvokeIngredients(next) <= cap) return next;
  if (next.actions?.length) next = { ...next, actions: undefined, actionArgs: undefined };
  if (countInvokeIngredients(next) <= cap) return next;

  if (next.keywords) {
    const entries = Object.entries(next.keywords);
    while (
      entries.length &&
      countInvokeIngredients({
        ...next,
        keywords: Object.fromEntries(entries) as UnitKeywords,
      }) > cap
    ) {
      entries.pop();
    }
    next = {
      ...next,
      keywords: entries.length ? (Object.fromEntries(entries) as UnitKeywords) : undefined,
    };
  }
  if (countInvokeIngredients(next) <= cap) return next;
  if ((next.retaliate ?? 0) > 0) next = { ...next, retaliate: 0 };
  if (countInvokeIngredients(next) <= cap) return next;
  if ((next.hp ?? 1) > 1) next = { ...next, hp: 1 };
  if (countInvokeIngredients(next) <= cap) return next;
  if ((next.power ?? 0) > 0) next = { ...next, power: 0 };
  if (countInvokeIngredients(next) <= cap) return next;

  if (next.colors?.length) {
    const colors = [...next.colors];
    while (colors.length && countInvokeIngredients({ ...next, colors }) > cap) colors.pop();
    next = { ...next, colors: colors.length ? colors : undefined };
  }
  return next;
}

export function getCardCreationBonuses(
  resources: { type: ResourceType; count: number }[],
  characterKey = 'player',
  source: CardCreationSource = 'invoke'
): CardCreationBonuses {
  const character = getActingCharacter(characterKey);
  const profile = craftProfile(character.craftingSkills, resources, source);
  return {
    learningChance: profile.knowledge.expected,
    extraBudgetChance: profile.extraBudget.expected,
    profile,
  };
}

function learnCard(
  template: CardTemplate,
  learningChance: number,
  bonusBudget: number,
  character: Character,
  actionName?: string[],
  learningRoll?: number
) {
  const points = learningRoll ?? rollPoints(learningChance);
  const gains = applyKnowledgeGains(character, template, points, actionName);
  character.collection.push(template);
  if (character.key === gs.player.key) {
    narrateCardLearnt(template, bonusBudget, gains);
  }
}

function narrateCardLearnt(
  template: CardTemplate,
  bonusBudget: number,
  gains: ReturnType<typeof applyKnowledgeGains>
) {
  const learnt = describeKnowledgeGains(gains);
  let text = learnt ? `You created ${template.name}. ${learnt}` : `You created ${template.name}.`;
  if (bonusBudget) {
    text += ` Mastery granted ${bonusBudget} bonus budget.`;
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

async function getUnitTemplate(
  parameters: CardCreationParameters,
  bonuses: CardCreationBonuses,
  character: Character,
  usedFlavors?: UsedFlavors,
  onSummonProgress?: (stage: SummonRevealStage, template: CardTemplate) => void,
  flavorText?: string,
  allowAiGenerate = true,
  fortuneBudget?: number
): Promise<{
  template: UnitCardTemplate;
  bonusBudget: number;
  actionName: string[];
}> {
  const unitParams = { ...parameters };
  delete unitParams.cardType;

  const cardBase = buildUnitCard(unitParams, character);
  const bonusBudget = fortuneBudget ?? rollExtraBudget(bonuses.extraBudgetChance);
  const budget = getCardBudget(cardBase) - bonusBudget;
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
    source: parameters.source,
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
    flavorText,
    allowAiGenerate,
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
    bonusBudget,
    actionName,
  };
}

async function getSpellTemplate(
  parameters: CardCreationParameters,
  bonuses: CardCreationBonuses,
  usedFlavors?: UsedFlavors,
  onSummonProgress?: (stage: SummonRevealStage, template: CardTemplate) => void,
  flavorText?: string,
  allowAiGenerate = true,
  fortuneBudget?: number
): Promise<{
  template: SpellCardTemplate;
  bonusBudget: number;
  actionName: string[];
}> {
  const { card, actionName } = buildSpellCard(parameters);
  const bonusBudget = fortuneBudget ?? rollExtraBudget(bonuses.extraBudgetChance);
  const budget = getCardBudget(card) - bonusBudget;
  const { cost } = getCostFromBudget(budget);
  const conjured: Omit<SpellCardTemplate, 'id' | 'name' | 'imageFileName'> = {
    ...card,
    cost,
  };
  const templateParameters: CardCreationParameters = {
    source: parameters.source,
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
    flavorText,
    allowAiGenerate,
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
    bonusBudget,
    actionName,
  };
}
