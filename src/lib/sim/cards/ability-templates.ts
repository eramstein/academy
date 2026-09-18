import { CardColor, TriggerType, type Ability, type Trigger } from '@/lib/_model';
import { getRandomFromArray } from '@/lib/_utils/random';
import {
  createActionTemplate,
  defaultActionFactoryArgs,
  getActionTemplateNameForEffect,
  pickRandomActionTemplate,
} from './action-templates';
import { actionTemplates } from './action-templates-data';

export interface AbilityPick {
  trigger: string;
  action: string;
  args?: Record<string, number>;
}

// multiplier for the cost of an ability
export const triggerTemplateCost: Record<string, number> = {
  onDeploy: 1,
  onTurnStart: 3,
};

export const triggerTemplates: Record<string, Trigger> = {
  onDeploy: {
    type: TriggerType.OnDeploy,
    range: {
      self: true,
    },
  },
  onTurnStart: {
    type: TriggerType.OnTurnStart,
    range: {
      self: true,
    },
  },
};

export const TRIGGER_TEMPLATE_KEYS = Object.keys(triggerTemplates);

export function getTriggerTemplateLabel(key: string): string {
  return triggerTemplates[key]?.type ?? key;
}

export function getTriggerTemplateKey(type: string): string | undefined {
  return TRIGGER_TEMPLATE_KEYS.find((key) => triggerTemplates[key].type === type);
}

export function getTriggerTemplateAsset(key: string): string {
  const file = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  return `images/keywords/${file}.png`;
}

export function getTriggerCostMultiplier(trigger: Trigger): number {
  const key = TRIGGER_TEMPLATE_KEYS.find((entry) => triggerTemplates[entry].type === trigger.type);
  return key ? (triggerTemplateCost[key] ?? 1) : 1;
}

export function cloneTrigger(trigger: Trigger): Trigger {
  return {
    type: trigger.type,
    range: trigger.range ? { ...trigger.range } : undefined,
    text: trigger.text,
    staticRecompute: trigger.staticRecompute ? [...trigger.staticRecompute] : undefined,
  };
}

export function buildAbility(pick: AbilityPick): Ability | null {
  const trigger = triggerTemplates[pick.trigger];
  if (!trigger || !(pick.action in actionTemplates)) {
    return null;
  }
  const action = createActionTemplate(
    pick.action,
    pick.args ?? defaultActionFactoryArgs(pick.action)
  );
  return {
    trigger: cloneTrigger(trigger),
    actions: [
      {
        effect: {
          name: action.definition.effect.name,
          args: { ...action.definition.effect.args },
        },
        targets: action.definition.targets?.map((target) => ({ ...target })),
      },
    ],
  };
}

export function getAbilityActionNames(ability: Ability): string[] {
  return ability.actions
    .map((action) => getActionTemplateNameForEffect(action.effect.name))
    .filter((name): name is string => !!name);
}

export function pickRandomAbility(
  colors: CardColor[],
  allowedActions?: string[]
): { ability: Ability; pick: AbilityPick } | null {
  const trigger = getRandomFromArray(TRIGGER_TEMPLATE_KEYS);
  const action = pickRandomActionTemplate(colors, allowedActions);
  if (!trigger || !action) {
    return null;
  }
  return {
    ability: {
      trigger: cloneTrigger(triggerTemplates[trigger]),
      actions: [
        {
          effect: {
            name: action.definition.effect.name,
            args: { ...action.definition.effect.args },
          },
          targets: action.definition.targets?.map((target) => ({ ...target })),
        },
      ],
    },
    pick: { trigger, action: action.name },
  };
}
