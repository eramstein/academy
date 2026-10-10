import type { Attributes } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getActingCharacter } from '../characters';

const ATTRIBUTE_KEYS: (keyof Attributes)[] = [
  'dexterity',
  'intelligence',
  'vitality',
  'charisma',
  'aura',
];

export interface LevelAttributeParameters {
  attribute: keyof Attributes;
  amount?: number;
  characterKey?: string;
}

export function levelAttribute(parameters: LevelAttributeParameters): string {
  const { attribute, amount = 1, characterKey = 'player' } = parameters;

  if (!ATTRIBUTE_KEYS.includes(attribute)) {
    return `Invalid attribute: ${attribute}.`;
  }

  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }

  const character = getActingCharacter(characterKey);
  character.attributes[attribute] += amount;
  const value = character.attributes[attribute];

  if (character.key === gs.player.key) {
    return `Your ${attribute} increases to ${value}.`;
  }
  return `${character.name}'s ${attribute} increases to ${value}.`;
}
