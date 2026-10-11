import { gs } from '@/lib/_state';
import { getActingCharacter } from '../characters';

export interface MoveParameters {
  placeKey: string;
  characterKeys: string[];
}

export function move(parameters: MoveParameters): string {
  const { placeKey, characterKeys } = parameters;
  const place = gs.places[placeKey];
  if (!place) {
    return `Invalid place key: ${placeKey}.`;
  }
  if (!Array.isArray(characterKeys) || characterKeys.length === 0) {
    return `No characters to move.`;
  }

  for (const characterKey of characterKeys) {
    if (
      characterKey !== 'player' &&
      characterKey !== gs.player.key &&
      !gs.characters[characterKey]
    ) {
      return `Invalid character key: ${characterKey}.`;
    }
  }

  for (const characterKey of characterKeys) {
    getActingCharacter(characterKey).placeKey = placeKey;
  }

  const includesPlayer = characterKeys.some((key) => key === 'player' || key === gs.player.key);
  const names = characterKeys
    .filter((key) => key !== 'player' && key !== gs.player.key)
    .map((key) => gs.characters[key].name);

  if (includesPlayer && names.length === 0) {
    return `You go to ${place.name}.`;
  }
  if (includesPlayer) {
    return `You and ${joinNames(names)} go to ${place.name}.`;
  }
  if (names.length === 1) {
    return `${names[0]} goes to ${place.name}.`;
  }
  return `${joinNames(names)} go to ${place.name}.`;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
