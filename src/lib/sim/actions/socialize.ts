import type { Action, Npc } from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getCharactersAtScene } from '../characters';
import { narrateAttemptedAction } from '../narration';

export enum SocializeType {
  Befriend = 'befriend',
  Taunt = 'taunt',
  Impress = 'impress',
  Flirt = 'flirt',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType;
}

const SOCIALIZE_RELATION: Record<SocializeType, keyof Npc['relationProgress']> = {
  [SocializeType.Befriend]: 'friendship',
  [SocializeType.Taunt]: 'rivalry',
  [SocializeType.Impress]: 'respect',
  [SocializeType.Flirt]: 'love',
};

// progresses a relation parameter; used to trigger relation events
export function socialize(parameters: SocializeParameters): string {
  const partner = gs.characters[parameters.characterKey];
  const relationKey = SOCIALIZE_RELATION[parameters.socializeType];
  partner.relationProgress[relationKey] += 1;
  narrateAttemptedAction({
    label: 'Socialize',
    actionType: ActionType.Socialize,
    isLongAction: false,
    actionParameters: {
      characterKey: parameters.characterKey,
      socializeType: parameters.socializeType,
    },
  });
  return '';
}

export function getSocializeActions(): Action[] {
  const presentCharacters = getCharactersAtScene();
  if (!presentCharacters.length) {
    return [];
  }
  return [
    {
      label: 'Socialize',
      actionType: ActionType.Socialize,
      isLongAction: false,
      actionParameters: {},
      missingParameters: {
        characterKey: presentCharacters.map((c) => [c.key, c.name]),
        socializeType: [
          SocializeType.Befriend,
          SocializeType.Taunt,
          SocializeType.Impress,
          SocializeType.Flirt,
        ],
      },
    },
  ];
}
