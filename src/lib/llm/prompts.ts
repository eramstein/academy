import { ActionType } from '@/lib/_model/enums-sim';
import type { Action, AttributeCheck } from '@/lib/_model/model-sim';
import { z } from 'zod';
import {
  BATTLE_GREETING_SYSTEM_PROMPT,
  NARRATION_SYSTEM_PROMPT,
  ROMANCE_DEEPEN_SYSTEM_PROMPT,
  ROMANCE_PHYSICAL_SYSTEM_PROMPT,
} from './config';
import { buildBattleGreetingContext, buildLlmContext, type LlmContextParams } from './context-builder';
import { completeChat } from './llm-service';

const SceneNarrationSchema = z.object({
  text: z.string().min(1),
  imagePrompt: z
    .string()
    .min(1)
    .max(320)
    .describe(
      'One or two short sentences: the focus character\'s physical action, a visible expression such as laughing or scowling, and the place with two or three concrete objects. No appearance, clothing, or inner feelings.'
    ),
});

export type SceneNarration = z.infer<typeof SceneNarrationSchema>;
export type AttributeCheckNarration = SceneNarration;

async function generateSceneNarration(
  contextParams: LlmContextParams,
  systemPrompt: string = NARRATION_SYSTEM_PROMPT,
  extraUserGuidance?: string
): Promise<SceneNarration> {
  const userPrompt = [
    buildLlmContext(contextParams),
    [
      'Return JSON with:',
      '- text: one short paragraph describing what happens.',
      '- imagePrompt: one or two short sentences. The focus character\'s activity, a visible expression (laughing, scowling, smiling, shouting), and the place with a few concrete objects. Example: "Laughing while pouring tea behind the inn bar, wooden mugs and bottles on the shelves, firelight on the counter."',
      extraUserGuidance,
    ]
      .filter(Boolean)
      .join('\n'),
  ].join('\n\n');

  const parsed = await completeChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.8,
      maxTokens: 320,
      schema: SceneNarrationSchema,
      schemaName: 'scene-narration',
    }
  );

  return {
    text: trimIncompleteSentence(parsed.text.replace(/^["']+|["']+$/g, '').trim()),
    imagePrompt: parsed.imagePrompt.replace(/^["']+|["']+$/g, '').trim(),
  };
}

function romanceSystemPrompt(action?: Action): string {
  return action?.actionParameters?.romanceType === 'physical'
    ? ROMANCE_PHYSICAL_SYSTEM_PROMPT
    : ROMANCE_DEEPEN_SYSTEM_PROMPT;
}

function romanceUserGuidance(action?: Action): string {
  if (action?.actionParameters?.romanceType === 'physical') {
    return 'Write an adult erotic scene of sexual intimacy between the player and the focus character. Explicit content is allowed.';
  }
  return 'Write a cosy, heartwarming scene of emotional intimacy and growing affection.';
}

/** Romance scenes use dedicated system prompts (cosy deepen vs adult physical). */
export async function generateRomanceNarration(
  contextParams: LlmContextParams
): Promise<SceneNarration> {
  const action = contextParams.attributeCheck?.attemptedAction ?? contextParams.attemptedAction;
  return generateSceneNarration(
    contextParams,
    romanceSystemPrompt(action),
    romanceUserGuidance(action)
  );
}

export async function generateAttributeCheckNarration(
  check: AttributeCheck
): Promise<SceneNarration> {
  if (check.attemptedAction?.actionType === ActionType.Romance) {
    return generateRomanceNarration({ attributeCheck: check });
  }
  return generateSceneNarration({ attributeCheck: check });
}

export async function generateAttemptedActionNarration(action: Action): Promise<SceneNarration> {
  if (action.actionType === ActionType.Romance) {
    return generateRomanceNarration({ attemptedAction: action });
  }
  return generateSceneNarration({ attemptedAction: action });
}

/** One spoken sentence from the opponent at the start of a card duel. Cached via completeChat. */
export async function generateBattleGreeting(opponentKey: string): Promise<string> {
  const userPrompt = [
    buildBattleGreetingContext(opponentKey),
    [
      'Write the opponent\'s greeting to the player as they sit down to duel.',
      'One sentence only, in their voice, shaped by their personality and how they feel about the player.',
    ].join('\n'),
  ].join('\n\n');

  const text = await completeChat(
    [
      { role: 'system', content: BATTLE_GREETING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.9,
      maxTokens: 80,
    }
  );

  return trimIncompleteSentence(text.replace(/^["']+|["']+$/g, '').trim());
}

function trimIncompleteSentence(text: string): string {
  if (/[.!?]["']?$/.test(text)) return text;
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return last === -1 ? text : text.slice(0, last + 1);
}
