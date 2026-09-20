import { CardColor } from '@/lib/_model';
import type { ActionDefinition } from '@/lib/_model/model-battle';
import { getRandomInteger, getRandomWeighted } from '@/lib/_utils/random';
import { actionTemplates, type ActionTemplate } from './action-templates-data';
import { colorPie } from './color-pie';

export { actionTemplates, type ActionTemplate };

export interface ActionNumericParam {
  factoryKey: string;
  definitionKey: string;
  label: string;
}

const DEFAULT_ACTION_PREVALENCE = 3;

export const actionNumericParams: Record<string, ActionNumericParam[]> = {
  directDamage: [{ factoryKey: 'damage', definitionKey: 'damage', label: 'Damage' }],
  grow: [{ factoryKey: 'counters', definitionKey: 'counterValue', label: 'Growth' }],
  healUnit: [{ factoryKey: 'health', definitionKey: 'health', label: 'Heal' }],
  damageLand: [{ factoryKey: 'damage', definitionKey: 'damage', label: 'Damage' }],
  destroyUnit: [],
  fortifyLand: [{ factoryKey: 'amount', definitionKey: 'amount', label: 'Fortify' }],
  reanimate: [],
  damageOpponent: [{ factoryKey: 'damage', definitionKey: 'damage', label: 'Damage' }],
  addGrowthCounters: [{ factoryKey: 'counters', definitionKey: 'counterValue', label: 'Growth' }],
  addDecayCounters: [{ factoryKey: 'counters', definitionKey: 'counterValue', label: 'Decay' }],
  drawCards: [{ factoryKey: 'cardCount', definitionKey: 'cardCount', label: 'Cards' }],
  mezz: [{ factoryKey: 'duration', definitionKey: 'duration', label: 'Duration' }],
  stun: [{ factoryKey: 'duration', definitionKey: 'duration', label: 'Duration' }],
  root: [{ factoryKey: 'duration', definitionKey: 'duration', label: 'Duration' }],
  daze: [{ factoryKey: 'duration', definitionKey: 'duration', label: 'Duration' }],
  bounceUnit: [],
  forceMoveUnit: [],
  fight: [],
  cycleCards: [],
  tutorCard: [],
  regrowCard: [],
  addMana: [{ factoryKey: 'amount', definitionKey: 'amount', label: 'Mana' }],
};

const randomActionArgs: Record<string, () => Record<string, unknown>> = {
  directDamage: () => ({ damage: getRandomInteger(1, 5) }),
  grow: () => ({ counters: getRandomInteger(1, 3) }),
  healUnit: () => ({ health: getRandomInteger(2, 6) }),
  damageLand: () => ({ damage: getRandomInteger(1, 3) }),
  destroyUnit: () => ({}),
  fortifyLand: () => ({ amount: getRandomInteger(1, 4) }),
  reanimate: () => ({}),
  damageOpponent: () => ({ damage: getRandomInteger(1, 4) }),
  addGrowthCounters: () => ({ counters: getRandomInteger(1, 3) }),
  addDecayCounters: () => ({ counters: getRandomInteger(1, 3) }),
  drawCards: () => ({ cardCount: getRandomInteger(1, 3) }),
  mezz: () => ({ duration: getRandomInteger(1, 2) }),
  stun: () => ({ duration: getRandomInteger(1, 2) }),
  root: () => ({ duration: getRandomInteger(1, 2) }),
  daze: () => ({ duration: getRandomInteger(1, 2) }),
  bounceUnit: () => ({ count: getRandomInteger(1, 2) }),
  forceMoveUnit: () => ({}),
  fight: () => ({}),
  cycleCards: () => ({ count: getRandomInteger(1, 2) }),
  tutorCard: () => ({}),
  regrowCard: () => ({}),
  addMana: () => ({ amount: getRandomInteger(1, 3) }),
};

export const ACTION_TEMPLATE_KEYS = Object.keys(actionTemplates);

const DEFAULT_ACTION_ARG = 1;

export function defaultActionFactoryArgs(name: string): Record<string, number> {
  return Object.fromEntries(
    (actionNumericParams[name] ?? []).map((param) => [param.factoryKey, DEFAULT_ACTION_ARG])
  );
}

export function createActionTemplate(
  name: string,
  factoryArgs?: Record<string, number>
): ActionTemplate {
  const args = factoryArgs ?? randomActionArgs[name]?.() ?? {};
  return actionTemplates[name](args);
}

export function pickRandomActionTemplate(
  colors: CardColor[],
  allowedActions?: string[]
): ActionTemplate {
  const colorBonus = combinedActionPreferences(colors);
  const actionPool = allowedActions?.length
    ? allowedActions.filter((key) => key in actionTemplates)
    : ACTION_TEMPLATE_KEYS;
  const weightedKeys = actionPool
    .map((key) => ({
      item: key,
      weight: Math.max(0, DEFAULT_ACTION_PREVALENCE + (colorBonus[key] ?? 0)),
    }))
    .filter(({ weight }) => weight > 0);
  const fallbackPool = actionPool.length ? actionPool : ACTION_TEMPLATE_KEYS;
  const name =
    weightedKeys.length > 0 ? getRandomWeighted(weightedKeys) : fallbackPool[0];
  return createActionTemplate(name);
}

export function getActionTemplateNameForEffect(effectName: string): string | undefined {
  for (const [name, create] of Object.entries(actionTemplates)) {
    if (create({}).definition.effect.name === effectName) {
      return name;
    }
  }
}

export function getActionTemplateMeta(
  name: string
): Pick<ActionTemplate, 'label' | 'description'> | undefined {
  const template = actionTemplates[name]?.({});
  if (!template) return undefined;
  return { label: template.label, description: template.description };
}

export function getActionTooltip(name: string): string {
  return getActionTemplateMeta(name)?.description ?? name;
}

export function getActionNumericParams(definition: ActionDefinition): ActionNumericParam[] {
  const name = getActionTemplateNameForEffect(definition.effect.name);
  if (!name) return [];
  return actionNumericParams[name] ?? [];
}

export function getActionDefinitionBudget(definition: ActionDefinition): number {
  const name = getActionTemplateNameForEffect(definition.effect.name);
  if (!name) return 0;
  return actionTemplates[name](factoryArgsFromDefinition(name, definition)).budget;
}

export function getActionParamBudgetDelta(
  definition: ActionDefinition,
  definitionKey: string,
  delta: number
): number {
  const next: ActionDefinition = {
    ...definition,
    effect: {
      ...definition.effect,
      args: {
        ...definition.effect.args,
        [definitionKey]: (Number(definition.effect.args[definitionKey]) || 0) + delta,
      },
    },
  };
  return getActionDefinitionBudget(next) - getActionDefinitionBudget(definition);
}

function factoryArgsFromDefinition(
  name: string,
  definition: ActionDefinition
): Record<string, number> {
  const params = actionNumericParams[name] ?? [];
  return Object.fromEntries(
    params.map((param) => [
      param.factoryKey,
      Number(definition.effect.args[param.definitionKey]) || 0,
    ])
  );
}

function combinedActionPreferences(colors: CardColor[]): Partial<Record<string, number>> {
  const combined: Partial<Record<string, number>> = {};
  for (const color of colors) {
    for (const [key, value] of Object.entries(colorPie[color].actionPreferences) as [
      string,
      number,
    ][]) {
      combined[key] = (combined[key] ?? 0) + value;
    }
  }
  return combined;
}
