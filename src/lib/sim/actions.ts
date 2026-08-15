import { ActionDuration, ActionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { negotiate, type NegotiateParameters } from './actions/negotiation';
import { narrateText } from './narration';
import { gs } from '../_state';
import { move, type MoveParameters } from './actions/move';
import { config } from '../_config/config';
import { nextScene } from './scene';
import { wait } from './actions/wait';
import { getSocializeActions, socialize, type SocializeParameters } from './actions/socialize';
import { getLeagueMatchActions, startMatch, type StartMatchParameters } from './actions/match';

export function getPossibleActions(): Action[] {
  const actions: Action[] = [];
  actions.push({
    label: 'Wait',
    actionType: ActionType.Wait,
    duration: ActionDuration.Instant,
    actionParameters: {},
    missingParameters: {},
  });
  actions.push(...getSocializeActions());
  actions.push(...getLeagueMatchActions());
  return filterActionsForAvailableTime(actions);
}

function filterActionsForAvailableTime(actions: Action[]): Action[] {
  const shortLeft = gs.time.usedActions[ActionDuration.Short] < config.shortActionsPerScene;
  const longLeft = gs.time.usedActions[ActionDuration.Long] < config.longActionsPerScene;
  return actions.filter((action) => {
    if (action.duration === ActionDuration.Instant) return shortLeft || longLeft;
    if (action.duration === ActionDuration.Short) return shortLeft;
    return longLeft;
  });
}

export function performAction(action: Action) {
  const result = actionFunctions[action.actionType](action.actionParameters);
  // Reassign usedActions so nested $derived subscribers update (in-place += does not).
  if (action.duration !== ActionDuration.Instant) {
    gs.time.usedActions = {
      ...gs.time.usedActions,
      [action.duration]: gs.time.usedActions[action.duration] + 1,
    };
  }
  narrateText(result);
  setPossibleActions();
}

export function setPossibleActions() {
  gs.scene.actions = getPossibleActions();
  // if no actions are available, end the scene
  if (gs.scene.actions.length === 0) {
    nextScene();
  }
}

const actionFunctions: Record<ActionType, (parameters: Record<string, any>) => string> = {
  [ActionType.Transaction]: (parameters) => transaction(parameters as TransactionParameters),
  [ActionType.Negotiate]: (parameters) => negotiate(parameters as NegotiateParameters),
  [ActionType.Move]: (parameters) => move(parameters as MoveParameters),
  [ActionType.Wait]: () => wait(),
  [ActionType.Socialize]: (parameters) => socialize(parameters as SocializeParameters),
  [ActionType.StartMatch]: (parameters) => startMatch(parameters as StartMatchParameters),
};
