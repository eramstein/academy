/*
  Picks one prewritten chat line for the NPC the player is talking to.
  First a topic type is chosen by weighted random, then topics of that
  type are ranked (NPC voice, author priority, creation recency, recent
  mention penalty). Tunables live in CHAT_TOPIC_WEIGHTS.
*/

import { ChatTopicType, type ChatTopic } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getRandomFromArray, getRandomWeighted } from '@/lib/_utils/random';
import { readChatTopicText, textsForTopic, type ChatTopicTextMeta } from './chat-topics';
import { getCurrentScheduledActivity } from './schedule';

/**
 * Type weights drive the first-pass pick among types that have a speakable
 * topic. Within a type, each matching factor adds its points; the highest
 * total is spoken. Ties are broken at random.
 */
export const CHAT_TOPIC_WEIGHTS = {
  type: {
    [ChatTopicType.Evergreen]: 10,
    [ChatTopicType.Lore]: 40,
    [ChatTopicType.Memory]: 80,
    [ChatTopicType.Routine]: 40,
  },
  /** This NPC has a line written specifically for them. */
  npcSpecificText: 15,
  /** Subtracted in full when the topic was used today. */
  mentionedToday: 35,
  /** How much of that penalty falls away for each day since it was used. */
  mentionedDecayPerDay: 7,
  /** Added in full when the topic was created today (event-made topics). */
  generatedToday: 40,
  /** How much of that boost falls away for each day since creation. */
  generatedDecayPerDay: 8,
  /** Multiplied by usage.priority (0–3). */
  priorityPoint: 30,
};

export interface DirectedChat {
  characterKey: string;
  topicKey: string;
  textKey: string;
  text: string;
}

interface RankedTopic {
  topic: ChatTopic;
  score: number;
  lines: ChatTopicTextMeta[];
}

/** Chooses the chat line this NPC should speak right now. */
export async function directSocialScene(characterKey: string): Promise<DirectedChat | undefined> {
  const npc = gs.characters[characterKey];
  if (!npc) return undefined;

  const ranked = await rankTopics(characterKey);
  if (ranked.length === 0) {
    console.log('[scene-director]', { characterKey, name: npc.name, topic: null });
    return undefined;
  }

  const chosenType = pickTopicType(ranked);
  const ofType = ranked.filter((entry) => entry.topic.type === chosenType);
  const best = Math.max(...ofType.map((entry) => entry.score));
  const tied = ofType.filter((entry) => entry.score === best);
  const chosen = getRandomFromArray(tied);
  const line = pickLine(chosen.lines, chosen.topic.usage?.textUsedKey ?? '');
  const prose = await readChatTopicText(line);
  if (!prose) return undefined;

  const firstName = (npc.name ?? characterKey).split(/\s+/)[0] ?? characterKey;
  const text = prose.replaceAll('your companion', firstName);

  const direction: DirectedChat = {
    characterKey,
    topicKey: chosen.topic.key,
    textKey: line.key,
    text,
  };
  console.log('[scene-director]', {
    characterKey,
    name: npc.name,
    topic: chosen.topic.key,
    type: chosen.topic.type,
    score: chosen.score,
    textKey: line.key,
  });
  return direction;
}

/** Weighted random among types that still have at least one speakable topic. */
function pickTopicType(ranked: RankedTopic[]): ChatTopicType {
  const available = new Set(ranked.map((entry) => entry.topic.type));
  return getRandomWeighted(
    [...available].map((type) => ({
      item: type,
      weight: CHAT_TOPIC_WEIGHTS.type[type] ?? 0,
    }))
  );
}

/** Remembers which line was spoken. A use-once topic is removed. */
export function recordDirectedChat(direction: DirectedChat): void {
  const topics = gs.chatTopics ?? [];
  const topic = topics.find((item) => item.key === direction.topicKey);
  if (!topic) return;
  if (topic.usage?.useOnlyOnce) {
    gs.chatTopics = topics.filter((item) => item.key !== topic.key);
    return;
  }
  topic.usage = {
    ...topic.usage,
    lastUsedOnDay: gs.time.day,
    textUsedKey: direction.textKey,
  };
}

