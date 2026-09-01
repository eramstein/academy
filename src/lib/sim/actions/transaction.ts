import { gs } from '@/lib/_state';
import { EventEffectType } from '@/lib/_model/enums-sim';
import { applyEffect } from '@/lib/sim/effects';

export enum TransactionType {
  Subscription = 'subscription',
  Purchase = 'purchase',
}

export interface TransactionParameters {
  cost: number;
  transactionType: TransactionType;
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
  return 'The transaction was successful.';
}
