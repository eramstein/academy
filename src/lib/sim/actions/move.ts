import { gs } from '@/lib/_state';
import { ActionDuration } from '@/lib/_model';

export interface MoveParameters {
  placeKey: string;
  duration: number;
}

export function move(parameters: MoveParameters): string {
  const startingPlace = gs.places[gs.player.placeKey];
  const endingPlace = gs.places[parameters.placeKey];
  gs.player.placeKey = parameters.placeKey;

  if (startingPlace.regionKey !== endingPlace.regionKey) {
    gs.time.usedActions[ActionDuration.Long] += 1;
  } else {
    gs.time.usedActions[ActionDuration.Short] += 1;
  }
  return `You go to ${endingPlace.name}.`;
}
