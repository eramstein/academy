import { gs } from '@/lib/_state';
import { getLoadedArtifact } from '../artifacts';
import { getActingCharacter } from '../characters';

export interface AcquireArtifactPatternParameters {
  patternKey: string;
  /** Defaults to the player. */
  characterKey?: string;
}

export function acquireArtifactPattern(parameters: AcquireArtifactPatternParameters): string {
  const { patternKey, characterKey = 'player' } = parameters;

  if (typeof patternKey !== 'string' || !patternKey.trim()) {
    return `Artifact pattern key is required.`;
  }
  if (characterKey !== 'player' && characterKey !== gs.player.key && !gs.characters[characterKey]) {
    return `Invalid character key: ${characterKey}.`;
  }

  const key = patternKey.trim();
  const artifact = getLoadedArtifact(key);
  if (!artifact) {
    return `Unknown artifact pattern: ${key}.`;
  }

  const character = getActingCharacter(characterKey);
  if (!character.artifacts) {
    character.artifacts = { patterns: [], tools: [], trinkets: [] };
  }
  if (!character.artifacts.patterns) {
    character.artifacts.patterns = [];
  }

  if (character.artifacts.patterns.includes(key)) {
    if (character.key === gs.player.key) {
      return `You already know the ${artifact.name} pattern.`;
    }
    return `${character.name} already knows the ${artifact.name} pattern.`;
  }

  character.artifacts.patterns.push(key);

  if (character.key === gs.player.key) {
    return `You acquire the ${artifact.name} pattern.`;
  }
  return `${character.name} acquires the ${artifact.name} pattern.`;
}
