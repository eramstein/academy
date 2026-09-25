import {
  isSpellCard,
  isUnitCard,
  ResourceType,
  type Ability,
  type ActionDefinition,
  type CardTemplate,
  type SpellCardTemplate,
  type UnitCardTemplate,
  type UnitKeywords,
} from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromObjectWeights } from '@/lib/_utils/random';
import { buildAbility, getAbilityActionNames, type AbilityPick } from '../cards/ability-templates';
import { cardBudget, featureCosts, getActionBudget, getCardBudget } from '../cards/card-budget';
import { colorPie, getCardDominantColor } from '../cards/color-pie';
import {
  getActionNumericParams,
  getActionTemplateMeta,
  getActionTemplateNameForEffect,
} from '../cards/action-templates';
import { addKeyword, formatKeywordLabel, KEYWORD_KEYS, removeKeyword } from '../cards/keywords';
import { narrateCardEncanted } from '../narration';

export type ActionArgDeltas = Record<number, Record<string, number>>;

export interface AugmentParameters {
  cardId: string;
  costIncrease?: number;
  maxHealth?: number;
  power?: number;
  retaliate?: number;
  keywords?: Partial<Record<keyof UnitKeywords, number>>;
  actionArgs?: ActionArgDeltas;
  ability?: AbilityPick;
  abilityArgs?: ActionArgDeltas;
  removeAbilities?: number[];
  /** Offered materials; bonuses TBD. */
  resources: { type: ResourceType; count: number }[];
}

export interface AugmentPreview {
  error: string;
  card: UnitCardTemplate | SpellCardTemplate | null;
  /** Auto-computed mana cost increase required to fund `spent`. */
  costIncrease: number;
  upgradeBudget: number;
  spent: number;
  extraBudget: number;
}

export interface DistillParameters {
  cardId: string;
  costDecrease?: number;
  maxHealth?: number;
  power?: number;
  retaliate?: number;
  keywords?: Partial<Record<keyof UnitKeywords, number>>;
  actionArgs?: ActionArgDeltas;
  ability?: AbilityPick;
  abilityArgs?: ActionArgDeltas;
  removeAbilities?: number[];
  /** Offered materials; bonuses TBD. */
  resources: { type: ResourceType; count: number }[];
}

export interface DistillPreview {
  error: string;
  card: UnitCardTemplate | SpellCardTemplate | null;
  preview: UnitCardTemplate | SpellCardTemplate | null;
  /** Mana cost reduction funded by the cuts (0 if not enough yet). */
  costDecrease: number;
  downgradeBudget: number;
  saved: number;
  extraCut: number;
}

const MIN_ACTION_ARG = 1;

/** Minimum mana cost increase that funds `spent`, or null if it would exceed 9. */
export function requiredCostIncrease(baseCost: number, spent: number): number | null {
  const maxIncrease = 9 - baseCost;
  if (maxIncrease < 0) return null;
  for (let n = 0; n <= maxIncrease; n++) {
    if (cardBudget[baseCost + n] - cardBudget[baseCost] >= spent) return n;
  }
  return null;
}

/** Maximum mana cost decrease that `saved` budget can fund (0 if not enough for −1). */
export function requiredCostDecrease(baseCost: number, saved: number): number {
  let best = 0;
  for (let n = 1; n <= baseCost; n++) {
    const need = cardBudget[baseCost] - cardBudget[baseCost - n];
    if (saved >= need) best = n;
    else break;
  }
  return best;
}

