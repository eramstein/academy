import type { AttributeCheck } from '@/lib/_model/model-sim';
import { NARRATION_SYSTEM_PROMPT } from './config';
import { completeChat } from './llm-service';

function outcomeLabel(check: AttributeCheck): string {
  if (check.critical) {
    return check.success ? 'a critical success' : 'a critical failure';
  }
  return check.success ? 'a success' : 'a failure';
}

export async function generateAttributeCheckNarration(
  check: AttributeCheck,
  context: { placeName?: string } = {}
): Promise<string> {
  const placeLine = context.placeName ? ` They are at ${context.placeName}.` : '';
  const userPrompt = [
    `The player's character just attempted a ${check.attribute} check of ${check.difficulty.toLowerCase()} difficulty.${placeLine}`,
    `The result is ${outcomeLabel(check)}.`,
    'Write one short paragraph describing what happens.',
  ].join(' ');

  const text = await completeChat(
    [
      { role: 'system', content: NARRATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.8, maxTokens: 220 }
  );

  return trimIncompleteSentence(text.replace(/^["']+|["']+$/g, '').trim());
}

function trimIncompleteSentence(text: string): string {
  if (/[.!?]["']?$/.test(text)) return text;
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return last === -1 ? text : text.slice(0, last + 1);
}
