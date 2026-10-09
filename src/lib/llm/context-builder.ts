import { ActionType, ActivityType, JobType } from '@/lib/_model/enums-sim';
import type { Action, AttributeCheck, Npc, ScheduledActivity } from '@/lib/_model/model-sim';
import { gs } from '@/lib/_state';

export interface LlmContextParams {
  attributeCheck?: AttributeCheck;
  attemptedAction?: Action;
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
  charisma:
    'This moment turns on charm, timing, and reading this particular person — a remark, a joke, or a tone aimed at them.',
  intelligence:
    'This moment turns on wit or knowledge — a real observation, a correction, something they would respect or see through.',
  vitality:
    'This moment turns on stamina and nerve — breath, grip, how long the body can keep the moment going.',
  dexterity: 'This moment turns on the hands. Use a specific object in the room.',
  aura: 'This moment turns on magical presence. The working should be visible in the room: light, weight, a charm that holds or frays.',
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
  [ActivityType.Romance]: 'sharing a private romantic moment',
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

/** Context for a one-line duel greeting from a given NPC. */
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
      describeSharedHistory(opponent)
    );
  }
  sections.push(
    buildRecentContext(),
    'Situation: they are sitting down to a card duel with the player. The opponent speaks one sentence.'
  );
  return sections.filter(Boolean).join('\n\n');
}

function buildPlayerContext(): string {
  return `Player: ${gs.player.name}. In the prose, call the player "you".`;
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
      ? `Occasion: ${describeActivity(activity)} Shape the scene around that.`
      : 'No class, job, or date is scheduled. This is unstructured time.'
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
  return [
    `Place: ${place.name}${region ? `, in ${region}` : ''}.`,
    place.description,
    'Use objects and clutter that belong in this specific place.',
  ]
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
      describeSharedHistory(focus)
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
  const label = isFocus ? 'Focus' : 'Also here';
  const lines = [`${label}: ${npc.name} — ${describeIdentity(npc)}.`];
  const notes = isFocus ? npc.bio?.trim() : bioLead(npc.bio ?? '');
  if (notes) {
    lines.push(
      isFocus
        ? `Character notes for ${npc.name} — use a habit, a worry, or a way of speaking from this:\n${notes}`
        : `In brief: ${notes}`
    );
  }
  return lines.join('\n');
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
  const traits = Object.entries(npc.traits)
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

function buildAttributeCheckContext(check: AttributeCheck, focusKey?: string): string {
  const name = characterName(focusKey);
  return [
    'What is happening:',
    ATTRIBUTE_BEAT[check.attribute] ?? `This moment turns on ${check.attribute}.`,
    DIFFICULTY_NOTE[check.difficulty] ??
      `The attempt is ${check.difficulty.toLowerCase()} for the player.`,
    outcomeBrief(check, name),
    ...describeAttemptedAction(check.attemptedAction, focusKey),
    focusReminder(name),
  ].join('\n');
}

function buildAttemptedActionContext(action: Action, focusKey?: string): string {
  return [
    'What is happening:',
    ...describeAttemptedAction(action, focusKey),
    focusReminder(characterName(focusKey)),
  ].join('\n');
}

function outcomeBrief(check: AttributeCheck, name: string): string {
  const who = name === 'someone' ? 'the other person' : name;
  if (check.critical && check.success) {
    return `Outcome: the attempt comes off in a way people will retell. Keep it something ${who} would actually do.`;
  }
  if (check.critical && !check.success) {
    return `Outcome: the attempt collapses in a conspicuous, specific mishap — a snapped retort, a spill, a working that frays — that ${who} will remember.`;
  }
  if (check.success) {
    return `Outcome: the attempt comes off. ${who} is moved, convinced, amused, or disarmed in their own way.`;
  }
  return `Outcome: the attempt misses. Show ${who} closing off, outpacing the player, or letting the moment die, in a way that fits them.`;
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
          characterName(typeof params.characterKey === 'string' ? params.characterKey : undefined)
        ),
      ].filter((line): line is string => Boolean(line));
    case ActionType.Negotiate:
      return [
        choice,
        `The player is haggling with ${characterName(typeof params.partner === 'string' ? params.partner : undefined)}${dealPhrase(params.subscriptionType)}.`,
        'Put the bargain in dialogue: a price, a condition, a hesitation. Show them giving ground or holding the line.',
      ].filter((line): line is string => Boolean(line));
    case ActionType.PerformJob:
      return jobLines(params.job, choice);
    case ActionType.Invite:
      return inviteLines(params, choice);
    case ActionType.Romance:
      return romanceLines(params, choice);
    default:
      return [
        choice,
        `Action: ${String(action.actionType).replace(/_/g, ' ')}.`,
        focusKey ? `The player is dealing with ${characterName(focusKey)}.` : undefined,
      ].filter((line): line is string => Boolean(line));
  }
}