export function getAugmentPreview(parameters: AugmentParameters): AugmentPreview {
  const card = gs.player.collection.find((c) => c.id === parameters.cardId);

  if (!card) {
    return emptyPreview(`Card not found: ${parameters.cardId}.`);
  }
  if (!isEnchantableCard(card)) {
    return emptyPreview(`Card cannot be enchanted: ${parameters.cardId}.`);
  }
  if (card.cost >= 9) {
    return {
      error: `Card is already at max cost: ${card.cost}.`,
      card,
      costIncrease: 0,
      upgradeBudget: 0,
      spent: 0,
      extraBudget: 0,
    };
  }

  const features = makeNewCardTemplate(card, { ...parameters, costIncrease: 0 });
  const spent = getCardBudget(features) - getCardBudget(card);
  const costIncrease =
    parameters.costIncrease != null
      ? parameters.costIncrease
      : requiredCostIncrease(card.cost, spent);

  if (costIncrease === null || card.cost + costIncrease > 9) {
    return {
      error: 'Enchantment would raise mana cost above 9.',
      card,
      costIncrease: 0,
      upgradeBudget: 0,
      spent,
      extraBudget: 0,
    };
  }

  const upgradeBudget = cardBudget[card.cost + costIncrease] - cardBudget[card.cost];
  if (spent > upgradeBudget) {
    return {
      error: `New card budget is greater than upgrade budget: ${spent} > ${upgradeBudget}.`,
      card,
      costIncrease,
      upgradeBudget,
      spent,
      extraBudget: 0,
    };
  }

  return {
    error: '',
    card,
    costIncrease,
    upgradeBudget,
    spent,
    extraBudget: upgradeBudget - spent,
  };
}

export function augmentCard(parameters: AugmentParameters): string {
  const result = getAugmentPreview(parameters);
  if (result.error || !result.card) {
    return result.error;
  }
  parameters.costIncrease = result.costIncrease;

  const card = result.card;
  const oldCard = cloneCardTemplate(card);

  makeNewCardTemplate(card, parameters, true);

  if (isUnitCard(card)) {
    spendUnitExtraBudget(card, result.extraBudget);
  } else if (isSpellCard(card)) {
    spendSpellExtraBudget(card, result.extraBudget);
  }

  narrateCardEncanted(oldCard, card, describeAugment(oldCard, card));

  return '';
}

export const augmentUnit = augmentCard;

export function getDistillPreview(parameters: DistillParameters): DistillPreview {
  const card = gs.player.collection.find((c) => c.id === parameters.cardId);

  if (!card) {
    return emptyDistillPreview(`Card not found: ${parameters.cardId}.`);
  }
  if (!isEnchantableCard(card)) {
    return emptyDistillPreview(`Card cannot be distilled: ${parameters.cardId}.`);
  }
  if (card.cost < 1) {
    return {
      error: `Card cost is too low to distill: ${card.cost}.`,
      card,
      preview: null,
      costDecrease: 0,
      downgradeBudget: 0,
      saved: 0,
      extraCut: 0,
    };
  }

  const cutError = getDistillCutError(card, parameters);
  if (cutError) {
    return {
      error: cutError,
      card,
      preview: null,
      costDecrease: 0,
      downgradeBudget: 0,
      saved: 0,
      extraCut: 0,
    };
  }

  const cutPreview = makeDistilledCardTemplate(card, { ...parameters, costDecrease: 0 });
  const saved = getCardBudget(card) - getCardBudget(cutPreview);
  const costDecrease =
    parameters.costDecrease != null
      ? parameters.costDecrease
      : requiredCostDecrease(card.cost, saved);

  if (costDecrease < 1 || card.cost < costDecrease) {
    const needForOne = cardBudget[card.cost] - cardBudget[card.cost - 1];
    return {
      error: `Need to cut more budget: ${saved} < ${needForOne}.`,
      card,
      preview: cutPreview,
      costDecrease: 0,
      downgradeBudget: needForOne,
      saved,
      extraCut: 0,
    };
  }

  const downgradeBudget = cardBudget[card.cost] - cardBudget[card.cost - costDecrease];
  if (saved < downgradeBudget) {
    return {
      error: `Need to cut more budget: ${saved} < ${downgradeBudget}.`,
      card,
      preview: cutPreview,
      costDecrease: 0,
      downgradeBudget,
      saved,
      extraCut: 0,
    };
  }

  const preview = makeDistilledCardTemplate(card, { ...parameters, costDecrease });
  return {
    error: '',
    card,
    preview,
    costDecrease,
    downgradeBudget,
    saved,
    extraCut: saved - downgradeBudget,
  };
}

