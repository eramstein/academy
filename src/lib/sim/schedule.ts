import { ActivityType, type ScheduledActivity } from '../_model';
import { gs } from '../_state';
import { narrateText } from './narration';

const ACTIVITY_NARRATION: Record<ActivityType, string> = {
  [ActivityType.Class]: 'in class',
  [ActivityType.Work]: 'working',
  [ActivityType.Social]: 'socializing',
  [ActivityType.Date]: 'on a date',
  [ActivityType.Training]: 'training',
  [ActivityType.Study]: 'studying',
};

export function scheduleActivity(activity: ScheduledActivity): string {
  gs.scheduledActivities.push(activity);
  return `You have scheduled an activity for ${activity.day} at ${activity.period}.`;
}

export function getCurrentScheduledActivity() {
  return gs.scheduledActivities.find(
    (activity) => activity.day === gs.time.day && activity.period === gs.time.period
  );
}

export function narrateScheduledActivity(activity: ScheduledActivity) {
  const others = activity.participants
    .filter((key) => key !== gs.player.key)
    .map((key) => gs.characters[key]?.name ?? key)
    .filter(Boolean);
  const phrase = ACTIVITY_NARRATION[activity.type] ?? activity.type;
  if (others.length === 0) {
    narrateText(`You are ${phrase}.`);
    return;
  }
  const withWhom =
    others.length === 1
      ? others[0]
      : `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}`;
  narrateText(`You are ${phrase} with ${withWhom}.`);
}
