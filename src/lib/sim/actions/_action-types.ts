import { ActionType } from '@/lib/_model/enums-sim';

export const ActionsLimitByPeriod: Partial<Record<ActionType, number>> = {
  [ActionType.Socialize]: 1,
};
