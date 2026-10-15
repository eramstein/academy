import { RelationTag, type RelationProgress } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { narrateRelationUpdate } from '../narration';

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
  title?: string;
  image?: string;
}

/** Appends a relation-arc beat (text + optional title / folder/file image path under images/). */
export function updateRelationArc(parameters: UpdateRelationArcParameters): string {
  const { characterKey, text, title, image } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (!text) {
    return `Relation arc text is required.`;
  }
  const entry: { title?: string; text: string; image?: string } = { text };
  if (title) {
    entry.title = title;
  }
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

function relationTagDisplay(tag: RelationTag): string {
  return tag.replaceAll('_', ' ');
}

/** Accepts enum values (`friend`) or keys (`EmmaSmitten`). */
export function resolveRelationTag(tag: string): RelationTag | undefined {
  if ((Object.values(RelationTag) as string[]).includes(tag)) {
    return tag as RelationTag;
  }
  if (Object.prototype.hasOwnProperty.call(RelationTag, tag)) {
    return RelationTag[tag as keyof typeof RelationTag];
  }
  return undefined;
}

export interface AddRelationTagParameters {
  characterKey: string;
  relationTag: RelationTag | string;
}

/** Adds a relation tag to an NPC if not already present. */
export function addRelationTag(parameters: AddRelationTagParameters): string {
  const { characterKey, relationTag: rawTag } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  const relationTag = resolveRelationTag(String(rawTag));
  if (!relationTag) {
    return `Invalid relation tag: ${rawTag}.`;
  }
  if (!character.relationTags) {
    character.relationTags = [];
  }
  if (!character.relationTags.includes(relationTag)) {
    character.relationTags.push(relationTag);
  }
  narrateRelationUpdate(characterKey, relationTagDisplay(relationTag));
  // Narrated above with RelationUpdate styling; avoid a second plain-text line.
  return '';
}
