import type { InteractionTemplate, InteractionValue, InteractionValueOutcome } from './types';

const NUDGE = 2;

export function thresholdMet(value: number, threshold: string): boolean {
  const match = threshold.trim().match(/^(>=|<=|>|<|==|=)\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return false;
  const target = Number(match[2]);
  switch (match[1]) {
    case '>':
      return value > target;
    case '<':
      return value < target;
    case '>=':
      return value >= target;
    case '<=':
      return value <= target;
    default:
      return value === target;
  }
}

export function nearestBand(bands: Record<number, string>, current: number): string {
  let bestAt = Number.NaN;
  let bestLabel = '';
  for (const [raw, label] of Object.entries(bands)) {
    const at = Number(raw);
    if (!Number.isFinite(at) || !label) continue;
    if (!bestLabel) {
      bestAt = at;
      bestLabel = label;
      continue;
    }
    const nextDistance = Math.abs(at - current);
    const bestDistance = Math.abs(bestAt - current);
    if (nextDistance < bestDistance || (nextDistance === bestDistance && at > bestAt)) {
      bestAt = at;
      bestLabel = label;
    }
  }
  return bestLabel || String(current);
}

export interface CrossedOutcome {
  key: string;
  effect: string;
}

/** Outcome whose threshold was false before this beat and true after. */
export function crossedOutcome(
  values: InteractionValue[],
  previous: Record<string, number>,
  next: Record<string, number>
): CrossedOutcome | undefined {
  for (const value of values) {
    const before = previous[value.key] ?? value.initial;
    const after = next[value.key] ?? before;
    for (const outcome of value.outcomes ?? []) {
      if (!thresholdMet(before, outcome.threshold) && thresholdMet(after, outcome.threshold)) {
        return { key: value.key, effect: outcome.effect };
      }
    }
  }
  return undefined;
}

/** Outcome that the chosen deltas alone would cross, before the model replies. */
export function predictedOutcome(
  values: InteractionValue[],
  previous: Record<string, number>,
  deltas?: Record<string, number>
): CrossedOutcome | undefined {
  if (!deltas) return undefined;
  const expected: Record<string, number> = {};
  for (const value of values) {
    const before = previous[value.key] ?? value.initial;
    expected[value.key] = before + (deltas[value.key] ?? 0);
  }
  return crossedOutcome(values, previous, expected);
}

/** After an outcome fires, that value returns to 0. */
export function applyOutcomeReset(
  values: Record<string, number>,
  outcome: CrossedOutcome
): Record<string, number> {
  return { ...values, [outcome.key]: 0 };
}

/**
 * Prefer the model's new totals when they stay near the chosen deltas.
 * A jump is kept when it is what crosses an outcome threshold.
 */
export function resolveNextValues(
  template: InteractionTemplate,
  previous: Record<string, number>,
  reported: Record<string, number>,
  deltas?: Record<string, number>
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const value of template.values) {
    const before = previous[value.key] ?? value.initial;
    const expected = before + (deltas?.[value.key] ?? 0);
    const given = reported[value.key];
    if (typeof given !== 'number' || !Number.isFinite(given)) {
      next[value.key] = expected;
      continue;
    }
    const rounded = Math.round(given);
    // Opening beat has no chosen deltas: ignore a leap that would end the scene.
    const crosses =
      deltas !== undefined &&
      (value.outcomes ?? []).some((outcome) => newlyMet(before, rounded, outcome));
    next[value.key] = crosses || Math.abs(rounded - expected) <= NUDGE ? rounded : expected;
  }
  return next;
}

function newlyMet(before: number, after: number, outcome: InteractionValueOutcome): boolean {
  return !thresholdMet(before, outcome.threshold) && thresholdMet(after, outcome.threshold);
}
