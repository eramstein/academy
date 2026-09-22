import { Mistral } from '@mistralai/mistralai';
import type { z } from 'zod';
import { getCachedLlmResponse, makePromptKey, setCachedLlmResponse } from './cache';
import { LLM_API_CHAT_MODEL, LLM_API_KEY, LLM_TIMEOUT_MS } from './config';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompleteChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** When true, request Mistral JSON mode (`response_format: json_object`). Ignored if `schema` is set. */
  json?: boolean;
  /** Stable name included in the cache key when using a Zod `schema`. */
  schemaName?: string;
}

let client: Mistral | null = null;

function getMistralServerURL(): string | undefined {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/mistral-api`;
  }
  return undefined;
}

function getClient(): Mistral {
  if (!LLM_API_KEY) {
    throw new Error('VITE_MISTRAL_API_KEY is missing');
  }
  if (!client) {
    client = new Mistral({
      apiKey: LLM_API_KEY,
      serverURL: getMistralServerURL(),
      timeoutMs: LLM_TIMEOUT_MS,
    });
  }
  return client;
}

function messageContentToText(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return '';
  }
  return content
    .map((chunk) => {
      if (chunk && typeof chunk === 'object' && 'text' in chunk && typeof chunk.text === 'string') {
        return chunk.text;
      }
      return '';
    })
    .join('')
    .trim();
}

function cacheKeyOptions(options: CompleteChatOptions & { schema?: z.ZodTypeAny }) {
  return {
    model: options.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    json: options.schema ? false : options.json,
    schemaName: options.schema ? (options.schemaName ?? 'structured') : undefined,
  };
}

export async function completeChat<T extends z.ZodTypeAny>(
  messages: ChatMessage[],
  options: CompleteChatOptions & { schema: T }
): Promise<z.infer<T>>;
export async function completeChat(
  messages: ChatMessage[],
  options?: CompleteChatOptions
): Promise<string>;
export async function completeChat(
  messages: ChatMessage[],
  options: CompleteChatOptions & { schema?: z.ZodTypeAny } = {}
): Promise<unknown> {
  const keyOpts = cacheKeyOptions(options);
  const cacheKey = await makePromptKey(messages, keyOpts);
  const cached = await getCachedLlmResponse(cacheKey);
  if (cached !== undefined) {
    if (options.schema) {
      try {
        const parsed = options.schema.safeParse(JSON.parse(cached));
        if (parsed.success) {
          return parsed.data;
        }
      } catch {
        // Corrupt cache entry — regenerate.
      }
    } else {
      return cached;
    }
  }

  try {
    const value = await requestWithOneRetry(messages, options);
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    await setCachedLlmResponse(cacheKey, toStore);
    return value;
  } catch (error) {
    const fallback = await getCachedLlmResponse(cacheKey);
    if (fallback !== undefined) {
      if (options.schema) {
        try {
          const parsed = options.schema.safeParse(JSON.parse(fallback));
          if (parsed.success) {
            return parsed.data;
          }
        } catch {
          // Ignore corrupt fallback and rethrow.
        }
      } else {
        return fallback;
      }
    }
    throw error;
  }
}

/** One attempt, then at most one retry on invalid/failed response. */
async function requestWithOneRetry(
  messages: ChatMessage[],
  options: CompleteChatOptions & { schema?: z.ZodTypeAny }
): Promise<unknown> {
  try {
    return await requestChatCompletion(messages, options);
  } catch (error) {
    console.warn('[llm] invalid or failed response; retrying once', error);
    return await requestChatCompletion(messages, options);
  }
}

async function requestChatCompletion(
  messages: ChatMessage[],
  options: CompleteChatOptions & { schema?: z.ZodTypeAny }
): Promise<unknown> {
  const model = options.model ?? LLM_API_CHAT_MODEL;
  const chatMessages = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (options.schema) {
    const result = await getClient().chat.parse({
      model,
      messages: chatMessages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      responseFormat: options.schema,
    });
    const parsed = result.choices?.[0]?.message?.parsed;
    if (parsed === undefined) {
      throw new Error('LLM structured response failed schema validation');
    }
    return parsed;
  }

  const result = await getClient().chat.complete({
    model,
    messages: chatMessages,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    ...(options.json ? { responseFormat: { type: 'json_object' as const } } : {}),
  });

  const text = messageContentToText(result.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error('LLM returned an empty response');
  }
  return text;
}
