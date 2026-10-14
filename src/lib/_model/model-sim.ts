import type { SocializeParameters, TransactionParameters } from '../sim/actions';
import type { EventTrigger } from '../sim/events';
import type { CardColor } from './enums-battle';
import type {
  ActionType,
  ActivityType,
  CharacterGender,
  CharacterTrait,
  ClassType,
  DayPeriod,
  Emotion,
  EventEffectType,
  JobType,
  NarrationType,
  RelationTag,
  ResourceType,
  SchoolName,
  SubscriptionType,
} from './enums-sim';
import type { CardTemplate, UnitKeywords } from './model-battle';

export interface GameState {
  time: {
    day: number;
    period: DayPeriod;
    playedLeagueMatch: boolean;
    longActionPerformed: boolean;
    usedActions: Partial<Record<ActionType, number>>;
  };
  characters: Record<string, Npc>;
  player: Player;
  places: Record<string, Place>;
  regions: Record<string, Region>;
  scene: Scene;
  scheduledActivities: ScheduledActivity[];
  league: League;
  ongoingBattle: OngoingBattle | null;
  storyTags: Record<string, number>;
}

export interface OngoingBattle {
  playerDeck: Deck;
  opponentDeck: Deck;
  opponentKey: string;
  isLeagueMatch: boolean;
}

export interface League {
  season: number;
  rankings: { characterKey: string; points: number }[];
  records: Record<string, { opponentKey: string; won: boolean }[]>;
  playedToday: boolean;
  pastWinners: string[];
}

export interface Scene {
  narration: Narration[];
  event: SceneEvent | undefined; // current event the player has to react to
  actions: Action[]; // list of proactive actions the player can do currently
  selectingNextPlace?: boolean; // whether the player is selecting a next place
  image?: string;
  /** Active socialize attempt; Socialize triggers only match while this is set. */
  socializeContext?: SocializeParameters;
}

export interface SceneEvent {
  key: string;
  text: string;
  options: EventOption[];
}

export interface EventOption {
  text: string;
  outcome: EventOutcome;
}

export interface EventOutcome {
  action?: Action;
  effects?: EventEffect[];
  /** When set, roll on select; apply successEffects or failureEffects instead of effects. */
  attributeCheck?: EventOptionAttributeCheck;
}

export interface EventEffect {
  type: EventEffectType;
  parameters: Record<string, any>;
}

export type EventImageSize = 'small' | 'medium' | 'large';

/** Named difficulties for event option skill checks (see skillCheckDifficulty). */
export type SkillCheckDifficultyName =
  | 'trivial'
  | 'veryeasy'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'extreme'
  | 'impossible';

/** Authored skill check on an event option: roll attribute vs difficulty, then branch effects. */
export interface EventOptionAttributeCheck {
  attribute: keyof Attributes;
  difficulty: SkillCheckDifficultyName;
  successEffects?: EventEffect[];
  failureEffects?: EventEffect[];
}

// An event template defines when a scene event triggers and how to generate its options
export interface EventTemplate {
  key: string;
  /** Short heading shown above event narration / relation-arc beats. */
  title?: string;
  text: string;
  optionTemplates: EventOptionTemplate[];
  triggers: EventTrigger[];
  effects?: EventEffect[];
  characterArc?: string; // npc key
  emotion?: Emotion;
  image?: string;
  imageSize?: EventImageSize;
}

export interface EventOptionTemplate {
  text: string;
  actionTemplate?: ActionTemplate;
  /** Direct effects when the option is chosen (no skill check). */
  effects?: EventEffect[];
  /** Alternative to effects: roll, then apply success or failure effects. */
  attributeCheck?: EventOptionAttributeCheck;
  triggers?: EventTrigger[];
}

export interface ActionTemplate {
  actionTemplate: string;
  args: Record<string, any>;
}

export interface Narration {
  id: string;
  /** Optional heading for authored event beats. */
  title?: string;
  text: string;
  type: NarrationType;
  mentions?: Mentions;
  attributeCheck?: AttributeCheck;
  skipCheckText?: boolean;
  /** Action being narrated when there is no attribute check (e.g. socialize). */
  attemptedAction?: Action;
  /** Short visual description for generating an image of this scene. */
  imagePrompt?: string;
  /** Object URL for a generated scene illustration. */
  imageUrl?: string;
  /** Display size for static event art (`imageUrl` without `imagePrompt`). */
  imageSize?: EventImageSize;
  cardIds?: string[];
  cardTemplates?: CardTemplate[];
  day?: number;
  period?: DayPeriod;
  characters?: string[];
  emotion?: Emotion;
  won?: boolean;
  transaction?: TransactionParameters;
  gold?: number;
}

