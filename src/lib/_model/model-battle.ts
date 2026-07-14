import type { UnitFilterArgs } from '../battle/effects';
import {
  AiTurnGoal,
  AiTurnStrategy,
  CardColor,
  CardType,
  CounterType,
  TargetType,
  TriggerType,
  UnitType,
} from './enums-battle';

export interface BattleState {
  turn: number;
  isPlayersTurn: boolean;
  playerIdWon: number | null;
  players: Player[];
  units: UnitDeployed[];
  aiState: AiState;
}

export interface Player {
  id: number;
  isPlayer: boolean;
  name: string;
  mana: number;
  maxMana: number;
  life: number;
  hand: Card[];
  deck: Card[];
  graveyard: Card[];
  lands: Land[];
  colors: Partial<Record<CardColor, number>>;
  abilityUsed: boolean;
}

// CARD TEMPLATE INTERFACES (before the game started, the card itself)
export interface BaseCardTemplate {
  id: string;
  name: string;
  imageFileName: string;
  type: CardType;
  cost: number;
  colors: { color: CardColor; count: number }[];
  aiHints?: AiTurnGoal[];
}

export interface UnitCardTemplate extends BaseCardTemplate {
  power: number;
  maxHealth: number;
  keywords?: UnitKeywords;
  abilities?: Ability[];
  unitTypes?: UnitType[];
}

export interface SpellCardTemplate extends BaseCardTemplate {
  actions: ActionDefinition[];
}

export interface LandTemplate extends BaseCardTemplate {
  health: number;
  retaliate?: number;
  abilities?: Ability[];
  ruinsAbilities?: Ability[];
}

export type CardTemplate = UnitCardTemplate | SpellCardTemplate | LandTemplate;

// CARD INTERFACES (once the game started, drawn or in deck)
export interface BaseCard extends BaseCardTemplate {
  instanceId: string;
  ownerPlayerId: number;
}
export interface UnitCard extends UnitCardTemplate, BaseCard {}
export interface SpellCard extends SpellCardTemplate, BaseCard {}
export type Card = UnitCard | SpellCard;

// CARD DEPLOYED INTERFACES (for permanents, once on the board)
export interface BaseCardDeployed extends BaseCard {
  position: Position;
}

export interface Position {
  row: number;
  column: number;
}

export interface UnitDeployed extends UnitCard, BaseCardDeployed {
  health: number;
  hasAttacked: boolean;
  hasMoved: boolean;
  exhausted: boolean;
  statuses: UnitStatuses;
  untilEndOfTurn: UnitEndOfTurnEffects;
  staticModifiers: {
    source: { sourceId?: string; effectName: string };
    permanent: boolean;
    keyword?: UnitKeywordDefinition;
    attack?: number;
  }[];
  initialKeywords: UnitKeywords; // used to restore keywords if the temporary effect ends
  counters: Partial<Record<CounterType, number>>;
  isDying?: boolean;
}

export interface SpellCardDeployed extends SpellCard, BaseCardDeployed {
  remainingDuration?: number;
}

export type CardDeployed = UnitDeployed | SpellCardDeployed;

export interface Land extends LandTemplate {
  instanceId: string;
  ownerPlayerId: number;
  position: number;
  isRuined: boolean;
  retaliate?: number;
}

export type UnitKeywordDefinition = {
  key: keyof UnitKeywords;
  value: boolean | number;
};

export interface UnitKeywords {
  ranged?: boolean;
  haste?: boolean;
  moveAndAttack?: boolean;
  retaliate?: number;
  armor?: number;
  resist?: number;
  poisonous?: number;
  regeneration?: number;
  trample?: boolean;
  zerk?: boolean;
  cleave?: boolean;
  lance?: boolean;
  flying?: boolean;
  immobile?: boolean;
  armorPiercing?: boolean;
  raid?: number;
}

export type UnitEndOfTurnEffects = UnitKeywords & {
  power?: number;
};

export interface UnitStatuses {
  poison?: number;
  mezz?: number;
  root?: number;
  stun?: number;
  daze?: number;
}

export interface Ability {
  actions: ActionDefinition[];
  trigger: Trigger;
  cost?: number;
  exhausts?: boolean;
}

export interface EffectArgs {
  targets: EffectTargets[];
  triggerParams: any;
  player: Player;
  unit?: UnitDeployed;
  land?: Land;
}

export interface Trigger {
  type: TriggerType;
  range?: UnitFilterArgs;
  staticRecompute?: TriggerType[];
  text?: string;
}

export interface TargetDefinition {
  type: TargetType;
  count?: number;
}

export type EffectTargets = UnitDeployed[] | Position[] | Land[] | Player[] | Card[];

export type ActionDefinition = {
  effect: {
    name: string;
    args: Record<string, any>;
  };
  targets?: TargetDefinition[];
};

export type AiState = {
  strategy: AiTurnStrategy;
  goals: { goal: AiTurnGoal; args: any }[];
  dismissedCards: Record<string, boolean>; // ids of cards that won't be played this turn
};
