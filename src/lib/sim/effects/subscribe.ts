import { SubscriptionType } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { scheduleClassesForCurrentTerm } from '../academy';
import type { TransactionParameters } from '../actions';

export interface TransactionSubscriptionParameters extends TransactionParameters {
  subscriptionType: SubscriptionType;
  duration: number;
}

const labelsBySubscriptionType: Partial<Record<SubscriptionType, (duration: number) => string>> = {
  [SubscriptionType.Academy]: (duration) =>
    `You have subscribed to the academy for one term of ${duration} days. This grants you access to classes, the cafeteria, and a bunk in the barracks`,
};

export function subscribe(parameters: TransactionSubscriptionParameters): string {
  if (!gs.player.subscriptions[parameters.subscriptionType]) {
    gs.player.subscriptions[parameters.subscriptionType] = 0;
  }
  gs.player.subscriptions[parameters.subscriptionType]! += parameters.duration;
  if (parameters.subscriptionType === SubscriptionType.Academy) {
    scheduleClassesForCurrentTerm();
  }
  if (labelsBySubscriptionType[parameters.subscriptionType]) {
    return labelsBySubscriptionType[parameters.subscriptionType]!(parameters.duration);
  }
  return `You paid ${parameters.cost} gold and have subscribed to the ${parameters.subscriptionType} for ${parameters.duration} days.`;
}
