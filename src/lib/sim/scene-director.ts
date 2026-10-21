/*
  The scene director decides what a social scene contains.
  The LLM only turns that decision into prose.
*/

import { ActivityType, type Npc, type Rumor } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray, getRandomFromObjectWeights } from '../_utils/random';
import type { SocializeType } from './actions/socialize';
import { formatRoutineText } from './npc';

const NO_EXCLUSIONS: ReadonlySet<string> = new Set();

/** Flirt successes that assume an existing romantic spark. */
const FLIRT_BEFORE_LOVE = new Set([
  'reciprocate',
  'romantic_sincerity',
  'daring_escalation',
  'subtle_invitation',
]);

const innSituations = [
  'The innkeeper complains about an unusually demanding guest.',
  'A group of travelers is loudly celebrating a successful journey.',
  'A musician begins playing a familiar folk tune.',
  'A waiter accidentally brings the wrong drinks.',
  'Two merchants at a nearby table are arguing over a business deal.',
  'A delicious smell drifts from the kitchen.',
  'A group of card players erupts in cheers over an unexpected victory.',
  'An elderly regular offers unsolicited advice to anyone willing to listen.',
  'A traveler is telling an increasingly improbable story about an adventure.',
  'The innkeeper announces that the kitchen will soon close.',
];

const classroomSituations = [
  'The professor becomes distracted while explaining an especially complicated theory.',
  "A student's experimental card produces a small puff of colored smoke.",
  "Two students whisper behind the professor's back.",
  'A piece of magical equipment begins making an irritating noise.',
  'The professor announces a short break between exercises.',
  'Someone has drawn a rather unflattering caricature on the blackboard.',
  'A student asks a question that sends the lecture on an unexpected tangent.',
  'An assistant struggles to carry an oversized demonstration apparatus.',
  'The professor discovers that an important teaching instrument has gone missing.',
  'A student accidentally drops a collection of cards, scattering them across the floor.',
];

const bedroomSituations = [
  'A pile of books and papers has taken over most of the available furniture.',
  'Rain begins pattering softly against the window.',
  'A candle burns low, casting long shadows across the room.',
  'A forgotten cup of tea has gone completely cold.',
  'A personal belonging attracts attention and prompts a conversation.',
  'Someone discovers a small but embarrassing mess they had forgotten to tidy.',
  'Sounds of an animated conversation drift in from the neighboring room.',
  'An unfinished piece of work lies abandoned on the desk.',
  'A sudden gust of wind blows the curtains across the room.',
  'The distant sound of the town clock reminds the characters how late it has become.',
];

const locationSituations: Record<string, readonly string[]> = {
  library: [
    'The librarian complains about the noise.',
    'A nearby student is struggling to remain awake.',
    'A precarious pile of books collapses.',
    'The librarian announces closing time.',
    'An unusual book attracts attention.',
    'Someone is searching desperately for a missing volume.',
  ],
  cafeteria: [
    'The cook announces a new dish of rather questionable appearance.',
    'A student at a nearby table bursts into laughter.',
    'The cafeteria is unusually crowded, leaving very little room at the table.',
    "A waiter accidentally delivers someone else's meal.",
    'A heated discussion about the latest tournament is taking place nearby.',
    'A student attempts to discreetly sneak a second dessert.',
    'The daily special turns out to be surprisingly delicious.',
    'Someone has left an interesting book or newspaper on the table.',
    'A group of students is planning an excursion for the weekend.',
    'An exhausted student falls asleep with their head resting on the table.',
  ],
  'old-monk-inn': innSituations,
  'royal-pigeon-inn': innSituations,
  'artificery-classroom': classroomSituations,
  'enchanting-classroom': classroomSituations,
  'emma-room': bedroomSituations,
  'molly-room': bedroomSituations,
  'elsa-room': bedroomSituations,
  'vai-room': bedroomSituations,
};

