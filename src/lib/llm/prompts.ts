import { ActionType } from '@/lib/_model/enums-sim';
import type { Action, AttributeCheck } from '@/lib/_model/model-sim';
import { z } from 'zod';
import {
  BATTLE_GREETING_SYSTEM_PROMPT,
  NARRATION_SYSTEM_PROMPT,
  ROMANCE_DEEPEN_SYSTEM_PROMPT,
  ROMANCE_PHYSICAL_SYSTEM_PROMPT,
  SOCIAL_NARRATION_SYSTEM_PROMPT,
} from './config';
import type { SceneDirection } from '@/lib/sim/scene-director';
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
  const directed = Boolean(contextParams.sceneDirection);
  const userContent = directed
    ? buildLlmContext(contextParams)
    : [buildLlmContext(contextParams), narrationRequest(extraUserGuidance)].join('\n\n');
  if (contextParams.sceneDirection) {
    console.log('[scene-director] LLM prompt', {
      system: systemPrompt,
      user: userContent,
    });
  }
  if (directed) {
    const raw = await completeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      { temperature: 0.9, maxTokens: 260 }
    );
    return { text: plainSocialText(raw), imagePrompt: '' };
  }
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

function romanceSystemPrompt(action?: Action): string {
  return action?.actionParameters?.romanceType === 'physical'
    ? ROMANCE_PHYSICAL_SYSTEM_PROMPT
    : ROMANCE_DEEPEN_SYSTEM_PROMPT;
}

function romanceUserGuidance(action?: Action): string | undefined {
  if (action?.actionParameters?.romanceType === 'physical') {
    return 'This is a sexual encounter. Show what you do, then how they respond. Explicit detail is allowed.';
  }
  return 'This is emotional intimacy. Show what you offer, then how they answer, in their own voice.';
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

function systemPromptForDirection(direction?: SceneDirection): string {
  return direction ? SOCIAL_NARRATION_SYSTEM_PROMPT : NARRATION_SYSTEM_PROMPT;
}

export async function generateAttributeCheckNarration(
  check: AttributeCheck,
  sceneDirection?: SceneDirection
): Promise<SceneNarration> {
  if (check.attemptedAction?.actionType === ActionType.Romance) {
    return generateRomanceNarration({ attributeCheck: check });
  }
  return generateSceneNarration(
    { attributeCheck: check, sceneDirection },
    systemPromptForDirection(sceneDirection)
  );
}

export async function generateAttemptedActionNarration(
  action: Action,
  sceneDirection?: SceneDirection
): Promise<SceneNarration> {
  if (action.actionType === ActionType.Romance) {
    return generateRomanceNarration({ attemptedAction: action });
  }
  return generateSceneNarration(
    { attemptedAction: action, sceneDirection },
    systemPromptForDirection(sceneDirection)
  );
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

function plainSocialText(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as { text?: unknown };
      if (typeof parsed.text === 'string' && parsed.text.trim()) text = parsed.text.trim();
    } catch {
      // The model returned prose, not JSON.
    }
  }
  text = text
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return trimIncompleteSentence(text.replace(/^["']+|["']+$/g, '').trim());
}
