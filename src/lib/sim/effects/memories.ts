import type { Emotion, NpcMemory } from '@/lib/_model';
import { gs } from '@/lib/_state';

export interface AddMemoryParameters {
  characterKey: string;
  title: string;
  description: string;
  /** Optional emotional tone of the memory. */
  emotion?: Emotion;
}

/** Appends a memory to an NPC's `memories`. Silent — pair with narrate. */
export function addMemory(parameters: AddMemoryParameters): string {
  const { characterKey, title, description, emotion } = parameters;
  const character = gs.characters[characterKey];
  if (!character) {
    return `Invalid character key: ${characterKey}.`;
  }
  if (typeof title !== 'string' || !title.trim()) {
    return `Memory title is required.`;
  }
  if (typeof description !== 'string' || !description.trim()) {
    return `Memory description is required.`;
  }
  if (emotion !== undefined && typeof emotion !== 'string') {
    return `Invalid memory emotion: ${emotion}.`;
  }

  const memory: NpcMemory = {
    title: title.trim(),
    description: description.trim(),
    day: gs.time.day,
    referenceCount: 0,
  };
  if (emotion) {
    memory.emotion = emotion;
  }

  if (!character.memories) {
    character.memories = [];
  }
  if (character.memories.some((m) => m.title === memory.title)) {
    return '';
  }
  character.memories.push(memory);
  return '';
}
