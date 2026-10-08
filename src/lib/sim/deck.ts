import { BASE_DECK_BLACK, BASE_DECK_BLUE, BASE_DECK_GREEN, BASE_DECK_RED } from '@/data/base-deck';
import {
  CardColor,
  type CardTemplate,
  type Character,
  type Deck,
  type DeckBlueprint,
  SchoolName,
} from '../_model';
import { gs } from '../_state';
import { learnFromDeck } from './effects/decks';

const BASE_DECKS_BY_COLOR: Partial<Record<CardColor, DeckBlueprint>> = {
  [CardColor.Red]: BASE_DECK_RED,
  [CardColor.Black]: BASE_DECK_BLACK,
  [CardColor.Green]: BASE_DECK_GREEN,
  [CardColor.Blue]: BASE_DECK_BLUE,
};

export function redeemBaseDeck(baseDeck: DeckBlueprint, character: Character) {
  const cardsWithIds = baseDeck.cards.map((template) => claimDeckCard(template, character));
  const landsWithIds = baseDeck.lands.map((template) => claimDeckCard(template, character));
  character.decks.push({
    key: baseDeck.key,
    name: baseDeck.name,
    cards: cardsWithIds.map((c) => c.id),
    lands: landsWithIds.map((c) => c.id),
  });
}

/** Reuse an owned copy by name; otherwise mint and add to the collection. */
function claimDeckCard(template: CardTemplate, character: Character): CardTemplate {
  const existing = character.collection.find((card) => card.name === template.name);
  if (existing) {
    return existing;
  }
  const card = makeUniqueId(template);
  character.collection.push(card);
  return card;
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
      learnFromDeck(deck, student.key);
    }
  });
}

export function addCardToDeck(deck: Deck, card: CardTemplate) {
  if (!deck.cards.includes(card.id)) {
    deck.cards.push(card.id);
  }
}

export function resolveDeckCards(ids: string[], collection: CardTemplate[]): CardTemplate[] {
  return ids.map((id) => {
    const card = collection.find((c) => c.id === id);
    if (!card) {
      throw new Error(`Card ${id} not found in collection`);
    }
    return card;
  });
}

export function makeUniqueId(cardTemplate: CardTemplate): CardTemplate {
  return { ...cardTemplate, id: `${cardTemplate.id}-${crypto.randomUUID()}` };
}
