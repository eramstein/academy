import { getCharacterImagePath } from '@/lib/_utils/asset-paths';
import { generateImage } from '@/lib/image_gen';
import { generateAttributeCheckNarration } from '@/lib/llm/prompts';
import type { CardTemplate, DayPeriod } from '../_model';
import { NarrationType } from '../_model/enums-sim';
import type { Action, AttributeCheck, Job, Mentions, Narration } from '../_model/model-sim';
import { gs } from '../_state';
import type { TransactionParameters } from './actions';
import { actionTemplates, getActionTemplateMeta } from './cards/action-templates';
import { formatKeywordLabel, KEYWORD_KEYS } from './cards/keywords';
import { getWeekDay, WEEK_DAYS } from './time';

export function narrate(narration: Narration) {
  const expandedNarration = {
    ...narration,
    mentions: narration.mentions ?? findMentions(narration.text),
  };
  gs.scene.narration.push(expandedNarration);
  if (expandedNarration.imagePrompt && !expandedNarration.imageUrl) {
    void fillNarrationImage(expandedNarration.id, expandedNarration.imagePrompt);
  }
}

function revokeNarrationImage(narration: Narration) {
  if (!narration.imageUrl) return;
  URL.revokeObjectURL(narration.imageUrl);
  narration.imageUrl = undefined;
}

async function fillNarrationImage(id: string, imagePrompt: string) {
  const entry = gs.scene.narration.find((narration) => narration.id === id);
  if (!entry || entry.imagePrompt !== imagePrompt) return;
  try {
    const referenceImage = await loadCharacterPortrait(portraitKeyForNarration(entry));
    const { blob } = await generateImage(imagePrompt, {
      workflow: 'flux2-klein-narration',
      filenamePrefix: 'academy_scene',
      referenceImage,
    });
    const current = gs.scene.narration.find((narration) => narration.id === id);
    if (!current || current.imagePrompt !== imagePrompt) return;
    revokeNarrationImage(current);
    current.imageUrl = URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to generate narration image', error);
    const current = gs.scene.narration.find((narration) => narration.id === id);
    if (current && current.imagePrompt === imagePrompt && !current.imageUrl) {
      current.imagePrompt = undefined;
    }
  }
}

function portraitKeyForNarration(entry: Narration): string {
  const fromAction = focusCharacterKey(entry.attributeCheck?.attemptedAction);
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
  const kept: Narration[] = [];
  for (const narration of gs.scene.narration) {
    if (narration.type === NarrationType.AttributeCheck) {
      revokeNarrationImage(narration);
    } else {
      kept.push(narration);
    }
  }
  gs.scene.narration = kept;
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
  entry.imagePrompt = imagePrompt;
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

export function narrateText(text: string) {
  narrate({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.Text,
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
