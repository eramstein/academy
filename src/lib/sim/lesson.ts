import { ActionType, ClassType, isUnitCard, SchoolName, type Action } from '../_model';
import { isClassActivity } from '../_model/type-lookup-sim';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { conjureUnit, getConjurationOtions } from './actions/artificery';
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
    makeAllNpcsConjure();
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

function makeAllNpcsConjure() {
  for (const character of Object.values(gs.characters)) {
    if (character.school === SchoolName.Academy) {
      const options = getConjurationOtions(
        {
          resources: [],
        },
        character.key
      );
      if (options.length === 0) {
        continue;
      }
      const result = getRandomFromArray(options);
      conjureUnit(result, character.key);
      character.decks[0]!.cards.push(result.template);
    }
  }
}
