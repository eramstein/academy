import { ActionDuration, ActionType, SubscriptionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { negotiate, type NegotiateParameters } from './actions/negotiation';
import { narrateText } from './narration';
import { gs } from '../_state';
import { move, type MoveParameters } from './actions/move';
import { config } from '../_config/config';
import { nextScene } from './scene';
import { wait } from './actions/wait';

export function getPossibleActions(): Action[] {
  const actions: Action[] = [];
  actions.push({
    label: 'Wait',
    actionType: ActionType.Wait,
    duration: ActionDuration.Short,
    actionParameters: {},
  });
  return filterActionsForAvailableTime(actions);
}

function filterActionsForAvailableTime(actions: Action[]): Action[] {
  return actions.filter((action) => {
    if (action.duration === ActionDuration.Short) {
      return gs.time.usedActions[ActionDuration.Short] < config.shortActionsPerScene;
    } else {
      return gs.time.usedActions[ActionDuration.Long] < config.longActionsPerScene;
    }
  });
}

const actionFunctions: Record<ActionType, (parameters: Record<string, any>) => string> = {
  [ActionType.Transaction]: (parameters: Record<string, any>) =>
    transaction(parameters as TransactionParameters),
  [ActionType.Negotiate]: (parameters: Record<string, any>) =>
    negotiate(parameters as NegotiateParameters),
  [ActionType.Move]: (parameters: Record<string, any>) => move(parameters as MoveParameters),
  [ActionType.Wait]: () => wait(),
};

export function performAction(action: Action) {
  const result = actionFunctions[action.actionType](action.actionParameters);
  narrateText(result);
  gs.time.usedActions[action.duration] += 1;
  setPossibleActions();
}

export function setPossibleActions() {
  gs.scene.actions = getPossibleActions();
  console.log('setPossibleActions', gs.scene.actions);
  // if no actions are available, end the scene
  if (gs.scene.actions.length === 0) {
    nextScene();
  }
}
