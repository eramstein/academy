import { config } from '@/lib/_config/config';
import { ActionDuration } from '@/lib/_model';
import { gs } from '@/lib/_state';

export function wait(): string {
  // Exhaust short/long budgets; Wait itself is Instant so performAction won't bump them again
  gs.time.usedActions = {
    ...gs.time.usedActions,
    [ActionDuration.Short]: config.shortActionsPerScene,
    [ActionDuration.Long]: config.longActionsPerScene,
  };
  return `You wait for now.`;
}