export function distillCard(parameters: DistillParameters): string {
  const result = getDistillPreview(parameters);
  if (result.error || !result.card) {
    return result.error;
  }
  parameters.costDecrease = result.costDecrease;

  const card = result.card;
  const oldCard = cloneCardTemplate(card);

  makeDistilledCardTemplate(card, parameters, true);
  narrateCardEncanted(oldCard, card, describeDistill(oldCard, card));

  return '';
}

export const distillUnit = distillCard;

export function isEnchantableCard(card: CardTemplate): card is UnitCardTemplate | SpellCardTemplate {
  return isUnitCard(card) || isSpellCard(card);
}

export function getEnchantableCards(options: { distill?: boolean } = {}): CardTemplate[] {
  return gs.player.collection.filter((card) => {
    if (!isEnchantableCard(card)) return false;
    if (options.distill) return card.cost > 0;
    return card.cost < 9;
  });
}

function describeAugment(oldCard: CardTemplate, newCard: CardTemplate): string {
  const changes = describeCardChanges(oldCard, newCard);
  if (!changes) {
    return `You augmented ${newCard.name}.`;
  }
  return `You augmented ${newCard.name}. ${changes}`;
}

function describeDistill(oldCard: CardTemplate, newCard: CardTemplate): string {
  const changes = describeCardChanges(oldCard, newCard);
  if (!changes) {
    return `You distilled ${newCard.name}.`;
  }
  return `You distilled ${newCard.name}. ${changes}`;
}

