import { ActionType, EventEffectType, ResourceType } from '@/lib/_model/enums-sim';
import type { Action } from '@/lib/_model/model-sim';
import { gs } from '@/lib/_state';
import { applyEffect } from '@/lib/sim/effects';
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
  };
}

export function transaction(parameters: TransactionParameters): string {
  if (parameters.cost > gs.player.gold) {
    return 'You only have ' + gs.player.gold + ' gold, but the cost is ' + parameters.cost + '.';
  }
  gs.player.gold -= parameters.cost;
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
  narrateTransaction(parameters);
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
