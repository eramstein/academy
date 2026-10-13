import { RelationTag, type RelationProgress } from '@/lib/_model';
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

/** Mixes prose into the latest arc beat (same box as the event text). */
export function appendRelationArcText(characterKey: string, text: string): void {
  const character = gs.characters[characterKey];
  if (!character || !text) {
    return;
  }
  const entry = character.relationArc.at(-1);
  if (!entry) {
    return;
  }
  entry.text = `${entry.text.trimEnd()}\n\n${text.trim()}`;
}

const RELATION_TAG_LABELS: Record<RelationTag, string> = {
  [RelationTag.Teammate]: 'teammates',
  [RelationTag.Rival]: 'rivals',
  [RelationTag.Friend]: 'friends',
  [RelationTag.Lover]: 'lovers',
  [RelationTag.SignificantOther]: 'significant others',
};

export interface AddRelationTagParameters {
  characterKey: string;
  relationTag: RelationTag;
}

/** Adds a relation tag to an NPC if not already present. */
export function addRelationTag(parameters: AddRelationTagParameters): string {
  const { characterKey, relationTag } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (!Object.values(RelationTag).includes(relationTag)) {
    return `Invalid relation tag: ${relationTag}.`;
  }
  if (!character.relationTags) {
    character.relationTags = [];
  }
  if (character.relationTags.includes(relationTag)) {
    return `You and ${character.name} are already ${RELATION_TAG_LABELS[relationTag]}.`;
  }
  character.relationTags.push(relationTag);
  return `You and ${character.name} are now ${RELATION_TAG_LABELS[relationTag]}.`;
}
