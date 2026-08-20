import { ActionType } from '../_model';
import type { Action } from '../_model/model-game';
import { transaction, type TransactionParameters } from './actions/transaction';
import { negotiate, type NegotiateParameters } from './actions/negotiation';
import { narrateText } from './narration';
import { gs } from '../_state';
import { move, type MoveParameters } from './actions/move';
import { nextScene } from './scene';
import { wait } from './actions/wait';
import { getSocializeActions, socialize, type SocializeParameters } from './actions/socialize';
import { getLeagueMatchActions, startMatch, type StartMatchParameters } from './actions/match';

export function getPossibleActions(): Action[] {
  const actions: Action[] = [];
  actions.push(...getSocializeActions());

  // league matches are mandatory, can't skip scene if there is one
  const leagueActions = getLeagueMatchActions();
  if (leagueActions.length > 0) {
    actions.push(...leagueActions);
  } else {
    actions.push({
      label: 'Wait',
      actionType: ActionType.Wait,
      isLongAction: true,
      actionParameters: {},
      missingParameters: {},
    });
  }

  return actions;
}

export function performAction(action: Action) {
  const result = actionFunctions[action.actionType](action.actionParameters);
  narrateText(result);
  if (action.isLongAction) {
    nextScene();
    return;
  }
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
