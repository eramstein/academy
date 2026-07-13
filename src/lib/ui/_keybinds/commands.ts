import { cards } from '@/data';
import { config } from '../../_config';
import type { Card } from '../../_model';
import { bs } from '../../_state';
import { makeUnit, summonUnit } from '../../battle/unit';

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
    case 'get-card': {
      // /get-card <cardKey> [playerIndex]
      const [, cardKey, playerIndexStr] = parts;
      if (!cardKey) {
        return { ok: false, message: 'Usage: /get-card <cardKey> [playerIndex]' };
      }

      const cardTemplate = cards[cardKey];
      if (!cardTemplate) {
        return { ok: false, message: `Unknown card: ${cardKey}` };
      }

      const playerIndex = playerIndexStr === '1' || playerIndexStr === 'opponent' ? 1 : 0;

      if (!bs.players?.[playerIndex]) {
        return { ok: false, message: 'No active battle' };
      }

      const card: Card = {
        ...cardTemplate,
        ownerPlayerId: playerIndex,
        instanceId: crypto.randomUUID(),
        cost: 0,
        colors: [],
      } as Card;

      bs.players[playerIndex].hand.push(card);
      return {
        ok: true,
        message: `Added ${cardTemplate.name} to ${playerIndex === 1 ? "opponent's " : ''}hand`,
      };
    }

    case 'discard-hand': {
      // /discard-hand
      bs.players[1].hand = [];
      return { ok: true, message: `Discarded opponent's hand` };
    }

    case 'spawn': {
      // /spawn <cardKey> <row-column>
      const [, cardKey, posStr] = parts;
      if (!cardKey || !posStr) {
        return { ok: false, message: 'Usage: /spawn <cardKey> <row-column>' };
      }

      const cardTemplate = cards[cardKey];
      if (!cardTemplate) {
        return { ok: false, message: `Unknown card: ${cardKey}` };
      }

      const [rowStr, colStr] = posStr.split('-');
      const row = Number(rowStr);
      const column = Number(colStr);
      if (isNaN(row) || isNaN(column)) {
        return {
          ok: false,
          message: `Invalid position: ${posStr}. Expected format: row-column (e.g. 2-1)`,
        };
      }

      const position = { row, column };
      const ownerPlayerId = column < config.boardColumns / 2 ? 0 : 1;

      if (!bs.players?.[ownerPlayerId]) {
        return { ok: false, message: 'No active battle' };
      }

      const unit = makeUnit(ownerPlayerId, cardTemplate as Parameters<typeof makeUnit>[1]);
      summonUnit(unit, position);
      return { ok: true, message: `Spawned ${cardTemplate.name} at row ${row}, col ${column}` };
    }

    default:
      return { ok: false, message: `Unknown command: ${cmd}` };
  }
}
