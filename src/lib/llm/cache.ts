import type { Table } from 'dexie';
import { db } from '@/lib/_state/database';
import { LLM_API_CHAT_MODEL } from './config';

const KEY_HEX_LENGTH = 32;

export interface LlmCacheEntry {
  key: string;
  response: string;
  createdAt: number;
}

const llmCache: Table<LlmCacheEntry, string> = db.table('llmCache');

/**
 * Stable short key for a chat request: first 32 hex chars of SHA-256
 * over messages + the options that affect the completion.
 */
export async function makePromptKey(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    json?: boolean;
  } = {}
): Promise<string> {
  const payload = JSON.stringify({
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    model: options.model ?? LLM_API_CHAT_MODEL,
    temperature: options.temperature ?? null,
    maxTokens: options.maxTokens ?? null,
    json: options.json ?? false,
  });
  const digest = await sha256Bytes(payload);
  return toHex(digest).slice(0, KEY_HEX_LENGTH);
}

export async function getCachedLlmResponse(key: string): Promise<string | undefined> {
  try {
    const entry = await llmCache.get(key);
    return entry?.response;
  } catch (error) {
    console.warn('LLM cache read failed', error);
    return undefined;
  }
}

export async function setCachedLlmResponse(key: string, response: string): Promise<void> {
  try {
    await llmCache.put({
      key,
      response,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.warn('LLM cache write failed', error);
  }
}

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(input);
  if (globalThis.crypto?.subtle) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', encoded));
  }
  return fnv1aBytes(encoded);
}

/** Fallback when Web Crypto is unavailable (non-secure contexts). */
function fnv1aBytes(bytes: Uint8Array): Uint8Array {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  const out = new Uint8Array(8);
  let value = hash;
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
