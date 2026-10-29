import type { EventEffect } from '@/lib/_model';
import { EventEffectType } from '@/lib/_model/enums-sim';
import { narrateText } from '../narration';
import { levelAttribute, type LevelAttributeParameters } from './attributes';
import { levelUpCharacter, type LevelUpCharacterParameters } from './characters';
import { getDeck, type GetDeckParameters } from './decks';
import { followUpEvent, type FollowUpEventParameters } from './events';
import { useFocus, type UseFocusParameters } from './focus';
import {
  giftCardToCharacter,
  offerCardGifts,
  type GiftCardToCharacterParameters,
  type OfferCardGiftsParameters,
} from './gifts';
import { addGold, type AddGoldParameters } from './gold';
import { getJob, type GetJobParameters } from './jobs';
import { narrate, type NarrateParameters } from './narrate';
import { move, type MoveParameters } from './move';
import {
  addRelationTag,
  changeRelation,
  updateRelationArc,
  type AddRelationTagParameters,
  type ChangeRelationParameters,
  type UpdateRelationArcParameters,
} from './relations';
import { addResource, type AddResourceParameters } from './resources';
import { scheduleActivities, type ScheduleActivitiesParameters } from './schedule';
import { subscribe, type TransactionSubscriptionParameters } from './subscribe';
import { addStoryTag, type AddStoryTagParameters } from './story-tags';
import {
  teachAbility,
  teachColor,
  type TeachAbilityParameters,
  type TeachColorParameters,
} from './teach';
import { addKnownTrait, type AddKnownTraitParameters } from './traits';
import { addChatTopic, type AddChatTopicParameters } from './chat-topics';
import { startMatch, type StartMatchParameters } from './match';
import { newLeagueSeason, type NewLeagueSeasonParameters } from './league';
import { addPossession, type AddPossessionParameters } from './possessions';
import {
  acquireArtifactPattern,
  giftArtifact,
  type AcquireArtifactPatternParameters,
  type GiftArtifactParameters,
} from './artifacts';

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
  [EventEffectType.FollowUpEvent]: (parameters) =>
    followUpEvent(parameters as FollowUpEventParameters),
  [EventEffectType.OfferCardGifts]: (parameters) =>
    offerCardGifts(parameters as OfferCardGiftsParameters),
  [EventEffectType.GiftCardToCharacter]: (parameters) =>
    giftCardToCharacter(parameters as GiftCardToCharacterParameters),
  [EventEffectType.TeachColor]: (parameters) => teachColor(parameters as TeachColorParameters),
  [EventEffectType.TeachAbility]: (parameters) =>
    teachAbility(parameters as TeachAbilityParameters),
  [EventEffectType.Narrate]: (parameters) => narrate(parameters as NarrateParameters),
  [EventEffectType.LevelAttribute]: (parameters) =>
    levelAttribute(parameters as LevelAttributeParameters),
  [EventEffectType.LevelUpCharacter]: (parameters) =>
    levelUpCharacter(parameters as LevelUpCharacterParameters),
  [EventEffectType.ChangeRelation]: (parameters) =>
    changeRelation(parameters as ChangeRelationParameters),
  [EventEffectType.UpdateRelationArc]: (parameters) =>
    updateRelationArc(parameters as UpdateRelationArcParameters),
  [EventEffectType.AddRelationTag]: (parameters) =>
    addRelationTag(parameters as AddRelationTagParameters),
  [EventEffectType.AddStoryTag]: (parameters) => addStoryTag(parameters as AddStoryTagParameters),
  [EventEffectType.AddKnownTrait]: (parameters) =>
    addKnownTrait(parameters as AddKnownTraitParameters),
  [EventEffectType.AddChatTopic]: (parameters) =>
    addChatTopic(parameters as AddChatTopicParameters),
  [EventEffectType.Move]: (parameters) => move(parameters as MoveParameters),
  [EventEffectType.UseFocus]: (parameters) => useFocus(parameters as UseFocusParameters),
  [EventEffectType.StartMatch]: (parameters) => startMatch(parameters as StartMatchParameters),
  [EventEffectType.NewLeagueSeason]: (parameters) =>
    newLeagueSeason(parameters as NewLeagueSeasonParameters),
  [EventEffectType.AddPossession]: (parameters) =>
    addPossession(parameters as AddPossessionParameters),
  [EventEffectType.AcquireArtifactPattern]: (parameters) =>
    acquireArtifactPattern(parameters as AcquireArtifactPatternParameters),
  [EventEffectType.GiftArtifact]: (parameters) =>
    giftArtifact(parameters as GiftArtifactParameters),
};
