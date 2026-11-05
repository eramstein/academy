import {
  ActionType,
  NarrationType,
  type InteractionChoiceState,
  type InteractionSession,
  type Npc,
} from '@/lib/_model';
import { gs } from '@/lib/_state';
import { completeChat } from '@/lib/llm/llm-service';
import { z } from 'zod';
import { narrate, narrateText } from '../narration';
import { getInteractionTemplate } from './registry';
import type { InteractionTemplate } from './types';
import {
  applyOutcomeReset,
  crossedOutcome,
  nearestBand,
  predictedOutcome,
  resolveNextValues,
  type CrossedOutcome,
} from './values';

const HISTORY_WINDOW = 3;
const MAX_CHOICES = 6;

const MECHANICS = `You simulate one beat of a structured social interaction in a lighthearted medieval fantasy academy.

Write the scene in second person, present tense, addressing the player as "you". Use the NPC's speaking name. 40–80 words. Prefer a line of dialogue and a visible reaction. Do not list choices in the prose. Do not add people, places, or events beyond this situation. Plain sentences only: no markdown, asterisks, or wrapping the scene in quotation marks.

Tracked values are integers. Report each one as its new absolute total.
On the opening beat there is no chosen action. Keep each value at its current number, or shift it by at most 1 if the situation itself demands it.
When the player has chosen an action, start from the current number plus that action's delta. You may adjust by 1. To reach a listed outcome, set the value so the comparison becomes true, and show that outcome clearly in the scene. After an outcome fires, that value resets to 0 — report 0 for it in your values.

Follow-up choices:
- At least one for every action type, and more for the types that fit this moment.
- text is a specific thing the player can say or do next, at most 8 words, not a restatement of the type.
- updates are integer deltas from the totals at the end of this beat, using only the tracked keys.
- type is copied exactly from the action types.`;

const DeltaSchema = z.object({
  key: z.string().describe('Tracked value key'),
  delta: z.number().describe('Integer change if the player picks this'),
});

const ChoiceSchema = z.object({
  type: z.string().describe('One of the action types, copied exactly'),
  text: z.string().describe('Specific next action, at most 8 words'),
  updates: z.array(DeltaSchema),
});

const TurnSchema = z.object({
  scene: z.string().min(1).describe('What the player did and how the NPC reacted'),
  values: z.array(
    z.object({
      key: z.string(),
      value: z.number().describe('New absolute total after this beat'),
    })
  ),
  choices: z.array(ChoiceSchema),
});

export interface RunInteractionInput {
  characterKey: string;
  interactionKey: string;
  /** Index into the session's current choices. Omit to open the interaction. */
  choiceIndex?: number;
  stop?: boolean;
}

let busy = false;

export async function runInteraction(input: RunInteractionInput): Promise<void> {
  const template = input.interactionKey ? getInteractionTemplate(input.interactionKey) : undefined;
  const npc = gs.characters[input.characterKey];

  if (input.stop) {
    const text = template?.stopText;
    clearInteraction();
    if (text) narrateText(text, { characterKey: input.characterKey });
    return;
  }
  if (busy) {
    // A second click must not drop the scene and restore the action list
    // while the first model call is still running.
    gs.scene.actions = [];
    gs.scene.manualTriggers = [];
    gs.scene.event = {
      key: 'interaction:pending',
      text: '',
      options: [{ text: '…', outcome: {} }],
    };
    return;
  }
  if (!template || !npc) {
    clearInteraction();
    narrateText('There is no one here to do that with.', { characterKey: input.characterKey });
    return;
  }

  const active = gs.scene.interaction;
  const continuing =
    input.choiceIndex !== undefined &&
    active?.templateKey === template.key &&
    active.characterKey === input.characterKey;
  if (input.choiceIndex !== undefined && !continuing) {
    clearInteraction();
    narrateText('The moment has passed.', { characterKey: input.characterKey });
    return;
  }

  const session = continuing && active ? active : openSession(template, input.characterKey);
  const choice = continuing ? session.choices[input.choiceIndex ?? -1] : undefined;
  if (continuing && !choice) {
    clearInteraction();
    narrateText('The moment has passed.', { characterKey: input.characterKey });
    return;
  }

  gs.scene.interaction = session;
  gs.scene.actions = [];
  gs.scene.manualTriggers = [];
  gs.scene.event = undefined;
  busy = true;
  try {
    const pendingOutcome = predictedOutcome(template.values, session.values, choice?.updates);
    const turn = await requestTurn(template, npc, session, choice, pendingOutcome);
    const reported = Object.fromEntries(turn.values.map((entry) => [entry.key, entry.value]));
    const previous = { ...session.values };
    let nextValues = resolveNextValues(template, previous, reported, choice?.updates);
    const outcome =
      crossedOutcome(template.values, previous, nextValues) ?? pendingOutcome ?? undefined;
    // Mood aside shows the peak that fired; the meter itself resets afterward.
    const valuesForReport = { ...nextValues };
    if (outcome) {
      nextValues = applyOutcomeReset(nextValues, outcome);
    }
    const scene = cleanScene(turn.scene);
    session.values = nextValues;
    session.history = [
      ...session.history,
      { scene, values: { ...nextValues }, ...(choice ? { action: choice } : {}) },
    ].slice(-HISTORY_WINDOW);
    narrateText(scene, {
      characterKey: input.characterKey,
      ...(outcome ? { title: sentenceCase(outcome.effect) } : {}),
    });
    narrateValueReport(template, previous, valuesForReport, input.characterKey);
    if (outcome) {
      clearInteraction();
      return;
    }
    session.choices = normalizeChoices(template, turn.choices);
    gs.scene.interaction = session;
    presentChoices(session);
  } catch (error) {
    console.warn('[interaction]', error);
    clearInteraction();
    narrateText('The conversation stalls before it can go anywhere.', {
      characterKey: input.characterKey,
    });
  } finally {
    busy = false;
  }
}

