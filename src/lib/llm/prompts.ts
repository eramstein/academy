import type { Action, AttributeCheck } from '@/lib/_model/model-sim';
import { z } from 'zod';
import { BATTLE_GREETING_SYSTEM_PROMPT, NARRATION_SYSTEM_PROMPT } from './config';
import {
  buildBattleGreetingContext,
  buildLlmContext,
  type LlmContextParams,
} from './context-builder';
import { completeChat } from './llm-service';

const SceneNarrationSchema = z.object({
  text: z.string().min(1),
  imagePrompt: z
    .string()
    .min(1)
    .max(320)
    .describe(
      "25–40 words: the NPC's physical action, a visible expression, the place, and relevant objects. No appearance, clothing, or inner feelings."
    ),
});

export type SceneNarration = z.infer<typeof SceneNarrationSchema>;
export type AttributeCheckNarration = SceneNarration;

const GREETING_ANGLES = [
  'Let their speech, or how they handle conflict, show in the wording.',
  'Talk about the duel through whatever this person actually cares about.',
  'If they barely know the player, the sentence should size the player up. If they have history, that history should be specific.',
];

async function generateSceneNarration(
  contextParams: LlmContextParams,
  systemPrompt: string = NARRATION_SYSTEM_PROMPT,
  extraUserGuidance?: string
): Promise<SceneNarration> {
  const userContent = [buildLlmContext(contextParams), narrationRequest(extraUserGuidance)].join(
    '\n\n'
  );
  const parsed = await completeChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    {
      temperature: 0.9,
      maxTokens: 420,
      schema: SceneNarrationSchema,
      schemaName: 'scene-narration',
    }
  );

  return {
    text: trimIncompleteSentence(parsed.text.replace(/^["']+|["']+$/g, '').trim()),
    imagePrompt: parsed.imagePrompt.replace(/^["']+|["']+$/g, '').trim(),
  };
}

function narrationRequest(extra?: string): string {
  return [
    'Narrate the engine result above.',
    'Show what you say or do first, then how they react. Do not skip the attempt and describe only their behavior.',
    'If Recent story beats are listed, you may briefly reference them when it naturally fits; do not force a callback.',
    extra,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateAttributeCheckNarration(
  check: AttributeCheck
): Promise<SceneNarration> {
  return generateSceneNarration({ attributeCheck: check });
}

export async function generateAttemptedActionNarration(action: Action): Promise<SceneNarration> {
  return generateSceneNarration({ attemptedAction: action });
}

/** One spoken sentence from the opponent at the start of a card duel. Cached via completeChat. */
export async function generateBattleGreeting(opponentKey: string): Promise<string> {
  const angle = GREETING_ANGLES[Math.floor(Math.random() * GREETING_ANGLES.length)];
  const userPrompt = [
    buildBattleGreetingContext(opponentKey),
    [
      "Write the opponent's greeting as they sit down to duel.",
      'One sentence only, in their voice.',
      angle,
      'Do not start with "So", "Well", or "Ah".',
    ].join('\n'),
  ].join('\n\n');

  const text = await completeChat(
    [
      { role: 'system', content: BATTLE_GREETING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.95,
      maxTokens: 100,
    }
  );

  return trimIncompleteSentence(text.replace(/^["']+|["']+$/g, '').trim());
}

function trimIncompleteSentence(text: string): string {
  if (/[.!?]["']?$/.test(text)) return text;
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return last === -1 ? text : text.slice(0, last + 1);
}
