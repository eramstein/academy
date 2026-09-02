import { ActionType, CardType, ClassType, type Action } from "../_model";
import { getCurrentScheduledActivity } from "./schedule";
import { isClassActivity } from "../_model/type-lookup-sim";
import { gs } from "../_state";

export function getLessonActions(): Action[] {
  if (gs.time.day <= 1) return [];
  const currentActivity = getCurrentScheduledActivity();

  if (!currentActivity || !isClassActivity(currentActivity)) return [];

  if (currentActivity.classType === ClassType.Enchanting) {
    return [
      {
        label: 'Augment',
        actionType: ActionType.Augment,
        isLongAction: true,
        actionParameters: {},
        missingParameters: {
          cardId: gs.player.collection.filter(c => c.type !== CardType.Land).map((c) => [c.id, c.name]),
        },
      },
    ];
  }

  if (currentActivity.classType === ClassType.Artificery) {
    return [
      {
        label: 'Conjure',
        actionType: ActionType.Conjure,
        isLongAction: true,
        actionParameters: {},
      },
    ];
  }
  return [];
}