function openSession(template: InteractionTemplate, characterKey: string): InteractionSession {
  const values: Record<string, number> = {};
  for (const value of template.values) values[value.key] = value.initial;
  return { templateKey: template.key, characterKey, values, history: [], choices: [] };
}

function clearInteraction() {
  gs.scene.interaction = undefined;
}

function presentChoices(session: InteractionSession) {
  const parameters = {
    characterKey: session.characterKey,
    socializeType: 'interaction',
    interactionKey: session.templateKey,
  };
  gs.scene.event = {
    key: `interaction:${session.templateKey}`,
    text: '',
    options: [
      ...session.choices.map((choice, index) => ({
        text: choice.text,
        outcome: {
          action: {
            actionType: ActionType.Socialize,
            isLongAction: false,
            actionParameters: { ...parameters, interactionChoice: index },
          },
        },
      })),
      {
        text: 'Stop there',
        outcome: {
          action: {
            actionType: ActionType.Socialize,
            isLongAction: false,
            actionParameters: { ...parameters, interactionStop: true },
          },
        },
      },
    ],
  };
  gs.scene.actions = [];
}

async function requestTurn(
  template: InteractionTemplate,
  npc: Npc,
  session: InteractionSession,
  choice?: InteractionChoiceState,
  pendingOutcome?: CrossedOutcome
) {
  return completeChat(
    [
      { role: 'system', content: `${template.systemPrompt}\n\n${MECHANICS}` },
      { role: 'user', content: userPrompt(template, npc, session, choice, pendingOutcome) },
    ],
    { temperature: 0.8, maxTokens: 900, schema: TurnSchema, schemaName: 'interaction-turn' }
  );
}

function userPrompt(
  template: InteractionTemplate,
  npc: Npc,
  session: InteractionSession,
  choice?: InteractionChoiceState,
  pendingOutcome?: CrossedOutcome
): string {
  const player = speakingName(gs.player.name);
  const other = speakingName(npc.name);
  const situation = template.situation.replaceAll('{player}', player).replaceAll('{npc}', other);
  const recent =
    session.history.length === 0
      ? 'None yet.'
      : session.history
          .map((beat, index) => {
            const action = beat.action ? `Player chose "${beat.action.text}". ` : 'Opening. ';
            return `${index + 1}. ${action}${beat.scene}`;
          })
          .join('\n');
  const chosen = choice
    ? `type: ${choice.type}\ntext: ${choice.text}\nupdates: ${formatDeltas(choice.updates)}`
    : 'None. This is the opening beat.';
  const sections = [
    `Player: ${player}. Address them as "you".`,
    npcNotes(template, npc, other),
    '',
    'Initial situation:',
    situation,
    '',
    'Action types:',
    template.actionTypes.map((type) => `- ${type}`).join('\n'),
    '',
    'How the NPC tends to take each type:',
    formatReactions(template),
    '',
    'Value scales:',
    formatScales(template),
    '',
    'Recent updates (oldest first, at most the last 3):',
    recent,
    '',
    'Current state:',
    formatState(template, session.values),
    '',
    'Chosen action:',
    chosen,
  ];
  if (pendingOutcome) {
    sections.push(
      '',
      'Required outcome this beat:',
      `${pendingOutcome.effect} (from ${pendingOutcome.key}). Make this happen in the scene. Report ${pendingOutcome.key} as 0 after it fires.`
    );
  }
  return sections.join('\n');
}

function npcNotes(template: InteractionTemplate, npc: Npc, name: string): string {
  const lines = [`NPC: ${name}`];
  const authored = template.npcDescriptions?.[npc.key]?.trim();
  if (authored) lines.push(authored);
  return lines.join('\n');
}

