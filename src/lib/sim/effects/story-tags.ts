import { gs } from '@/lib/_state';

export interface AddStoryTagParameters {
  tag: string;
  /** Increment applied to the tag counter; defaults to 1. */
  amount?: number;
}

/** Increments a free-form story tag on `gs.storyTags` for later `story_tag` triggers. */
export function addStoryTag(parameters: AddStoryTagParameters): string {
  const { tag, amount = 1 } = parameters;
  if (typeof tag !== 'string' || !tag.trim()) {
    return `Invalid story tag: ${tag}.`;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return `Invalid story tag amount: ${amount}.`;
  }
  if (!gs.storyTags) {
    gs.storyTags = {};
  }
  const key = tag.trim();
  gs.storyTags[key] = (gs.storyTags[key] ?? 0) + amount;
  // Silent: tags are authoring flags; use narrate for player-facing prose.
  return '';
}
