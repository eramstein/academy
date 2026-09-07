import { BASE_DECK_BLACK, BASE_DECK_GREEN, BASE_DECK_RED } from '@/data/base-deck';
import { CardColor, isUnitCard, type CardTemplate, type Deck, type UnitKeywords } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { redeemBaseDeck } from '../deck';

export interface GetDeckParameters {
  deckKey: string;
}

export function getDeck(parameters: GetDeckParameters): string {
  let deck: Deck | undefined = undefined;  
  // base decks unlock the color in crafting skills
  if (parameters.deckKey === 'base_black') {
    deck = BASE_DECK_BLACK;
    gs.player.craftingKnowledge.colors = {
      ...gs.player.craftingKnowledge.colors,
      [CardColor.Black]: 1,
    };
  } else if (parameters.deckKey === 'base_red') {
    deck = BASE_DECK_RED;
    gs.player.craftingKnowledge.colors = {
      ...gs.player.craftingKnowledge.colors,
      [CardColor.Red]: 1,
    };
  } else if (parameters.deckKey === 'base_green') {
    deck = BASE_DECK_GREEN;
    gs.player.craftingKnowledge.colors = {
      ...gs.player.craftingKnowledge.colors,
      [CardColor.Green]: 1,
    };
  }
  if (!deck) {
    return `Invalid deck key: ${parameters.deckKey}.`;
  }
  const learntKeywords = learnKeywordsFromDeck(deck.cards);
  redeemBaseDeck(deck, gs.player);
  if (learntKeywords.length) {
    return `You have received your first deck. You learnt ${learntKeywords.join(', ')}. Go and try it out!`;
  }
  return `You have received your first deck. Go and try it out!`;
}

function learnKeywordsFromDeck(cards: CardTemplate[]): string[] {
  const known = gs.player.craftingKnowledge.keywords ?? {};
  const learntKeywords: string[] = [];

  for (const card of cards) {
    if (!isUnitCard(card) || !card.keywords) continue;
    for (const [keyword, value] of Object.entries(card.keywords) as [
      keyof UnitKeywords,
      boolean | number | undefined,
    ][]) {
      if (!value || known[keyword] !== undefined || learntKeywords.includes(keyword)) continue;
      learntKeywords.push(keyword);
    }
  }

  if (learntKeywords.length) {
    if (!gs.player.craftingKnowledge.keywords) {
      gs.player.craftingKnowledge.keywords = {};
    }
    for (const keyword of learntKeywords) {
      gs.player.craftingKnowledge.keywords[keyword as keyof UnitKeywords] = 1;
    }
  }

  return learntKeywords;
}