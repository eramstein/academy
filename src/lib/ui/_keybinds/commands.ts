import { DayPeriod } from '../../_model';
import { bs, gs } from '../../_state';
import { scheduleClassesForCurrentTerm } from '../../sim/academy';
import { goToPeriod } from '../../sim/time';

const PERIODS = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

export interface CommandResult {
  ok: boolean;
  message: string;
}

export function executeCommand(input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { ok: false, message: 'Commands must start with /' };
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = parts[0];

  switch (cmd) {
    case 'discard-hand': {
      // /discard-hand
      bs.players[1].hand = [];
      return { ok: true, message: `Discarded opponent's hand` };
    }

    case 'day': {
      // /day <day number> <1|2|3>
      const day = parseInt(parts[1], 10);
      const periodIndex = parseInt(parts[2], 10);
      if (Number.isNaN(day) || ![1, 2, 3].includes(periodIndex)) {
        return { ok: false, message: 'Usage: /day <day number> <1|2|3>' };
      }
      const period = PERIODS[periodIndex - 1];
      gs.time.day = day;
      if (gs.scheduledActivities.length === 0) {
        scheduleClassesForCurrentTerm();
      }
      goToPeriod(day, period);
      return { ok: true, message: `Went to day ${day} ${period}` };
    }

    default:
      return { ok: false, message: `Unknown command: ${cmd}` };
  }
}
