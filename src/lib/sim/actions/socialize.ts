import type { Action } from '@/lib/_model';
import { ActionType, ActivityType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { getPhysicalRomanceImageCandidates } from '@/lib/_utils/asset-paths';
import { getRandomFromArray } from '@/lib/_utils/random';
import { attributeCheck, skillCheckDifficulty } from '../attribute-checks';
import { getCharactersAtScene } from '../characters';
import { offerCardGifts } from '../effects/gifts';
import { changeRelation } from '../effects/relations';
import { getTriggeredSceneEvent } from '../events';
import { narrateAttemptedAction, narrateText } from '../narration';
import { setEvent } from '../scene';
import { getCurrentScheduledActivity } from '../schedule';

export enum SocializeType {
  Befriend = 'befriend',
  Taunt = 'taunt',
  Impress = 'impress',
  Flirt = 'flirt',
}

export interface SocializeParameters {
  characterKey: string;
  socializeType: SocializeType;
  /** Optional player intent for LLM narration (does not affect the attribute check). */
  intent?: string;
}

export enum RomanceType {
  DeepenRelationship = 'deepen-relationship',
  Physical = 'physical',
}

export interface RomanceParameters {
  characterKey: string;
  romanceType: RomanceType;
  /** Optional player intent for LLM narration (does not affect checks or relation changes). */
  intent?: string;
}

function socializeAttribute(type: SocializeType): 'charisma' | 'intelligence' {
  if (type === SocializeType.Befriend || type === SocializeType.Flirt) return 'charisma';
  return 'intelligence';
}

/** Socialize: fire a matching event if one triggers, otherwise roll silently and narrate the outcome. */
export async function socialize(parameters: SocializeParameters): Promise<string> {
  gs.scene.socializeContext = {
    characterKey: parameters.characterKey,
    socializeType: parameters.socializeType,
  };
  const triggered = getTriggeredSceneEvent({ includeManual: true });
  gs.scene.socializeContext = undefined;

  if (triggered) {
    setEvent(triggered.event, triggered.template);
    return '';
  }

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
  const attribute = socializeAttribute(parameters.socializeType);
  const { success, critical } = await attributeCheck(
    gs.player.attributes[attribute],
    skillCheckDifficulty.medium,
    attribute,
    action,
    undefined,
    { silent: true }
  );
  narrateAttemptedAction(action, {
    success,
    critical,
    attribute,
    difficulty: 'Medium',
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
        socializeType: [
          SocializeType.Befriend,
          SocializeType.Taunt,
          SocializeType.Impress,
          SocializeType.Flirt,
        ],
      },
    },
  ];
}

export async function romance(parameters: RomanceParameters): Promise<string> {
  const partner = gs.characters[parameters.characterKey];
  const intent = parameters.intent?.trim();
  const action: Action = {
    label:
      parameters.romanceType === RomanceType.DeepenRelationship
        ? 'Deepen Relationship'
        : 'Physical Interaction',
    actionType: ActionType.Romance,
    isLongAction: true,
    actionParameters: {
      characterKey: parameters.characterKey,
      romanceType: parameters.romanceType,
      ...(intent ? { intent } : {}),
    },
  };

  if (parameters.romanceType === RomanceType.DeepenRelationship) {
    changeRelation({
      characterKey: parameters.characterKey,
      relationParameter: 'love',
      amount: 1,
    });
    narrateAttemptedAction(action);
    return '';
  }

  if (parameters.romanceType === RomanceType.Physical) {
    const { success, critical } = await attributeCheck(
      gs.player.attributes.vitality,
      skillCheckDifficulty.trivial,
      'vitality',
      action,
      undefined,
      { silent: true }
    );
    narrateAttemptedAction(action, {
      success,
      critical,
      attribute: 'vitality',
      difficulty: 'Trivial',
    });
    if (success) {
      void narratePhysicalRomanceGift(partner.name, parameters.characterKey);
    }
    return '';
  }

  return '';
}

async function imageUrlExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/** Pick a random existing `{character}-p-N.jpg` from loaded mods, if any. */
async function pickPhysicalRomanceImage(characterKey: string): Promise<string | undefined> {
  const candidates = getPhysicalRomanceImageCandidates(characterKey);
  const existing = (
    await Promise.all(
      candidates.map(async (url) => ((await imageUrlExists(url)) ? url : undefined))
    )
  ).filter((url): url is string => url !== undefined);
  if (existing.length === 0) return undefined;
  return getRandomFromArray(existing);
}

async function narratePhysicalRomanceGift(partnerName: string, characterKey: string) {
  const imageUrl = await pickPhysicalRomanceImage(characterKey);
  narrateText(`${partnerName} offers you a card as a gift.`, {
    characterKey,
    ...(imageUrl ? { imageUrl, imageSize: 'medium' } : {}),
  });
  offerCardGifts({
    count: 3,
    poolKeys: [characterKey, 'base'],
  });
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
        label: 'Try to be funny',
        actionType: ActionType.Socialize,
        isLongAction: true,
        actionParameters: {
          characterKey: partner,
          socializeType: SocializeType.Befriend,
        },
      },
      {
        label: 'Try to be charming',
        actionType: ActionType.Socialize,
        isLongAction: true,
        actionParameters: {
          characterKey: partner,
          socializeType: SocializeType.Flirt,
        },
      },
      {
        label: 'Try to be smart',
        actionType: ActionType.Socialize,
        isLongAction: true,
        actionParameters: {
          characterKey: partner,
          socializeType: SocializeType.Impress,
        },
      },
    ];
  }
  if (activity.type === ActivityType.Romance) {
    const partner = activity.participants.filter((p) => p !== gs.player.key)[0];
    if (!partner) {
      return [];
    }
    return [
      {
        label: 'Romance',
        actionType: ActionType.Romance,
        isLongAction: false,
        actionParameters: {
          characterKey: partner,
        },
        missingParameters: {
          romanceType: [RomanceType.DeepenRelationship, RomanceType.Physical],
        },
      },
    ];
  }
  return [];
}
