import { SubscriptionType, TransactionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { scheduleClassesForCurrentTerm } from '../academy';

export interface TransactionParameters {
  cost: number;
  transactionType: TransactionType;
}

export interface TransactionSubscriptionParameters extends TransactionParameters {
  subscriptionType: SubscriptionType;
  duration: number;
}

export function transaction(parameters: TransactionParameters): string {
  if (parameters.cost > gs.player.gold) {
    return 'You only have ' + gs.player.gold + ' gold, but the cost is ' + parameters.cost + '.';
  }
  gs.player.gold -= parameters.cost;
  if (parameters.transactionType === TransactionType.Subscription) {
    return subscribe(parameters as TransactionSubscriptionParameters);
  }
  return 'The transaction was successful.';
}

export function subscribe(parameters: TransactionSubscriptionParameters): string {
  if (!gs.player.subscriptions[parameters.subscriptionType]) {
    gs.player.subscriptions[parameters.subscriptionType] = 0;
  }
  gs.player.subscriptions[parameters.subscriptionType]! += parameters.duration;
  if (parameters.subscriptionType === SubscriptionType.Academy) {
    scheduleClassesForCurrentTerm();
  }
  return `You paid ${parameters.cost} gold and have subscribed to the ${parameters.subscriptionType} for ${parameters.duration} days.`;
}
