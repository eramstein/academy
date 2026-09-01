import type { Action } from '@/lib/_model';
import { ActionType, CharacterTrait } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { attributeCheck, skillCheckDifficulty } from '../attribute-checks';
import { getCharacterPronoun, getCharactersAtScene } from '../characters';

export enum SocializeType {
  Befriend = 'befriend',
  Confront = 'confront',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType;
}

export function socialize(parameters: SocializeParameters): string {
  const partner = gs.characters[parameters.characterKey];
  let difficulty = skillCheckDifficulty.medium;
  let difficultyText = '';
  if (
    parameters.socializeType === SocializeType.Befriend &&
    partner.traits[CharacterTrait.Friendly]
  ) {
    difficulty = skillCheckDifficulty.easy;
    difficultyText = `As ${getCharacterPronoun(partner)} is friendly, it is a bit easier.`;
  } else if (
    parameters.socializeType === SocializeType.Confront &&
    partner.traits[CharacterTrait.Grumpy]
  ) {
    difficulty = skillCheckDifficulty.easy;
    difficultyText = `As ${getCharacterPronoun(partner)} is grumpy, it is a bit easier.`;
  }
  const { success, critical, outcomeText } = attributeCheck(
    gs.player.attributes.charisma,
    difficulty,
    'charisma'
  );
  const narrationText = `
    You try to ${parameters.socializeType} ${gs.characters[parameters.characterKey].name}.    
    ${difficultyText} \n
    ${outcomeText}
  `;
  return narrationText;
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
        socializeType: [SocializeType.Befriend, SocializeType.Confront],
      },
    },
  ];
}