const activitySituations: Partial<Record<ActivityType, readonly string[]>> = {
  [ActivityType.Study]: [
    'The characters disagree about the interpretation of a passage in a book.',
    "One character notices a mistake in the other's notes.",
    'A difficult problem has kept the characters occupied for far too long.',
    'One character discovers a surprisingly elegant solution to a problem.',
    'An obscure passage raises a question neither character can answer.',
    'The characters compare two authors who strongly disagree on the same subject.',
    'A surprisingly amusing example appears in an otherwise tedious textbook.',
    'One character realizes they have been studying the wrong chapter.',
    'The characters become distracted by a fascinating but irrelevant subject.',
    'One character challenges the other to solve a problem without consulting the textbook.',
    'A discussion about an academic subject gradually becomes more personal.',
    'The characters discover an unexpected connection between two different magical disciplines.',
  ],
  [ActivityType.Class]: [
    'The professor asks a difficult question and waits for someone to answer.',
    "A student's magical experiment produces an unexpected but harmless result.",
    'The professor demonstrates a technique that looks deceptively simple.',
    'A classmate confidently gives an answer that turns out to be completely wrong.',
    'The professor asks the students to work in pairs.',
    'A particularly complicated explanation leaves half the class visibly confused.',
    "A student's attempt to show off attracts the professor's attention.",
    'The professor introduces an unusual magical ingredient.',
    'The students are asked to evaluate a surprisingly powerful card.',
    'A minor disagreement breaks out over the best way to solve an exercise.',
    'The professor shares an anecdote from their own student days.',
    'An unexpectedly entertaining practical exercise interrupts an otherwise dry lecture.',
  ],
  [ActivityType.Social]: [
    'The conversation turns to a recent Academy event.',
    'One character brings up an amusing incident involving another student.',
    'The characters discover they have different opinions about a popular pastime.',
    'One character asks the other for an opinion on a personal dilemma.',
    'An innocent remark leads to a good-natured disagreement.',
    'The characters speculate about what they might do after graduating.',
    'One character mentions an unusual hobby or personal interest.',
    'A passing observation reminds the characters of a previous shared experience.',
    'One character proposes a hypothetical question that becomes surprisingly entertaining.',
    "The characters exchange opinions about another student's latest achievement.",
    'An unexpected compliment catches one character off guard.',
    'The conversation drifts toward childhood memories and life before the Academy.',
  ],
};

const responseDynamics: Record<
  SocializeType,
  { onSuccess: Record<string, string>; onFailure: Record<string, string> }
