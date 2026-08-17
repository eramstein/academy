import { ActionDuration, ActionType, DayPeriod, type Action, type Deck } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getPossibleLeagueOpponents } from '../league';
import { isWeekDay } from '../time';
import { initOngoingBattle, pickNpcDeck } from '../ongoing-battle';

export interface StartMatchParameters {
  playerDeckKey: string;
  opponentKey: string;
}

export function startMatch(parameters: StartMatchParameters): string {
  const playerDeck = gs.player.decks.find((deck) => deck.key === parameters.playerDeckKey);
  const opponentDeck = pickNpcDeck(parameters.opponentKey);
  if (!playerDeck || !opponentDeck) {
    return 'Missing deck.';
  }
  initOngoingBattle(gs.characters[parameters.opponentKey], playerDeck, opponentDeck, true);
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
