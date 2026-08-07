import { ActionDuration, ActionType, SubscriptionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { negotiate, type NegotiateParameters } from './actions/negotiation';
import { narrateText } from './narration';
import { gs } from '../_state';
import { getEnrollmentTransactionParameters } from './academy';
import { move, type MoveParameters } from './actions/move';

export function getPossibleActions(): Action[] {
  const actions: Action[] = [];
  actions.push({
    label: 'Move',
    actionType: ActionType.Move,
    duration: ActionDuration.Short,
    //TODO: dynamic action parameters or chosen by player from a list (fn => param values)
    actionParameters: [],
  });
  return actions;
}

const actionFunctions: Record<ActionType, (parameters: Record<string, any>) => string> = {
  [ActionType.Transaction]: (parameters: Record<string, any>) =>
    transaction(parameters as TransactionParameters),
  [ActionType.Negotiate]: (parameters: Record<string, any>) =>
    negotiate(parameters as NegotiateParameters),
  [ActionType.Move]: (parameters: Record<string, any>) => move(parameters as MoveParameters),
};

export function performAction(action: Action) {
  const result = actionFunctions[action.actionType](action.actionParameters);
  narrateText(result);
  gs.time.usedActions[action.duration] += 1;
}

export function setPossibleActions() {
  gs.scene.actions = getPossibleActions();
}
