import type { ActionType, DayPeriod, NarrationType, SubscriptionType } from './enums-sim';
import type { CardTemplate, LandTemplate } from './model-battle';

export interface GameState {
  time: {
    day: number;
    period: DayPeriod;
  };
  characters: Record<string, Npc>;
  player: Player;
  places: Place[];
  scene: Scene;
}

export interface Scene {
  narration: Narration[];
  actions: Action[];
}

export interface Narration {
  text: string;
  type: NarrationType;
  attributeCheck?: AttributeCheck;
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
  label: string;
  actionType: ActionType;
  actionParameters: Record<string, any>;
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
