import type { CardTemplate, DayPeriod } from '../_model';
import { NarrationType } from '../_model/enums-sim';
import type { AttributeCheck, Mentions, Narration } from '../_model/model-sim';
import { gs } from '../_state';
import { KEYWORD_KEYS } from './cards/keywords';
import { getWeekDay, WEEK_DAYS } from './time';

export function narrate(narration: Narration) {
  const expandedNarration = {
    ...narration,
    mentions: narration.mentions ?? findMentions(narration.text),
  };
  gs.scene.narration.push(expandedNarration);
}

function findMentions(text: string): Mentions {
  const mentions: Mentions = { keywords: [], characters: [] };
  let remaining = text;

  const candidates: { type: keyof Mentions; word: string; id: string }[] = [
    ...Object.values(gs.characters).map((character) => ({
      type: 'characters' as const,
      word: character.name,
      id: character.key,
    })),
    ...KEYWORD_KEYS.map((key) => ({
      type: 'keywords' as const,
      word: key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(),
      id: key,
    })),
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
  gs.scene.narration = gs.scene.narration.filter(
    (narration) => narration.type !== NarrationType.AttributeCheck
  );
  narrate({
    id: crypto.randomUUID(),
    text: `You roll a ${attributeCheck.roll} on a ${attributeCheck.difficulty} difficulty check for ${attributeCheck.attribute}.`,
    type: NarrationType.AttributeCheck,
    attributeCheck,
  });
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
