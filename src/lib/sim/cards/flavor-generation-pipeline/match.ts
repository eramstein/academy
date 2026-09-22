import type { FlavorTemplate, GameplayTemplate, PowerLevel } from './types';

export const MATCH_SCORE_THRESHOLD = 999;

const COLOR_MATCH_WEIGHT = 9;
const POWER_EXACT_MATCH_WEIGHT = 2;
const POWER_NEAR_MATCH_WEIGHT = 1;
const KEYWORD_MATCH_WEIGHT = 3;
const UNIT_TYPE_MATCH_WEIGHT = 3;
const ACTION_MATCH_WEIGHT = 3;

const POWER_ORDER: PowerLevel[] = ['weak', 'medium', 'powerful'];

export interface FlavorScoreBreakdown {
  total: number;
  colors: number;
  power: number;
  keywords: number;
  unitTypes: number;
  actions: number;
}

export function scoreFlavorTemplateDetailed(
  template: FlavorTemplate,
  gameplay: GameplayTemplate
): FlavorScoreBreakdown {
  let colors = 0;
  for (const color of gameplay.colors) {
    if (template.colors.includes(color)) {
      colors += COLOR_MATCH_WEIGHT;
    }
  }

  let power = 0;
  const powerDelta = Math.abs(
    POWER_ORDER.indexOf(template.unitSize) - POWER_ORDER.indexOf(gameplay.powerLevel)
  );
  if (powerDelta === 0) {
    power = POWER_EXACT_MATCH_WEIGHT;
  } else if (powerDelta === 1) {
    power = POWER_NEAR_MATCH_WEIGHT;
  }

  let keywords = 0;
  if (gameplay.keywords) {
    for (const keyword of gameplay.keywords) {
      if (template.keywords.includes(keyword)) {
        keywords += KEYWORD_MATCH_WEIGHT;
      }
    }
  }

  let unitTypes = 0;
  if (gameplay.unitTypes) {
    for (const unitType of gameplay.unitTypes) {
      if (template.unitTypes?.includes(unitType)) {
        unitTypes += UNIT_TYPE_MATCH_WEIGHT;
      }
    }
  }

  let actions = 0;
  if (gameplay.actions) {
    for (const action of gameplay.actions) {
      if (template.actions?.includes(action)) {
        actions += ACTION_MATCH_WEIGHT;
      }
    }
  }

  return {
    total: colors + power + keywords + unitTypes + actions,
    colors,
    power,
    keywords,
    unitTypes,
    actions,
  };
}

export function scoreFlavorTemplate(template: FlavorTemplate, gameplay: GameplayTemplate): number {
  return scoreFlavorTemplateDetailed(template, gameplay).total;
}

export interface RankedFlavor {
  template: FlavorTemplate;
  score: number;
  breakdown: FlavorScoreBreakdown;
}

/** Best unused candidate in the typed pool (regardless of threshold). */
export function rankBestFlavor(
  templates: FlavorTemplate[],
  gameplay: GameplayTemplate
): RankedFlavor | null {
  const typed = templates.filter((template) => template.cardType === gameplay.cardType);
  const pool = typed.length ? typed : templates;
  if (!pool.length) return null;

  let best: RankedFlavor | null = null;
  for (const template of pool) {
    const breakdown = scoreFlavorTemplateDetailed(template, gameplay);
    if (!best || breakdown.total > best.score) {
      best = { template, score: breakdown.total, breakdown };
    }
  }
  return best;
}

/** Best unused match at or above threshold, or null on miss. */
export function findMatchingFlavor(
  templates: FlavorTemplate[],
  gameplay: GameplayTemplate
): FlavorTemplate | null {
  const best = rankBestFlavor(templates, gameplay);
  if (best && best.score >= MATCH_SCORE_THRESHOLD) {
    return best.template;
  }
  return null;
}

/** Best score among pool (for below-threshold fallbacks). */
export function findBestFlavor(
  templates: FlavorTemplate[],
  gameplay: GameplayTemplate
): FlavorTemplate | null {
  if (!templates.length) return null;

  let best = templates[0];
  let bestScore = scoreFlavorTemplate(best, gameplay);
  for (let i = 1; i < templates.length; i++) {
    const score = scoreFlavorTemplate(templates[i], gameplay);
    if (score > bestScore) {
      bestScore = score;
      best = templates[i];
    }
  }
  return best;
}
