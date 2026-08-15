import type {
  ActionType,
  ActivityType,
  ClassType,
  NarrationType,
  DayPeriod,
  ActionDuration,
  EventOutcomeType,
  SubscriptionType,
  CharacterTrait,
  CharacterGender,
  EventEffectType,
  SchoolName,
} from './enums-sim';
import type { CardTemplate, LandTemplate } from './model-battle';

export interface GameState {
  time: {
    day: number;
    period: DayPeriod;
    usedActions: Record<ActionDuration, number>;
    playedLeagueMatch: boolean;
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
}

export interface League {
  season: number;
  rankings: { characterKey: string; points: number }[];
  records: Record<string, { opponentKey: string; won: boolean }[]>;
}

export interface Scene {
  narration: Narration[];
  event: SceneEvent | undefined; // current event the player has to react to
  actions: Action[]; // list of proactive actions the player can do currently
  selectingNextPlace?: boolean; // whether the player is selecting a next place
}

export interface SceneEvent {
  text: string;
  options: SceneEventOption[];
}

export interface SceneEventOption {
  text: string;
  outcome: EventOutcome;
}

export interface EventOutcome {
  type: EventOutcomeType;
  action?: Action;
  effects?: EventEffect[];
}

export interface EventEffect {
  type: EventEffectType;
  parameters: Record<string, any>;
}

export interface Narration {
  id: string;
  text: string;
  type: NarrationType;
  attributeCheck?: AttributeCheck;
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
  duration: ActionDuration;
}

export interface Character {
  key: string;
  name: string;
  gold: number;
  placeKey: string;
  attributes: Attributes;
  subscriptions: Partial<Record<SubscriptionType, number>>;
  decks: Deck[];
}

export interface Player extends Character {
  focus: number;
}

export interface Npc extends Character {
  gender: CharacterGender;
  traits: Partial<Record<CharacterTrait, boolean>>;
  school?: SchoolName;
}

export interface Place {
  key: string;
  name: string;
  description: string;
  regionKey: string;
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
  lands: LandTemplate[];
}

export interface Attributes {
  dexterity: number;
  intelligence: number;
  vitality: number;
  charisma: number;
  aura: number;
}
