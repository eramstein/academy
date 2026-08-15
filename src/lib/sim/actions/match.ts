import { ActionDuration, ActionType, DayPeriod, type Action, type Deck } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { initBattle } from '@/lib/battle';
import { getPossibleLeagueOpponents } from '../league';
import { isWeekDay } from '../time';

export interface StartMatchParameters {
  playerDeckKey: string;
  opponentKey: string;
}

export function startMatch(parameters: StartMatchParameters): string {
  const playerDeck = gs.player.decks.find((deck) => deck.key === parameters.playerDeckKey);
  const opponentDeck = gs.characters[parameters.opponentKey].decks[0];
  if (!playerDeck || !opponentDeck) {
    return 'Missing deck.';
  }
  gs.ongoingBattle = {
    playerDeck: playerDeck,
    opponentDeck: opponentDeck,
    opponentKey: parameters.opponentKey,
  };
  initBattle(parameters.opponentKey, playerDeck, opponentDeck);
  return `You have started a match with ${gs.characters[parameters.opponentKey].name}.`;
}

export function getLeagueMatchActions(): Action[] {
  // matches after class
  if (!(gs.time.period === DayPeriod.Afternoon) || !isWeekDay(gs.time.day)) {
    return [];
  }
  const opponents = getPossibleLeagueOpponents();
  if (!opponents.length) {
    return [];
  }
  return [
    {
      label: 'Play League Match',
      actionType: ActionType.StartMatch,
      duration: ActionDuration.Instant,
      actionParameters: {},
      missingParameters: {
        opponentKey: opponents.map((c) => [c.key, c.name]),
        playerDeckKey: gs.player.decks.map((d) => [d.key, d.name]),
      },
    },
  ];
}
