import type { EventEffect } from '@/lib/_model';
import { EventEffectType } from '@/lib/_model/enums-sim';
import { narrateText } from '../narration';
import { getDeck, type GetDeckParameters } from './decks';
import { unlockEvent, type UnlockEventParameters } from './events';
import { getJob, type GetJobParameters } from './jobs';
import { addResource, type AddResourceParameters } from './resources';
import { scheduleActivities, type ScheduleActivitiesParameters } from './schedule';
import { subscribe, type TransactionSubscriptionParameters } from './subscribe';

export function applyEffect(effect: EventEffect) {
  const result = effectFunctions[effect.type](effect.parameters);
  narrateText(result);
}

const effectFunctions: Record<EventEffectType, (parameters: Record<string, any>) => string> = {
  [EventEffectType.GetDeck]: (parameters) => getDeck(parameters as GetDeckParameters),
  [EventEffectType.Subscribe]: (parameters) =>
    subscribe(parameters as TransactionSubscriptionParameters),
  [EventEffectType.AddResource]: (parameters) => addResource(parameters as AddResourceParameters),
  [EventEffectType.ScheduleActivity]: (parameters) =>
    scheduleActivities(parameters as ScheduleActivitiesParameters),
  [EventEffectType.GetJob]: (parameters) => getJob(parameters as GetJobParameters),
  [EventEffectType.UnlockEvent]: (parameters) => unlockEvent(parameters as UnlockEventParameters),
};
