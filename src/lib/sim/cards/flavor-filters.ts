import type { UnitKeywords } from '@/lib/_model';
import type { CardCreationParameters } from '../actions';
import type { FlavorTemplate } from './flavor-templates';

const COLOR_MATCH_WEIGHT = 9;
const COST_EXACT_MATCH_WEIGHT = 2;
const COST_NEAR_MATCH_WEIGHT = 1;
const KEYWORD_MATCH_WEIGHT = 3;
const UNIT_TYPE_MATCH_WEIGHT = 3;
const ACTION_MATCH_WEIGHT = 3;

export function filterFlavorTemplates(
  templates: FlavorTemplate[],
  parameters: CardCreationParameters
): FlavorTemplate[] {
  const typed = parameters.cardType
    ? templates.filter((template) => template.cardType === parameters.cardType)
    : templates;
  const pool = typed.length ? typed : templates;

  let highestScore = 0;
  const scored = pool.map((template) => {
    const score = scoreFlavorTemplate(template, parameters);
    if (score > highestScore) {
      highestScore = score;
    }
    return { template, score };
  });

  return scored.filter(({ score }) => score === highestScore).map(({ template }) => template);
}

function scoreFlavorTemplate(template: FlavorTemplate, parameters: CardCreationParameters): number {
  let score = 0;

  if (parameters.colors) {
    for (const color of parameters.colors) {
      if (template.colors.includes(color)) {
        score += COLOR_MATCH_WEIGHT;
      }
    }
  }

  if (parameters.cost !== undefined) {
    const costDelta = Math.abs(template.cost - parameters.cost);
    if (costDelta === 0) {
      score += COST_EXACT_MATCH_WEIGHT;
    } else if (costDelta === 1) {
      score += COST_NEAR_MATCH_WEIGHT;
    }
  }

  if (parameters.keywords) {
    for (const keyword of Object.keys(parameters.keywords) as (keyof UnitKeywords)[]) {
      if (parameters.keywords[keyword] && template.keywords.includes(keyword)) {
        score += KEYWORD_MATCH_WEIGHT;
      }
    }
  }

  if (parameters.unitTypes) {
    for (const unitType of parameters.unitTypes) {
      if (template.unitTypes?.includes(unitType)) {
        score += UNIT_TYPE_MATCH_WEIGHT;
      }
    }
  }

  const requestedActions = requestedActionKeys(parameters);
  if (requestedActions.length) {
    for (const action of requestedActions) {
      if (template.actions?.includes(action)) {
        score += ACTION_MATCH_WEIGHT;
      }
    }
  }

  return score;
}

function requestedActionKeys(parameters: CardCreationParameters): string[] {
  const keys = new Set<string>();
  if (parameters.actions) {
    for (const action of parameters.actions) {
      keys.add(action);
    }
  }
  if (parameters.ability?.action) {
    keys.add(parameters.ability.action);
  }
  return [...keys];
}