function describeCardChanges(oldCard: CardTemplate, newCard: CardTemplate): string {
  const parts: string[] = [];

  if (oldCard.cost !== newCard.cost) {
    parts.push(`cost ${oldCard.cost} → ${newCard.cost}`);
  }

  if (isUnitCard(oldCard) && isUnitCard(newCard)) {
    if (oldCard.power !== newCard.power) {
      parts.push(`power ${oldCard.power} → ${newCard.power}`);
    }
    if (oldCard.maxHealth !== newCard.maxHealth) {
      parts.push(`health ${oldCard.maxHealth} → ${newCard.maxHealth}`);
    }
    if (oldCard.retaliate !== newCard.retaliate) {
      parts.push(`retaliate ${oldCard.retaliate} → ${newCard.retaliate}`);
    }
    parts.push(...describeKeywordChanges(oldCard.keywords, newCard.keywords));
    parts.push(...describeAbilityChanges(oldCard.abilities, newCard.abilities));
  }

  if (isSpellCard(oldCard) && isSpellCard(newCard)) {
    parts.push(...describeActionArgChanges(oldCard, newCard));
  }

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
    const name = formatKeywordLabel(key);
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

function describeAbilityChanges(
  oldAbilities: Ability[] | undefined,
  newAbilities: Ability[] | undefined
): string[] {
  const parts: string[] = [];
  const oldList = oldAbilities ?? [];
  const newList = newAbilities ?? [];
  const oldLabels = oldList.map(abilityLabel);
  const unmatched = [...oldLabels];

  for (const label of newList.map(abilityLabel)) {
    const index = unmatched.indexOf(label);
    if (index === -1) {
      parts.push(`gained ${label}`);
    } else {
      unmatched.splice(index, 1);
    }
  }
  for (const label of unmatched) {
    parts.push(`lost ${label}`);
  }

  const shared = Math.min(oldList.length, newList.length);
  for (let index = 0; index < shared; index++) {
    if (abilityLabel(oldList[index]) !== abilityLabel(newList[index])) continue;
    parts.push(...describeAbilityArgChanges(oldList[index], newList[index], oldList.length > 1));
  }

  return parts;
}

function describeAbilityArgChanges(
  oldAbility: Ability,
  newAbility: Ability,
  qualify: boolean
): string[] {
  const parts: string[] = [];
  const count = Math.max(oldAbility.actions.length, newAbility.actions.length);
  for (let index = 0; index < count; index++) {
    const oldAction = oldAbility.actions[index];
    const newAction = newAbility.actions[index];
    if (!oldAction || !newAction) continue;
    for (const param of getActionNumericParams(oldAction)) {
      const oldValue = Number(oldAction.effect.args[param.definitionKey]) || 0;
      const newValue = Number(newAction.effect.args[param.definitionKey]) || 0;
      if (oldValue === newValue) continue;
      const label = param.label.toLowerCase();
      parts.push(
        qualify
          ? `${abilityLabel(newAbility)} ${label} ${oldValue} → ${newValue}`
          : `${label} ${oldValue} → ${newValue}`
      );
    }
  }
  return parts;
}

function abilityLabel(ability: Ability): string {
  const actionName = getAbilityActionNames(ability)[0];
  const actionLabel = actionName
    ? (getActionTemplateMeta(actionName)?.label ?? actionName)
    : (ability.actions[0]?.effect.name ?? 'ability');
  return `${ability.trigger.type}: ${actionLabel}`.toLowerCase();
}

function describeActionArgChanges(
  oldCard: SpellCardTemplate,
  newCard: SpellCardTemplate
): string[] {
  const parts: string[] = [];
  const count = Math.max(oldCard.actions.length, newCard.actions.length);
  for (let index = 0; index < count; index++) {
    const oldAction = oldCard.actions[index];
    const newAction = newCard.actions[index];
    if (!oldAction || !newAction) continue;
    const templateName = getActionTemplateNameForEffect(oldAction.effect.name);
    const actionLabel = templateName
      ? (getActionTemplateMeta(templateName)?.label ?? templateName)
      : oldAction.effect.name;
    for (const param of getActionNumericParams(oldAction)) {
      const oldValue = Number(oldAction.effect.args[param.definitionKey]) || 0;
      const newValue = Number(newAction.effect.args[param.definitionKey]) || 0;
      if (oldValue === newValue) continue;
      const label = param.label.toLowerCase();
      parts.push(
        count > 1
          ? `${actionLabel} ${label} ${oldValue} → ${newValue}`
          : `${label} ${oldValue} → ${newValue}`
      );
    }
  }
  return parts;
}

function emptyPreview(error: string): AugmentPreview {
  return {
    error,
    card: null,
    costIncrease: 0,
    upgradeBudget: 0,
    spent: 0,
    extraBudget: 0,
  };
}

function emptyDistillPreview(error: string): DistillPreview {
  return {
    error,
    card: null,
    preview: null,
    costDecrease: 0,
    downgradeBudget: 0,
    saved: 0,
    extraCut: 0,
  };
}

function getDistillCutError(
  card: UnitCardTemplate | SpellCardTemplate,
  parameters: DistillParameters
): string {
  if (isUnitCard(card)) {
    if ((parameters.power ?? 0) > card.power) {
      return `Cannot cut more power than the card has: ${card.power}.`;
    }
    if ((parameters.maxHealth ?? 0) > card.maxHealth - 1) {
      return `Cannot cut health below 1: ${card.maxHealth}.`;
    }
    if ((parameters.retaliate ?? 0) > (card.retaliate || 0)) {
      return `Cannot cut more retaliate than the card has: ${card.retaliate || 0}.`;
    }
    if (parameters.keywords) {
      for (const [keyword, value] of Object.entries(parameters.keywords) as [
        keyof UnitKeywords,
        number,
      ][]) {
        if (!value) continue;
        const current = card.keywords?.[keyword];
        if (!current) {
          return `Card does not have keyword: ${formatKeywordLabel(keyword)}.`;
        }
        if (typeof current === 'number' && value > current) {
          return `Cannot cut more ${formatKeywordLabel(keyword)} than the card has: ${current}.`;
        }
      }
    }
  }

  if (isSpellCard(card) && parameters.actionArgs) {
    for (const [indexKey, args] of Object.entries(parameters.actionArgs)) {
      const action = card.actions[Number(indexKey)];
      if (!action) {
        return `Spell does not have action ${indexKey}.`;
      }
      const params = getActionNumericParams(action);
      for (const [argKey, value] of Object.entries(args)) {
        if (!value) continue;
        const param = params.find((entry) => entry.definitionKey === argKey);
        if (!param) {
          return `Action does not have adjustable parameter: ${argKey}.`;
        }
        const current = Number(action.effect.args[argKey]) || 0;
        if (value > current - MIN_ACTION_ARG) {
          return `Cannot cut ${param.label.toLowerCase()} below ${MIN_ACTION_ARG}: ${current}.`;
        }
      }
    }
  }

  if (isUnitCard(card)) {
    const removed = new Set(parameters.removeAbilities ?? []);
    if (parameters.removeAbilities) {
      for (const index of parameters.removeAbilities) {
        if (!card.abilities?.[index]) {
          return `Card does not have ability ${index}.`;
        }
      }
    }
    if (parameters.abilityArgs) {
      for (const [indexKey, args] of Object.entries(parameters.abilityArgs)) {
        const index = Number(indexKey);
        if (removed.has(index)) continue;
        const action = card.abilities?.[index]?.actions[0];
        if (!action) {
          return `Card does not have ability ${indexKey}.`;
        }
        const params = getActionNumericParams(action);
        for (const [argKey, value] of Object.entries(args)) {
          if (!value) continue;
          const param = params.find((entry) => entry.definitionKey === argKey);
          if (!param) {
            return `Ability does not have adjustable parameter: ${argKey}.`;
          }
          const current = Number(action.effect.args[argKey]) || 0;
          if (value > current - MIN_ACTION_ARG) {
            return `Cannot cut ${param.label.toLowerCase()} below ${MIN_ACTION_ARG}: ${current}.`;
          }
        }
      }
    }
  }

  return '';
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

function spendUnitExtraBudget(card: UnitCardTemplate, extraBudget: number): number {
  const costs: Record<string, number> = {
    power: featureCosts.power(card),
    maxHealth: featureCosts.maxHealth(card),
    ret: featureCosts.retaliate(card),
  };

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
        card.retaliate = (card.retaliate || 0) + 1;
        break;
    }
  }

  return extraBudget;
}

