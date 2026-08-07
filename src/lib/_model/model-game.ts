import type {
  ActionType,
  ActivityType,
  ClassType,
  NarrationType,
  SubscriptionType,
  DayPeriod,
  ActionDuration,
  EventOutcomeType,
} from './enums-sim';
import type { CardTemplate, LandTemplate } from './model-battle';

export interface GameState {
  time: {
    day: number;
    period: DayPeriod;
    usedActions: Record<ActionDuration, number>;
  };
  characters: Record<string, Npc>;
  player: Player;
  places: Record<string, Place>;
  regions: Record<string, Region>;
  scene: Scene;
  scheduledActivities: ScheduledActivity[];
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
  duration: ActionDuration;
}

export interface Character {
  key: string;
  name: string;
  gold: number;
  placeKey: string;
  attributes: Attributes;
  subscriptions: Partial<Record<SubscriptionType, number>>;
}

export interface Player extends Character {
  focus: number;
}

export interface Npc extends Character {}

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
