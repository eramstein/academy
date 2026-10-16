import { isLandCard, type CardTemplate, type Character } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getCardTemplatesByPoolKeys, getLoadedCardTemplate } from '../cards/npc-card-templates';
import { addCardToDeck, makeUniqueId } from '../deck';
import { narrateGiftCardChoice } from '../narration';

export interface OfferCardGiftsParameters {
  count: number;
  poolKeys: string[];
  specificCardKeys?: string[];
}

export function offerCardGifts(parameters: OfferCardGiftsParameters): string {
  const { count, poolKeys = [], specificCardKeys = [] } = parameters;

  if (typeof count !== 'number' || count < 1) {
    return `Invalid gift count: ${count}.`;
  }

  const hasSpecific = Array.isArray(specificCardKeys) && specificCardKeys.length > 0;
  const hasPool = Array.isArray(poolKeys) && poolKeys.length > 0;
  if (!hasSpecific && !hasPool) {
    return `Invalid gift sources: provide poolKeys and/or specificCardKeys.`;
  }

  const offered: CardTemplate[] = [];
  if (hasSpecific) {
    for (const key of specificCardKeys) {
      const card = getLoadedCardTemplate(key);
      if (!card) {
        return `Unknown gift card key: ${key}.`;
      }
      if (!offered.some((c) => c.id === card.id)) {
        offered.push(card);
      }
    }
  }

  if (offered.length < count && hasPool) {
    const pool = getCardTemplatesByPoolKeys(poolKeys).filter(
      (card) => !offered.some((o) => o.id === card.id)
    );
    if (pool.length === 0 && offered.length === 0) {
      return `No gift cards found for pool keys: ${poolKeys.join(', ')}.`;
    }
    const remaining = [...pool];
    const pickCount = Math.min(count - offered.length, remaining.length);
    for (let i = 0; i < pickCount; i++) {
      const card = getRandomFromArray(remaining);
      offered.push(card);
      remaining.splice(remaining.indexOf(card), 1);
    }
  }

  if (offered.length === 0) {
    return hasSpecific
      ? `No gift cards found for specific keys: ${specificCardKeys.join(', ')}.`
      : `No gift cards found for pool keys: ${poolKeys.join(', ')}.`;
  }

  const choices = offered.length > count ? offered.slice(0, count) : offered;
  narrateGiftCardChoice(choices, 'Choose a card.');
  return '';
}

/** Claim one offered gift into the player's collection. Returns the instance added. */
export function acceptGiftCard(template: CardTemplate): CardTemplate {
  const card = makeUniqueId(template);
  gs.player.collection.push(card);
  return card;
}

export interface GiftCardToCharacterParameters {
  characterKey: string;
  cardKey: string;
  /** When true (default), move a matching card from the player. When false, mint a new copy. */
  fromPlayer?: boolean;
}

/** Gives a card to a character — either transferred from the player or newly minted. */
export function giftCardToCharacter(parameters: GiftCardToCharacterParameters): string {
  const { characterKey, cardKey, fromPlayer = true } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (typeof cardKey !== 'string' || !cardKey.trim()) {
    return `Invalid card key: ${cardKey}.`;
  }

  let card: CardTemplate;
  if (fromPlayer) {
    const index = gs.player.collection.findIndex(
      (owned) => owned.id === cardKey || owned.id.startsWith(`${cardKey}-`)
    );
    if (index === -1) {
      return `You do not have ${cardKey} to give.`;
    }

    const [transferred] = gs.player.collection.splice(index, 1);
    for (const deck of gs.player.decks) {
      deck.cards = deck.cards.filter((id) => id !== transferred.id);
      deck.lands = deck.lands.filter((id) => id !== transferred.id);
    }
    card = transferred;
  } else {
    const template = getLoadedCardTemplate(cardKey);
    if (!template) {
      return `Unknown gift card key: ${cardKey}.`;
    }
    card = makeUniqueId(template);
  }

  character.collection.push(card);
  tryAddCardToCharacterDecks(character, card);

  return fromPlayer
    ? `You give ${card.name} to ${character.name}.`
    : `${character.name} receives ${card.name}.`;
}

function tryAddCardToCharacterDecks(character: Character, card: CardTemplate) {
  if (isLandCard(card)) return;
  const neededColors = new Set(card.colors.map((entry) => entry.color));
  for (const deck of character.decks) {
    const landColors = new Set(
      deck.lands
        .map((id) => character.collection.find((owned) => owned.id === id))
        .filter((land): land is CardTemplate => !!land)
        .flatMap((land) => land.colors.map((entry) => entry.color))
    );
    if ([...neededColors].every((color) => landColors.has(color))) {
      addCardToDeck(deck, card);
    }
  }
}
