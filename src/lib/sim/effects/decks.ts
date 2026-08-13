import { BASE_DECK_BLACK, BASE_DECK_RED, BASE_DECK_GREEN } from '@/data/base-deck';
import type { Deck } from '@/lib/_model';
import { gs } from '@/lib/_state';

export interface GetDeckParameters {
  deckKey: string;
}

export function getDeck(parameters: GetDeckParameters): string {
  let deck: Deck | undefined = undefined;
  if (parameters.deckKey === 'base_black') {
    deck = BASE_DECK_BLACK;
  } else if (parameters.deckKey === 'base_red') {
    deck = BASE_DECK_RED;
  } else if (parameters.deckKey === 'base_green') {
    deck = BASE_DECK_GREEN;
  }
  if (!deck) {
    return `Invalid deck key: ${parameters.deckKey}.`;
  }
  gs.player.decks.push(deck);
  return `You have received the deck: ${parameters.deckKey}.`;
}
