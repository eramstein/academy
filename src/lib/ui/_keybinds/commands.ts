import { DayPeriod, ResourceType } from '../../_model';
import { bs, gs } from '../../_state';
import { scheduleClassesForCurrentTerm } from '../../sim/academy';
import { addResource } from '../../sim/effects/resources';
import { simulateEvent } from '../../sim/events';
import { goToPeriod } from '../../sim/time';

const PERIODS = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

function resolveResource(token: string): ResourceType | undefined {
  const key = token.toLowerCase();
  const types = Object.values(ResourceType);
  return types.find((type) => type === key || type.split('_').at(-1) === key);
}

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

    case 'e': {
      // /e <event-key>
      const eventKey = parts[1];
      if (!eventKey) {
        return { ok: false, message: 'Usage: /e <event-key>' };
      }
      const event = simulateEvent(eventKey);
      if (!event) {
        return { ok: false, message: `Event not found: ${eventKey}` };
      }
      return { ok: true, message: `Simulated event ${eventKey}` };
    }

    case 'res': {
      // /res <dust|mithril|moxes> <amount>
      const resourceType = parts[1] ? resolveResource(parts[1]) : undefined;
      const amount = parseInt(parts[2], 10);
      if (!resourceType || Number.isNaN(amount)) {
        return { ok: false, message: 'Usage: /res <dust|mithril|moxes> <amount>' };
      }
      const message = addResource({ resourceType, amount });
      return { ok: true, message };
    }

    default:
      return { ok: false, message: `Unknown command: ${cmd}` };
  }
}
