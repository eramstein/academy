import type { CardColor, SpellCard, UnitCard, UnitDeployed } from '@/lib/_model';

export const AI_PLAYER_ID = 1;
export const HUMAN_PLAYER_ID = 0;

export interface AiPersona {
  executeAction(possibleActions: PossibleActions): void;
}

/** Old heuristic personalities. Search uses {@link WeightPreset} instead. */
export enum PersonaType {
  Normal = 'Normal',
  Aggro = 'Aggro',
}

export enum WeightPreset {
  Normal = 'Normal',
  Aggro = 'Aggro',
  Defend = 'Defend',
}

export interface PossibleActions {
  count: number;
  playableSpells: SpellCard[];
  deployableUnits: UnitCard[];
  unitsWhoCanAttack: UnitDeployed[];
  unitsWhoCanMove: UnitDeployed[];
  playerAbility: boolean;
}

export type TargetRef =
  | { kind: 'unit'; instanceId: string }
  | { kind: 'land'; instanceId: string }
  | { kind: 'player'; playerId: number }
  | { kind: 'card'; instanceId: string }
  | { kind: 'cell'; row: number; column: number };

/** [actionIndex][targetDefinitionIndex] = chosen entities */
export type TargetAssignment = TargetRef[][][];

export type Candidate =
  | { id: string; kind: 'pass' }
  | { id: string; kind: 'attack'; unitId: string; target: TargetRef }
  | { id: string; kind: 'move'; unitId: string; row: number; column: number }
  | { id: string; kind: 'deploy'; cardId: string; row: number; column: number }
  | { id: string; kind: 'spell'; cardId: string; targets: TargetAssignment }
  | {
      id: string;
      kind: 'activate';
      sourceKind: 'unit' | 'land';
      sourceId: string;
      abilityIndex: number;
      targets: TargetAssignment;
    }
  | { id: string; kind: 'color'; color: CardColor };

export type ScoreTerminal = 'win' | 'loss' | 'none';

export interface ScoreBreakdown {
  id: string;
  terminal: ScoreTerminal;
  score: number;
  life: number;
  board: number;
  lands: number;
  hand: number;
  color: number;
  mana: number;
  latent: number;
}

export interface RankedCandidate {
  candidate: Candidate;
  rank: number;
  manaCost: number;
  instanceId: string;
  primary: boolean;
  killValue: number;
  obviousLethal: boolean;
  row?: number;
}
