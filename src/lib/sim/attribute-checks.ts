import type { Action, AttributeCheck, Attributes } from '../_model/model-sim';
import { gs } from '../_state';
import { uiState } from '../_state/state-ui.svelte';
import { narrateAttributeCheck, resolveAttributeCheckNarration } from './narration';

export const skillCheckDifficulty = {
  trivial: -1000,
  veryeasy: -6,
  easy: -3,
  medium: 0,
  hard: 3,
  extreme: 6,
  impossible: 1000,
} as const;

export type SkillCheckDifficultyKey = keyof typeof skillCheckDifficulty;

export const skillCheckDifficultyKeys = Object.keys(
  skillCheckDifficulty
) as SkillCheckDifficultyKey[];

export const skillCheckDifficultyLabels: Record<SkillCheckDifficultyKey, string> = {
  trivial: 'Trivial',
  veryeasy: 'Very Easy',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extreme',
  impossible: 'Impossible',
};

const difficultLabels = {
  [-1000]: 'Trivial',
  [-6]: 'Very Easy',
  [-3]: 'Easy',
  [0]: 'Medium',
  [3]: 'Hard',
  [6]: 'Extreme',
  [1000]: 'Impossible',
} as const;

export type AttributeCheckResult = {
  roll: number;
  success: boolean;
  critical: boolean;
  outcomeText: string;
  usedFocus: number;
};

type PendingResolver = (usedFocus: number) => void;

const pendingResolvers = new Map<string, PendingResolver>();

// attributeDelta compares the player's attribute to an NPC's attribute
export function getDifficultyFromAttributeDelta(attributeDelta: number): number {
  if (attributeDelta < -10) {
    return skillCheckDifficulty.trivial;
  } else if (attributeDelta < -6) {
    return skillCheckDifficulty.veryeasy;
  } else if (attributeDelta < -3) {
    return skillCheckDifficulty.easy;
  } else if (attributeDelta < 3) {
    return skillCheckDifficulty.medium;
  } else if (attributeDelta < 6) {
    return skillCheckDifficulty.hard;
  } else if (attributeDelta < 9) {
    return skillCheckDifficulty.extreme;
  }
  return skillCheckDifficulty.impossible;
}

export function confrontNpc(
  attribute: keyof Attributes,
  npcKey: string,
  attemptedAction?: Action
): Promise<AttributeCheckResult> {
  const npcAttributeValue = gs.characters[npcKey].attributes[attribute];
  const playerAttributeValue = gs.player.attributes[attribute];
  const attributeDelta = npcAttributeValue - playerAttributeValue;
  const difficulty = getDifficultyFromAttributeDelta(attributeDelta);
  return attributeCheck(playerAttributeValue, difficulty, attribute, attemptedAction);
}

function difficultyLabel(difficulty: number): string {
  return difficultLabels[difficulty as keyof typeof difficultLabels] ?? 'Unknown';
}

function ensurePlayerFocus() {
  if (typeof gs.player.maxFocus !== 'number') {
    gs.player.maxFocus = 3;
  }
  if (typeof gs.player.focus !== 'number') {
    gs.player.focus = gs.player.maxFocus;
  }
}

function spendFocus(requested: number, available: number): number {
  ensurePlayerFocus();
  const spent = Math.max(0, Math.min(requested, gs.player.focus, available));
  if (spent > 0) {
    gs.player.focus -= spent;
  }
  return spent;
}

function writeRoll(
  check: AttributeCheck,
  attribute: number,
  difficulty: number,
  spent: number
): AttributeCheckResult {
  const focusBonus = spent * 5;
  const roll = Math.floor(Math.random() * 20) + 1;
  const success = roll <= attribute + focusBonus - difficulty;
  const critical = roll === 20 || roll === 1;
  const outcomeText = `${success ? 'Success!' : 'Failure!'} ${critical ? 'Critical!' : ''}`.trim();

  check.pending = false;
  check.usedFocus = spent;
  check.roll = roll;
  check.success = success;
  check.critical = critical;
  check.target = attribute + focusBonus - difficulty;

  return { roll, success, critical, outcomeText, usedFocus: spent };
}

/**
 * Commit focus for a pending attribute check and resolve the roll.
 * Called from AttributeCheckEntry when the player confirms.
 */
export function commitAttributeCheck(narrationId: string, usedFocus: number) {
  const resolve = pendingResolvers.get(narrationId);
  if (!resolve) return;
  pendingResolvers.delete(narrationId);
  resolve(usedFocus);
}

// This is DnD style, very random. A attribute of 10/20 can succeed an extreme difficulty check with some luck.
export function attributeCheck(
  attribute: number,
  difficulty: number,
  attributeName: keyof Attributes,
  attemptedAction?: Action,
  usedFocus?: number
): Promise<AttributeCheckResult> {
  ensurePlayerFocus();
  const availableFocus = gs.player.focus;
  const check: AttributeCheck = {
    success: false,
    critical: false,
    roll: 0,
    attribute: attributeName,
    difficulty: difficultyLabel(difficulty),
    target: attribute - difficulty,
    attemptedAction,
    availableFocus,
    usedFocus: 0,
    pending: false,
  };

  const needsCommit = usedFocus === undefined && !uiState.isHeadless && availableFocus > 0;

  if (!needsCommit) {
    const spent = spendFocus(usedFocus ?? 0, availableFocus);
    const result = writeRoll(check, attribute, difficulty, spent);
    const narrationId = narrateAttributeCheck(check);
    void resolveAttributeCheckNarration(narrationId, check);
    return Promise.resolve(result);
  }

  check.pending = true;
  // Block further actions until the player commits focus and the roll resolves.
  gs.scene.actions = [];
  const narrationId = narrateAttributeCheck(check);

  return new Promise((resolve) => {
    pendingResolvers.set(narrationId, (requested) => {
      const spent = spendFocus(requested, availableFocus);
      const result = writeRoll(check, attribute, difficulty, spent);
      void resolveAttributeCheckNarration(narrationId, check);
      resolve(result);
    });
  });
}
