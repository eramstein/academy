import { ActionType, SubscriptionType, TransactionType } from '@/lib/_model/enums-sim';
import type { Action } from '@/lib/_model/model-game';

export const EVENTS: Record<string, { narration: string; actions: Action[] }> = {
  'first-day': {
    narration:
      'After a long journey, you finally arrive at the academy. A clerk directs you to the administration office. The administrator asks you for tuition fees.',
    actions: [
      {
        label: 'Negotiate',
        actionType: ActionType.Negotiate,
        actionParameters: {
          success: {
            description: 'The administrator agrees to reduce the tuition fees.',
            rewards: [
              {
                type: 'gold',
                amount: 100,
              },
            ],
          },
        },
      },
      {
        label: 'Pay',
        actionType: ActionType.Transaction,
        actionParameters: {
          cost: 1000,
          transactionType: TransactionType.Subscription,
          acquisition: SubscriptionType.Academy,
          duration: 365,
        },
      },
    ],
  },
};
