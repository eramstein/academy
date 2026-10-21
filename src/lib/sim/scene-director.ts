/*
  The scene director picks one fact for a chat: a rumor, a memory, or a routine.
  The LLM only turns that fact into prose.
*/

import type { Npc, NpcMemory, Rumor } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { formatRoutineText } from './npc';

export interface ScenePayload {
  kind: 'rumor' | 'memory' | 'routine';
  /** Fact the writer must put in the NPC's dialogue. */
  text: string;
  index: number;
}

export interface SceneDirection {
  characterKey: string;
  payload?: ScenePayload;
}

interface FactCandidate {
  payload: ScenePayload;
  /** Lower means less recently used. */
  rank: number;
}

/** Chooses one fact this NPC can tell without repeating today's material. */
export function directSocialScene(characterKey: string): SceneDirection {
  const npc = gs.characters[characterKey];
  const candidates = npc ? factCandidates(npc) : [];
  const payload = candidates.length > 0 ? pickLeastUsed(candidates) : undefined;
  const direction: SceneDirection = {
    characterKey,
    ...(payload ? { payload } : {}),
  };
  console.log('[scene-director]', {
    characterKey,
    name: npc?.name,
    payload: payload ? { kind: payload.kind, index: payload.index, text: payload.text } : null,
  });
  return direction;
}

/** Marks the directed fact as used. Call only after the prose was saved. */
export function consumeScenePayload(direction: SceneDirection): void {
  const payload = direction.payload;
  if (!payload) return;

  if (payload.kind === 'rumor') {
    consumeRumor(payload);
    return;
  }

  const npc = gs.characters[direction.characterKey];
  if (!npc) return;

  if (payload.kind === 'memory') {
    const memory = npc.memories?.[payload.index];
    if (memory && payload.text.includes(memory.description)) {
      memory.referenceCount = (memory.referenceCount ?? 0) + 1;
      memory.lastReferencedDay = gs.time.day;
    }
    return;
  }

  const routine = npc.routines?.[payload.index];
  if (routine && formatRoutineText(routine) === payload.text) {
    routine.isKnown = true;
  }
}

function factCandidates(npc: Npc): FactCandidate[] {
  return [...rumorCandidates(npc.key), ...memoryCandidates(npc), ...routineCandidates(npc)];
}

function pickLeastUsed(candidates: FactCandidate[]): ScenePayload {
  const best = Math.min(...candidates.map((candidate) => candidate.rank));
  const tied = candidates.filter((candidate) => candidate.rank === best);
  const kinds = [...new Set(tied.map((candidate) => candidate.payload.kind))];
  const kind = getRandomFromArray(kinds);
  return getRandomFromArray(tied.filter((candidate) => candidate.payload.kind === kind)).payload;
}

function rumorCandidates(npcKey: string): FactCandidate[] {
  const day = gs.time.day;
  return (gs.rumors ?? [])
    .map((rumor, index) => ({ rumor, index }))
    .filter(
      ({ rumor }) =>
        isRumorActive(rumor, day) && canNpcTell(rumor, npcKey) && rumor.aboutNpcKey !== npcKey
    )
    .map(({ rumor, index }) => ({
      payload: { kind: 'rumor' as const, text: rumor.text, index },
      rank: 0,
    }));
}

function memoryCandidates(npc: Npc): FactCandidate[] {
  const today = gs.time.day;
  return (npc.memories ?? [])
    .map((memory, index) => ({ memory, index }))
    .filter(({ memory }) => memory.lastReferencedDay !== today)
    .map(({ memory, index }) => ({
      payload: {
        kind: 'memory' as const,
        text: memoryText(memory),
        index,
      },
      rank: memoryRank(memory, today),
    }));
}

function routineCandidates(npc: Npc): FactCandidate[] {
  return (npc.routines ?? [])
    .map((routine, index) => ({ routine, index }))
    .filter(({ routine }) => !routine.isKnown)
    .map(({ routine, index }) => ({
      payload: { kind: 'routine' as const, text: formatRoutineText(routine), index },
      rank: 0,
    }));
}

/** Unused facts rank 0. Each past telling pushes a memory back. */
function memoryRank(memory: NpcMemory, today: number): number {
  const mentions = memory.referenceCount ?? 0;
  if (mentions === 0) return 0;
  const daysSince =
    memory.lastReferencedDay === undefined
      ? mentions
      : Math.max(1, today - memory.lastReferencedDay);
  return mentions * 10 - Math.min(daysSince, 9);
}

function memoryText(memory: NpcMemory): string {
  const title = memory.title?.trim();
  const description = memory.description?.trim() ?? '';
  return title ? `${title}. ${description}` : description;
}

function isRumorActive(rumor: Rumor, day: number): boolean {
  if (rumor.fromDay !== undefined && day < rumor.fromDay) return false;
  if (rumor.untilDay !== undefined && day > rumor.untilDay) return false;
  return true;
}

function canNpcTell(rumor: Rumor, npcKey: string): boolean {
  return rumor.fromNpcKey === undefined || rumor.fromNpcKey === npcKey;
}

function consumeRumor(payload: ScenePayload): void {
  const rumors = gs.rumors ?? [];
  if (rumors[payload.index]?.text === payload.text) {
    rumors.splice(payload.index, 1);
    return;
  }
  const found = rumors.findIndex((rumor) => rumor.text === payload.text);
  if (found >= 0) rumors.splice(found, 1);
}
