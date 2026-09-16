import { ActionType } from '@/lib/_model/enums-sim';
import type { Action, AttributeCheck, Npc } from '@/lib/_model/model-sim';
import { gs } from '@/lib/_state';

export interface LlmContextParams {
  attributeCheck?: AttributeCheck;
}

export function buildLlmContext(params: LlmContextParams = {}): string {
  const focusKey = getFocusCharacterKey(params.attributeCheck?.attemptedAction);
  const sections = [
    buildPlayerContext(),
    buildPlaceContext(),
    buildPresentCharactersContext(focusKey),
  ];
  if (params.attributeCheck) {
    sections.push(buildAttributeCheckContext(params.attributeCheck, focusKey));
  }
  return sections.filter(Boolean).join('\n\n');
}

function buildPlayerContext(): string {
  return `Player character: ${gs.player.name}. Refer to them as "you".`;
}

function buildPlaceContext(): string {
  const place = gs.places[gs.player.placeKey];
  if (!place) {
    return 'Place: unknown.';
  }
  return [`Place: ${place.name}.`, place.description].filter(Boolean).join(' ');
}

function buildPresentCharactersContext(focusKey?: string): string {
  const present = Object.values(gs.characters).filter(
    (character) => character.placeKey === gs.player.placeKey
  );
  const focus = focusKey ? gs.characters[focusKey] : undefined;
  const others = present.filter((character) => character.key !== focusKey);

  if (!focus && others.length === 0) {
    return 'People present: none.';
  }

  const lines = ['People present:'];
  if (focus) {
    lines.push(describeNpc(focus, true, true));
  }
  for (const character of others) {
    lines.push(describeNpc(character, false, !focus));
  }
  return lines.join('\n');
}

function describeNpc(npc: Npc, isFocus: boolean, includeBio: boolean): string {
  const traits = Object.entries(npc.traits)
    .filter(([, active]) => active)
    .map(([trait]) => trait);
  const header = isFocus
    ? `- ${npc.name} (the person the player is interacting with)`
    : `- ${npc.name}`;
  const details = [
    `${npc.gender}, age ${npc.age}`,
    traits.length > 0 ? `traits: ${traits.join(', ')}` : undefined,
  ]
    .filter(Boolean)
    .join('; ');
  const lines = [`${header} — ${details}.`];
  if (includeBio && npc.bio) {
    lines.push(`  Bio: ${npc.bio}`);
  }
  return lines.join('\n');
}

function buildAttributeCheckContext(check: AttributeCheck, focusKey?: string): string {
  const outcome = check.critical
    ? check.success
      ? 'a critical success'
      : 'a critical failure'
    : check.success
      ? 'a success'
      : 'a failure';
  const lines = [
    'Current attempt:',
    `The player just attempted a ${check.attribute} check of ${check.difficulty.toLowerCase()} difficulty.`,
    `The result is ${outcome}.`,
  ];
  const actionLines = describeAttemptedAction(check.attemptedAction, focusKey);
  if (actionLines.length > 0) {
    lines.push(...actionLines);
  }
  lines.push(
    'Narrate this specific attempt. If a person is being interacted with, they are the focus; other people in the room are background unless they naturally notice.'
  );
  return lines.join('\n');
}

function describeAttemptedAction(action?: Action, focusKey?: string): string[] {
  if (!action) return [];
  const params = action.actionParameters ?? {};
  const focusName = characterName(focusKey);
  switch (action.actionType) {
    case ActionType.Socialize:
      return [
        `Action: socialize.`,
        `The player is trying to ${params.socializeType ?? 'interact with'} ${characterName(params.characterKey)}.`,
      ];
    case ActionType.Negotiate:
      return [
        `Action: negotiate.`,
        `The player is bargaining with ${characterName(params.partner)}.`,
        params.subscriptionType
          ? `The deal concerns a ${String(params.subscriptionType).replace(/_/g, ' ')} subscription.`
          : undefined,
      ].filter((line): line is string => Boolean(line));
    case ActionType.PerformJob: {
      const job = params.job;
      return [
        `Action: perform a job.`,
        job?.name
          ? `The player is working as ${job.name}${job.jobType ? ` (${job.jobType})` : ''}.`
          : 'The player is performing a job.',
        job?.employerKey ? `Employer: ${characterName(job.employerKey)}.` : undefined,
      ].filter((line): line is string => Boolean(line));
    }
    default:
      return [
        `Action: ${String(action.actionType).replace(/_/g, ' ')}.`,
        focusKey ? `The player is interacting with ${focusName}.` : undefined,
      ].filter((line): line is string => Boolean(line));
  }
}

function getFocusCharacterKey(action?: Action): string | undefined {
  if (!action) return undefined;
  const params = action.actionParameters ?? {};
  if (typeof params.characterKey === 'string') return params.characterKey;
  if (typeof params.partner === 'string') return params.partner;
  if (typeof params.opponentKey === 'string') return params.opponentKey;
  if (params.job && typeof params.job.employerKey === 'string') return params.job.employerKey;
  return undefined;
}

function characterName(key?: string): string {
  if (!key) return 'someone';
  if (key === gs.player.key || key === 'player') return gs.player.name;
  return gs.characters[key]?.name ?? key;
}
