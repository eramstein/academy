import type { Action, CardTemplate } from '@/lib/_model';
import { ActionType, ActivityType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getRandomFromArray } from '@/lib/_utils/random';
import { getCardTemplatesByPoolKeys, getLoadedCardTemplate } from '../cards/npc-card-templates';
import { makeUniqueId } from '../deck';
import { getCurrentScheduledActivity } from '../schedule';

const OFFER_COUNT = 5;

export interface TradeCardsParameters {
  characterKey: string;
  /** Catalog id of the card the player receives. */
  receiveCardId: string;
  /** Collection instance id of the card the player gives. */
  giveCardId: string;
}

function isPlayerParticipant(key: string): boolean {
  return key === gs.player.key || key === 'player';
}

function seasonPools(): string[] {
  return gs.time.year === 1 ? ['base'] : ['base', 'extended'];
}

/** A collection card that carries poolKeys and is not in any deck. */
function getTradeablePlayerCards(): CardTemplate[] {
  const used = new Set<string>();
  for (const deck of gs.player.decks) {
    for (const id of deck.cards) used.add(id);
    for (const id of deck.lands) used.add(id);
  }
  return gs.player.collection.filter((card) => card.poolKeys != null && !used.has(card.id));
}

function playerOwnsTemplate(templateId: string): boolean {
  return gs.player.collection.some(
    (card) => card.id === templateId || card.id.startsWith(`${templateId}-`)
  );
}

/** NPC catalog cards the player does not own, limited to this year's trade pools. */
function npcOfferPool(characterKey: string): CardTemplate[] {
  const seen = new Set<string>();
  const cards: CardTemplate[] = [];
  for (const pool of seasonPools()) {
    for (const card of getCardTemplatesByPoolKeys([characterKey, pool])) {
      if (seen.has(card.id) || playerOwnsTemplate(card.id)) continue;
      seen.add(card.id);
      cards.push(card);
    }
  }
  return cards;
}

function trainingPartners(): string[] {
  const activity = getCurrentScheduledActivity();
  if (!activity || activity.type !== ActivityType.Training) return [];
  return activity.participants.filter(
    (key) => !isPlayerParticipant(key) && gs.characters[key]
  );
}

function pickRandom<T>(items: T[], count: number): T[] {
  const remaining = [...items];
  const picked: T[] = [];
  const n = Math.min(count, remaining.length);
  for (let i = 0; i < n; i++) {
    const card = getRandomFromArray(remaining);
    picked.push(card);
    remaining.splice(remaining.indexOf(card), 1);
  }
  return picked;
}

export function getTradePartners(): { key: string; name: string }[] {
  return trainingPartners()
    .filter((key) => npcOfferPool(key).length > 0)
    .map((key) => ({ key, name: gs.characters[key]?.name ?? key }));
}

/** Up to 5 catalog cards this NPC can offer that the player does not own. */
export function rollNpcTradeCards(characterKey: string): CardTemplate[] {
  return pickRandom(npcOfferPool(characterKey), OFFER_COUNT);
}

/** Up to 5 of the player's tradeable cards. */
export function rollPlayerTradeCards(): CardTemplate[] {
  return pickRandom(getTradeablePlayerCards(), OFFER_COUNT);
}

export function getTradeCardActions(): Action[] {
  if (gs.time.tradedCardsToday) return [];
  if (getTradeablePlayerCards().length === 0) return [];
  const partners = getTradePartners();
  if (partners.length === 0) return [];

  return [
    {
      label: 'Trade Cards',
      actionType: ActionType.TradeCards,
      isLongAction: false,
      actionParameters: partners.length === 1 ? { characterKey: partners[0].key } : {},
    },
  ];
}

function removeFromPlayerDecks(cardId: string) {
  for (const deck of gs.player.decks) {
    deck.cards = deck.cards.filter((id) => id !== cardId);
    deck.lands = deck.lands.filter((id) => id !== cardId);
  }
}

/** Swap one tradeable player card for a copy of an NPC catalog card. The catalog itself is unchanged. */
export function tradeCards(parameters: TradeCardsParameters): string {
  const { characterKey, receiveCardId, giveCardId } = parameters;
  const npc = gs.characters[characterKey];
  if (!npc) return 'There is no one here to trade with.';

  const template = getLoadedCardTemplate(receiveCardId);
  if (!template || !npcOfferPool(characterKey).some((card) => card.id === template.id)) {
    return `${npc.name} doesn't have that card to trade.`;
  }

  const index = gs.player.collection.findIndex((card) => card.id === giveCardId);
  const give = index === -1 ? undefined : gs.player.collection[index];
  if (!give || !getTradeablePlayerCards().some((card) => card.id === give.id)) {
    return `You can't trade ${give?.name ?? 'that card'}.`;
  }

  gs.player.collection.splice(index, 1);
  removeFromPlayerDecks(give.id);
  const received = makeUniqueId(template);
  gs.player.collection.push(received);
  npc.collection.push(give);
  gs.time.tradedCardsToday = true;

  return `You trade ${give.name} to ${npc.name} for ${received.name}.`;
}
