import type { CardCraftingSkills } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getActingCharacter } from '../characters';

const CRAFTING_SKILL_KEYS: (keyof CardCraftingSkills)[] = ['mastery', 'erudition', 'inspiration'];

export interface LevelCraftingSkillParameters {
  skill: keyof CardCraftingSkills;
  amount?: number;
  characterKey?: string;
}

export function levelCraftingSkill(parameters: LevelCraftingSkillParameters): string {
  const { skill, amount = 1, characterKey = 'player' } = parameters;

  if (!CRAFTING_SKILL_KEYS.includes(skill)) {
    return `Invalid crafting skill: ${skill}.`;
  }

  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }

  const character = getActingCharacter(characterKey);
  character.craftingSkills ??= { mastery: 0, erudition: 0, inspiration: 0 };
  character.craftingSkills[skill] = (character.craftingSkills[skill] ?? 0) + amount;
  const value = character.craftingSkills[skill];

  if (character.key === gs.player.key) {
    return `Your ${skill} increases to ${value}.`;
  }
  return `${character.name}'s ${skill} increases to ${value}.`;
}
