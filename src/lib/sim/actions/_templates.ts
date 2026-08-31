import type { Action } from "@/lib/_model";
import { ActionType } from "@/lib/_model/enums-sim";
import { getEnrollmentTransactionParameters } from "../academy";
  
export const SceneActionTemplates: Record<
  string,
  (args: Record<string, any>) => Action
> = {
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
};