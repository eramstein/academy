import type { Action } from '@/lib/_model';
import { ActionType, ActivityType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getCharactersAtScene } from '../characters';
import { narrateText } from '../narration';
import { getCurrentScheduledActivity } from '../schedule';
import { directSocialScene, recordDirectedChat } from '../scene-director';

export enum SocializeType {
  Chat = 'chat',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType;
}

/** Chat: the scene director picks a prewritten line for this NPC. */
export async function socialize(parameters: SocializeParameters): Promise<string> {
  const characterKey = parameters.characterKey;
  const direction = await directSocialScene(characterKey);
  if (!direction) {
    const name = gs.characters[characterKey]?.name ?? 'them';
    narrateText(`You chat with ${name}, but nothing particular comes up.`, { characterKey });
    return '';
  }
  narrateText(direction.text, { characterKey });
  recordDirectedChat(direction);
  return '';
}

export function getSocializeActions(): Action[] {
  const presentCharacters = getCharactersAtScene();
  if (!presentCharacters.length) {
    return [];
  }
  return [
    {
      label: 'Socialize',
      actionType: ActionType.Socialize,
      isLongAction: false,
      actionParameters: {},
      missingParameters: {
        characterKey: presentCharacters.map((c) => [c.key, c.name]),
        socializeType: [SocializeType.Chat],
      },
    },
  ];
}

export function getRelationalActions() {
  const activity = getCurrentScheduledActivity();
  if (!activity) {
    return [];
  }
  if (activity.type === ActivityType.Date) {
    const partner = activity.participants.filter((p) => p !== gs.player.key)[0];
    if (!partner) {
      return [];
    }
    return [
      {
        label: 'Chat',
        actionType: ActionType.Socialize,
        isLongAction: true,
        actionParameters: {
          characterKey: partner,
          socializeType: SocializeType.Chat,
        },
      },
    ];
  }
  return [];
}
