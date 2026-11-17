import {
  ActionType,
  ActivityType,
  ClassType,
  SchoolName,
  type Action,
  type CardTemplate,
  type Character,
} from '../_model';
import { isClassActivity } from '../_model/type-lookup-sim';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { conjureCard, getConjurationOtions } from './actions/artificery';
import { getEnchantableCards } from './actions/enchanting';
import { getCardTemplatesByPoolKeys } from './cards/npc-card-templates';
import { makeUniqueId } from './deck';
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
        cardId: getEnchantableCards().map((c) => [c.id, c.name]),
      },
    });
    lessons.push({
      label: 'Distill',
      actionType: ActionType.Distill,
      isLongAction: true,
      actionParameters: {},
      missingParameters: {
        cardId: getEnchantableCards({ distill: true }).map((c) => [c.id, c.name]),
      },
    });
    lessons.push({
      label: 'Disenchant',
      actionType: ActionType.Disenchant,
      isLongAction: true,
      actionParameters: {},
    });
  }

  if (currentActivity.classType === ClassType.Artificery) {
    void makeAllNpcsConjure();
    lessons.push({
      label: 'Conjure',
      actionType: ActionType.Conjure,
      isLongAction: true,
      actionParameters: {},
    });
  }

  if (currentActivity.classType === ClassType.Artificery && gs.time.day > 6) {
    lessons.push({
      label: 'Invoke',
      actionType: ActionType.Invoke,
      isLongAction: true,
      actionParameters: {},
    });
  }
  return lessons;
}

function characterOwnsTemplate(character: Character, templateId: string): boolean {
  return character.collection.some(
    (card) => card.id === templateId || card.id.startsWith(`${templateId}-`)
  );
}

/** Unused NPC catalog cards tagged with both the character key and `base`. */
function getUnusedNpcBaseCards(character: Character): CardTemplate[] {
  return getCardTemplatesByPoolKeys([character.key, 'base']).filter(
    (template) => !characterOwnsTemplate(character, template.id)
  );
}

async function makeAllNpcsConjure() {
  for (const character of Object.values(gs.characters)) {
    if (character.school !== SchoolName.Academy) {
      continue;
    }

    const baseOptions = getUnusedNpcBaseCards(character);
    if (baseOptions.length > 0) {
      const template = getRandomFromArray(baseOptions);
      const card = makeUniqueId(template);
      character.collection.push(card);
      character.decks[0]!.cards.push(card.id);
      continue;
    }

    const options = await getConjurationOtions(
      {
        source: 'conjure',
        resources: [],
      },
      character.key
    );
    if (options.length === 0) {
      continue;
    }
    const result = getRandomFromArray(options);
    conjureCard(result, character.key);
    character.decks[0]!.cards.push(result.template.id);
  }
}

export function getStudyActions(): Action[] {
  const currentActivity = getCurrentScheduledActivity();
  if (!currentActivity || currentActivity.type !== ActivityType.Study) {
    return [];
  }

  const teacherKey = currentActivity.participants.find((key) => key !== 'player');
  const actionParameters = teacherKey ? { characterKey: teacherKey } : {};

  return [
    {
      label: 'Study Colors',
      actionType: ActionType.StudyColors,
      isLongAction: true,
      actionParameters,
    },
    {
      label: 'Study Abilities',
      actionType: ActionType.StudyAbilities,
      isLongAction: true,
      actionParameters,
    },
  ];
}
