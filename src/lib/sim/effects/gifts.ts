import type { CardTemplate } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import {
  getCardTemplatesByPoolKeys,
  getLoadedCardTemplate,
} from '../cards/npc-card-templates';
import { makeUniqueId } from '../deck';
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
