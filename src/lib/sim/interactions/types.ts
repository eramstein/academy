import type { RelationTag } from '@/lib/_model';

/** Fires the first time `threshold` becomes true for this value. Ends the interaction. */
export interface InteractionValueOutcome {
  /** Comparison against the value after the beat, e.g. ">10" or "<-3". */
  threshold: string;
  effect: string;
}

export interface InteractionValue {
  key: string;
  label: string;
  initial: number;
  /** Anchor points for describing the number, e.g. { 0: 'neutral', 5: 'annoyed' }. */
  bands: Record<number, string>;
  outcomes?: InteractionValueOutcome[];
}

/**
 * When an interaction is offered. Omit to offer it with any present NPC.
 * Every set field must hold; new criteria can be added here later.
 */
export interface InteractionTriggers {
  /** At least one of these tags must already be on the NPC. */
  anyRelationTag?: RelationTag[];
}

/**
 * One kind of structured social scene. Adding a kind is a new object of this
 * shape (and a registry entry), not a new code path.
 */
export interface InteractionTemplate {
  key: string;
  /** Button label, distinct from the generic "Interact" action. */
  label: string;
  icon?: string;
  /** What this kind of scene is. The runner adds the shared output rules. */
  systemPrompt: string;
  /** `{player}` and `{npc}` are replaced with the characters' speaking names. */
  situation: string;
  actionTypes: string[];
  values: InteractionValue[];
  /** How the NPC tends to move each value when the player picks that action type. */
  reactions: Record<string, Record<string, number>>;
  /**
   * Extra voice notes keyed by NPC key. When present for the current partner,
   * appended to the prompt so the model can play them more precisely.
   */
  npcDescriptions?: Record<string, string>;
  triggers?: InteractionTriggers;
  /** Read when the player chooses "Stop there". */
  stopText?: string;
}
