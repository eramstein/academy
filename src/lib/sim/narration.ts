import {
  getCharacterImagePath,
  getEventImagePath,
  getEventImageRefs,
  resolveEventImageFileName,
} from '@/lib/_utils/asset-paths';
import { generateImage, isImageGenAvailable } from '@/lib/image_gen';
import {
  generateAttemptedActionNarration,
  generateAttributeCheckNarration,
} from '@/lib/llm/prompts';
import { ActivityType, type CardTemplate, type DayPeriod, type ScheduledActivity } from '../_model';
import { ActionType, Emotion, NarrationType } from '../_model/enums-sim';
import type {
  Action,
  AttributeCheck,
  EventImageSize,
  Job,
  Mentions,
  Narration,
} from '../_model/model-sim';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import type { TransactionParameters } from './actions';
import { probeFirstExistingImage } from './activity-image';
import { actionTemplates, getActionTemplateMeta } from './cards/action-templates';
import { formatKeywordLabel, KEYWORD_KEYS } from './cards/keywords';
import { readChatTopicText, textsForActivity } from './chat-topics';
import { getCachedSceneImageUrl, saveCachedSceneImage } from './scene-image-cache';
import { getWeekDay, WEEK_DAYS } from './time';

const ACTIVITY_NARRATION: Record<ActivityType, string> = {
  [ActivityType.Class]: 'in class',
  [ActivityType.Work]: 'working',
  [ActivityType.Social]: 'socializing',
  [ActivityType.Date]: 'on a date',
  [ActivityType.Training]: 'training',
  [ActivityType.Study]: 'studying',
  [ActivityType.Tournament]: 'competing',
  [ActivityType.Exam]: 'taking an exam',
  [ActivityType.Event]: 'an event occured',
  [ActivityType.Adventure]: 'adventuring',
  [ActivityType.LeagueCeremony]: 'attending the league ceremony',
  [ActivityType.Sports]: 'playing sports',
};

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

/** Push a check into the narration stream. LLM text waits until resolveAttributeCheckNarration. */
export function narrateAttributeCheck(attributeCheck: AttributeCheck): string {
  const id = crypto.randomUUID();
  narrate({
    id,
    text: '',
    type: NarrationType.AttributeCheck,
    attributeCheck,
  });
  return id;
}

