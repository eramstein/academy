import { ActionType, ActivityType, JobType } from '@/lib/_model/enums-sim';
import type { Action, AttributeCheck, Npc, ScheduledActivity } from '@/lib/_model/model-sim';
import { gs } from '@/lib/_state';
import type { SceneDirection, ScenePayload } from '@/lib/sim/scene-director';

export interface LlmContextParams {
  attributeCheck?: AttributeCheck;
  attemptedAction?: Action;
  sceneDirection?: SceneDirection;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TRAIT_HINT: Record<string, string> = {
  grumpy: 'irritable and hard to please',
  friendly: 'warm, though not a stock smile',
  funny: 'reaches for a joke',
  beautiful: 'striking; people notice',
  shy: 'hesitant; warmth comes out sideways',
  confident: 'at ease and sure of being heard',
  assertive: 'direct, and will not be talked over',
  abrasive: 'blunt past the point of politeness',
};

const ATTRIBUTE_BEAT: Record<string, string> = {
  charisma: 'You make the attempt through charm, timing, or a remark aimed at this person.',
  intelligence: 'You make the attempt through wit or knowledge — an observation or a correction.',
  vitality: 'You make the attempt through stamina and nerve.',
  dexterity: 'You make the attempt with your hands, using a specific object in the room.',
  aura: 'You make the attempt through visible magic: light, weight, a charm that holds or frays.',
};

const DIFFICULTY_NOTE: Record<string, string> = {
  Trivial: 'The effort is slight. Do not stage it as a heroic feat.',
  'Very Easy': 'The effort is slight. Keep it light.',
  Easy: 'A modest effort.',
  Medium: 'An even contest. Either result should feel believable.',
  Hard: 'The player is reaching. Coming off should feel earned; missing should feel like a real gap.',
  Extreme: 'A long shot. Coming off is remarkable; missing is the ordinary human result.',
  Impossible: 'This cannot come off. Show the attempt collapsing in a specific way.',
};

const OCCASION: Record<string, string> = {
  [ActivityType.Class]: 'in class',
  [ActivityType.Work]: 'at work',
  [ActivityType.Social]: 'socializing',
  [ActivityType.Date]: 'on a date',
  [ActivityType.Training]: 'training',
  [ActivityType.Study]: 'studying',
  [ActivityType.Tournament]: 'at a tournament',
  [ActivityType.Exam]: 'in an exam',
};

const SUBSCRIPTION_DEAL: Record<string, string> = {
  academy: 'enrollment at the Academy',
  library: 'a library subscription',
  inn: 'room and board',
};

const GENERIC_ACTION_LABELS = new Set([
  'Socialize',
  'Negotiate',
  'Invite',
  'Perform Job',
  'Deepen Relationship',
  'Physical Interaction',
]);

export function buildLlmContext(params: LlmContextParams = {}): string {
  if (params.sceneDirection) {
    return buildDirectedSocialContext(params);
  }
  const action = params.attributeCheck?.attemptedAction ?? params.attemptedAction;
  const focusKey = getFocusCharacterKey(action);
  const sections = [
    buildPlayerContext(),
    buildWhenContext(),
    buildPlaceContext(),
    buildPresentCharactersContext(focusKey),
    buildRecentContext(),
  ];
  if (params.attributeCheck) {
    sections.push(buildAttributeCheckContext(params.attributeCheck, focusKey));
  } else if (params.attemptedAction) {
    sections.push(buildAttemptedActionContext(params.attemptedAction, focusKey));
  }
  return sections.filter(Boolean).join('\n\n');
}

/** Voice, personality, and the one fact to convey. */
function buildDirectedSocialContext(params: LlmContextParams): string {
  const direction = params.sceneDirection;
  if (!direction) return '';
  const npc = gs.characters[direction.characterKey];
  const name = npc?.name ?? direction.characterKey;
  return [
    `NPC: ${name}`,
    npc ? personalityBlock(npc) : '',
    direction.payload
      ? conveyBlock(name, direction.payload)
      : `Have a short chat with ${name}. Do not invent news or past events.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function personalityBlock(npc: Npc): string {
  const personality = npc.personality;
  if (!personality) return '';
  const traits = Object.entries(personality.traits ?? {})
    .filter(([, active]) => active)
    .map(([trait]) => trait);
  const lines = ['PERSONALITY:'];
  if (traits.length > 0) lines.push(`Traits: ${traits.join(', ')}.`);
  if (personality.humor?.trim()) lines.push(personality.humor.trim());
  if (personality.conflicts?.trim()) lines.push(personality.conflicts.trim());
  const habits = (personality.habits ?? []).map((habit) => habit.trim()).filter(Boolean);
  if (habits.length > 0) lines.push(habits.join('. ') + '.');
  const examples = (personality.speechExamples ?? [])
    .map((example) => example.trim())
    .filter(Boolean);
  if (examples.length > 0) {
    lines.push('', 'VOICE:', ...examples.map((example) => `"${example}"`));
  }
  return lines.length > 1 ? lines.join('\n') : '';
}

function conveyBlock(npcName: string, payload: ScenePayload): string {
  if (payload.kind === 'rumor') {
    return `TELL THE PLAYER THIS. They do not know it yet:\n"${payload.text}"\n${npcName} says it in their own voice. Add no other news.`;
  }
  if (payload.kind === 'routine') {
    return `LET THIS HABIT SLIP, as something the player can learn:\n"${payload.text}"`;
  }
  return `REFER BRIEFLY TO THIS MEMORY. Do not retell it, and do not invent any other past event:\n"${payload.text}"`;
}

export function buildBattleGreetingContext(opponentKey: string): string {
  const opponent = gs.characters[opponentKey];
  const sections = [buildPlayerContext(), buildWhenContext(), buildPlaceContext()];
  if (!opponent) {
    sections.push(`Opponent: unknown (${opponentKey}).`);
  } else {
    sections.push(
      'Opponent, about to speak:',
      describeNpc(opponent, true),
      describeRelationToPlayer(opponent),
      describeSharedHistory(opponent),
      describeRelationArc(opponent)
    );
  }
  sections.push(
    buildRecentContext(),
    'Situation: they are sitting down to a card duel with the player. The opponent speaks one sentence.'
  );
  return sections.filter(Boolean).join('\n\n');
}

function buildPlayerContext(): string {
  return `Player: ${gs.player.name}. Address them as "you".`;
}

function buildWhenContext(): string {
  const { day, period } = gs.time;
  const weekday = WEEKDAYS[(day - 1) % WEEKDAYS.length] ?? 'A day';
  const lines = [`When: ${weekday} ${period}.`];
  const activity = gs.scheduledActivities.find(
    (item) => item.day === day && item.period === period
  );
  lines.push(
    activity
      ? `Ongoing activity: ${describeActivity(activity)}`
      : 'Ongoing activity: none. This is unstructured time.'
  );
  return lines.join('\n');
}

function describeActivity(activity: ScheduledActivity): string {
  const phrase =
    activity.type === ActivityType.Class && 'classType' in activity && activity.classType
      ? `in an ${activity.classType} class`
      : (OCCASION[activity.type] ?? activity.type);
  const others = activity.participants
    .filter((key) => key !== gs.player.key)
    .map((key) => gs.characters[key]?.name ?? key);
  if (others.length === 0) return `The player is ${phrase}.`;
  return `The player is ${phrase} with ${others.join(', ')}.`;
}

function buildPlaceContext(): string {
  const place = gs.places[gs.player.placeKey];
  if (!place) return 'Place: unknown.';
  const region = gs.regions?.[place.regionKey]?.name;
  return [`Place: ${place.name}${region ? `, in ${region}` : ''}.`, place.description]
    .filter(Boolean)
    .join(' ');
}

function buildPresentCharactersContext(focusKey?: string): string {
  const present = Object.values(gs.characters).filter(
    (character) => character.placeKey === gs.player.placeKey
  );
  const focus = focusKey ? gs.characters[focusKey] : undefined;
  const others = present.filter((character) => character.key !== focusKey);
  if (!focus && others.length === 0) {
    return 'People here: the player is alone.';
  }

  const lines = ['People here:'];
  if (focus) {
    lines.push(
      describeNpc(focus, true),
      describeRelationToPlayer(focus),
      describeRelationTags(focus),
      describeSharedHistory(focus),
      describeRelationArc(focus)
    );
  }
  for (const character of others) {
    lines.push(describeNpc(character, false));
  }
  if (focus && others.length > 0) {
    lines.push(
      'Anyone listed as "Also here" stays in the background unless they would naturally notice.'
    );
  }
  return lines.filter(Boolean).join('\n');
}

function buildRecentContext(): string {
  const lines = gs.scene.narration
    .filter((entry) => entry.text.trim() && !entry.attributeCheck && !entry.attemptedAction)
    .slice(-2)
    .map((entry) => `- ${clip(entry.text, 420)}`);
  if (lines.length === 0) return '';
  return [
    'Just before this moment (continue from it; do not repeat the sentences):',
    ...lines,
  ].join('\n');
}

function describeNpc(npc: Npc, isFocus: boolean): string {
  const label = isFocus ? 'NPC' : 'Also here';
  const lines = [`${label}: ${npc.name} — ${describeIdentity(npc)}.`];
  const voice = describeVoice(npc, isFocus);
  if (voice) lines.push(voice);
  return lines.join('\n');
}

function describeVoice(npc: Npc, isFocus: boolean): string | undefined {
  if (!npc.personality) return undefined;
  const { speechExamples, humor, conflicts, habits } = npc.personality;
  const speechLines = (speechExamples ?? []).map((example) => example.trim()).filter(Boolean);
  const humorLine = humor?.trim() ?? '';
  const conflictLine = conflicts?.trim() ?? '';
  const habitLines = (habits ?? []).map((habit) => habit.trim()).filter(Boolean);
  if (!isFocus) {
    const bits = [
      speechLines.length > 0 ? speechLines[0] : '',
      habitLines.slice(0, 2).join('; '),
    ].filter(Boolean);
    return bits.length > 0 ? `In brief: ${bits.join(' ')}` : undefined;
  }
  const lines = [
    speechLines.length > 0
      ? `Speech examples:\n${speechLines.map((example) => `- ${example}`).join('\n')}`
      : undefined,
    humorLine ? `Humor: ${humorLine}` : undefined,
    conflictLine ? `In conflict: ${conflictLine}` : undefined,
    habitLines.length > 0 ? `Habits: ${habitLines.join('; ')}` : undefined,
  ].filter((line): line is string => Boolean(line));
  if (lines.length === 0) return undefined;
  return [`How ${npc.name} speaks and behaves:`, ...lines].join('\n');
}

function describeIdentity(npc: Npc): string {
  const colors =
    npc.favoriteColors?.length > 0 ? `favors ${formatList(npc.favoriteColors)} magic` : undefined;
  const student = npc.school
    ? [`student at ${schoolLabel(npc.school)}`, colors].filter(Boolean).join(', ')
    : undefined;
  return [`${npc.gender}, age ${npc.age}`, student, describeTraits(npc)].filter(Boolean).join('; ');
}

function describeTraits(npc: Npc): string | undefined {
  const traits = Object.entries(npc.personality?.traits ?? {})
    .filter(([, active]) => active)
    .map(([trait]) => {
      const hint = TRAIT_HINT[trait];
      return hint ? `${trait} (${hint})` : trait;
    });
  if (traits.length === 0) return undefined;
  return `traits: ${traits.join(', ')}`;
}

function describeRelationToPlayer(npc: Npc): string {
  const { friendship, respect, love, rivalry } = npc.relationProgress;
  if (![friendship, respect, love, rivalry].some((value) => value > 0)) {
    return `How ${npc.name} feels about the player: no real history yet. Write a first impression, not an old friendship.`;
  }
  const parts = [
    `friendship ${friendship} (${bondLabel(friendship, 'none', 'a first warmth', 'a growing friendship', 'close friends')})`,
    `respect ${respect} (${bondLabel(respect, 'none', 'a first spark of regard', 'growing respect', 'real respect')})`,
    `love ${love} (${bondLabel(love, 'none', 'a first flicker of attraction', 'growing affection', 'in love')})`,
    `rivalry ${rivalry} (${bondLabel(rivalry, 'none', 'a first jab', 'an ongoing rivalry', 'a fierce rivalry')})`,
  ];
  return `How ${npc.name} feels about the player: ${parts.join('; ')}. Let the strongest feeling show in their manner, and do not write them as closer than this.`;
}

function describeSharedHistory(npc: Npc): string {
  const parts = Object.entries(npc.activityHistory ?? {})
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([type, count]) => `${type.replace(/_/g, ' ')} ×${count}`);
  if (parts.length === 0) return '';
  return `Time already shared with the player: ${parts.join(', ')}. They have met before.`;
}

/** Latest story beats with this NPC; optional flavor the model may echo if relevant. */
function describeRelationArc(npc: Npc): string {
  const beats = (npc.relationArc ?? [])
    .map((beat) => beat.text?.trim())
    .filter((text): text is string => Boolean(text))
    .slice(-2);
  if (beats.length === 0) return '';
  return [
    `Recent story with ${npc.name} (optional — reference only if it fits this moment):`,
    ...beats.map((text) => `- ${clip(text, 480)}`),
  ].join('\n');
}

function bondLabel(
  value: number,
  none: string,
  spark: string,
  growing: string,
  established: string
): string {
  if (value <= 0) return none;
  if (value === 1) return spark;
  if (value < 4) return growing;
  return established;
}

function describeRelationTags(npc: Npc): string {
  const tags = (npc.relationTags ?? []).map((tag) => String(tag).trim()).filter(Boolean);
  if (tags.length === 0) return '';
  return `Labels on this bond: ${tags.join('; ')}.`;
}

function buildAttributeCheckContext(check: AttributeCheck, focusKey?: string): string {
  const name = characterName(focusKey);
  return [
    'Engine result (already decided — narrate it, do not change it):',
    ...describeAttemptedAction(check.attemptedAction, focusKey),
    ATTRIBUTE_BEAT[check.attribute] ?? `You make the attempt through ${check.attribute}.`,
    DIFFICULTY_NOTE[check.difficulty] ??
      `The attempt is ${check.difficulty.toLowerCase()} for the player.`,
    outcomeBrief(check, name),
    voiceReminder(name),
  ].join('\n');
}

function buildAttemptedActionContext(action: Action, focusKey?: string): string {
  return [
    'Engine result (already decided — narrate it, do not change it):',
    ...describeAttemptedAction(action, focusKey),
    voiceReminder(characterName(focusKey)),
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

function outcomeBrief(check: AttributeCheck, name: string): string {
  const who = name === 'someone' ? 'them' : name;
  if (check.critical && check.success) {
    return `Outcome: the attempt comes off in a way people will retell. Show what you do, then a reaction ${who} would actually have.`;
  }
  if (check.critical && !check.success) {
    return `Outcome: the attempt collapses in a conspicuous mishap. Show what you try, then the specific way it goes wrong — something ${who} will remember.`;
  }
  if (check.success) {
    return `Outcome: the attempt comes off. Show what you do, then ${who} moved, convinced, amused, or disarmed in their own way.`;
  }
  return `Outcome: the attempt misses. Show what you try, then ${who} closing off, outpacing you, or letting the moment die.`;
}

function describeAttemptedAction(action?: Action, focusKey?: string): string[] {
  if (!action) return [];
  const params = action.actionParameters ?? {};
  const choice = choiceLine(action);
  switch (action.actionType) {
    case ActionType.Socialize:
      return [
        choice,
        ...socializeLines(
          params.socializeType,
          characterName(typeof params.characterKey === 'string' ? params.characterKey : undefined),
          typeof params.intent === 'string' ? params.intent : undefined
        ),
      ].filter((line): line is string => Boolean(line));
    case ActionType.Negotiate:
      return [
        choice,
        `Player action: you haggle with ${characterName(typeof params.partner === 'string' ? params.partner : undefined)}${dealPhrase(params.subscriptionType)}. Name a price, a condition, or a hesitation out loud, then show them giving ground or holding the line.`,
      ].filter((line): line is string => Boolean(line));
    case ActionType.PerformJob:
      return jobLines(params.job, choice);
    case ActionType.Invite:
      return inviteLines(params, choice);
    default:
      return [
        choice,
        `Player action: ${String(action.actionType).replace(/_/g, ' ')}.${focusKey ? ` You are dealing with ${characterName(focusKey)}.` : ''}`,
      ].filter((line): line is string => Boolean(line));
  }
}

function choiceLine(action: Action): string | undefined {
  const label = action.label?.trim();
  if (!label || GENERIC_ACTION_LABELS.has(label)) return undefined;
  return `The player's approach: "${label}".`;
}

function socializeLines(_type: unknown, name: string, intent?: string): string[] {
  const lines = [`Player action: you chat with ${name}.`];
  const intentLine = playerIntentLine(intent);
  if (intentLine) lines.push(intentLine);
  return lines;
}

/** Player free-text intent: shapes the attempt, never the engine outcome. */
function playerIntentLine(intent?: string): string | undefined {
  const trimmed = intent?.trim();
  if (!trimmed) return undefined;
  return `Player's intended approach (what they mean to try — not what happens): "${clip(trimmed, 280)}". Shape the attempt around this intent. The engine already decided success or failure; do not invent a different plan, and do not let the player decide the outcome.`;
}

function jobLines(
  job: { name?: string; description?: string; jobType?: string; employerKey?: string } | undefined,
  choice?: string
): string[] {
  const lines = [
    choice,
    `Player action: you work${job?.name ? ` as ${job.name}` : ''}. Show the work you do, not only how someone watches it.`,
    job?.description ? `The work itself: ${clip(String(job.description), 400)}` : undefined,
  ];
  if (job?.jobType === JobType.Mentoring) {
    lines.push('Include an explanation or a correction, and someone who follows it or gets lost.');
  } else if (job?.jobType === JobType.Coaching) {
    lines.push('Include you reading a person and getting them to try.');
  }
  if (job?.employerKey) {
    lines.push(`The employer watching the work: ${characterName(job.employerKey)}.`);
  }
  return lines.filter((line): line is string => Boolean(line));
}

function inviteLines(params: Record<string, unknown>, choice?: string): string[] {
  const who = characterName(
    typeof params.characterKey === 'string' ? params.characterKey : undefined
  );
  const place = typeof params.placeKey === 'string' ? gs.places[params.placeKey]?.name : undefined;
  const activity =
    typeof params.type === 'string' ? params.type.replace(/_/g, ' ') : 'get-together';
  const when = typeof params.period === 'string' ? ` in the ${params.period}` : '';
  return [
    choice,
    `Player action: you ask ${who} to a ${activity}${place ? ` at ${place}` : ''}${when}.`,
    'The question happens in the current place. Show what you say, then their answer. Do not skip ahead to the outing.',
  ].filter((line): line is string => Boolean(line));
}

function dealPhrase(subscriptionType: unknown): string {
  if (typeof subscriptionType !== 'string' || !subscriptionType) return '';
  const deal =
    SUBSCRIPTION_DEAL[subscriptionType] ?? `a ${subscriptionType.replace(/_/g, ' ')} subscription`;
  return ` over ${deal}`;
}

function voiceReminder(name: string): string {
  if (name === 'someone') return 'Keep the scene specific to this place and this attempt.';
  return `${name}'s reply should sound wrong in anyone else's mouth.`;
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

function schoolLabel(school: string): string {
  if (school === 'academy') return 'the Academy';
  if (school === 'kartekar') return 'Kartekar';
  return school;
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trim()}…`;
}
