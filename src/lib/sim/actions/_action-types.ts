import type { Action } from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';

/**
 * Period caps keyed by free-form limit ids (e.g. socialize subtypes), not ActionType.
 * Chat is intentionally absent so it stays unlimited.
 */
export const ActionsLimitByPeriod: Record<string, number> = {
  hangout: 1,
};

/** Limit id to increment / check for this action, if any. */
export function actionLimitKey(action: Action): string | undefined {
  if (action.actionType === ActionType.Socialize) {
    const socializeType = action.actionParameters?.socializeType;
    if (typeof socializeType === 'string' && socializeType in ActionsLimitByPeriod) {
      return socializeType;
    }
  }
  return undefined;
}

export function isActionUnderPeriodLimit(action: Action): boolean {
  const key = actionLimitKey(action);
  if (!key) return true;
  return (gs.time.usedActions[key] ?? 0) < ActionsLimitByPeriod[key];
}

export function isLimitKeyAvailable(key: string): boolean {
  const limit = ActionsLimitByPeriod[key];
  if (limit === undefined) return true;
  return (gs.time.usedActions[key] ?? 0) < limit;
}
