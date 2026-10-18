import { PossessionType, type Possession } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getActingCharacter } from '../characters';

export interface AddPossessionParameters {
  type: PossessionType;
  name: string;
  description: string;
  count?: number;
  /** Defaults to the player. */
  characterKey?: string;
}

export function addPossession(parameters: AddPossessionParameters): string {
  const { type, name, description, count, characterKey = 'player' } = parameters;

  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (!Object.values(PossessionType).includes(type)) {
    return `Invalid possession type: ${type}.`;
  }
  if (typeof name !== 'string' || !name.trim()) {
    return `Possession name is required.`;
  }
  if (typeof description !== 'string' || !description.trim()) {
    return `Possession description is required.`;
  }
  if (count !== undefined && (typeof count !== 'number' || count < 1)) {
    return `Invalid possession count: ${count}.`;
  }

  const character = getActingCharacter(characterKey);
  if (!character.possessions) {
    character.possessions = [];
  }

  const possession: Possession = {
    type,
    name: name.trim(),
    description: description.trim(),
  };
  if (count !== undefined) {
    possession.count = count;
  }
  character.possessions.push(possession);

  if (character.key === gs.player.key) {
    return `You receive ${possession.name}.`;
  }
  return `${character.name} receives ${possession.name}.`;
}
