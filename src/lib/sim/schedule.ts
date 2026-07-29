import type { ScheduledActivity } from '../_model';
import { gs } from '../_state';

export function scheduleActivity(activity: ScheduledActivity) {
  gs.scheduledActivities.push(activity);
}
