import { BASE_DECK_BLACK, BASE_DECK_GREEN, BASE_DECK_RED } from '@/data/base-deck';
import { CardColor, type CardTemplate, type Character, type Deck, SchoolName } from '../_model';
import { gs } from '../_state';
import { learnKeywordsFromDeck } from './effects/decks';

const BASE_DECKS_BY_COLOR: Partial<Record<CardColor, Deck>> = {
  [CardColor.Red]: BASE_DECK_RED,
  [CardColor.Black]: BASE_DECK_BLACK,
  [CardColor.Green]: BASE_DECK_GREEN,
};

export function redeemBaseDeck(baseDeck: Deck, character: Character) {
  const cardsWithIds = baseDeck.cards.map(makeUniqueId);
  const landsWithIds = baseDeck.lands.map(makeUniqueId);
  character.collection.push(...cardsWithIds);
  character.collection.push(...landsWithIds);
  character.decks.push({
    key: baseDeck.key,
    name: baseDeck.name,
    cards: cardsWithIds,
    lands: landsWithIds,
  });
}

export function initNpcDecks() {
  // give other students a deck matching their favorite color
  const otherStudents = Object.values(gs.characters).filter(
    (character) => character.school === SchoolName.Academy && character.key !== gs.player.key
  );
  otherStudents.forEach((student) => {
    const deck = student.favoriteColors
      .map((color) => BASE_DECKS_BY_COLOR[color])
      .find((baseDeck) => baseDeck !== undefined);
    if (deck) {
      redeemBaseDeck(deck, student);
      student.craftingKnowledge.colors = {
        ...student.craftingKnowledge.colors,
        ...Object.fromEntries(student.favoriteColors.map((color) => [color, 1])),
      };
      learnKeywordsFromDeck(deck.cards, student.key);
    }
  });
}

export function addCardToDeck(deck: Deck, card: CardTemplate) {
  deck.cards.push(card);
}

function makeUniqueId(cardTemplate: CardTemplate): CardTemplate {
  return { ...cardTemplate, id: `${cardTemplate.id}-${crypto.randomUUID()}` };
}
