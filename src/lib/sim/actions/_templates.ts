import type { Action } from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { getEnrollmentTransactionParameters } from '../academy';
import type { InviteParameters } from './invitation';
import { TransactionType, type TransactionParameters } from './transaction';

export const SceneActionTemplates: Record<string, (args: Record<string, any>) => Action> = {
  enrollmentTransaction: (args = {}) => ({
    actionType: ActionType.Negotiate,
    actionParameters: {
      ...getEnrollmentTransactionParameters(),
      ...args,
    } as Record<string, any>,
    isLongAction: false,
  }),
  enrollmentPayment: (args = {}) => ({
    actionType: ActionType.Transaction,
    actionParameters: {
      ...getEnrollmentTransactionParameters(),
      ...args,
    } as Record<string, any>,
    isLongAction: false,
  }),
  /** Fixed-cost purchase (resources and/or possessions). Event options pass cost + items in args. */
  purchase: (args = {}) => ({
    actionType: ActionType.Transaction,
    actionParameters: {
      cost: 0,
      transactionType: TransactionType.Purchase,
      ...args,
    } as TransactionParameters,
    isLongAction: false,
  }),
  invite: (args) => ({
    label: 'Invite',
    actionType: ActionType.Invite,
    actionParameters: args as InviteParameters,
    isLongAction: false,
  }),
};
