import { EventEffectType, type EventEffect, type EventOutcome } from '@/lib/_model';
import { getActionTemplateMeta } from '../cards/action-templates';
import { formatKeywordLabel } from '../cards/keywords';

/** Short UI labels for option buttons; only the types listed here are shown. */
export function formatOutcomeEffectHints(outcome: EventOutcome): string {
  const effects = effectsForHint(outcome);
  if (!effects?.length) return '';

  const labels = effects
    .map((effect) => formatEffectHint(effect))
    .filter((label): label is string => !!label);

  return labels.join(' · ');
}

function effectsForHint(outcome: EventOutcome): EventEffect[] | undefined {
  if (outcome.effects?.length) return outcome.effects;
  // Skill-check options stash rewards on the success branch.
  if (outcome.attributeCheck?.successEffects?.length) {
    return outcome.attributeCheck.successEffects;
  }
  return undefined;
}

function formatEffectHint(effect: EventEffect): string | undefined {
  const params = effect.parameters ?? {};

  switch (effect.type) {
    case EventEffectType.OfferCardGifts:
      return '+ card';
    case EventEffectType.AddGold:
      return '+ gold';
    case EventEffectType.GetJob:
      return '+ job';
    case EventEffectType.AddResource: {
      const amount = params.amount;
      const resourceType = params.resourceType;
      if (typeof amount !== 'number' || typeof resourceType !== 'string') return undefined;
      return `+ ${amount} ${formatResourceLabel(resourceType)}`;
    }
    case EventEffectType.LevelAttribute: {
      const attribute = params.attribute;
      if (typeof attribute !== 'string' || !attribute) return undefined;
      return `+ ${attribute.toLowerCase()}`;
    }
    case EventEffectType.TeachAbility: {
      const ability = typeof params.ability === 'string' ? params.ability.trim() : '';
      return ability ? `+ ${formatSkillLabel(ability)} skill` : '+ skill';
    }
    case EventEffectType.TeachColor: {
      const color = typeof params.color === 'string' ? params.color.trim() : '';
      return color ? `+ ${formatSkillLabel(color)} skill` : '+ skill';
    }
    default:
      return undefined;
  }
}

function formatResourceLabel(resourceType: string): string {
  return resourceType.replace(/_/g, ' ').toLowerCase();
}

function formatSkillLabel(key: string): string {
  const meta = getActionTemplateMeta(key);
  if (meta?.label) return meta.label.toLowerCase();
  return formatKeywordLabel(key).toLowerCase();
}
