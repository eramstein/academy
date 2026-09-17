import { Mistral } from '@mistralai/mistralai';
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

export async function completeChat(
  messages: ChatMessage[],
  options: CompleteChatOptions = {}
): Promise<string> {
  const cacheKey = await makePromptKey(messages, options);
  const cached = await getCachedLlmResponse(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const text = await requestChatCompletion(messages, options);
    await setCachedLlmResponse(cacheKey, text);
    return text;
  } catch (error) {
    const fallback = await getCachedLlmResponse(cacheKey);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

async function requestChatCompletion(
  messages: ChatMessage[],
  options: CompleteChatOptions
): Promise<string> {
  const result = await getClient().chat.complete({
    model: options.model ?? LLM_API_CHAT_MODEL,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });

  const text = messageContentToText(result.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error('LLM returned an empty response');
  }
  return text;
}
