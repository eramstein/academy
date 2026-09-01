import { ActivityType } from './enums-sim';
import type { ClassActivity, ScheduledActivity } from './model-sim';

export function isClassActivity(activity: ScheduledActivity): activity is ClassActivity {
  return activity.type === ActivityType.Class;
}
