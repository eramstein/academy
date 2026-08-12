import { gs } from '@/lib/_state';
import { attributeCheck } from '../attribute-checks';
import { narrateText } from '../narration';
import { getCharactersAtScene } from '../characters';
import { ActionDuration, ActionType } from '@/lib/_model/enums-sim';
import type { Action } from '@/lib/_model';

export enum SocializeType {
  Befriend = 'befriend',
  Confront = 'confront',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType;
}

export function socialize(parameters: SocializeParameters): string {
  const { success, critical, outcomeText } = attributeCheck(
    gs.player.attributes.charisma,
    10,
    'charisma'
  );
  narrateText(`You ${parameters.socializeType} ${gs.characters[parameters.characterKey].name}.`);
  return outcomeText;
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
      duration: ActionDuration.Short,
      actionParameters: {},
      missingParameters: {
        characterKey: presentCharacters.map((c) => [c.key, c.name]),
        socializeType: [SocializeType.Befriend, SocializeType.Confront],
      },
    },
  ];
}