/** After the roll resolves, fill LLM narration for a previously pending check. */
export function resolveAttributeCheckNarration(id: string, attributeCheck: AttributeCheck) {
  const entry = gs.scene.narration.find((narration) => narration.id === id);
  if (entry) {
    entry.attributeCheck = attributeCheck;
  }
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

/** Outcome of a check that should shape the prose without appearing as its own narration. */
export type SilentCheckOutcome = {
  success: boolean;
  critical: boolean;
  attribute: string;
  difficulty: string;
};

export type AttemptedNarrationHints = {
  /** Called after generated prose is saved. Skipped when the model call fails. */
  onGenerated?: () => void;
};

export function narrateAttemptedAction(
  action: Action,
  outcome?: SilentCheckOutcome,
  hints?: AttemptedNarrationHints
) {
  const id = crypto.randomUUID();
  narrate({
    id,
    text: '',
    type: NarrationType.Text,
    attemptedAction: action,
  });
  void fillAttemptedActionNarration(id, action, outcome, hints);
}

async function fillAttemptedActionNarration(
  id: string,
  action: Action,
  outcome?: SilentCheckOutcome,
  hints?: AttemptedNarrationHints
) {
  let text: string;
  let imagePrompt: string | undefined;
  let generated = false;
  try {
    const result = outcome
      ? await generateAttributeCheckNarration({
          success: outcome.success,
          critical: outcome.critical,
          roll: 0,
          attribute: outcome.attribute,
          difficulty: outcome.difficulty,
          target: 0,
          attemptedAction: action,
        })
      : await generateAttemptedActionNarration(action);
    text = result.text;
    imagePrompt = result.imagePrompt;
    generated = true;
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
  if (generated) hints?.onGenerated?.();
}

function fallbackAttemptedActionText(action: Action): string {
  const params = action.actionParameters ?? {};
  if (action.actionType === ActionType.Socialize && typeof params.characterKey === 'string') {
    const name = gs.characters[params.characterKey]?.name ?? 'someone';
    return `You try to ${params.socializeType ?? 'talk with'} ${name}.`;
  }
  return `You ${String(action.actionType).replace(/_/g, ' ')}.`;
}

export function narrateText(
  text: string,
  options?: {
    title?: string;
    characterKey?: string;
    emotion?: Emotion;
    image?: string;
    /** Pre-resolved asset URL (built-in or mod); wins over `image`. */
    imageUrl?: string;
    imageSize?: EventImageSize;
    eventKey?: string;
  }
) {
  const id = crypto.randomUUID();
  const imageFile = options?.image
    ? resolveEventImageFileName(options.eventKey ?? '', options.image)
    : undefined;
  const imageUrl = options?.imageUrl ?? (imageFile ? getEventImagePath(imageFile) : undefined);
  const imageSize = imageUrl ? (options?.imageSize ?? 'small') : undefined;
  if (imageUrl && imageSize === 'large') {
    gs.scene.image = imageUrl;
  }
  narrate({
    id,
    text,
    type: NarrationType.Text,
    ...(options?.title ? { title: options.title } : {}),
    ...(options?.characterKey ? { characters: [options.characterKey] } : {}),
    ...(options?.emotion ? { emotion: options.emotion } : {}),
    ...(imageUrl ? { imageUrl, imageSize } : {}),
  });

  // Prefer images/events/, then any mod that ships the same filename.
  if (!options?.imageUrl && imageFile) {
    const provisionalUrl = imageUrl;
    void probeFirstExistingImage(getEventImageRefs(imageFile)).then((ref) => {
      if (!ref) return;
      const resolved = ref.url;
      if (resolved === provisionalUrl) return;
      const entry = gs.scene.narration.find((n) => n.id === id);
      if (entry && entry.imageUrl === provisionalUrl) {
        entry.imageUrl = resolved;
      }
      if (imageSize === 'large' && gs.scene.image === provisionalUrl) {
        gs.scene.image = resolved;
      }
    });
  }
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
  const resourceParts = Object.entries(transaction.items?.resources ?? {})
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([type, count]) => `${count} ${type.replace(/_/g, ' ').toLowerCase()}`);
  const possessionParts = Object.entries(transaction.items?.possessions ?? {})
    .filter(([, name]) => typeof name === 'string' && name.trim())
    .map(([, name]) => (name as string).trim());
  const itemText = [...resourceParts, ...possessionParts].join(', ') || 'nothing';
  narrate({
    id: crypto.randomUUID(),
    text: `You spent ${transaction.cost} gold to purchase ${itemText}.`,
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

export function narrateRelationUpdate(characterKey: string, tagText: string) {
  const character = gs.characters[characterKey];
  const firstName = (character?.name ?? characterKey).split(/\s+/)[0] ?? characterKey;
  narrate({
    id: crypto.randomUUID(),
    text: tagText,
    type: NarrationType.RelationUpdate,
    characters: [characterKey],
    title: `${firstName} · relation update`,
  });
}

/** Prefer a ChatTopicText that fits a participant and this activity; else a short stock line. */
export async function narrateScheduledActivity(activity: ScheduledActivity) {
  const npcKeys = activity.participants.filter((key) => key !== gs.player.key);
  const lines = await textsForActivity(activity.type, npcKeys, activity.placeKey);
  if (lines.length > 0) {
    const line = getRandomFromArray(lines);
    const prose = await readChatTopicText(line);
    if (prose) {
      const companionKey = line.npcKey ?? npcKeys[0];
      const companionName = companionKey
        ? (gs.characters[companionKey]?.name ?? companionKey).split(/\s+/)[0]
        : undefined;
      narrateText(
        companionName ? prose.replaceAll('your companion', companionName) : prose,
        companionKey ? { characterKey: companionKey } : undefined
      );
      return;
    }
  }

  const others = npcKeys
    .map((key) => gs.characters[key]?.name ?? key)
    .filter(Boolean);
  const phrase = ACTIVITY_NARRATION[activity.type] ?? activity.type;
  if (others.length === 0) {
    narrateText(`You are ${phrase}.`);
    return;
  }
  const withWhom =
    others.length === 1
      ? others[0]
      : `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}`;
  narrateText(`You are ${phrase} with ${withWhom}.`);
}