> = {
  befriend: {
    onSuccess: {
      warm_welcome: 'The NPC responds with genuine warmth and friendliness.',
      shared_enthusiasm: "The NPC enthusiastically joins in, building on the player's initiative.",
      playful_banter: 'The NPC responds with friendly teasing and good-natured humor.',
      personal_opening: 'The NPC becomes a little more candid, sharing something personal.',
      common_ground:
        'The NPC discovers or emphasizes something they have in common with the player.',
      appreciative: "The NPC expresses appreciation for the player's company or attention.",
      friendly_challenge:
        'The NPC turns the exchange into a lighthearted challenge or competition.',
      unexpected_kindness:
        'The NPC surprises the player with an unusually thoughtful or generous response.',
    },
    onFailure: {
      polite_distance: 'The NPC remains courteous but keeps the conversation impersonal.',
      distracted: 'The NPC is preoccupied and struggles to engage with the player.',
      awkward_silence: 'The attempt at friendly conversation produces an awkward pause.',
      missed_humor: "The NPC misunderstands or fails to appreciate the player's attempt at humor.",
      gentle_brush_off: 'The NPC politely indicates they would rather be doing something else.',
      mismatched_interests: 'The NPC finds little common ground with the player on this occasion.',
      guarded_response:
        'The NPC avoids opening up and redirects the conversation to safer subjects.',
      unintended_offense:
        'The player inadvertently touches on a sensitive subject, making the NPC uncomfortable.',
    },
  },
  flirt: {
    onSuccess: {
      reciprocate: 'The NPC openly flirts back, showing clear romantic interest.',
      playful_seduction:
        'The NPC responds with a confident, teasing romantic advance of their own.',
      coy_acceptance: 'The NPC welcomes the flirtation but expresses their interest indirectly.',
      flustered_delight: 'The NPC is visibly flattered and briefly loses their composure.',
      affectionate_teasing:
        'The NPC responds with affectionate mockery while making their attraction clear.',
      romantic_sincerity:
        'The NPC drops their usual defenses and responds with unexpected tenderness.',
      daring_escalation:
        'The NPC playfully takes the flirtation a little further, catching the player off guard.',
      subtle_invitation: 'The NPC hints at wanting to spend more time alone with the player.',
    },
    onFailure: {
      affectionate_rebuttal:
        'The NPC declines warmly, making clear that they still value the player.',
      playful_deflection:
        'The NPC responds with humor and steers the conversation away from romance.',
      elegant_counterattack:
        'The NPC turns the flirtation back on the player, leaving the player flustered without reciprocating.',
      gentle_boundary:
        'The NPC kindly but clearly indicates that romantic attention is not welcome right now.',
      cool_dismissal: 'The NPC rejects the advance with detached politeness.',
      amused_disbelief:
        "The NPC finds the player's romantic attempt entertaining rather than persuasive.",
      embarrassed_retreat:
        'The NPC becomes uncomfortable or embarrassed and quickly changes the subject.',
      terrible_timing:
        'The NPC might otherwise be receptive, but the circumstances make the advance unwelcome.',
    },
  },
  impress: {
    onSuccess: {
      sincere_admiration:
        "The NPC openly acknowledges the player's impressive ability or achievement.",
      reluctant_praise: 'The NPC is clearly impressed but struggles to admit it directly.',
      curious_interest:
        'The NPC becomes genuinely curious and asks the player to explain or demonstrate more.',
      competitive_excitement:
        'The NPC is impressed and immediately becomes eager to match or surpass the player.',
      enthusiastic_praise: 'The NPC reacts with delighted enthusiasm and generous compliments.',
      professional_recognition:
        "The NPC responds with serious, measured respect for the player's competence.",
      playful_skepticism:
        "The NPC jokes about the player's achievement while making their admiration apparent.",
      unexpected_humility:
        'The NPC admits that the player has taught them something or exceeded their expectations.',
    },
    onFailure: {
      polite_indifference:
        "The NPC acknowledges the player's effort without being particularly impressed.",
      constructive_criticism:
        "The NPC points out the shortcomings of the player's attempt and offers useful advice.",
      amused_skepticism:
        'The NPC reacts with mild amusement, finding the display less impressive than intended.',
      blunt_assessment: "The NPC frankly explains why the player's attempt falls short.",
      raised_expectations:
        'The NPC acknowledges some merit but makes clear they expected more from the player.',
      accidental_comedy:
        "The player's attempt to impress has an unintentionally comical result, which the NPC notices.",
      competitive_dismissal: 'The NPC confidently claims they could do better.',
      suspicious_reaction:
        "The NPC questions whether the player's achievement is quite as impressive as suggested.",
    },
  },
  taunt: {
    onSuccess: {
      good_natured_laughter: 'The NPC takes the provocation in good humor and laughs along.',
      witty_counterattack: 'The NPC fires back with an equally clever and entertaining taunt.',
      competitive_spark:
        'The NPC enthusiastically accepts the challenge and promises to prove the player wrong.',
      mock_indignation:
        'The NPC pretends to be terribly offended, exaggerating their outrage for comic effect.',
      grudging_amusement: 'The NPC tries to remain serious but cannot entirely suppress a smile.',
      playful_one_upmanship:
        'The NPC turns the exchange into a contest of increasingly ridiculous boasts.',
      exposed_bluff:
        "The NPC recognizes the player's teasing as a bluff and gleefully calls the player out on it.",
      affectionate_retaliation:
        'The NPC accepts the teasing and promises playful revenge at a future opportunity.',
    },
    onFailure: {
      genuine_offense: 'The NPC takes the remark personally and expresses their displeasure.',
      icy_rebuke: 'The NPC responds with controlled, unmistakable disapproval.',
      awkward_misfire: 'The taunt falls flat, leaving an uncomfortable silence.',
      cutting_retort:
        'The NPC delivers a sharp response that leaves the player regretting the provocation.',
      disappointed_reaction:
        'The NPC is disappointed that the player chose to mock rather than support them.',
      humorless_dismissal: 'The NPC refuses to engage with the provocation and moves on.',
      wounded_pride: 'The NPC attempts to conceal their hurt pride, but their reaction betrays it.',
      escalating_argument:
        'The NPC responds defensively, and the exchange briefly becomes a genuine disagreement.',
    },
  },
};

