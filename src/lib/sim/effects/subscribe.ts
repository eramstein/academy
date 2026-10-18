import { SubscriptionType } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { scheduleClassesForCurrentTerm } from '../academy';
import { TransactionType, type TransactionParameters } from '../actions';

export interface TransactionSubscriptionParameters
  extends Omit<TransactionParameters, 'cost' | 'transactionType'> {
  subscriptionType: SubscriptionType;
  duration: number;
  cost?: number;
  transactionType?: TransactionType;
}

const labelsBySubscriptionType: Partial<Record<SubscriptionType, (duration: number) => string>> = {
  [SubscriptionType.Academy]: (duration) =>
    `You have subscribed to the academy for one term of ${duration} days. This grants you access to classes, the cafeteria, and a bunk in the barracks`,
  [SubscriptionType.MaterialShop]: (duration) =>
    `You unlock a materials shop discount for ${duration} days.`,
};

export function subscribe(parameters: TransactionSubscriptionParameters): string {
  const { subscriptionType, duration, cost = 0 } = parameters;
  if (!gs.player.subscriptions[subscriptionType]) {
    gs.player.subscriptions[subscriptionType] = 0;
  }
  gs.player.subscriptions[subscriptionType]! += duration;
  if (subscriptionType === SubscriptionType.Academy) {
    scheduleClassesForCurrentTerm();
  }
  if (labelsBySubscriptionType[subscriptionType]) {
    return labelsBySubscriptionType[subscriptionType]!(duration);
  }
  if (cost > 0) {
    return `You paid ${cost} gold and have subscribed to the ${subscriptionType} for ${duration} days.`;
  }
  return `You have subscribed to the ${subscriptionType} for ${duration} days.`;
}
