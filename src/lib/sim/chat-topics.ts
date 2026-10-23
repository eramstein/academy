/*
  Authored chat lines live in src/data/sim/chat_topics/*.json.
  Game state keeps topic metadata only. The prose is read from those files
  when a line is chosen, so the full catalog is not copied onto the save.
*/

import type { ActivityType, ChatTopic, ChatTopicText } from '@/lib/_model';
import { ChatTopicType } from '@/lib/_model/enums-sim';
import { gs } from '@/lib/_state';

/** Authored JSON may omit `key`; it is filled in when the catalog loads. */
type RawChatTopicText = Omit<ChatTopicText, 'key'> & { key?: string };

const topicTextLoaders = import.meta.glob('@/data/sim/chat_topics/*.json', {
  import: 'default',
}) as Record<string, () => Promise<RawChatTopicText[]>>;

/** Ranking fields for one authored line. The prose stays in the data file. */
export interface ChatTopicTextMeta {
  key: string;
  topicKey: string;
  activityType?: ActivityType;
  placeKey?: string;
  npcKey?: string;
  source: string;
  /** Index among valid lines in that source file (for prose lookup). */
  sourceIndex: number;
}

let textCatalog: ChatTopicTextMeta[] | null = null;

const RUNTIME_SOURCE = 'runtime';

const TOPIC_TYPE_BY_SEGMENT: Record<string, ChatTopicType> = {
  lore: ChatTopicType.Lore,
  memory: ChatTopicType.Memory,
  routine: ChatTopicType.Routine,
  evergreen: ChatTopicType.Evergreen,
};

/** Fresh game: replace the list. Loaded save: keep usage, and add topics new files introduced. */
export async function initChatTopics(options?: { keepExisting?: boolean }): Promise<void> {
  const catalog = await loadTextCatalog();
  const seeded = topicKeysIn(catalog).map(topicFromKey);
  const previous = options?.keepExisting && Array.isArray(gs.chatTopics) ? gs.chatTopics : [];
  const previousByKey = new Map(previous.map((topic) => [topic.key, topic]));
  const merged = seeded.map((topic) => previousByKey.get(topic.key) ?? topic);
  for (const topic of previous) {
    if (!seeded.some((seed) => seed.key === topic.key)) merged.push(topic);
  }
  gs.chatTopics = merged;
  if (!options?.keepExisting || !Array.isArray(gs.chatTopicTexts)) {
    gs.chatTopicTexts = [];
  }
}

export async function textsForTopic(topicKey: string): Promise<ChatTopicTextMeta[]> {
  const catalog = await loadTextCatalog();
  const authored = catalog.filter((text) => text.topicKey === topicKey);
  const runtime = runtimeTexts()
    .filter((text) => text.topicKey === topicKey)
    .map((text) =>
      toMeta({ ...text, key: text.key ?? text.topicKey }, RUNTIME_SOURCE, -1)
    );
  return [...authored, ...runtime];
}

/**
 * Lines tagged for an activity type that fit the given NPCs (and optional place).
 * NPC-specific lines replace generics; a matching placeKey is preferred when set.
 */
export async function textsForActivity(
  activityType: ActivityType,
  npcKeys: string[],
  placeKey?: string
): Promise<ChatTopicTextMeta[]> {
  const all = await allTextMetas();
  const ofActivity = all.filter((text) => text.activityType === activityType);
  const dedicated = ofActivity.filter(
    (text) => text.npcKey !== undefined && npcKeys.includes(text.npcKey)
  );
  const pool =
    dedicated.length > 0 ? dedicated : ofActivity.filter((text) => !text.npcKey);
  const fitting = pool.filter(
    (text) => !text.placeKey || !placeKey || text.placeKey === placeKey
  );
  const atPlace = fitting.filter((text) => text.placeKey && text.placeKey === placeKey);
  return atPlace.length > 0 ? atPlace : fitting;
}

async function allTextMetas(): Promise<ChatTopicTextMeta[]> {
  const catalog = await loadTextCatalog();
  const runtime = runtimeTexts().map((text) =>
    toMeta({ ...text, key: text.key ?? text.topicKey }, RUNTIME_SOURCE, -1)
  );
  return [...catalog, ...runtime];
}

export function hasChatTopicText(topicKey: string, textKey: string): boolean {
  const authored = textCatalog?.some((text) => text.topicKey === topicKey && text.key === textKey);
  const runtime = runtimeTexts().some((text) => text.topicKey === topicKey && text.key === textKey);
  return Boolean(authored || runtime);
}