function formatReactions(template: InteractionTemplate): string {
  return template.actionTypes
    .map((type) => `- ${type}: ${formatDeltas(template.reactions[type] ?? {})}`)
    .join('\n');
}

function formatScales(template: InteractionTemplate): string {
  return template.values
    .map((value) => {
      const bands = Object.entries(value.bands)
        .map(([at, label]) => `${at} ${label}`)
        .join(', ');
      const outcomes = (value.outcomes ?? [])
        .map((outcome) => `${outcome.threshold} → ${outcome.effect}`)
        .join('; ');
      return `${value.key} (${value.label}): ${bands}.${outcomes ? ` Outcomes: ${outcomes}.` : ''}`;
    })
    .join('\n');
}

function formatState(template: InteractionTemplate, values: Record<string, number>): string {
  return template.values
    .map((value) => {
      const current = values[value.key] ?? value.initial;
      return `${value.label}: ${nearestBand(value.bands, current)} (${current})`;
    })
    .join('\n');
}

/** Aside under the beat: each tracked value's new total and how it moved. */
function narrateValueReport(
  template: InteractionTemplate,
  previous: Record<string, number>,
  next: Record<string, number>,
  characterKey: string
) {
  const lines = template.values.map((value) => {
    const before = previous[value.key] ?? value.initial;
    const after = next[value.key] ?? before;
    const delta = after - before;
    const band = nearestBand(value.bands, after);
    const change = delta === 0 ? 'unchanged' : `${delta > 0 ? '+' : ''}${delta}`;
    return `${value.label}: ${band} (${after}) · ${change}`;
  });
  narrate({
    id: crypto.randomUUID(),
    text: lines.join('\n'),
    type: NarrationType.RelationUpdate,
    characters: [characterKey],
    title: 'Mood',
  });
}

function formatDeltas(deltas: Record<string, number>): string {
  const parts = Object.entries(deltas).map(
    ([key, delta]) => `${key} ${delta > 0 ? '+' : ''}${delta}`
  );
  return parts.length ? parts.join(', ') : 'no change';
}

function normalizeChoices(
  template: InteractionTemplate,
  raw: z.infer<typeof ChoiceSchema>[]
): InteractionChoiceState[] {
  const known = new Map(template.actionTypes.map((type) => [type.toLowerCase(), type]));
  const choices: InteractionChoiceState[] = [];
  for (const choice of raw) {
    const type = known.get(choice.type.trim().toLowerCase());
    const text = buttonText(choice.text);
    if (!type || !text) continue;
    choices.push({ type, text, updates: deltasFor(template, type, choice.updates) });
  }
  for (const type of template.actionTypes) {
    if (choices.some((choice) => choice.type === type)) continue;
    choices.push({
      type,
      text: sentenceCase(type),
      updates: { ...(template.reactions[type] ?? {}) },
    });
  }
  return capChoices(choices, template.actionTypes);
}

function deltasFor(
  template: InteractionTemplate,
  type: string,
  raw: { key: string; delta: number }[]
): Record<string, number> {
  const allowed = new Set(template.values.map((value) => value.key));
  const updates: Record<string, number> = {};
  for (const entry of raw) {
    if (!allowed.has(entry.key) || !Number.isFinite(entry.delta)) continue;
    updates[entry.key] = Math.round(entry.delta);
  }
  if (Object.keys(updates).length === 0) {
    return { ...(template.reactions[type] ?? {}) };
  }
  return updates;
}

function capChoices(choices: InteractionChoiceState[], types: string[]): InteractionChoiceState[] {
  if (choices.length <= MAX_CHOICES) return choices;
  const kept: InteractionChoiceState[] = [];
  for (const type of types) {
    const first = choices.find((choice) => choice.type === type);
    if (!first) continue;
    kept.push(first);
  }
  for (const choice of choices) {
    if (kept.length >= MAX_CHOICES) break;
    if (kept.includes(choice)) continue;
    kept.push(choice);
  }
  return kept;
}

function buttonText(text: string): string {
  const clean = stripMarkup(text)
    .replace(/\s+/g, ' ')
    .replace(/^["']+|["']+$/g, '')
    .trim();
  if (clean.length <= 90) return clean;
  const cut = clean.slice(0, 87).replace(/\s+\S*$/, '');
  return `${cut || clean.slice(0, 87)}…`;
}

function cleanScene(text: string): string {
  const clean = stripMarkup(text)
    .replace(/^["']+|["']+$/g, '')
    .trim();
  return clean || 'The argument hangs in the air between you.';
}

function stripMarkup(text: string): string {
  return text.replace(/[*_`#]/g, '');
}

function sentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function speakingName(name: string): string {
  const beforeComma = name.split(',')[0]?.trim() || name;
  const parts = beforeComma.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name;
  if (parts[0].toLowerCase() === 'the' && parts.length > 1) return beforeComma;
  return parts[0];
}
