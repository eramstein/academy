import { ActionType, ClassType, isUnitCard, type Action } from '../_model';
import { isClassActivity } from '../_model/type-lookup-sim';
import { gs } from '../_state';
import { getCurrentScheduledActivity } from './schedule';

export function getLessonActions(): Action[] {
  if (gs.time.day <= 1) return [];
  const currentActivity = getCurrentScheduledActivity();

  if (!currentActivity || !isClassActivity(currentActivity)) return [];

  const lessons: Action[] = [];

  if (currentActivity.classType === ClassType.Enchanting) {
    lessons.push({
      label: 'Augment',
      actionType: ActionType.Augment,
      isLongAction: true,
      actionParameters: {},
      missingParameters: {
        cardId: gs.player.collection
          .filter((c) => isUnitCard(c) && c.cost < 9)
          .map((c) => [c.id, c.name]),
      },
    });
    lessons.push({
      label: 'Distill',
      actionType: ActionType.Distill,
      isLongAction: true,
      actionParameters: {},
      missingParameters: {
        cardId: gs.player.collection
          .filter((c) => isUnitCard(c) && c.cost > 0)
          .map((c) => [c.id, c.name]),
      },
    });
  }

  if (currentActivity.classType === ClassType.Artificery) {
    lessons.push({
      label: 'Conjure',
      actionType: ActionType.Conjure,
      isLongAction: true,
      actionParameters: {},
    });
  }

  if (
    currentActivity.classType === ClassType.Artificery &&
    gs.player.craftingKnowledge.keywords &&
    Object.keys(gs.player.craftingKnowledge.keywords).length > 1
  ) {
    lessons.push({
      label: 'Invoke',
      actionType: ActionType.Invoke,
      isLongAction: true,
      actionParameters: {},
    });
  }
  return lessons;
}
