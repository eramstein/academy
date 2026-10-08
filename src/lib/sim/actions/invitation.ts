import { ActionType, DayPeriod, type ActivityType } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { attributeCheck, skillCheckDifficulty } from '../attribute-checks';
import { scheduleActivities } from '../effects/schedule';

export interface InviteParameters {
  type: ActivityType;
  placeKey: string;
  day?: number;
  period?: DayPeriod;
  characterKey: string;
}

export function invite(parameters: InviteParameters): string {
  const period = parameters.period ?? DayPeriod.Evening;
  const { success } = attributeCheck(
    gs.player.attributes.charisma,
    skillCheckDifficulty.trivial,
    'charisma',
    {
      label: 'Invite',
      actionType: ActionType.Invite,
      actionParameters: { ...parameters, period },
      isLongAction: false,
    }
  );

  if (!success) {
    return '';
  }

  return scheduleActivities({
    activity: {
      type: parameters.type,
      placeKey: parameters.placeKey,
      participants: [gs.player.key, parameters.characterKey],
    },
    schedule: {
      date: {
        day: parameters.day,
        period,
      },
      nextFree: parameters.day === undefined,
    },
  });
}
