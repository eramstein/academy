import type { FlavorTemplate, GameplayTemplate, PowerLevel } from './types';

/** Fraction of max possible match score a candidate must reach to reuse. */
export const MATCH_SCORE_THRESHOLD = 0.8;

const CARD_TYPE_MATCH_WEIGHT = 6;
const COLOR_MATCH_WEIGHT = 6;
const POWER_EXACT_MATCH_WEIGHT = 2;
const POWER_NEAR_MATCH_WEIGHT = 1;
const KEYWORD_MATCH_WEIGHT = 3;
const UNIT_TYPE_MATCH_WEIGHT = 3;
const ACTION_MATCH_WEIGHT = 3;

const POWER_ORDER: PowerLevel[] = ['weak', 'medium', 'powerful'];

export interface FlavorScoreBreakdown {
  total: number;
  cardType: number;
  colors: number;
  power: number;
  keywords: number;
  unitTypes: number;
  actions: number;
}

/** Perfect-match score for a gameplay template (all factors matched exactly). */
export function maxFlavorMatchScore(gameplay: GameplayTemplate): number {
  const cardType = CARD_TYPE_MATCH_WEIGHT;
  const colors = gameplay.colors.length * COLOR_MATCH_WEIGHT;
  const power = POWER_EXACT_MATCH_WEIGHT;
  const keywords = (gameplay.keywords?.length ?? 0) * KEYWORD_MATCH_WEIGHT;
  const unitTypes = (gameplay.unitTypes?.length ?? 0) * UNIT_TYPE_MATCH_WEIGHT;
  const actions = (gameplay.actions?.length ?? 0) * ACTION_MATCH_WEIGHT;
  return cardType + colors + power + keywords + unitTypes + actions;
}

/** Absolute score a candidate must reach for the given gameplay template. */
export function requiredMatchScore(gameplay: GameplayTemplate): number {
  return maxFlavorMatchScore(gameplay) * MATCH_SCORE_THRESHOLD;
}

export function matchRatio(score: number, gameplay: GameplayTemplate): number {
  const max = maxFlavorMatchScore(gameplay);
  if (max <= 0) return score >= 0 ? 1 : 0;
  return score / max;
}

export function passesMatchThreshold(score: number, gameplay: GameplayTemplate): boolean {
  return matchRatio(score, gameplay) >= MATCH_SCORE_THRESHOLD;
}

export function scoreFlavorTemplateDetailed(
  template: FlavorTemplate,
  gameplay: GameplayTemplate
): FlavorScoreBreakdown {
  const cardType =
    template.cardType === gameplay.cardType ? CARD_TYPE_MATCH_WEIGHT : 0;

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
    total: cardType + colors + power + keywords + unitTypes + actions,
    cardType,
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
  maxScore: number;
  ratio: number;
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

  const maxScore = maxFlavorMatchScore(gameplay);
  let best: RankedFlavor | null = null;
  for (const template of pool) {
    const breakdown = scoreFlavorTemplateDetailed(template, gameplay);
    if (!best || breakdown.total > best.score) {
      best = {
        template,
        score: breakdown.total,
        maxScore,
        ratio: matchRatio(breakdown.total, gameplay),
        breakdown,
      };
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
  if (best && passesMatchThreshold(best.score, gameplay)) {
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
