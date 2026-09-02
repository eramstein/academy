import type { UnitKeywords } from "@/lib/_model";
import type { ConjurationParameters } from "../actions";
import type { ConjurationTemplate } from "./conjuration-templates";


const COLOR_MATCH_WEIGHT = 3;
const COST_EXACT_MATCH_WEIGHT = 3;
const COST_NEAR_MATCH_WEIGHT = 1;
const DEFAULT_MATCH_WEIGHT = 1;

export function filterConjurationTemplates(templates: ConjurationTemplate[], parameters: ConjurationParameters): ConjurationTemplate[] {
  let highestScore = 0;
  const scored = templates.map(template => {
    const score = scoreConjurationTemplate(template, parameters);
    if (score > highestScore) {
      highestScore = score;
    }
    return { template, score };
  });

  return scored
    .filter(({ score }) => score === highestScore)
    .map(({ template }) => template);
}

function scoreConjurationTemplate(template: ConjurationTemplate, parameters: ConjurationParameters): number {
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
        score += DEFAULT_MATCH_WEIGHT;
      }
    }
  }

  return score;
}