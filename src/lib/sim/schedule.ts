import { ActivityType, DayPeriod, type ScheduledActivity } from '../_model';
import { isClassActivity } from '../_model/type-lookup-sim';
import { gs } from '../_state';
import { setPossibleActions } from './actions';
import { narrateText } from './narration';
import { setCurrentActivity } from './scene';
import { getNextPeriod } from './time';

const ACTIVITY_NARRATION: Record<ActivityType, string> = {
  [ActivityType.Class]: 'in class',
  [ActivityType.Work]: 'working',
  [ActivityType.Social]: 'socializing',
  [ActivityType.Date]: 'on a date',
  [ActivityType.Training]: 'training',
  [ActivityType.Study]: 'studying',
  [ActivityType.Romance]: 'romancing',
  [ActivityType.Tournament]: 'competing',
  [ActivityType.Exam]: 'taking an exam',
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function participantNames(activity: ScheduledActivity): string[] {
  return activity.participants
    .filter((key) => key !== gs.player.key)
    .map((key) => gs.characters[key]?.name ?? key)
    .filter(Boolean);
}

export function scheduleActivity(activity: ScheduledActivity): string {
  // immediate new activity
  if (activity.day === gs.time.day && activity.period === gs.time.period) {
    gs.scheduledActivities = gs.scheduledActivities.filter(
      (a) => a.day !== activity.day || a.period !== activity.period
    );
    gs.scheduledActivities.push(activity);
    setCurrentActivity(activity);
    setPossibleActions();
  } else {
    // scheduled activity
    gs.scheduledActivities.push(activity);
  }
  return `You have scheduled an activity for ${activity.day} at ${activity.period}.`;
}

export function getCurrentScheduledActivity() {
  return gs.scheduledActivities.find(
    (activity) => activity.day === gs.time.day && activity.period === gs.time.period
  );
}

/** Activity scheduled for the period the Wait action advances into. */
export function getNextPeriodScheduledActivity(): ScheduledActivity | undefined {
  const period = getNextPeriod();
  const day = gs.time.period === DayPeriod.Evening ? gs.time.day + 1 : gs.time.day;
  return gs.scheduledActivities.find(
    (activity) => activity.day === day && activity.period === period
  );
}

/** Short UI label, e.g. "Study with Molly" or "Artificery". */
export function formatActivityShortLabel(activity: ScheduledActivity): string {
  const others = participantNames(activity);
  const name = isClassActivity(activity)
    ? capitalize(activity.classType)
    : capitalize(activity.type);
  if (others.length === 0) return name;
  const withWhom =
    others.length === 1
      ? others[0]
      : `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}`;
  return `${name} with ${withWhom}`;
}

export function narrateScheduledActivity(activity: ScheduledActivity) {
  const others = participantNames(activity);
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
