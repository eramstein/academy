import { gs } from '@/lib/_state';

export interface UnlockPlaceParameters {
  placeKey: string;
}

export function unlockPlace(parameters: UnlockPlaceParameters): string {
  const { placeKey } = parameters;
  const place = gs.places[placeKey];
  if (!place) {
    return `Invalid place key: ${placeKey}.`;
  }
  if (!place.locked) {
    return `You already know the way to ${place.name}.`;
  }
  place.locked = false;
  return `You unlock ${place.name}.`;
}
