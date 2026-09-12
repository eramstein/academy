import type { Action } from '@/lib/_model';
import { ActionType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { attributeCheck, skillCheckDifficulty } from '../attribute-checks';
import { getCharactersAtScene } from '../characters';

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

// this progresses a relation parameter up or down
// these values get used to trigger relation events
export function socialize(parameters: SocializeParameters): string {
  const partner = gs.characters[parameters.characterKey];
  const difficulty = skillCheckDifficulty.trivial;

  const { success, critical, outcomeText } = attributeCheck(
    gs.player.attributes.charisma,
    difficulty,
    'charisma'
  );
  const outcomeValue = (critical ? 2 : 1) * (success ? 1 : -1);
  switch (parameters.socializeType) {
    case SocializeType.Befriend:
      if (success) {
        partner.relationProgress.friendship = Math.max(0, partner.relationProgress.friendship);
      }
      partner.relationProgress.friendship += outcomeValue;
      break;
    case SocializeType.Taunt:
      if (success) {
        partner.relationProgress.rivalry = Math.max(0, partner.relationProgress.rivalry);
      }
      partner.relationProgress.rivalry += outcomeValue;
      break;
    case SocializeType.Impress:
      if (success) {
        partner.relationProgress.friendship = Math.max(0, partner.relationProgress.friendship);
      }
      partner.relationProgress.respect += outcomeValue;
      break;
    case SocializeType.Flirt:
      if (success) {
        partner.relationProgress.love = Math.max(0, partner.relationProgress.love);
      }
      partner.relationProgress.love += outcomeValue;
      break;
  }
  return `You try to ${parameters.socializeType} ${gs.characters[parameters.characterKey].name}. ${outcomeText}`;
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
