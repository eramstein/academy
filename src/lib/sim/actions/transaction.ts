import { SubscriptionType, TransactionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';

export interface TransactionParameters {
  cost: number;
  transactionType: TransactionType;
}

interface TransactionSubscriptionParameters extends TransactionParameters {
  subscriptionType: SubscriptionType;
  duration: number;
}

export function transaction(parameters: TransactionParameters): string {
  if (parameters.cost > gs.player.gold) {
    return 'You do not have enough gold to pay the cost.';
  }
  gs.player.gold -= parameters.cost;
  if (parameters.transactionType === TransactionType.Subscription) {
    return subscribe(parameters as TransactionSubscriptionParameters);
  }
  return 'The transaction was successful.';
}

function subscribe(parameters: TransactionSubscriptionParameters): string {
  if (!gs.player.subscriptions[parameters.subscriptionType]) {
    gs.player.subscriptions[parameters.subscriptionType] = 0;
  }
  gs.player.subscriptions[parameters.subscriptionType]! += parameters.duration;
  return `You have subscribed to the ${parameters.subscriptionType} for ${parameters.duration} days.`;
}