function spendSpellExtraBudget(card: SpellCardTemplate, extraBudget: number): number {
  const colors = card.colors.map((entry) => entry.color);
  while (extraBudget > 0) {
    const options = card.actions.flatMap((action) =>
      getActionNumericParams(action)
        .map((param) => {
          const next = {
            ...action,
            effect: {
              ...action.effect,
              args: {
                ...action.effect.args,
                [param.definitionKey]:
                  (Number(action.effect.args[param.definitionKey]) || 0) + 1,
              },
            },
          };
          return {
            action,
            param,
            cost: getActionBudget(next, colors) - getActionBudget(action, colors),
          };
        })
        .filter((option) => option.cost > 0 && option.cost <= extraBudget)
    );
    if (!options.length) {
      break;
    }
    const pick = options.reduce((best, option) => (option.cost < best.cost ? option : best));
    const key = pick.param.definitionKey;
    pick.action.effect.args[key] = (Number(pick.action.effect.args[key]) || 0) + 1;
    extraBudget -= pick.cost;
  }
  return extraBudget;
}

function makeNewCardTemplate(
  card: UnitCardTemplate | SpellCardTemplate,
  parameters: AugmentParameters,
  mutate = false
): UnitCardTemplate | SpellCardTemplate {
  const target = mutate ? card : cloneCardTemplate(card);

  target.cost += parameters.costIncrease ?? 0;

  if (isUnitCard(target)) {
    target.maxHealth += parameters.maxHealth ?? 0;
    target.power += parameters.power ?? 0;
    target.retaliate = (target.retaliate || 0) + (parameters.retaliate ?? 0);

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

    applyAbilityArgDeltas(target, parameters.abilityArgs, 1);
    if (parameters.ability) {
      const ability = buildAbility(parameters.ability);
      if (ability) {
        target.abilities = [...(target.abilities ?? []), ability];
      }
    }
  }

  if (isSpellCard(target)) {
    applyActionArgDeltas(target, parameters.actionArgs, 1);
  }

  return target;
}

