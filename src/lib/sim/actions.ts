import { ActionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { gs } from '../_state';

export function getPossibleActions(): Action[] {
  return [];
}

export function performAction(action: Action) {
  let result = '';
  if (action.actionType === ActionType.Transaction) {
    result = transaction(action.actionParameters as TransactionParameters);
  }
  gs.scene.narration.push(result);
}
