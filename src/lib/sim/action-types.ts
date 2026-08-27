import { ActionType } from '../_model';

export enum ActionParameterType {
  Number = 'number',

  CharacterKey = 'characterKey',
  PlaceKey = 'placeKey',
  SocializeType = 'socializeType',
}

export const ActionParameterTypes: Partial<Record<ActionType, ActionParameterType[]>> = {
  [ActionType.Socialize]: [ActionParameterType.CharacterKey, ActionParameterType.SocializeType],
};

export const ActionsLimitByPeriod: Partial<Record<ActionType, number>> = {
  [ActionType.Socialize]: 1,
};