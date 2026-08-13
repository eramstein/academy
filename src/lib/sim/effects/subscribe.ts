import { gs } from '@/lib/_state';
import { SubscriptionType } from '@/lib/_model';
import { scheduleClassesForCurrentTerm } from '../academy';
import type { TransactionParameters } from '../actions/transaction';

export interface TransactionSubscriptionParameters extends TransactionParameters {
  subscriptionType: SubscriptionType;
  duration: number;
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
