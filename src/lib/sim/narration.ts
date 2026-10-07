import { getCharacterImagePath } from '@/lib/_utils/asset-paths';
import { generateImage, isImageGenAvailable } from '@/lib/image_gen';
import {
  generateAttemptedActionNarration,
  generateAttributeCheckNarration,
} from '@/lib/llm/prompts';
import type { CardTemplate, DayPeriod } from '../_model';
import { ActionType, Emotion, NarrationType } from '../_model/enums-sim';
import type { Action, AttributeCheck, Job, Mentions, Narration } from '../_model/model-sim';
import { gs } from '../_state';
import type { TransactionParameters } from './actions';
import { actionTemplates, getActionTemplateMeta } from './cards/action-templates';
import { formatKeywordLabel, KEYWORD_KEYS } from './cards/keywords';
import { getCachedSceneImageUrl, saveCachedSceneImage } from './scene-image-cache';
import { getWeekDay, WEEK_DAYS } from './time';

export function narrate(narration: Narration) {
  const imagePrompt = narration.imageUrl ? undefined : narration.imagePrompt;
  const expandedNarration = {
    ...narration,
    imagePrompt: narration.imageUrl ? narration.imagePrompt : undefined,
    mentions: narration.mentions ?? findMentions(narration.text),
  };
  gs.scene.narration.push(expandedNarration);
  if (imagePrompt) {
    void fillNarrationImage(expandedNarration.id, imagePrompt);
  }
}

function revokeNarrationImage(narration: Narration) {
  if (!narration.imageUrl?.startsWith('blob:')) return;
  URL.revokeObjectURL(narration.imageUrl);
  narration.imageUrl = undefined;
}

export async function cacheNarrationSceneImage(id: string): Promise<void> {
  const entry = gs.scene.narration.find((narration) => narration.id === id);
  if (!entry?.imagePrompt || !entry.imageUrl) return;
  const response = await fetch(entry.imageUrl);
  if (!response.ok) {
    throw new Error('Could not read scene image');
  }
  await saveCachedSceneImage(entry.imagePrompt, await response.blob());
}

function narrationAcceptsPrompt(
  entry: Narration | undefined,
  imagePrompt: string
): entry is Narration {
  if (!entry) return false;
  return !entry.imagePrompt || entry.imagePrompt === imagePrompt;
}

async function fillNarrationImage(id: string, imagePrompt: string) {
  const entry = gs.scene.narration.find((narration) => narration.id === id);
  if (!narrationAcceptsPrompt(entry, imagePrompt)) return;
  try {
    const cachedUrl = await getCachedSceneImageUrl(imagePrompt);
    const current = gs.scene.narration.find((narration) => narration.id === id);
    if (!narrationAcceptsPrompt(current, imagePrompt)) return;
    if (cachedUrl) {
      current.imagePrompt = imagePrompt;
      revokeNarrationImage(current);
      current.imageUrl = cachedUrl;
      return;
    }
    if (!isImageGenAvailable()) return;
    current.imagePrompt = imagePrompt;
    const referenceImage = await loadCharacterPortrait(portraitKeyForNarration(current));
    const { blob } = await generateImage(imagePrompt, {
      workflow: 'flux2-klein-narration',
      filenamePrefix: 'academy_scene',
      referenceImage,
    });
    const illustrated = gs.scene.narration.find((narration) => narration.id === id);
    if (!illustrated || illustrated.imagePrompt !== imagePrompt) return;
    revokeNarrationImage(illustrated);
    illustrated.imageUrl = URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to generate narration image', error);
    const current = gs.scene.narration.find((narration) => narration.id === id);
    if (current && current.imagePrompt === imagePrompt && !current.imageUrl) {
      current.imagePrompt = undefined;
    }
  }
}

function portraitKeyForNarration(entry: Narration): string {
  const fromAction = focusCharacterKey(
    entry.attributeCheck?.attemptedAction ?? entry.attemptedAction
  );
  if (fromAction && (gs.characters[fromAction] || fromAction === gs.player.key)) {
    return fromAction;
  }
  const mentioned = entry.mentions?.characters.find(([, id]) => Boolean(gs.characters[id]));
  if (mentioned) return mentioned[1];
  return gs.player.key;
}

function focusCharacterKey(action?: Action): string | undefined {
  if (!action) return undefined;
  const params = action.actionParameters ?? {};
  if (typeof params.characterKey === 'string') return params.characterKey;
  if (typeof params.partner === 'string') return params.partner;
  if (typeof params.opponentKey === 'string') return params.opponentKey;
  if (params.job && typeof params.job.employerKey === 'string') return params.job.employerKey;
  return undefined;
}

async function loadCharacterPortrait(characterKey: string): Promise<Blob> {
  const response = await fetch(getCharacterImagePath(characterKey));
  if (!response.ok) {
    throw new Error(`Character portrait not found: ${characterKey}`);
  }
  return response.blob();
}

