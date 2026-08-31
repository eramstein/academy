import { BASE_DECK_BLACK, BASE_DECK_RED, BASE_DECK_GREEN } from '@/data/base-deck';
import { gs } from '@/lib/_state';
import { redeemBaseDeck } from '../deck';
import { type Deck } from '@/lib/_model';

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
  redeemBaseDeck(deck, gs.player);
  return `You have received your first deck. Go and try it out!`;
}
