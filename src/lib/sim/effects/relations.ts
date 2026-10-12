import type { RelationProgress } from '@/lib/_model';
import { gs } from '@/lib/_state';

export type RelationParameter = keyof RelationProgress;

export interface ChangeRelationParameters {
  characterKey: string;
  relationParameter: RelationParameter;
  amount: number;
}

/** Updates cumulative relation progress (not reset when events fire). */
export function changeRelation(parameters: ChangeRelationParameters): string {
  const { characterKey, relationParameter, amount } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  character.relationProgress[relationParameter] =
    (character.relationProgress[relationParameter] ?? 0) + amount;
  const direction = amount >= 0 ? 'improves' : 'worsens';
  return `Your ${relationParameter} with ${character.name} ${direction}.`;
}

export interface UpdateRelationArcParameters {
  characterKey: string;
  text: string;
  image?: string;
}

/** Appends a relation-arc beat (text + optional folder/file image path under images/). */
export function updateRelationArc(parameters: UpdateRelationArcParameters): string {
  const { characterKey, text, image } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (!text) {
    return `Relation arc text is required.`;
  }
  const entry: { text: string; image?: string } = { text };
  if (image) {
    entry.image = image;
  }
  character.relationArc.push(entry);
  return text;
}
