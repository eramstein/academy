import type { Deck, Npc } from '../_model/model-game';
import { gs } from '../_state/main.svelte';
import { getRandomFromArray } from '../_utils/random';
import { initBattle } from '../battle/init';
import { setPossibleActions } from './actions';
import { recordLeagueMatchResult } from './league';
import { narrateText } from './narration';

export function pickNpcDeck(npcKey: string): Deck {
  return getRandomFromArray(gs.characters[npcKey].decks);
}

export async function initOngoingBattle(
  foe: Npc,
  deck: Deck,
  requestedFoeDeck?: Deck,
  isLeagueMatch: boolean = false
) {
  const foeDeck = requestedFoeDeck || pickNpcDeck(foe.key);
  gs.ongoingBattle = {
    opponentKey: foe.key,
    playerDeck: deck,
    opponentDeck: foeDeck,
    isLeagueMatch,
  };
  initBattle(foe.key, deck, foeDeck);
}

export function recordBattleResult(won: boolean) {
  if (!gs.ongoingBattle) {
    return;
  }
  if (gs.ongoingBattle.isLeagueMatch) {
    recordLeagueMatchResult(won);
  }
  gs.ongoingBattle = null;
  narrateText(`You have ${won ? 'won' : 'lost'} the match.`);
  setPossibleActions();
}
