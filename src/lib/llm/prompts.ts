import { ActionType } from '@/lib/_model/enums-sim';
import type { Action, AttributeCheck } from '@/lib/_model/model-sim';
import { z } from 'zod';
import {
  BATTLE_GREETING_SYSTEM_PROMPT,
  NARRATION_SYSTEM_PROMPT,
  ROMANCE_DEEPEN_SYSTEM_PROMPT,
  ROMANCE_PHYSICAL_SYSTEM_PROMPT,
} from './config';
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
      "One or two short sentences: the focus character's physical action, a visible expression such as laughing or scowling, and the named place with two or three concrete objects. No appearance, clothing, or inner feelings."
    ),
});

export type SceneNarration = z.infer<typeof SceneNarrationSchema>;
export type AttributeCheckNarration = SceneNarration;

const OPENING_ANGLES = [
  'Start with a line of dialogue only the focus character would say.',
  'Start with an object in this place that the focus character is already handling.',
  'Start with the focus character mid-habit, drawn from their character notes, before the player gets a word in.',
  'Start with a sound, smell, or mess particular to this place, then bring the focus character into it.',
];

const GREETING_ANGLES = [
  'Let a habit or grudge from their character notes show in the wording.',
  'Talk about the duel through whatever this person actually cares about.',
  'If they barely know the player, the sentence should size the player up. If they have history, that history should be specific.',
];

async function generateSceneNarration(
  contextParams: LlmContextParams,
  systemPrompt: string = NARRATION_SYSTEM_PROMPT,
  extraUserGuidance?: string
): Promise<SceneNarration> {
  const parsed = await completeChat(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [buildLlmContext(contextParams), narrationRequest(extraUserGuidance)].join('\n\n'),
      },
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
  const angle = OPENING_ANGLES[Math.floor(Math.random() * OPENING_ANGLES.length)];
  return [
    'Write the scene as JSON with "text" and "imagePrompt".',
    angle,
    'The first words must not be "You lean", "You smile", "You approach", "You glance", or "You chuckle".',
    'Name the focus character and include one detail from their character notes.',
    extra,
    'imagePrompt: a visible expression, what the focus character is physically doing, the place name, and two or three objects that belong there. No clothing, appearance, or inner feelings.',
  ]
    .filter(Boolean)
    .join('\n');
}

function romanceSystemPrompt(action?: Action): string {
  return action?.actionParameters?.romanceType === 'physical'
    ? ROMANCE_PHYSICAL_SYSTEM_PROMPT
    : ROMANCE_DEEPEN_SYSTEM_PROMPT;
}

function romanceUserGuidance(action?: Action): string {
  const partner = 'the focus character';
  if (action?.actionParameters?.romanceType === 'physical') {
    return `Write an adult erotic scene of sexual intimacy between the player and ${partner}. Explicit detail is allowed. Filter it through their habits and inhibitions from the character notes, not a generic embrace.`;
  }
  return `Write a cosy scene of emotional intimacy. The tenderness should look like ${partner} specifically — their shyness, pride, humor, or loneliness — not a generic cuddle.`;
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