// First string is the word appearing in the text, second is id
export interface Mentions {
  keywords: string[][];
  characters: string[][];
  actions: string[][];
}

export interface ScheduledActivity {
  type: ActivityType;
  participants: string[];
  placeKey: string;
  day: number;
  period: DayPeriod;
  jobId?: string;
  eventId?: string;
}

export interface ClassActivity extends ScheduledActivity {
  classType: ClassType;
}

export interface AttributeCheck {
  success: boolean;
  critical: boolean;
  roll: number;
  attribute: string;
  difficulty: string;
  target: number;
  attemptedAction?: Action;
  /** Focus available when the check started (for commit UI). */
  availableFocus?: number;
  /** Focus spent on this check (+5 to the target each). */
  usedFocus?: number;
  /** Waiting for the player to commit focus before rolling. */
  pending?: boolean;
}

export interface Action {
  label?: string;
  actionType: ActionType;
  actionParameters: Record<string, any>;
  missingParameters?: Record<string, Array<string | [string, string]> | number>;
  isLongAction: boolean;
}

export interface Character {
  key: string;
  name: string;
  gold: number;
  placeKey: string;
  attributes: Attributes;
  subscriptions: Partial<Record<SubscriptionType, number>>;
  decks: Deck[];
  collection: CardTemplate[];
  resources: Record<ResourceType, number>;
  craftingKnowledge: CardKnowledge;
  craftingSkills: CardCraftingSkills;
  jobs: Job[];
}

export interface Job {
  id: string;
  jobType: JobType;
  name: string;
  description: string;
  payPerActivity: number;
  employerKey: string;
  placeKey: string;
  schedule: Schedule;
}

export interface Player extends Character {
  maxFocus: number;
  focus: number;
}

export interface Npc extends Character {
  gender: CharacterGender;
  age: number;
  school?: SchoolName;
  favoriteColors: CardColor[];
  relationProgress: RelationProgress;
  relationArc: { title?: string; text: string; image?: string }[];
  relationTags: RelationTag[];
  activityHistory: Partial<Record<ActivityType, number>>;
  bio: string;
  favoritePlaces: Record<string, number>;
  matchesRecord: { won: number; lost: number };
  personality: Personality;
  knownTraits: KnownTrait[];
  tcgSkill: number;
}

export interface KnownTrait {
  title: string;
  description: string;
}

export interface Personality {
  traits: Partial<Record<CharacterTrait, boolean>>;
  speech: string; // way of talking, mannerisms, etc.
  humor: string; // sense of humor, favorite style of humor, etc.
  conflicts: string; // how they react to conflict and arguments, etc.
  habits: string[]; // typical patterns of behavior, etc.
}

export interface RelationProgress {
  friendship: number;
  respect: number;
  love: number;
  rivalry: number;
}

export interface Place {
  key: string;
  name: string;
  description: string;
  regionKey: string;
  itemsOnSale?: {
    resources?: Partial<Record<ResourceType, { price: number; count: number }>>;
  };
  locked?: boolean;
}

export interface Region {
  key: string;
  name: string;
  description: string;
}

export interface Deck {
  key: string;
  name: string;
  cards: string[];
  lands: string[];
}

export interface DeckBlueprint {
  key: string;
  name: string;
  cards: CardTemplate[];
  lands: CardTemplate[];
  learntKeywords: string[];
  learntActions: string[];
}

export interface Attributes {
  dexterity: number;
  intelligence: number;
  vitality: number;
  charisma: number;
  aura: number;
}

export interface CardKnowledge {
  colors?: Partial<Record<CardColor, number>>;
  keywords?: Partial<Record<keyof UnitKeywords, number>>;
  actions?: Partial<Record<string, number>>;
}

export interface CardCraftingSkills {
  mastery: number;
  erudition: number;
  inspiration: number;
}

export interface Schedule {
  date?: {
    day?: number;
    period?: DayPeriod;
  };
  /** When true, schedule on the soonest free slot for date.period (default evening). */
  nextFree?: boolean;
  recurrence?: {
    maxCount?: number;
    daysOfWeek?: number[];
    period?: DayPeriod;
  };
}
