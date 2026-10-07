import type { CardTemplate } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getCardTemplatesByPoolKeys } from '../cards/npc-card-templates';
import { makeUniqueId } from '../deck';
import { narrateGiftCardChoice } from '../narration';

export interface OfferCardGiftsParameters {
  count: number;
  poolKeys: string[];
}

export function offerCardGifts(parameters: OfferCardGiftsParameters): string {
  const { count, poolKeys = [] } = parameters;

  if (!Array.isArray(poolKeys) || poolKeys.length === 0) {
    return `Invalid pool keys: none provided.`;
  }
  if (typeof count !== 'number' || count < 1) {
    return `Invalid gift count: ${count}.`;
  }

  const pool = getCardTemplatesByPoolKeys(poolKeys);
  if (pool.length === 0) {
    return `No gift cards found for pool keys: ${poolKeys.join(', ')}.`;
  }

  const offered: CardTemplate[] = [];
  const remaining = [...pool];
  const pickCount = Math.min(count, remaining.length);
  for (let i = 0; i < pickCount; i++) {
    const card = getRandomFromArray(remaining);
    offered.push(card);
    remaining.splice(remaining.indexOf(card), 1);
  }

  narrateGiftCardChoice(offered, 'Choose a card.');
  return '';
}

/** Claim one offered gift into the player's collection. Returns the instance added. */
export function acceptGiftCard(template: CardTemplate): CardTemplate {
  const card = makeUniqueId(template);
  gs.player.collection.push(card);
  return card;
}
