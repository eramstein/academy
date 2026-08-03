import { SubscriptionType, TransactionType } from '@/lib/_model/enums-sim';
import { transaction, type TransactionParameters } from './transaction';
import { confrontNpc } from '../attribute-checks';
import { narrateText } from '../narration';

export interface NegotiateParameters {
  cost: number;
  transactionType: TransactionType;
  subscriptionType?: SubscriptionType;
  duration?: number;
  partner: string; // NPC key
}

export function negotiate(parameters: NegotiateParameters): string {
  narrateText(`You negotiate with ${parameters.partner}.`);
  const { success, critical } = confrontNpc('charisma', parameters.partner);
  const multiplier = critical ? 2 : 1;
  const sign = success ? -1 : 1;
  parameters.cost += 0.1 * parameters.cost * multiplier * sign;
  return transaction(parameters as unknown as TransactionParameters);
}
