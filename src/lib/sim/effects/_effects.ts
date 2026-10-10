import type { EventEffect } from '@/lib/_model';
import { EventEffectType } from '@/lib/_model/enums-sim';
import { narrateText } from '../narration';
import { levelAttribute, type LevelAttributeParameters } from './attributes';
import { getDeck, type GetDeckParameters } from './decks';
import { unlockEvent, type UnlockEventParameters } from './events';
import { offerCardGifts, type OfferCardGiftsParameters } from './gifts';
import { addGold, type AddGoldParameters } from './gold';
import { getJob, type GetJobParameters } from './jobs';
import { narrate, type NarrateParameters } from './narrate';
import { changeRelation, type ChangeRelationParameters } from './relations';
import { addResource, type AddResourceParameters } from './resources';
import { scheduleActivities, type ScheduleActivitiesParameters } from './schedule';
import { subscribe, type TransactionSubscriptionParameters } from './subscribe';
import {
  teachAbility,
  teachColor,
  type TeachAbilityParameters,
  type TeachColorParameters,
} from './teach';

export function applyEffect(effect: EventEffect) {
  const result = effectFunctions[effect.type](effect.parameters);
  if (result) {
    narrateText(result);
  }
}

const effectFunctions: Record<EventEffectType, (parameters: Record<string, any>) => string> = {
  [EventEffectType.GetDeck]: (parameters) => getDeck(parameters as GetDeckParameters),
  [EventEffectType.Subscribe]: (parameters) =>
    subscribe(parameters as TransactionSubscriptionParameters),
  [EventEffectType.AddResource]: (parameters) => addResource(parameters as AddResourceParameters),
  [EventEffectType.AddGold]: (parameters) => addGold(parameters as AddGoldParameters),
  [EventEffectType.ScheduleActivity]: (parameters) =>
    scheduleActivities(parameters as ScheduleActivitiesParameters),
  [EventEffectType.GetJob]: (parameters) => getJob(parameters as GetJobParameters),
  [EventEffectType.UnlockEvent]: (parameters) => unlockEvent(parameters as UnlockEventParameters),
  [EventEffectType.OfferCardGifts]: (parameters) =>
    offerCardGifts(parameters as OfferCardGiftsParameters),
  [EventEffectType.TeachColor]: (parameters) => teachColor(parameters as TeachColorParameters),
  [EventEffectType.TeachAbility]: (parameters) =>
    teachAbility(parameters as TeachAbilityParameters),
  [EventEffectType.Narrate]: (parameters) => narrate(parameters as NarrateParameters),
  [EventEffectType.LevelAttribute]: (parameters) =>
    levelAttribute(parameters as LevelAttributeParameters),
  [EventEffectType.ChangeRelation]: (parameters) =>
    changeRelation(parameters as ChangeRelationParameters),
};