function choiceLine(action: Action): string | undefined {
  const label = action.label?.trim();
  if (!label || GENERIC_ACTION_LABELS.has(label)) return undefined;
  return `The player's approach: "${label}".`;
}

function socializeLines(type: unknown, name: string): string[] {
  const lands = `The gesture reaches ${name}. Show it landing in a way that is particular to them — a thaw, an unplanned laugh, a favor, a barb they enjoy — not instant devotion.`;
  switch (type) {
    case 'befriend':
      return [
        `The player is bidding for friendship with ${name}: a confidence, a small kindness, or a joke that makes room for them.`,
        lands,
      ];
    case 'taunt':
      return [
        `The player is needling ${name}: a barb, a challenge, or a joke at their expense that invites rivalry. Sharp, not cruel for its own sake.`,
        lands,
      ];
    case 'impress':
      return [
        `The player is trying to earn ${name}'s respect with skill, nerve, or competence they would actually notice.`,
        lands,
      ];
    case 'flirt':
      return [
        `The player is flirting with ${name}: a charged compliment, a bold question, an invitation in how they speak.`,
        `Let ${name} receive it as themselves. Shy, proud, grumpy, and lonely people do not answer a flirt the same way.`,
        lands,
      ];
    default:
      return [`The player is spending a social moment with ${name}.`, lands];
  }
}

function jobLines(
  job: { name?: string; description?: string; jobType?: string; employerKey?: string } | undefined,
  choice?: string
): string[] {
  const lines = [
    choice,
    `The player is working${job?.name ? ` as ${job.name}` : ''}.`,
    job?.description ? `The work itself: ${clip(String(job.description), 400)}` : undefined,
  ];
  if (job?.jobType === JobType.Mentoring) {
    lines.push(
      'Dramatize teaching: an explanation, a correction, someone who follows or gets lost.'
    );
  } else if (job?.jobType === JobType.Coaching) {
    lines.push('Dramatize coaching: reading a person and getting them to try.');
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
    `The player is asking ${who} to a ${activity}${place ? ` at ${place}` : ''}${when}.`,
    'The question is happening in the current place. Show the ask and their answer. Do not skip ahead to the outing.',
  ].filter((line): line is string => Boolean(line));
}

function romanceLines(params: Record<string, unknown>, choice?: string): string[] {
  const partner = characterName(
    typeof params.characterKey === 'string' ? params.characterKey : undefined
  );
  if (params.romanceType === 'physical') {
    return [
      choice,
      `The player is in a sexual encounter with ${partner}.`,
      `Write it through ${partner}'s body, inhibitions, and the room. Not a clinch that would fit any lover.`,
    ].filter((line): line is string => Boolean(line));
  }
  return [
    choice,
    `The player is spending a stretch of emotional intimacy with ${partner}, and the relationship deepens.`,
    `Write the tenderness as ${partner} actually offers it. The closeness is real, and it does not have to be dramatic.`,
  ].filter((line): line is string => Boolean(line));
}

function dealPhrase(subscriptionType: unknown): string {
  if (typeof subscriptionType !== 'string' || !subscriptionType) return '';
  const deal =
    SUBSCRIPTION_DEAL[subscriptionType] ?? `a ${subscriptionType.replace(/_/g, ' ')} subscription`;
  return ` over ${deal}`;
}

function focusReminder(name: string): string {
  if (name === 'someone') return 'Keep the scene specific to this place and this attempt.';
  return `Center ${name}. If their name were swapped for someone else's, the scene should stop making sense.`;
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

function bioLead(bio: string): string | undefined {
  const trimmed = bio.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^[\s\S]*?[.!?](?:\s|$)/);
  const sentence = (match?.[0] ?? trimmed).trim();
  return sentence.length > 280 ? `${sentence.slice(0, 277).trim()}…` : sentence;
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trim()}…`;
}
