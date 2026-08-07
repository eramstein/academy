import type { ScheduledActivity } from '../_model';
import { gs } from '../_state';

export function scheduleActivity(activity: ScheduledActivity) {
  gs.scheduledActivities.push(activity);
}

export function getCurrentScheduledActivity() {
  return gs.scheduledActivities.find(
    (activity) => activity.day === gs.time.day && activity.period === gs.time.period
  );
}
