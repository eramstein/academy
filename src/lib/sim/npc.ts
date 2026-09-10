import { ActivityType, SchoolName } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { getCurrentScheduledActivity } from './schedule';

export function updateNpcLocations() {
  const currentScheduledActivity = getCurrentScheduledActivity();
  Object.values(gs.characters).forEach((character) => {
    if (character.key === gs.player.key) {
      return;
    }
    // case student at lesson
    if (
      character.school === SchoolName.Academy &&
      currentScheduledActivity?.type === ActivityType.Class
    ) {
      character.placeKey = currentScheduledActivity.placeKey;
    }

    // case student in evening
    if (
      character.school === SchoolName.Academy &&
      currentScheduledActivity?.type !== ActivityType.Class
    ) {
      const eveningPlaces = [
        'library',
        'old-monk-inn',
        'royal-pigeon-inn',
        'cafeteria',
        'barracks',
      ];
      character.placeKey = getRandomFromArray(eveningPlaces);
    }
  });
}