function findMentions(text: string): Mentions {
  const mentions: Mentions = { keywords: [], characters: [], actions: [] };
  let remaining = text;

  const candidates: { type: keyof Mentions; word: string; id: string }[] = [
    ...Object.values(gs.characters).map((character) => ({
      type: 'characters' as const,
      word: character.name,
      id: character.key,
    })),
    ...KEYWORD_KEYS.flatMap((key) => {
      const label = formatKeywordLabel(key);
      const words = label === key ? [key] : [label, key];
      return words.map((word) => ({ type: 'keywords' as const, word, id: key }));
    }),
    ...Object.keys(actionTemplates).flatMap((key) => {
      const label = getActionTemplateMeta(key)?.label ?? formatKeywordLabel(key);
      const words = label === key ? [key] : [label, key];
      return words.map((word) => ({ type: 'actions' as const, word, id: key }));
    }),
  ].sort((a, b) => b.word.length - a.word.length);

  for (const { type, word, id } of candidates) {
    const match = remaining.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i'));
    if (match) {
      mentions[type].push([match[0], id]);
      remaining = remaining.replace(match[0], ' '.repeat(match[0].length));
    }
  }

  return mentions;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function narrateAttributeCheck(attributeCheck: AttributeCheck) {
  const id = crypto.randomUUID();
  narrate({
    id,
    text: '',
    type: NarrationType.AttributeCheck,
    attributeCheck,
  });
  void fillAttributeCheckNarration(id, attributeCheck);
}

async function fillAttributeCheckNarration(id: string, attributeCheck: AttributeCheck) {
  let text: string;
  let imagePrompt: string | undefined;
  try {
    const result = await generateAttributeCheckNarration(attributeCheck);
    text = result.text;
    imagePrompt = result.imagePrompt;
  } catch (error) {
    console.error('Failed to generate attribute check narration', error);
    text = fallbackAttributeCheckText(attributeCheck);
  }
  const entry = gs.scene.narration.find((narration) => narration.id === id);
  if (!entry) return;
  entry.text = text;
  entry.mentions = findMentions(text);
  if (imagePrompt) {
    void fillNarrationImage(id, imagePrompt);
  }
}

function fallbackAttributeCheckText(attributeCheck: AttributeCheck): string {
  const verb = attributeCheck.critical
    ? attributeCheck.success
      ? 'brilliantly succeed through'
      : 'catastrophically falter despite'
    : attributeCheck.success
      ? 'succeed through'
      : 'fall short despite';
  return `You ${verb} your ${attributeCheck.attribute}.`;
}

export function narrateAttemptedAction(action: Action) {
  const id = crypto.randomUUID();
  narrate({
    id,
    text: '',
    type: NarrationType.Text,
    attemptedAction: action,
  });
  void fillAttemptedActionNarration(id, action);
}

async function fillAttemptedActionNarration(id: string, action: Action) {
  let text: string;
  let imagePrompt: string | undefined;
  try {
    const result = await generateAttemptedActionNarration(action);
    text = result.text;
    imagePrompt = result.imagePrompt;
  } catch (error) {
    console.error('Failed to generate action narration', error);
    text = fallbackAttemptedActionText(action);
  }
  const entry = gs.scene.narration.find((narration) => narration.id === id);
  if (!entry) return;
  entry.text = text;
  entry.mentions = findMentions(text);
  if (imagePrompt) {
    void fillNarrationImage(id, imagePrompt);
  }
}

function fallbackAttemptedActionText(action: Action): string {
  const params = action.actionParameters ?? {};
  if (action.actionType === ActionType.Socialize && typeof params.characterKey === 'string') {
    const name = gs.characters[params.characterKey]?.name ?? 'someone';
    return `You try to ${params.socializeType ?? 'talk with'} ${name}.`;
  }
  return `You ${String(action.actionType).replace(/_/g, ' ')}.`;
}

export function narrateText(text: string, options?: { characterKey?: string; emotion?: Emotion }) {
  narrate({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.Text,
    ...(options?.characterKey ? { characters: [options.characterKey] } : {}),
    ...(options?.emotion ? { emotion: options.emotion } : {}),
  });
}

export function narrateNewPeriod(day: number, period: DayPeriod) {
  narrate({
    id: crypto.randomUUID(),
    text: `${WEEK_DAYS[getWeekDay(day) - 1]} ${period}`,
    type: NarrationType.NewPeriod,
    day,
    period,
  });
}

export function narrateMatchResult(won: boolean, opponentKey: string) {
  narrate({
    id: crypto.randomUUID(),
    text: `${won ? 'Victory!' : 'Defeat...'}`,
    type: NarrationType.MatchResult,
    characters: [opponentKey],
    won,
  });
}

export function narrateCardConjured(cardId: string, text: string) {
  narrate({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.ConjuredCard,
    cardIds: [cardId],
  });
}

export function narrateGiftCardChoice(cards: CardTemplate[], text: string) {
  narrate({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.GiftCardChoice,
    cardTemplates: cards,
  });
}

export function narrateCardEncanted(oldCard: CardTemplate, newCard: CardTemplate, text: string) {
  narrate({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.ConjuredCard,
    cardTemplates: [oldCard, newCard],
  });
}

export function narrateTransaction(transaction: TransactionParameters) {
  narrate({
    id: crypto.randomUUID(),
    text: `You spent ${transaction.cost} gold to purchase ${Object.entries(
      transaction.items?.resources ?? {}
    )
      .map(([type, count]) => `${count} ${type.replace(/_/g, ' ').toLowerCase()}`)
      .join(', ')}.`,
    type: NarrationType.Transaction,
    transaction: transaction,
  });
}

export function narrateJobResult(job: Job, outcome: boolean, gold: number) {
  narrate({
    id: crypto.randomUUID(),
    text: outcome ? `You succeeded at ${job.name}.` : `You failed at ${job.name}.`,
    type: NarrationType.JobResult,
    gold,
  });
}
