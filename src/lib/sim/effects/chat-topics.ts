import { ActivityType, ChatTopicType, type ChatTopic, type ChatTopicText } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { hasChatTopicText } from '../chat-topics';

export interface AddChatTopicParameters {
  /** Topic key. A later call with the same key adds another line. */
  key: string;
  type: ChatTopicType;
  /** The line an NPC can speak. */
  text: string;
  /** Line key. Defaults to the topic key. Must be unique on that topic. */
  textKey?: string;
  /** Only these NPCs know the topic. Omit for public info. */
  knownByNpcKeys?: string[];
  /** These NPCs never mention the topic. */
  excludeNpcKeys?: string[];
  useOnlyOnce?: boolean;
  /** 0–3 selection boost. Higher = more likely to be picked. Defaults to 0. */
  priority?: number;
  /** When set, only this NPC speaks this line. */
  npcKey?: string;
  activityType?: ActivityType;
  placeKey?: string;
}

/** Adds a topic and one line the scene director can speak. Silent on success. */
export function addChatTopic(parameters: AddChatTopicParameters): string {
  const key = typeof parameters.key === 'string' ? parameters.key.trim() : '';
  if (!key) return 'Chat topic key is required.';
  if (!isChatTopicType(parameters.type)) return `Invalid chat topic type: ${parameters.type}.`;
  const text = typeof parameters.text === 'string' ? parameters.text.trim() : '';
  if (!text) return 'Chat topic text is required.';

  const textKey =
    parameters.textKey === undefined
      ? key
      : typeof parameters.textKey === 'string'
        ? parameters.textKey.trim()
        : '';
  if (!textKey) return 'Chat topic text key is required.';

  const knownBy = readNpcKeys(parameters.knownByNpcKeys, 'knownByNpcKeys');
  if (typeof knownBy === 'string') return knownBy;
  const excluded = readNpcKeys(parameters.excludeNpcKeys, 'excludeNpcKeys');
  if (typeof excluded === 'string') return excluded;

  if (parameters.useOnlyOnce !== undefined && typeof parameters.useOnlyOnce !== 'boolean') {
    return 'useOnlyOnce must be true or false.';
  }
  const priority = readPriority(parameters.priority);
  if (typeof priority === 'string') return priority;
  const npcKey = readOptionalKey(parameters.npcKey, 'npcKey');
  if (npcKey instanceof Error) return npcKey.message;
  if (npcKey && !gs.characters[npcKey]) return `Invalid npcKey: ${npcKey}.`;
  if (
    parameters.activityType !== undefined &&
    !Object.values(ActivityType).includes(parameters.activityType)
  ) {
    return `Invalid activity type: ${parameters.activityType}.`;
  }
  const placeKey = readOptionalKey(parameters.placeKey, 'placeKey');
  if (placeKey instanceof Error) return placeKey.message;
  if (placeKey && !gs.places[placeKey]) return `Invalid place key: ${placeKey}.`;

  if (!Array.isArray(gs.chatTopics)) gs.chatTopics = [];
  const existing = gs.chatTopics.find((topic) => topic.key === key);
  if (existing && existing.type !== parameters.type) {
    return `Chat topic ${key} already exists as ${existing.type}.`;
  }
  if (hasChatTopicText(key, textKey)) {
    console.warn(
      `[add_chat_topic] skipped duplicate textKey "${textKey}" on topic "${key}"` +
        (parameters.knownByNpcKeys || parameters.priority !== undefined
          ? ' (knownBy/priority only apply when the topic is first created; use a distinct key or textKey for another line)'
          : '')
    );
    return '';
  }

  if (!existing) {
    const topic: ChatTopic = {
      key,
      type: parameters.type,
      usage: {
        lastUsedOnDay: 0,
        textUsedKey: '',
        generatedOnDay: gs.time.day,
      },
    };
    if (knownBy.length > 0) topic.knownByNpcKeys = knownBy;
    if (excluded.length > 0) topic.excludeNpcKeys = excluded;
    if (parameters.useOnlyOnce) topic.usage.useOnlyOnce = true;
    if (priority > 0) topic.usage.priority = priority;
    gs.chatTopics.push(topic);
  }

  const line: ChatTopicText = { key: textKey, topicKey: key, text };
  if (npcKey) line.npcKey = npcKey;
  if (parameters.activityType) line.activityType = parameters.activityType;
  if (placeKey) line.placeKey = placeKey;
  if (!Array.isArray(gs.chatTopicTexts)) gs.chatTopicTexts = [];
  gs.chatTopicTexts.push(line);
  return '';
}

function readNpcKeys(value: unknown, label: string): string[] | string {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return `${label} must be a list of character keys.`;
  const keys: string[] = [];
  for (const key of value) {
    if (typeof key !== 'string' || !key.trim() || !gs.characters[key]) {
      return `Invalid ${label}: ${key}.`;
    }
    keys.push(key);
  }
  return keys;
}

function readOptionalKey(value: unknown, label: string): string | undefined | Error {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') return new Error(`${label} must be a string.`);
  const key = value.trim();
  return key || undefined;
}

/** 0–3, or an error message. Omitted → 0. */
function readPriority(value: unknown): number | string {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 3) {
    return 'priority must be an integer from 0 to 3.';
  }
  return value;
}

function isChatTopicType(value: unknown): value is ChatTopicType {
  return Object.values(ChatTopicType).includes(value as ChatTopicType);
}
