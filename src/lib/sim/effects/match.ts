import { gs } from '@/lib/_state';
import { initOngoingBattle, pickNpcDeck } from '../ongoing-battle';
import { resolvePlayerDeck } from '../actions/match';

export interface StartMatchParameters {
  opponentKey: string;
  /** Player deck index or `deck.key`. Defaults to the first player deck. */
  playerDeckKey?: string;
  /** When true, counts as a league match. Event story matches leave this false. */
  isLeagueMatch?: boolean;
}

/** Begin a battle from an event option. Pair with `nextNode` to resume after the fight. */
export function startMatch(parameters: StartMatchParameters): string {
  const { opponentKey, playerDeckKey, isLeagueMatch = false } = parameters;
  const foe = gs.characters[opponentKey];
  if (!foe) {
    return `Invalid opponent key: ${opponentKey}.`;
  }
  const playerDeck = playerDeckKey ? resolvePlayerDeck(playerDeckKey) : gs.player.decks[0];
  if (!playerDeck) {
    return 'Missing player deck.';
  }
  const opponentDeck = pickNpcDeck(opponentKey);
  if (!opponentDeck) {
    return `Missing deck for ${foe.name}.`;
  }
  initOngoingBattle(foe, playerDeck, opponentDeck, isLeagueMatch);
  return `You have started a match with ${foe.name}.`;
}
