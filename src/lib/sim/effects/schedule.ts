import { DayPeriod, type Schedule, type ScheduledActivity } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { scheduleActivity } from '../schedule';
import { getWeekDay, WEEK_DAYS } from '../time';

export interface ScheduleActivitiesParameters {
  activity: Omit<ScheduledActivity, 'day' | 'period'>;
  schedule?: Schedule;
}

const PERIOD_ORDER = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

/** Absolute day of the soonest free slot for `period` (skips the current period if already underway). */
export function findNextFreeDay(period: DayPeriod): number {
  let day = gs.time.day;
  if (PERIOD_ORDER.indexOf(gs.time.period) >= PERIOD_ORDER.indexOf(period)) {
    day += 1;
  }
  while (gs.scheduledActivities.some((a) => a.day === day && a.period === period)) {
    day += 1;
  }
  return day;
}

export function scheduleActivities(parameters: ScheduleActivitiesParameters): string {
  const { activity, schedule = {} } = parameters;
  const { date, recurrence, nextFree } = schedule;
  const activities: ScheduledActivity[] = [];
  // nextFree defaults to evening; otherwise omit period to schedule into the current slot.
  const datePeriod = date?.period ?? (nextFree ? DayPeriod.Evening : gs.time.period);
  const startDay = nextFree ? findNextFreeDay(datePeriod) : gs.time.day + (date?.day ?? 0);

  if (recurrence) {
    const maxCount = recurrence.maxCount ?? 24;
    const period = recurrence.period ?? datePeriod;
    const daysOfWeek = recurrence.daysOfWeek;
    const hasMatchingDays =
      !daysOfWeek || daysOfWeek.some((dayOfWeek) => dayOfWeek >= 1 && dayOfWeek <= 7);

    let day = startDay;
    while (hasMatchingDays && activities.length < maxCount) {
      if (!daysOfWeek || daysOfWeek.includes(getWeekDay(day))) {
        activities.push({
          ...activity,
          day,
          period,
        });
      }
      day += 1;
    }
  } else {
    activities.push({
      ...activity,
      day: startDay,
      period: datePeriod,
    });
  }

  for (const scheduled of activities) {
    scheduleActivity(scheduled);
  }

  return describeScheduledActivities(activities, recurrence?.daysOfWeek);
}

function resolvePlaceName(placeKey: string): string {
  return gs.places[placeKey]?.name ?? placeKey;
}

function resolveParticipantNames(participants: string[]): string {
  return participants
    .filter((key) => key !== gs.player.key)
    .map((key) => gs.characters[key]?.name ?? key)
    .filter(Boolean)
    .join(', ');
}

function describeActivityDetails(activity: ScheduledActivity): string {
  const place = resolvePlaceName(activity.placeKey);
  const withWhom = resolveParticipantNames(activity.participants);
  const parts = [`a ${activity.type} activity at ${place}`];
  if (withWhom) {
    parts.push(`with ${withWhom}`);
  }
  return parts.join(' ');
}

function describeDay(day: number): string {
  const delta = day - gs.time.day;
  if (delta === 0) return 'today';
  if (delta === 1) return 'tomorrow';
  return WEEK_DAYS[getWeekDay(day) - 1];
}

function describeScheduledActivities(
  activities: ScheduledActivity[],
  daysOfWeek?: number[]
): string {
  if (activities.length === 0) {
    return 'No activities were scheduled.';
  }

  const details = describeActivityDetails(activities[0]);

  if (activities.length === 1) {
    return `You have scheduled ${details} for ${describeDay(activities[0].day)} ${activities[0].period}.`;
  }

  const dayNames = daysOfWeek
    ?.map((dayOfWeek) => WEEK_DAYS[dayOfWeek - 1])
    .filter(Boolean)
    .join(', ');
  const period = activities[0].period;
  const countLabel = `${activities.length} ${activities[0].type} activities at ${resolvePlaceName(activities[0].placeKey)}`;
  const withWhom = resolveParticipantNames(activities[0].participants);
  const withClause = withWhom ? ` with ${withWhom}` : '';

  if (dayNames) {
    return `You have scheduled ${countLabel}${withClause} on ${dayNames} ${period}s.`;
  }
  return `You have scheduled ${countLabel}${withClause} at ${period}.`;
}
