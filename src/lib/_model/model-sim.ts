import type { TransactionParameters } from '../sim/actions';
import type { EventTrigger } from '../sim/events';
import type { CardColor } from './enums-battle';
import type {
  ActionType,
  ActivityType,
  CharacterGender,
  CharacterTrait,
  ClassType,
  DayPeriod,
  EventEffectType,
  NarrationType,
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
}

export interface Scene {
  narration: Narration[];
  event: SceneEvent | undefined; // current event the player has to react to
  actions: Action[]; // list of proactive actions the player can do currently
  selectingNextPlace?: boolean; // whether the player is selecting a next place
}

export interface SceneEvent {
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
}

export interface EventEffect {
  type: EventEffectType;
  parameters: Record<string, any>;
}

// An event template defines when a scene event triggers and how to generate its options
export interface EventTemplate {
  key: string;
  text: string;
  optionTemplates: EventOptionTemplate[];
  triggers: EventTrigger[];
  triggersOnce?: boolean;
  effectsTemplates?: EventEffectsTemplate[];
  characterArc?: string; // npc key
}

export interface EventOptionTemplate {
  text: string;
  actionTemplate?: ActionTemplate;
  effectsTemplates?: EventEffectsTemplate[];
}

export interface ActionTemplate {
  actionTemplate: string;
  args: Record<string, any>;
}

export interface EventEffectsTemplate {
  effectTemplate: string;
  args: Record<string, any>;
}

export interface Narration {
  id: string;
  text: string;
  type: NarrationType;
  mentions?: Mentions;
  attributeCheck?: AttributeCheck;
  cardIds?: string[];
  cardTemplates?: CardTemplate[];
  day?: number;
  period?: DayPeriod;
  characters?: string[];
  won?: boolean;
  transaction?: TransactionParameters;
}

// First string is the word appearing in the text, second is id
export interface Mentions {
  keywords: string[][];
  characters: string[][];
}

export interface ScheduledActivity {
  type: ActivityType;
  participants: string[];
  placeKey: string;
  day: number;
  period: DayPeriod;
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
}

export interface Player extends Character {
  maxFocus: number;
  focus: number;
  craftingKnowledge: CardKnowledge;
  craftingSkills: CardCraftingSkills;
}

export interface Npc extends Character {
  gender: CharacterGender;
  traits: Partial<Record<CharacterTrait, boolean>>;
  school?: SchoolName;
  relationProgress: {
    friendship: number;
    respect: number;
    love: number;
    rivalry: number;
  };
}

export interface Place {
  key: string;
  name: string;
  description: string;
  regionKey: string;
  itemsOnSale?: {
    resources?: Partial<Record<ResourceType, { price: number; count: number }>>;
  };
}

export interface Region {
  key: string;
  name: string;
  description: string;
}

export interface Deck {
  key: string;
  name: string;
  cards: CardTemplate[];
  lands: CardTemplate[];
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
}

export interface CardCraftingSkills {
  mastery: number;
  efficiency: number;
  inspiration: number;
}
