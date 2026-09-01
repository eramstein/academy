import { ActionType, ClassType, type Action } from "../_model";
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
        isLongAction: false,
        actionParameters: {},
        missingParameters: {
          cardId: gs.player.collection.map((c) => [c.id, c.name]),
        },
      },
    ];
  }

  return [];
}