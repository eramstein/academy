import { gs } from '../_state';
import type { Attributes } from '../_model/model-game';
import { narrateAttributeCheck } from './narration';

export const skillCheckDifficulty = {
  trivial: -1000,
  veryeasy: -6,
  easy: -3,
  medium: 0,
  hard: 3,
  extreme: 6,
  impossible: 1000,
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
  npcKey: string
): {
  roll: number;
  success: boolean;
  critical: boolean;
} {
  const npcAttributeValue = gs.characters[npcKey].attributes[attribute];
  const playerAttributeValue = gs.player.attributes[attribute];
  const attributeDelta = npcAttributeValue - playerAttributeValue;
  const difficulty = getDifficultyFromAttributeDelta(attributeDelta);
  return attributeCheck(playerAttributeValue, difficulty, attribute);
}

// This is DnD style, very random. A attribute of 10/20 can succeed an extreme difficulty check with some luck.
export function attributeCheck(
  attribute: number,
  difficulty: number,
  attributeName: keyof Attributes
): {
  roll: number;
  success: boolean;
  critical: boolean;
  outcomeText: string;
} {
  const roll = Math.floor(Math.random() * 20) + 1;
  const success = roll <= attribute - difficulty;
  const critical = roll === 20 || roll === 1;
  const outcomeText = success ? 'Success!' : 'Failure!';
  const criticalText = critical ? 'Critical!' : '';
  narrateAttributeCheck({
    success,
    critical,
    roll,
    attribute: attributeName,
    difficulty: difficultLabels[difficulty as keyof typeof difficultLabels] ?? 'Unknown',
    target: attribute - difficulty,
  });
  return {
    roll,
    success,
    critical,
    outcomeText: `${outcomeText} ${criticalText}`,
  };
}
