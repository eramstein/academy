import { BASE_DECK_BLACK, BASE_DECK_BLUE, BASE_DECK_GREEN, BASE_DECK_RED } from '@/data/base-deck';
import { type DeckBlueprint, type UnitKeywords } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getActionTemplateMeta } from '../cards/action-templates';
import { formatKeywordLabel } from '../cards/keywords';
import { getActingCharacter } from '../characters';
import { redeemBaseDeck } from '../deck';

export interface GetDeckParameters {
  deckKey: string;
}

export function getDeck(parameters: GetDeckParameters): string {
  let deck: DeckBlueprint | undefined = undefined;
  // base decks unlock the color in crafting skills
  if (parameters.deckKey === 'base_black') {
    deck = BASE_DECK_BLACK;
  } else if (parameters.deckKey === 'base_red') {
    deck = BASE_DECK_RED;
  } else if (parameters.deckKey === 'base_green') {
    deck = BASE_DECK_GREEN;
  } else if (parameters.deckKey === 'base_blue') {
    deck = BASE_DECK_BLUE;
  }
  if (!deck) {
    return `Invalid deck key: ${parameters.deckKey}.`;
  }
  const learnt = learnFromDeck(deck);
  redeemBaseDeck(deck, gs.player);
  if (learnt.length) {
    return `You have received your first deck. You learnt ${learnt.join(', ')}. Go and try it out!`;
  }
  return `You have received your first deck. Go and try it out!`;
}

export function learnFromDeck(deck: DeckBlueprint, characterKey = 'player'): string[] {
  const character = getActingCharacter(characterKey);
  const knownKeywords = character.craftingKnowledge.keywords ?? {};
  const knownActions = character.craftingKnowledge.actions ?? {};

  const learntKeywords = deck.learntKeywords.filter(
    (keyword) => knownKeywords[keyword as keyof UnitKeywords] === undefined
  );
  const learntActions = deck.learntActions.filter(
    (actionName) => knownActions[actionName] === undefined
  );

  if (learntKeywords.length) {
    if (!character.craftingKnowledge.keywords) {
      character.craftingKnowledge.keywords = {};
    }
    for (const keyword of learntKeywords) {
      character.craftingKnowledge.keywords[keyword as keyof UnitKeywords] = 2;
    }
  }

  if (learntActions.length) {
    if (!character.craftingKnowledge.actions) {
      character.craftingKnowledge.actions = {};
    }
    for (const actionName of learntActions) {
      character.craftingKnowledge.actions[actionName] = 2;
    }
  }

  return [
    ...learntKeywords.map((keyword) => formatKeywordLabel(keyword)),
    ...learntActions.map((name) => getActionTemplateMeta(name)?.label ?? formatKeywordLabel(name)),
  ];
}
