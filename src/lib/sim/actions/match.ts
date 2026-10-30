import { ActionType, type Action } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { startGuardianMatch } from '../guardians';
import { getPossibleLeagueOpponents } from '../league';
import { initOngoingBattle, pickNpcDeck } from '../ongoing-battle';
import { isWeekDay } from '../time';

export interface StartMatchParameters {
  playerDeckKey: string;
  opponentKey: string;
  /** When set, challenge that place's guardian instead of an NPC. */
  placeKey?: string;
}

export function startMatch(parameters: StartMatchParameters): string {
  const playerDeck = resolvePlayerDeck(parameters.playerDeckKey);
  if (!playerDeck) {
    return 'Missing deck.';
  }
  if (parameters.placeKey) {
    return startGuardianMatch(parameters.placeKey, playerDeck);
  }
  const opponentDeck = pickNpcDeck(parameters.opponentKey);
  if (!opponentDeck) {
    return 'Missing deck.';
  }
  initOngoingBattle(gs.characters[parameters.opponentKey], playerDeck, opponentDeck, true);
  return `You have started a match with ${gs.characters[parameters.opponentKey].name}.`;
}

/** Option value for a player deck — index-based so duplicate deck.keys still pick correctly. */
export function playerDeckOptions(): [string, string][] {
  return gs.player.decks.map((deck, index) => [String(index), deck.name]);
}

export function resolvePlayerDeck(playerDeckKey: string) {
  const index = Number(playerDeckKey);
  if (Number.isInteger(index) && index >= 0 && index < gs.player.decks.length) {
    return gs.player.decks[index];
  }
  return gs.player.decks.find((deck) => deck.key === playerDeckKey);
}

export function getLeagueMatchActions(): Action[] {
  if (gs.league.playedToday || !gs.league.season || !isWeekDay(gs.time.day)) {
    return [];
  }
  const opponents = getPossibleLeagueOpponents();
  const decks = playerDeckOptions();
  if (!opponents.length || !decks.length) {
    return [];
  }
  return [
    {
      label: 'Play League Match',
      actionType: ActionType.StartMatch,
      isLongAction: false,
      actionParameters: {},
      missingParameters: {
        opponentKey: opponents.map((c) => [c.key, c.name]),
        playerDeckKey: decks,
      },
    },
  ];
}
