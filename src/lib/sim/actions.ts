import { ActionType, SubscriptionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { negotiate, type NegotiateParameters } from './actions/negotiation';
import { narrateText } from './narration';
import { gs } from '../_state';
import { passTime } from './time';
import { getEnrollmentTransactionParameters } from './academy';

export function getPossibleActions(): Action[] {
  if (
    gs.player.subscriptions[SubscriptionType.Academy] === 0 &&
    gs.player.placeKey === 'admin-office'
  ) {
    return [
      {
        label: 'Negotiate',
        actionType: ActionType.Negotiate,
        duration: 15,
        actionParameters: getEnrollmentTransactionParameters(),
      },
      {
        label: 'Pay',
        actionType: ActionType.Transaction,
        duration: 0,
        actionParameters: getEnrollmentTransactionParameters(),
      },
    ];
  }
  return [];
}

const actionFunctions: Record<ActionType, (parameters: Record<string, any>) => string> = {
  [ActionType.Transaction]: (parameters: Record<string, any>) =>
    transaction(parameters as TransactionParameters),
  [ActionType.Negotiate]: (parameters: Record<string, any>) =>
    negotiate(parameters as NegotiateParameters),
};

export function performAction(action: Action) {
  const result = actionFunctions[action.actionType](action.actionParameters);
  narrateText(result);
  passTime(action.duration);
  gs.scene.actions = getPossibleActions();
}

export function setPossibleActions() {
  gs.scene.actions = getPossibleActions();
}
