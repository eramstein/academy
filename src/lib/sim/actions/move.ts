import { gs } from '@/lib/_state';
import { presentGuardianEncounter, placeNeedsGuardian } from '../guardians';

export interface MoveParameters {
  placeKey: string;
}

export function move(parameters: MoveParameters): string {
  if (!parameters.placeKey) return 'Where do you want to move?';
  const endingPlace = gs.places[parameters.placeKey];
  if (!endingPlace) return 'Unknown place.';
  if (placeNeedsGuardian(parameters.placeKey)) {
    presentGuardianEncounter(parameters.placeKey);
    return '';
  }
  gs.player.placeKey = parameters.placeKey;
  return `You go to ${endingPlace.name}.`;
}
