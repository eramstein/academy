import type { Action } from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { narrateText } from '../narration';
import { nextScene } from '../scene';
import { ActionsLimitByPeriod } from './_action-types';
import { getLeagueMatchActions, startMatch, type StartMatchParameters } from './match';
import { move, type MoveParameters } from './move';
import { negotiate, type NegotiateParameters } from './negotiation';
import { getSocializeActions, socialize, type SocializeParameters } from './socialize';
import { transaction, type TransactionParameters } from './transaction';
import { wait } from './wait';
import { augment, type AugmentParameters } from './enchanting';
import { getLessonActions } from '../lesson';
import { conjureUnit, type ConjurationParameters } from './artificery';

export function getPossibleActions(): Action[] {
  const actions: Action[] = [];
  actions.push(...getSocializeActions());
  actions.push(...getLessonActions());  

  // check if the number of actions is limited by period
  let filteredActions = actions.filter(action => 
    !ActionsLimitByPeriod[action.actionType] || 
    (gs.time.usedActions[action.actionType] ?? 0) < (ActionsLimitByPeriod[action.actionType] ?? 0)); 
  
  // if a long action has already been performed, filter the other long ones
  if (gs.time.longActionPerformed) {
    filteredActions = filteredActions.filter(action => !action.isLongAction);
  }

  // league matches are mandatory, can't skip scene if there is one
  const leagueActions = getLeagueMatchActions();  
  if (leagueActions.length > 0) {
    filteredActions.push(...leagueActions);
  } else {
    filteredActions.push({
      label: 'Wait',
      actionType: ActionType.Wait,
      isLongAction: true,
      actionParameters: {},
      missingParameters: {},
    });
  }

  return filteredActions;
}

export function performAction(action: Action) {
  const result = actionFunctions[action.actionType](action.actionParameters);
  gs.time.usedActions[action.actionType] = (gs.time.usedActions[action.actionType] ?? 0) + 1;
  narrateText(result);
  if (action.isLongAction) {
    gs.time.longActionPerformed = true;
  }
  setPossibleActions();
  if (action.isLongAction && gs.scene.actions.filter(action => !action.isLongAction).length === 0) {
    nextScene();
    return;
  }
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
  [ActionType.Augment]: (parameters) => augment(parameters as AugmentParameters),
  [ActionType.Conjure]: (parameters) => conjureUnit(parameters as ConjurationParameters),
};
