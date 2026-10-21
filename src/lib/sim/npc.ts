import { ActivityType, DayPeriod, SchoolName, type NpcRoutine } from '../_model';
import { gs } from '../_state';
import { getRandomFromObjectWeights } from '../_utils/random';
import { getCurrentScheduledActivity } from './schedule';
import { getWeekDay, WEEK_DAYS } from './time';

const PERIOD_ORDER = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function isConsecutiveDays(days: number[]): boolean {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.length > 1 && sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
}

function formatRoutineDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  const names = sorted.map((d) => WEEK_DAYS[d - 1]);
  if (isConsecutiveDays(sorted)) {
    return `${names[0]} to ${names[names.length - 1]}`;
  }
  return joinList(names);
}

function formatRoutinePeriods(periods: DayPeriod[]): string {
  const sorted = [...periods].sort(
    (a, b) => PERIOD_ORDER.indexOf(a) - PERIOD_ORDER.indexOf(b)
  );
  return joinList(sorted);
}

/** e.g. "Emma studies in the library from Monday to Thursday evening." */
export function formatRoutineText(routine: NpcRoutine): string {
  const base = routine.description.replace(/\.\s*$/, '');
  const days = formatRoutineDays(routine.days);
  const periods = formatRoutinePeriods(routine.periods);
  const when = isConsecutiveDays(routine.days)
    ? `from ${days} ${periods}`
    : `on ${days} ${periods}`;
  return `${base} ${when}.`;
}

export function updateNpcLocations() {
  const currentScheduledActivity = getCurrentScheduledActivity();
  const weekDay = getWeekDay(gs.time.day);

  Object.values(gs.characters).forEach((character) => {
    if (character.key === gs.player.key) {
      return;
    }

    // 1. Scheduled activity (participant, or Academy student during class)
    if (
      currentScheduledActivity &&
      (currentScheduledActivity.participants.includes(character.key) ||
        (character.school === SchoolName.Academy &&
          currentScheduledActivity.type === ActivityType.Class))
    ) {
      character.placeKey = currentScheduledActivity.placeKey;
      return;
    }

    // 2. Routine for this weekday / period
    const routine = character.routines.find(
      (r) => r.days.includes(weekDay) && r.periods.includes(gs.time.period)
    );
    if (routine) {
      character.placeKey = routine.placeKey;
      return;
    }

    // 3. Favorite places fallback
    if (Object.keys(character.favoritePlaces).length > 0) {
      character.placeKey = getRandomFromObjectWeights(character.favoritePlaces);
    }
  });
}
