import { ActionDuration, DayPeriod } from '../_model';
import { gs } from '../_state';
import { narrateText } from './narration';

const PERIODS = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// assumes day 1 is monday, returns 1 for monday, 2 for tuesday... 7 for sunday
export function getWeekDay(day: number): number {
  return ((day - 1) % 7) + 1;
}

export function nextPeriod() {
  const index = PERIODS.indexOf(gs.time.period);
  if (index === PERIODS.length - 1) {
    gs.time.period = DayPeriod.Morning;
    gs.time.day += 1;
  } else {
    gs.time.period = PERIODS[index + 1];
  }
  gs.time.usedActions = {
    [ActionDuration.Short]: 0,
    [ActionDuration.Long]: 0,
    [ActionDuration.Instant]: 0,
  };
  narrateText('It is now ' + WEEK_DAYS[getWeekDay(gs.time.day) - 1] + ' ' + gs.time.period + '.');
}

export function isWeekDay(day: number): boolean {
  return getWeekDay(day) < 6;
}
