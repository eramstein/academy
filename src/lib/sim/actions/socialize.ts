import type { Action, Npc } from '@/lib/_model';
import { ActionType, ActivityType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';
import { attributeCheck, skillCheckDifficulty } from '../attribute-checks';
import { getCharactersAtScene } from '../characters';
import { offerCardGifts } from '../effects/gifts';
import { narrateAttemptedAction, narrateText } from '../narration';
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
}

export enum RomanceType {
  DeepenRelationship = 'deepen-relationship',
  Physical = 'physical',
}

export interface RomanceParameters {
  characterKey: string;
  romanceType: RomanceType;
}

const SOCIALIZE_RELATION: Record<SocializeType, keyof Npc['relationProgress']> = {
  [SocializeType.Befriend]: 'friendship',
  [SocializeType.Taunt]: 'rivalry',
  [SocializeType.Impress]: 'respect',
  [SocializeType.Flirt]: 'love',
};

// progresses a relation parameter; used to trigger relation events
export function socialize(parameters: SocializeParameters): string {
  const partner = gs.characters[parameters.characterKey];
  const relationKey = SOCIALIZE_RELATION[parameters.socializeType];
  partner.relationProgress[relationKey] = (partner.relationProgress[relationKey] ?? 0) + 1;
  narrateAttemptedAction({
    label: 'Socialize',
    actionType: ActionType.Socialize,
    isLongAction: false,
    actionParameters: {
      characterKey: parameters.characterKey,
      socializeType: parameters.socializeType,
    },
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

export function romance(parameters: RomanceParameters): string {
  const partner = gs.characters[parameters.characterKey];
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
    },
  };

  if (parameters.romanceType === RomanceType.DeepenRelationship) {
    partner.relationProgress.love = (partner.relationProgress.love ?? 0) + 1;
    narrateAttemptedAction(action);
    return '';
  }

  if (parameters.romanceType === RomanceType.Physical) {
    const { success } = attributeCheck(
      gs.player.attributes.vitality,
      skillCheckDifficulty.trivial,
      'vitality',
      action
    );
    if (success) {
      narrateText(`${partner.name} offers you a card as a gift.`, {
        characterKey: parameters.characterKey,
      });
      offerCardGifts({
        count: 3,
        poolKeys: [parameters.characterKey, 'base'],
      });
    }
    return '';
  }

  return '';
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
        label: 'Deepen Relationship',
        actionType: ActionType.Romance,
        isLongAction: false,
        actionParameters: {
          characterKey: partner,
          romanceType: RomanceType.DeepenRelationship,
        },
      },
      {
        label: 'Physical Interaction',
        actionType: ActionType.Romance,
        isLongAction: false,
        actionParameters: {
          characterKey: partner,
          romanceType: RomanceType.Physical,
        },
      },
    ];
  }
  return [];
}
