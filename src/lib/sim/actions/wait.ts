import { config } from '@/lib/_config/config';
import { ActionDuration } from '@/lib/_model';
import { gs } from '@/lib/_state';

export function wait(): string {
  // eaxhaust all available time
  gs.time.usedActions[ActionDuration.Short] = config.shortActionsPerScene;
  gs.time.usedActions[ActionDuration.Long] = config.longActionsPerScene;
  return `You wait for now.`;
}
