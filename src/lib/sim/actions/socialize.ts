import type { Action } from '@/lib/_model';
import { ActionType, ActivityType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getCharactersAtScene } from '../characters';
import { narrateAttemptedAction } from '../narration';
import { getCurrentScheduledActivity } from '../schedule';
import { consumeScenePayload, directSocialScene } from '../scene-director';

export enum SocializeType {
  Chat = 'chat',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType;
  /** Optional player intent for LLM narration (does not affect the attribute check). */
  intent?: string;
}

/** Chat: the scene director picks one fact, then the writer turns it into prose. */
export async function socialize(parameters: SocializeParameters): Promise<string> {
  const intent = parameters.intent?.trim();
  const action: Action = {
    label: 'Socialize',
    actionType: ActionType.Socialize,
    isLongAction: false,
    actionParameters: {
      characterKey: parameters.characterKey,
      socializeType: parameters.socializeType,
      ...(intent ? { intent } : {}),
    },
  };
  const direction = directSocialScene(parameters.characterKey);
  narrateAttemptedAction(action, undefined, {
    direction,
    onGenerated: () => consumeScenePayload(direction),
  });
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
