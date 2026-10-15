import { gs } from '@/lib/_state';

export interface LevelUpCharacterParameters {
  characterKey: string;
}

export function levelUpCharacter(parameters: LevelUpCharacterParameters): string {
  const { characterKey } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  character.tcgSkill += 1;
  return `${character.name}'s TCG skill increases to ${character.tcgSkill}.`;
}
