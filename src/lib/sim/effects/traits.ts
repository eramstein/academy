import { gs } from '@/lib/_state';

export interface AddKnownTraitParameters {
  characterKey: string;
  text: string;
}

/** Appends player-facing knowledge prose to an NPC's `knownTraits`. Silent — pair with narrate. */
export function addKnownTrait(parameters: AddKnownTraitParameters): string {
  const { characterKey, text } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (typeof text !== 'string' || !text.trim()) {
    return `Known trait text is required.`;
  }
  const trait = text.trim();
  if (!character.knownTraits) {
    character.knownTraits = [];
  }
  if (character.knownTraits.includes(trait)) {
    return '';
  }
  character.knownTraits.push(trait);
  return '';
}
