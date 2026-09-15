import { DayPeriod, type ScheduledActivity } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { scheduleActivity } from '../schedule';
import { getWeekDay, WEEK_DAYS } from '../time';

export interface ScheduleActivitiesParameters {
  activity: ScheduledActivity;
  date?: {
    day?: number;
    period?: DayPeriod;
  };
  recurrence?: {
    maxCount?: number;
    daysOfWeek?: number[];
    period?: DayPeriod;
  };
}

export function scheduleActivities(parameters: ScheduleActivitiesParameters): string {
  const { activity, date, recurrence } = parameters;
  const activities: ScheduledActivity[] = [];
  const startDay = gs.time.day + (date?.day ?? 0);
  const datePeriod = date?.period ?? DayPeriod.Evening;

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

function describeScheduledActivities(
  activities: ScheduledActivity[],
  daysOfWeek?: number[]
): string {
  if (activities.length === 0) {
    return 'No activities were scheduled.';
  }

  if (activities.length === 1) {
    return `You have scheduled an activity for day ${activities[0].day} at ${activities[0].period}.`;
  }

  const dayNames = daysOfWeek
    ?.map((dayOfWeek) => WEEK_DAYS[dayOfWeek - 1])
    .filter(Boolean)
    .join(', ');
  const period = activities[0].period;
  if (dayNames) {
    return `You have scheduled ${activities.length} activities on ${dayNames} ${period}s.`;
  }
  return `You have scheduled ${activities.length} activities at ${period}.`;
}
