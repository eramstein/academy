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
}

export interface Character {
  key: string;
  name: string;
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
