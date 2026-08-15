import { ActivityType, SchoolName } from '../_model';
import { gs } from '../_state';
import { getCurrentScheduledActivity } from './schedule';

export function updateNpcLocations() {
  const currentScheduledActivity = getCurrentScheduledActivity();
  Object.values(gs.characters).forEach((character) => {
    if (character.key === gs.player.key) {
      return;
    }
    if (
      character.school === SchoolName.Academy &&
      currentScheduledActivity?.type === ActivityType.Class
    ) {
      character.placeKey = currentScheduledActivity.placeKey;
    }
  });
}
