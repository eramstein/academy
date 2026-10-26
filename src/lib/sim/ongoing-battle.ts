import type { Deck, Npc } from '../_model';
import { bs } from '../_state';
import { gs } from '../_state/main.svelte';
import { getRandomFromArray } from '../_utils/random';
import { initBattle } from '../battle/init';
import { getHumanPlayer } from '../battle/player';
import { setPossibleActions } from './actions';
import { gainCraftingKnowledgeFromPlayedCards } from './cards/battle-knowledge';
import { recordLeagueMatchResult } from './league';
import { narrateCraftingKnowledgeGain, narrateMatchResult } from './narration';

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
  gs.scene.lastMatchWon = won;
  if (gs.ongoingBattle.isLeagueMatch) {
    recordLeagueMatchResult(won);
  }
  narrateMatchResult(won, gs.ongoingBattle.opponentKey);
  if (bs.players.length > 0) {
    const gain = gainCraftingKnowledgeFromPlayedCards(
      gs.player,
      getHumanPlayer().playedCards ?? []
    );
    if (gain) {
      narrateCraftingKnowledgeGain(gain);
    }
  }
  // Keep ongoingBattle until the victory modal dismisses so Main stays on Battle.
  if (gs.ongoingBattle.resume) {
    gs.scene.pendingEventResume = gs.ongoingBattle.resume;
  }
  if (gs.ongoingBattle.resumeFollowUps?.length) {
    gs.scene.pendingFollowUpEvents = gs.ongoingBattle.resumeFollowUps;
  }
  if (gs.ongoingBattle.resume || gs.ongoingBattle.resumeFollowUps?.length) {
    return;
  }
  setPossibleActions();
}