export interface ScenePayload {
  kind: 'rumor' | 'memory' | 'routine';
  /** Fact the writer must put in the NPC's dialogue. */
  text: string;
  index: number;
}

export interface SceneDirection {
  characterKey: string;
  dynamicKey: string;
  reaction: string;
  critical: boolean;
  situation?: string;
  payload?: ScenePayload;
}

/** Chooses the reaction, one optional world fact, and one optional situation. */
export function directSocialScene(
  characterKey: string,
  socializeType: SocializeType,
  success: boolean,
  critical: boolean
): SceneDirection {
  const npc = gs.characters[characterKey];
  const pool = responseDynamics[socializeType][success ? 'onSuccess' : 'onFailure'];
  const gateFlirt = socializeType === 'flirt' && success && (npc?.relationProgress?.love ?? 0) <= 0;
  const dynamic = pickDynamic(
    pool,
    npc?.personality?.preferredResponseDynamics ?? {},
    gateFlirt ? FLIRT_BEFORE_LOVE : NO_EXCLUSIONS
  );
  const situation = pickSituation(characterKey);
  const payload = npc ? pickPayload(npc) : undefined;
  const direction: SceneDirection = {
    characterKey,
    dynamicKey: dynamic.key,
    reaction: dynamic.text,
    critical,
    ...(situation ? { situation } : {}),
    ...(payload ? { payload } : {}),
  };
  console.log('[scene-director]', {
    characterKey,
    name: npc?.name,
    socializeType,
    success,
    critical,
    dynamicKey: direction.dynamicKey,
    reaction: direction.reaction,
    situation: direction.situation ?? null,
    payload: direction.payload
      ? {
          kind: direction.payload.kind,
          index: direction.payload.index,
          text: direction.payload.text,
        }
      : null,
  });
  return direction;
}

/** Marks the directed fact as used. Call only after the prose was saved. */
export function consumeScenePayload(direction: SceneDirection): void {
  const payload = direction.payload;
  if (!payload) return;

  if (payload.kind === 'rumor') {
    consumeRumor(payload);
    return;
  }

  const npc = gs.characters[direction.characterKey];
  if (!npc) return;

  if (payload.kind === 'memory') {
    const memory = npc.memories?.[payload.index];
    if (memory && payload.text.includes(memory.description)) {
      memory.referenceCount = (memory.referenceCount ?? 0) + 1;
      memory.lastReferencedDay = gs.time.day;
    }
    return;
  }

  const routine = npc.routines?.[payload.index];
  if (routine && formatRoutineText(routine) === payload.text) {
    routine.isKnown = true;
  }
}

function pickDynamic(
  pool: Record<string, string>,
  weights: Record<string, number>,
  excluded: ReadonlySet<string>
): { key: string; text: string } {
  const all = Object.keys(pool);
  const allowed = all.filter((key) => !excluded.has(key));
  const candidates = allowed.length > 0 ? allowed : all;
  const weighted = candidates.filter((key) => (weights[key] ?? 0) > 0);
  const key =
    weighted.length > 0
      ? getRandomFromObjectWeights(
          Object.fromEntries(weighted.map((entry) => [entry, weights[entry]]))
        )
      : getRandomFromArray(candidates);
  return { key, text: pool[key] };
}

