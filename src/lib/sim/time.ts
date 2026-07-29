import { gs } from '../_state/main.svelte';

export function passTime(minutes: number): void {
  gs.time.minute += minutes;
  if (gs.time.minute >= 60) {
    gs.time.hour++;
    gs.time.minute -= 60;
  }
  if (gs.time.hour >= 24) {
    gs.time.day++;
    gs.time.hour -= 24;
  }
}

// assumes day 1 is monday, returns 1 for monday, 2 for tuesday... 7 for sunday
export function getWeekDay(day: number): number {
  return ((day - 1) % 7) + 1;
}
