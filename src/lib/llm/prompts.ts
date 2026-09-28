import type { AttributeCheck } from '@/lib/_model/model-sim';
import { z } from 'zod';
import { NARRATION_SYSTEM_PROMPT } from './config';
import { buildLlmContext } from './context-builder';
import { completeChat } from './llm-service';

const AttributeCheckNarrationSchema = z.object({
  text: z.string().min(1),
  imagePrompt: z.string().min(1),
});

export type AttributeCheckNarration = z.infer<typeof AttributeCheckNarrationSchema>;

export async function generateAttributeCheckNarration(
  check: AttributeCheck
): Promise<AttributeCheckNarration> {
  const userPrompt = [
    buildLlmContext({ attributeCheck: check }),
    [
      'Return JSON with:',
      '- text: one short paragraph describing what happens.',
      '- imagePrompt: a short image description focused on one NPC, the location, and what that NPC does or feels.',
    ].join('\n'),
  ].join('\n\n');

  const parsed = await completeChat(
    [
      { role: 'system', content: NARRATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.8,
      maxTokens: 320,
      schema: AttributeCheckNarrationSchema,
      schemaName: 'attribute-check-narration',
    }
  );

  return {
    text: trimIncompleteSentence(parsed.text.replace(/^["']+|["']+$/g, '').trim()),
    imagePrompt: parsed.imagePrompt.replace(/^["']+|["']+$/g, '').trim(),
  };
}

function trimIncompleteSentence(text: string): string {
  if (/[.!?]["']?$/.test(text)) return text;
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return last === -1 ? text : text.slice(0, last + 1);
}
