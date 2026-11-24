import type { ArtifactTool, ArtifactTrinket } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getLoadedArtifact, unequipTrinketIfEquipped } from '../artifacts';
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

export interface GiveArtifactParameters {
  patternKey: string;
  /** Defaults to the player. */
  characterKey?: string;
}

/** Grants a finished tool or trinket instance from an authored pattern. */
export function giveArtifact(parameters: GiveArtifactParameters): string {
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
  character.artifacts.tools ??= [];
  character.artifacts.trinkets ??= [];

  const copy = structuredClone(artifact);
  if ('skillBonuses' in copy) {
    character.artifacts.tools.push(copy as ArtifactTool);
  } else if ('attributeBonuses' in copy) {
    character.artifacts.trinkets.push(copy as ArtifactTrinket);
  } else {
    character.artifacts.tools.push(copy as ArtifactTool);
  }

  if (character.key === gs.player.key) {
    return `You receive the ${artifact.name}.`;
  }
  return `${character.name} receives the ${artifact.name}.`;
}

export interface GiftArtifactParameters {
  patternKey: string;
  characterKey: string;
}

/** Moves a crafted tool or trinket from the player to an NPC, matched by pattern key. */
export function giftArtifact(parameters: GiftArtifactParameters): string {
  const { patternKey, characterKey } = parameters;

  if (typeof patternKey !== 'string' || !patternKey.trim()) {
    return `Artifact pattern key is required.`;
  }
  if (typeof characterKey !== 'string' || !characterKey.trim()) {
    return `Character key is required.`;
  }

  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }

  const key = patternKey.trim();
  if (!gs.player.artifacts) {
    gs.player.artifacts = { patterns: [], tools: [], trinkets: [] };
  }
  gs.player.artifacts.tools ??= [];
  gs.player.artifacts.trinkets ??= [];

  const toolIndex = gs.player.artifacts.tools.findIndex((tool) => tool.patternKey === key);
  const trinketIndex =
    toolIndex === -1
      ? gs.player.artifacts.trinkets.findIndex((trinket) => trinket.patternKey === key)
      : -1;

  if (toolIndex === -1 && trinketIndex === -1) {
    const name = getLoadedArtifact(key)?.name ?? key;
    return `You do not have the ${name} to give.`;
  }

  if (!character.artifacts) {
    character.artifacts = { patterns: [], tools: [], trinkets: [] };
  }
  character.artifacts.tools ??= [];
  character.artifacts.trinkets ??= [];

  if (toolIndex !== -1) {
    const [moved] = gs.player.artifacts.tools.splice(toolIndex, 1);
    character.artifacts.tools.push(moved);
    return `You give the ${moved.name} to ${character.name}.`;
  }

  const [moved] = gs.player.artifacts.trinkets.splice(trinketIndex, 1);
  unequipTrinketIfEquipped(moved);
  character.artifacts.trinkets.push(moved);
  return `You give the ${moved.name} to ${character.name}.`;
}
