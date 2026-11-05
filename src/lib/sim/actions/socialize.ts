import type { Action } from '@/lib/_model';
import { ActionType, ActivityType, DayPeriod } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getCharactersAtScene } from '../characters';
import { decodeInteractionType, runInteraction } from '../interactions';
import { narrateText } from '../narration';
import { directSocialScene, recordDirectedChat } from '../scene-director';
import { getCurrentScheduledActivity } from '../schedule';
import { isLimitKeyAvailable } from './_action-types';

export enum SocializeType {
  Chat = 'chat',
  Hangout = 'hangout',
  /** Structured scene. Offered as one button per interaction template, not as "Interact". */
  Interaction = 'interaction',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType | string;
  /** Template key when socializeType is Interaction. */
  interactionKey?: string;
  /** Index into the active interaction's offered choices. */
  interactionChoice?: number;
  /** End the interaction without another model call. */
  interactionStop?: boolean;
}

function interactionKeyOf(parameters: SocializeParameters): string | undefined {
  if (typeof parameters.interactionKey === 'string' && parameters.interactionKey) {
    return parameters.interactionKey;
  }
  if (typeof parameters.socializeType === 'string') {
    return decodeInteractionType(parameters.socializeType);
  }
  return undefined;
}

/** Chat / hangout: the scene director picks a prewritten line for this NPC. */
export async function socialize(parameters: SocializeParameters): Promise<string> {
  const interactionKey = interactionKeyOf(parameters);
  if (parameters.socializeType === SocializeType.Interaction || interactionKey) {
    await runInteraction({
      characterKey: parameters.characterKey,
      interactionKey: interactionKey ?? '',
      choiceIndex:
        typeof parameters.interactionChoice === 'number' ? parameters.interactionChoice : undefined,
      stop: parameters.interactionStop === true,
    });
    return '';
  }
  const characterKey = parameters.characterKey;
  const isHangout = parameters.socializeType === SocializeType.Hangout;
  if (isHangout) {
    recordHangoutPartner(characterKey);
    const npc = gs.characters[characterKey];
    if (npc) {
      npc.activityHistory ??= {};
      npc.activityHistory[ActivityType.Hangout] =
        (npc.activityHistory[ActivityType.Hangout] || 0) + 1;
    }
  }
  const direction = await directSocialScene(
    characterKey,
    isHangout ? { activityType: ActivityType.Hangout, requireActivityType: true } : undefined
  );
  if (!direction) {
    const name = gs.characters[characterKey]?.name ?? 'them';
    const verb = isHangout ? 'hang out with' : 'chat with';
    narrateText(`You ${verb} ${name}, but nothing particular comes up.`, { characterKey });
    return '';
  }
  narrateText(direction.text, { characterKey });
  recordDirectedChat(direction);
  return '';
}

function recordHangoutPartner(characterKey: string): void {
  const list = gs.time.hungOutWith ?? [];
  if (!list.includes(characterKey)) {
    gs.time.hungOutWith = [...list, characterKey];
  }
}

function canSocializeWith(characterKey: string): boolean {
  return !(gs.time.hungOutWith ?? []).includes(characterKey);
}

export function getSocializeActions(): Action[] {
  const presentCharacters = getCharactersAtScene().filter((c) => canSocializeWith(c.key));
  if (!presentCharacters.length) {
    return [];
  }
  const socializeTypes: SocializeType[] = [SocializeType.Chat];
  if (gs.time.period === DayPeriod.Evening && isLimitKeyAvailable(SocializeType.Hangout)) {
    socializeTypes.push(SocializeType.Hangout);
  }
  // Interaction templates are listed per NPC (they can depend on that relation),
  // so they are not a single SocializeType.Interaction entry here.
  return [
    {
      label: 'Socialize',
      actionType: ActionType.Socialize,
      isLongAction: false,
      actionParameters: {},
      missingParameters: {
        characterKey: presentCharacters.map((c) => [c.key, c.name]),
        socializeType: socializeTypes,
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
    if (!partner || !canSocializeWith(partner)) {
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