function pickSituation(characterKey: string): string | undefined {
  const activityType = sharedActivityType(characterKey);
  if (activityType) {
    const lines = activitySituations[activityType] ?? activitySituations[ActivityType.Social];
    if (lines?.length) return getRandomFromArray([...lines]);
  }
  const placeLines = locationSituations[gs.player.placeKey];
  if (placeLines?.length) return getRandomFromArray([...placeLines]);
  return undefined;
}

function sharedActivityType(characterKey: string): ActivityType | undefined {
  const { day, period } = gs.time;
  const activity = gs.scheduledActivities.find(
    (item) => item.day === day && item.period === period && item.participants.includes(characterKey)
  );
  return activity?.type;
}

function pickPayload(npc: Npc): ScenePayload | undefined {
  const rumor = pickRumor(npc.key);
  if (rumor) return rumor;
  if (Math.random() >= 0.5) return undefined;
  return pickRoutine(npc) ?? pickMemory(npc);
}

function pickRumor(npcKey: string): ScenePayload | undefined {
  const day = gs.time.day;
  const eligible = (gs.rumors ?? [])
    .map((rumor, index) => ({ rumor, index }))
    .filter(
      ({ rumor }) =>
        isRumorActive(rumor, day) && canNpcTell(rumor, npcKey) && !isAboutThisNpc(rumor, npcKey)
    );
  if (eligible.length === 0) return undefined;
  const pinned = eligible.filter(({ rumor }) => rumor.fromNpcKey === npcKey);
  const chosen = getRandomFromArray(pinned.length > 0 ? pinned : eligible);
  return { kind: 'rumor', text: chosen.rumor.text, index: chosen.index };
}

function isRumorActive(rumor: Rumor, day: number): boolean {
  if (rumor.fromDay !== undefined && day < rumor.fromDay) return false;
  if (rumor.untilDay !== undefined && day > rumor.untilDay) return false;
  return true;
}

function canNpcTell(rumor: Rumor, npcKey: string): boolean {
  return rumor.fromNpcKey === undefined || rumor.fromNpcKey === npcKey;
}

function isAboutThisNpc(rumor: Rumor, npcKey: string): boolean {
  return rumor.aboutNpcKey === npcKey;
}

function pickRoutine(npc: Npc): ScenePayload | undefined {
  const options = (npc.routines ?? [])
    .map((routine, index) => ({ routine, index }))
    .filter(({ routine }) => !routine.isKnown);
  if (options.length === 0) return undefined;
  const chosen = getRandomFromArray(options);
  return { kind: 'routine', text: formatRoutineText(chosen.routine), index: chosen.index };
}

function pickMemory(npc: Npc): ScenePayload | undefined {
  const today = gs.time.day;
  const fresh = (npc.memories ?? [])
    .map((memory, index) => ({ memory, index }))
    .filter(({ memory }) => memory.lastReferencedDay !== today);
  if (fresh.length === 0) return undefined;
  const lowest = Math.min(...fresh.map(({ memory }) => memory.referenceCount ?? 0));
  const tied = fresh.filter(({ memory }) => (memory.referenceCount ?? 0) === lowest);
  const chosen = getRandomFromArray(tied);
  const text = chosen.memory.title
    ? `${chosen.memory.title}. ${chosen.memory.description}`
    : chosen.memory.description;
  return { kind: 'memory', text, index: chosen.index };
}

function consumeRumor(payload: ScenePayload): void {
  const rumors = gs.rumors ?? [];
  if (rumors[payload.index]?.text === payload.text) {
    rumors.splice(payload.index, 1);
    return;
  }
  const found = rumors.findIndex((rumor) => rumor.text === payload.text);
  if (found >= 0) rumors.splice(found, 1);
}
