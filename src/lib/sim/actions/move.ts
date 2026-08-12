import { gs } from '@/lib/_state';

export interface MoveParameters {
  placeKey: string;
}

export function move(parameters: MoveParameters): string {
  if (!parameters.placeKey) return 'Where do you want to move?';
  const endingPlace = gs.places[parameters.placeKey];
  gs.player.placeKey = parameters.placeKey;
  return `You go to ${endingPlace.name}.`;
}
