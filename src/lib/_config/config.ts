import { DayPeriod } from '../_model/enums-sim';

export const config = {
  // sim
  startDate: '1993-04-01',
  startDayPeriod: DayPeriod.Afternoon,
  // battle
  initialMana: 2,
  initialHandSize: 7,
  initialLife: 10,
  boardRows: 4,
  boardColumns: 4,
  aiActionInterval: 1000,
};