function makeDistilledCardTemplate(
  card: UnitCardTemplate | SpellCardTemplate,
  parameters: DistillParameters,
  mutate = false
): UnitCardTemplate | SpellCardTemplate {
  const target = mutate ? card : cloneCardTemplate(card);

  target.cost -= parameters.costDecrease ?? 0;

  if (isUnitCard(target)) {
    target.maxHealth -= parameters.maxHealth ?? 0;
    target.power -= parameters.power ?? 0;
    target.retaliate = Math.max(0, (target.retaliate || 0) - (parameters.retaliate ?? 0));

    if (parameters.keywords) {
      for (const [keyword, value] of Object.entries(parameters.keywords) as [
        keyof UnitKeywords,
        number,
      ][]) {
        if (value) {
          removeKeyword(target, keyword, value);
        }
      }
    }

    applyAbilityArgDeltas(target, parameters.abilityArgs, -1);
    if (parameters.removeAbilities?.length) {
      const removed = new Set(parameters.removeAbilities);
      target.abilities = target.abilities?.filter((_, index) => !removed.has(index));
      if (!target.abilities?.length) {
        target.abilities = undefined;
      }
    }
  }

  if (isSpellCard(target)) {
    applyActionArgDeltas(target, parameters.actionArgs, -1);
  }

  return target;
}

function applyActionArgDeltas(
  card: SpellCardTemplate,
  deltas: ActionArgDeltas | undefined,
  sign: 1 | -1
) {
  if (!deltas) return;
  for (const [indexKey, args] of Object.entries(deltas)) {
    const action = card.actions[Number(indexKey)];
    if (!action) continue;
    applyArgDeltas(action, args, sign);
  }
}

function applyAbilityArgDeltas(
  card: UnitCardTemplate,
  deltas: ActionArgDeltas | undefined,
  sign: 1 | -1
) {
  if (!deltas) return;
  for (const [indexKey, args] of Object.entries(deltas)) {
    const action = card.abilities?.[Number(indexKey)]?.actions[0];
    if (!action) continue;
    applyArgDeltas(action, args, sign);
  }
}

function applyArgDeltas(
  action: ActionDefinition,
  args: Record<string, number>,
  sign: 1 | -1
) {
  for (const [argKey, value] of Object.entries(args)) {
    if (!value) continue;
    const current = Number(action.effect.args[argKey]) || 0;
    action.effect.args[argKey] = Math.max(0, current + sign * value);
  }
}

function cloneActionDefinition(action: ActionDefinition): ActionDefinition {
  return {
    ...action,
    effect: {
      name: action.effect.name,
      args: { ...action.effect.args },
    },
    targets: action.targets?.map((target) => ({ ...target })),
  };
}

function cloneAbility(ability: Ability): Ability {
  return {
    ...ability,
    trigger: {
      ...ability.trigger,
      range: ability.trigger.range ? { ...ability.trigger.range } : undefined,
      staticRecompute: ability.trigger.staticRecompute
        ? [...ability.trigger.staticRecompute]
        : undefined,
    },
    actions: ability.actions.map(cloneActionDefinition),
  };
}

function cloneCardTemplate<T extends CardTemplate>(card: T): T {
  if (isSpellCard(card)) {
    return {
      ...card,
      actions: card.actions.map(cloneActionDefinition),
    } as T;
  }
  if (isUnitCard(card)) {
    return {
      ...card,
      keywords: card.keywords ? { ...card.keywords } : undefined,
      abilities: card.abilities?.map(cloneAbility),
    } as T;
  }
  return { ...card };
}
