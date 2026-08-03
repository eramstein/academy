// assumes day 1 is monday, returns 1 for monday, 2 for tuesday... 7 for sunday
export function getWeekDay(day: number): number {
  return ((day - 1) % 7) + 1;
}
