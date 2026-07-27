import {
  ActionType,
  NarrationType,
  SubscriptionType,
  TransactionType,
} from '@/lib/_model/enums-sim';
import type { Action, Narration } from '@/lib/_model/model-game';
import { npcs } from '../npcs';

export const EVENTS: Record<string, { narration: Narration; actions: Action[] }> = {
  'first-day': {
    narration: {
      text: 'After a long journey, you finally arrive at the academy. A clerk directs you to the administration office. The administrator asks you for tuition fees.',
      type: NarrationType.Text,
    },
    actions: [
      {
        label: 'Negotiate',
        actionType: ActionType.Negotiate,
        actionParameters: {
          cost: 1000,
          transactionType: TransactionType.Subscription,
          subscriptionType: SubscriptionType.Academy,
          duration: 365,
          partner: npcs.administrator.key,
        },
      },
      {
        label: 'Pay',
        actionType: ActionType.Transaction,
        actionParameters: {
          cost: 1000,
          transactionType: TransactionType.Subscription,
          subscriptionType: SubscriptionType.Academy,
          duration: 365,
        },
      },
    ],
  },
};
