import { gs } from '@/lib/_state';
import type { KnownTrait } from '@/lib/_model/model-sim';

export interface AddKnownTraitParameters {
  characterKey: string;
  title: string;
  description: string;
}

/** Appends player-facing knowledge to an NPC's `knownTraits`. Silent — pair with narrate. */
export function addKnownTrait(parameters: AddKnownTraitParameters): string {
  const { characterKey, title, description } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (typeof title !== 'string' || !title.trim()) {
    return `Known trait title is required.`;
  }
  if (typeof description !== 'string' || !description.trim()) {
    return `Known trait description is required.`;
  }
  const trait: KnownTrait = {
    title: title.trim(),
    description: description.trim(),
  };
  if (!character.knownTraits) {
    character.knownTraits = [];
  }
  if (character.knownTraits.some((t) => t.title === trait.title)) {
    return '';
  }
  character.knownTraits.push(trait);
  return '';
}
