import { BASE_DECK_BLACK, BASE_DECK_GREEN, BASE_DECK_RED } from '@/data/base-deck';
import { type CardTemplate, type Character, type Deck, SchoolName } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';

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
  // give other students a deck
  const otherStudents = Object.values(gs.characters).filter(
    (character) => character.school === SchoolName.Academy && character.key !== gs.player.key
  );
  otherStudents.forEach((student) => {
    const deck = getRandomFromArray([BASE_DECK_RED, BASE_DECK_BLACK, BASE_DECK_GREEN]);
    redeemBaseDeck(deck, student);
  });
}

export function addCardToDeck(deck: Deck, card: CardTemplate) {
  deck.cards.push(card);
}

function makeUniqueId(cardTemplate: CardTemplate): CardTemplate {
  return { ...cardTemplate, id: `${cardTemplate.id}-${crypto.randomUUID()}` };
}
