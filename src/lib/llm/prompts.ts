import type { AttributeCheck } from '@/lib/_model/model-sim';
import { NARRATION_SYSTEM_PROMPT } from './config';
import { buildLlmContext } from './context-builder';
import { completeChat } from './llm-service';

export async function generateAttributeCheckNarration(check: AttributeCheck): Promise<string> {
  const userPrompt = [
    buildLlmContext({ attributeCheck: check }),
    'Write one short paragraph describing what happens.',
  ].join('\n\n');

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
