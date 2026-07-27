import { ActionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { negotiate, type NegotiateParameters } from './actions/negotiation';
import { narrateText } from './narration';
import { gs } from '../_state';

export function getPossibleActions(): Action[] {
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
  gs.scene.actions = getPossibleActions();
}
