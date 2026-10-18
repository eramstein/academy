import {
  ActionType,
  EventEffectType,
  PossessionType,
  ResourceType,
  SubscriptionType,
} from '@/lib/_model/enums-sim';
import type { Action } from '@/lib/_model/model-sim';
import { gs } from '@/lib/_state';
import { applyEffect } from '@/lib/sim/effects';
import { addPossession } from '@/lib/sim/effects/possessions';
import { narrateTransaction } from '../narration';

export enum TransactionType {
  Subscription = 'subscription',
  Purchase = 'purchase',
}

export interface TransactionParameters {
  cost: number;
  transactionType: TransactionType;
  items?: {
    resources?: Partial<Record<ResourceType, number>>;
    possessions?: Partial<Record<PossessionType, string>>;
  };
}

const MATERIAL_SHOP_PLACE_KEY = 'metarials-shop';
const MATERIAL_SHOP_DISCOUNT = 0.9;

/** Current place stock; MaterialShop subscription only discounts the materials shop. */
export function getShopPrices(): Partial<Record<ResourceType, { price: number; count: number }>> {
  const placeKey = gs.player.placeKey;
  const resources = gs.places[placeKey]?.itemsOnSale?.resources ?? {};
  const discountActive =
    placeKey === MATERIAL_SHOP_PLACE_KEY &&
    (gs.player.subscriptions[SubscriptionType.MaterialShop] ?? 0) > 0;
  const multiplier = discountActive ? MATERIAL_SHOP_DISCOUNT : 1;
  const priced: Partial<Record<ResourceType, { price: number; count: number }>> = {};
  for (const [type, item] of Object.entries(resources) as [
    ResourceType,
    { price: number; count: number },
  ][]) {
    priced[type] = {
      price: Math.floor(item.price * multiplier),
      count: item.count,
    };
  }
  return priced;
}

function getPurchaseCost(resources: Partial<Record<ResourceType, number>>): number {
  const prices = getShopPrices();
  let cost = 0;
  for (const [type, count] of Object.entries(resources)) {
    const amount = count ?? 0;
    if (amount <= 0) continue;
    cost += (prices[type as ResourceType]?.price ?? 0) * amount;
  }
  return cost;
}

export function transaction(parameters: TransactionParameters): string {
  const cost =
    parameters.transactionType === TransactionType.Purchase && parameters.items?.resources
      ? getPurchaseCost(parameters.items.resources)
      : parameters.cost;
  if (cost > gs.player.gold) {
    return 'You only have ' + gs.player.gold + ' gold, but the cost is ' + cost + '.';
  }
  gs.player.gold -= cost;
  if (parameters.transactionType === TransactionType.Subscription) {
    applyEffect({
      type: EventEffectType.Subscribe,
      parameters: parameters,
    });
    return '';
  }
  if (parameters.items?.resources) {
    const shopStock = gs.places[gs.player.placeKey]?.itemsOnSale?.resources;
    for (const [type, count] of Object.entries(parameters.items.resources)) {
      const resourceType = type as ResourceType;
      const amount = count ?? 0;
      if (amount <= 0) continue;
      gs.player.resources[resourceType] = (gs.player.resources[resourceType] ?? 0) + amount;
      const stockItem = shopStock?.[resourceType];
      if (stockItem) {
        stockItem.count = Math.max(0, stockItem.count - amount);
      }
    }
  }
  if (parameters.items?.possessions) {
    for (const [type, name] of Object.entries(parameters.items.possessions)) {
      if (typeof name !== 'string' || !name.trim()) continue;
      // Grant without applyEffect so purchase narration stays on narrateTransaction.
      addPossession({
        type: type as PossessionType,
        name: name.trim(),
        description: name.trim(),
      });
    }
  }
  narrateTransaction({ ...parameters, cost });
  return '';
}

export function getShopActions(): Action[] {
  const itemsOnSale = gs.places[gs.player.placeKey].itemsOnSale;
  if (!itemsOnSale) {
    return [];
  }
  return [
    {
      label: 'Shop',
      actionType: ActionType.Transaction,
      isLongAction: true,
      actionParameters: {
        cost: 0,
        transactionType: TransactionType.Purchase,
      },
    },
  ];
}