export async function readChatTopicText(meta: ChatTopicTextMeta): Promise<string | undefined> {
  if (meta.source === RUNTIME_SOURCE) {
    const match = runtimeTexts().find((text) => sameLine(text, meta));
    return match?.text?.trim() || undefined;
  }
  const load = topicTextLoaders[meta.source];
  if (!load) return undefined;
  const texts = (await load()).filter(isRawChatTopicText);
  const match = texts[meta.sourceIndex];
  if (!match || match.topicKey !== meta.topicKey) return undefined;
  const prose = match.text?.trim();
  return prose || undefined;
}

function runtimeTexts(): ChatTopicText[] {
  return Array.isArray(gs.chatTopicTexts) ? gs.chatTopicTexts : [];
}

async function loadTextCatalog(): Promise<ChatTopicTextMeta[]> {
  if (textCatalog) return textCatalog;
  const entries = await Promise.all(
    Object.entries(topicTextLoaders)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([source, load]) => ({
        source,
        texts: (await load()).filter(isRawChatTopicText),
      }))
  );
  const usedKeys = new Set<string>();
  textCatalog = entries.flatMap(({ source, texts }) =>
    texts.map((text, sourceIndex) => {
      const preferred = text.key?.trim() || text.topicKey;
      const key = assignUniqueKey(preferred, usedKeys);
      return toMeta({ ...text, key }, source, sourceIndex);
    })
  );
  return textCatalog;
}

function assignUniqueKey(preferred: string, used: Set<string>): string {
  if (!used.has(preferred)) {
    used.add(preferred);
    return preferred;
  }
  let n = 2;
  while (used.has(`${preferred}_${n}`)) n += 1;
  const key = `${preferred}_${n}`;
  used.add(key);
  return key;
}

function topicKeysIn(catalog: ChatTopicTextMeta[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const text of catalog) {
    if (seen.has(text.topicKey)) continue;
    seen.add(text.topicKey);
    keys.push(text.topicKey);
  }
  return keys;
}

/**
 * Seed topics are inferred from the topic key:
 * `{npc}_{topicType}_{topicLabel}` with optional `_private` suffix.
 * Private → known only by that NPC.
 * Public (non-routine) → that NPC is excluded; routines stay speakable by their NPC.
 */
function topicFromKey(topicKey: string): ChatTopic {
  /** Day 0 = seed catalog; no recency boost in the scene director. */
  const usage = { lastUsedOnDay: 0, textUsedKey: '', generatedOnDay: 0 };
  const parsed = parseTopicKey(topicKey);
  const topic: ChatTopic = {
    key: topicKey,
    type: parsed.type,
    usage,
  };
  if (parsed.npcKey) {
    if (parsed.isPrivate) {
      topic.knownByNpcKeys = [parsed.npcKey];
    } else if (parsed.type !== ChatTopicType.Routine) {
      topic.excludeNpcKeys = [parsed.npcKey];
    }
  }
  return topic;
}

function parseTopicKey(topicKey: string): {
  npcKey?: string;
  type: ChatTopicType;
  isPrivate: boolean;
} {
  const isPrivate = topicKey.endsWith('_private');
  const base = isPrivate ? topicKey.slice(0, -'_private'.length) : topicKey;

  const labeled = base.match(/^(.*?)_(lore|memory|routine|evergreen)_(.+)$/);
  if (labeled) {
    return {
      npcKey: labeled[1] || undefined,
      type: TOPIC_TYPE_BY_SEGMENT[labeled[2]],
      isPrivate,
    };
  }

  const short = base.match(/^(?:(.*?)_)?(lore|memory|routine|evergreen)$/);
  if (short) {
    return {
      npcKey: short[1] || undefined,
      type: TOPIC_TYPE_BY_SEGMENT[short[2]],
      isPrivate,
    };
  }

  return { type: ChatTopicType.Lore, isPrivate };
}

function toMeta(
  text: ChatTopicText & { key: string },
  source: string,
  sourceIndex: number
): ChatTopicTextMeta {
  return {
    key: text.key,
    topicKey: text.topicKey,
    ...(text.activityType ? { activityType: text.activityType } : {}),
    ...(text.placeKey ? { placeKey: text.placeKey } : {}),
    ...(text.npcKey ? { npcKey: text.npcKey } : {}),
    source,
    sourceIndex,
  };
}

function sameLine(text: ChatTopicText, meta: ChatTopicTextMeta): boolean {
  return (
    text.key === meta.key &&
    text.topicKey === meta.topicKey &&
    text.npcKey === meta.npcKey &&
    text.activityType === meta.activityType &&
    text.placeKey === meta.placeKey
  );
}

function isRawChatTopicText(value: unknown): value is RawChatTopicText {
  if (!value || typeof value !== 'object') return false;
  const text = value as RawChatTopicText;
  return (
    typeof text.topicKey === 'string' &&
    typeof text.text === 'string' &&
    (text.key === undefined || typeof text.key === 'string')
  );
}