async function rankTopics(characterKey: string): Promise<RankedTopic[]> {
  const today = gs.time.day;
  const activityType = getCurrentScheduledActivity()?.type;
  const placeKey = gs.characters[characterKey]?.placeKey;
  const ranked: RankedTopic[] = [];

  for (const topic of gs.chatTopics ?? []) {
    if (!npcKnowsTopic(topic, characterKey)) continue;
    const texts = await textsForTopic(topic.key);
    const dedicated = texts.some((text) => text.npcKey === characterKey);
    const lines = speakableLines(texts, characterKey, activityType, placeKey);
    if (lines.length === 0) continue;
    ranked.push({
      topic,
      lines,
      score: topicScore(topic, dedicated, today),
    });
  }
  return ranked;
}

function npcKnowsTopic(topic: ChatTopic, npcKey: string): boolean {
  const knownBy = topic.knownByNpcKeys;
  if (knownBy && knownBy.length > 0 && !knownBy.includes(npcKey)) return false;
  if (topic.excludeNpcKeys?.includes(npcKey)) return false;
  if (topic.usage?.useOnlyOnce && (topic.usage.textUsedKey || topic.usage.lastUsedOnDay > 0)) {
    return false;
  }
  return true;
}

function topicScore(topic: ChatTopic, dedicated: boolean, today: number): number {
  const voiceScore = dedicated ? CHAT_TOPIC_WEIGHTS.npcSpecificText : 0;
  const priority = Math.max(0, Math.min(3, topic.usage?.priority ?? 0));
  return (
    voiceScore +
    priority * CHAT_TOPIC_WEIGHTS.priorityPoint +
    recencyBonus(topic.usage?.generatedOnDay ?? 0, today) -
    mentionPenalty(topic.usage?.lastUsedOnDay ?? 0, today)
  );
}

/** Closer to today means a larger penalty. Never-used topics are not penalized. */
function mentionPenalty(lastUsedOnDay: number, today: number): number {
  if (!lastUsedOnDay || lastUsedOnDay > today) return 0;
  const daysAgo = today - lastUsedOnDay;
  return Math.max(
    0,
    CHAT_TOPIC_WEIGHTS.mentionedToday - daysAgo * CHAT_TOPIC_WEIGHTS.mentionedDecayPerDay
  );
}

/**
 * Newer topics score higher. Seed catalog topics use generatedOnDay 0 and get no boost.
 */
function recencyBonus(generatedOnDay: number, today: number): number {
  if (!generatedOnDay || generatedOnDay > today) return 0;
  const daysAgo = today - generatedOnDay;
  return Math.max(
    0,
    CHAT_TOPIC_WEIGHTS.generatedToday - daysAgo * CHAT_TOPIC_WEIGHTS.generatedDecayPerDay
  );
}

/**
 * NPC-specific lines replace the generic ones.
 * A line that names the current activity or place is preferred over a plain one.
 * The line used last is skipped when another remains.
 */
function speakableLines(
  texts: ChatTopicTextMeta[],
  npcKey: string,
  activityType: ChatTopicTextMeta['activityType'],
  placeKey: string | undefined
): ChatTopicTextMeta[] {
  const dedicated = texts.filter((text) => text.npcKey === npcKey);
  const pool = dedicated.length > 0 ? dedicated : texts.filter((text) => !text.npcKey);
  const fitting = pool.filter((text) => fitsContext(text, activityType, placeKey));
  const contextual = fitting.filter((text) => text.activityType || text.placeKey);
  return contextual.length > 0 ? contextual : fitting;
}

function fitsContext(
  text: ChatTopicTextMeta,
  activityType: ChatTopicTextMeta['activityType'],
  placeKey: string | undefined
): boolean {
  if (text.activityType && text.activityType !== activityType) return false;
  if (text.placeKey && text.placeKey !== placeKey) return false;
  return true;
}

function pickLine(lines: ChatTopicTextMeta[], lastTextKey: string): ChatTopicTextMeta {
  const fresh = lastTextKey ? lines.filter((line) => line.key !== lastTextKey) : lines;
  const pool = fresh.length > 0 ? fresh : lines;
  return getRandomFromArray(pool);
}
