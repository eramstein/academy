import type { CardCreationParameters } from '../actions';
import type { FlavorTemplate } from './flavor-generation-pipeline/types';
import { toGameplayTemplate } from './flavor-generation-pipeline/types';
import {
  eligibleFlavorPool,
  findMatchingFlavor,
  scoreFlavorTemplate,
} from './flavor-generation-pipeline/match';

/**
 * @deprecated Prefer findMatchingFlavor / resolveFlavorTemplate.
 * Kept for callers that still pass CardCreationParameters: returns best matches at max score
 * (legacy tie behavior). New pipeline uses threshold matching in match.ts.
 */
export function filterFlavorTemplates(
  templates: FlavorTemplate[],
  parameters: CardCreationParameters
): FlavorTemplate[] {
  const gameplay = toGameplayTemplate(parameters);
  const pool = eligibleFlavorPool(templates, gameplay);

  let highestScore = 0;
  const scored = pool.map((template) => {
    const score = scoreFlavorTemplate(template, gameplay);
    if (score > highestScore) {
      highestScore = score;
    }
    return { template, score };
  });

  return scored.filter(({ score }) => score === highestScore).map(({ template }) => template);
}

export { findMatchingFlavor, scoreFlavorTemplate };
