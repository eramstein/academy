import { BASE_DECK_BLACK, BASE_DECK_RED, BASE_DECK_GREEN } from '@/data/base-deck';
import { gs } from '@/lib/_state';
import { redeemBaseDeck } from '../deck';
import { CardColor, type Deck } from '@/lib/_model';

export interface GetDeckParameters {
  deckKey: string;
}

export function getDeck(parameters: GetDeckParameters): string {
  let deck: Deck | undefined = undefined;
  // base decks unlock the color in crafting skills
  if (parameters.deckKey === 'base_black') {
    deck = BASE_DECK_BLACK;
    gs.player.cardCrafting.colors = { ...gs.player.cardCrafting.colors, [CardColor.Black]: 1 };
  } else if (parameters.deckKey === 'base_red') {
    deck = BASE_DECK_RED;
    gs.player.cardCrafting.colors = { ...gs.player.cardCrafting.colors, [CardColor.Red]: 1 };
  } else if (parameters.deckKey === 'base_green') {
    deck = BASE_DECK_GREEN;
    gs.player.cardCrafting.colors = { ...gs.player.cardCrafting.colors, [CardColor.Green]: 1 };
  }
  if (!deck) {
    return `Invalid deck key: ${parameters.deckKey}.`;
  }
  redeemBaseDeck(deck, gs.player);
  return `You have received your first deck. Go and try it out!`;
}
