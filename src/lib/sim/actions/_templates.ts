import type { Action } from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { getEnrollmentTransactionParameters } from '../academy';
import type { InviteParameters } from './invitation';

export const SceneActionTemplates: Record<string, (args: Record<string, any>) => Action> = {
  enrollmentTransaction: () => ({
    actionType: ActionType.Negotiate,
    actionParameters: getEnrollmentTransactionParameters() as Record<string, any>,
    isLongAction: false,
  }),
  enrollmentPayment: () => ({
    actionType: ActionType.Transaction,
    actionParameters: getEnrollmentTransactionParameters() as Record<string, any>,
    isLongAction: false,
  }),
  invite: (args) => ({
    label: 'Invite',
    actionType: ActionType.Invite,
    actionParameters: args as InviteParameters,
    isLongAction: false,
  }),
};
