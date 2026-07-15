import type { DayPeriod } from './enums-sim';
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
  narration: string[];
}

export interface Character {
  key: string;
  name: string;
  gold: number;
  placeKey: string;
  attributes: Attributes;
}

export interface Player extends Character {}

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
