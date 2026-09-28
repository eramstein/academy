import type { Table } from 'dexie';
import { db } from '@/lib/_state/database';
import { getAssetPath } from '@/lib/_utils/asset-paths';

export interface SceneImageCacheEntry {
  prompt: string;
  imageName: string;
}

const sceneImages: Table<SceneImageCacheEntry, string> = db.table('sceneImages');

export async function getCachedSceneImageUrl(prompt: string): Promise<string | undefined> {
  const key = normalizePrompt(prompt);
  try {
    const entry = await sceneImages.get(key);
    const imageName = entry?.imageName ?? (await promptImageName(key));
    const url = sceneImageUrl(imageName);
    const served = await sceneFileIsServed(url, entry ? 8 : 1);
    if (!served) return undefined;
    if (!entry) {
      await sceneImages.put({ prompt: key, imageName });
    }
    return url;
  } catch (error) {
    console.warn('Scene image cache read failed', error);
    return undefined;
  }
}

export async function saveCachedSceneImage(prompt: string, image: Blob): Promise<string> {
  const key = normalizePrompt(prompt);
  const imageName = await promptImageName(key);
  await persistSceneImage(imageName, image);
  await sceneImages.put({ prompt: key, imageName });
  return sceneImageUrl(imageName);
}

function sceneImageUrl(imageName: string): string {
  // Query keeps a previously failed HTML response from being reused as the image.
  return `${getAssetPath(`images/scenes/${imageName}.jpg`)}?scene`;
}

async function sceneFileIsServed(url: string, attempts: number): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(url, { cache: 'no-store' });
    const contentType = response.headers.get('content-type') ?? '';
    if (response.ok && contentType.startsWith('image/')) return true;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  return false;
}

function normalizePrompt(prompt: string): string {
  return prompt.trim();
}

async function promptImageName(prompt: string): Promise<string> {
  const encoded = new TextEncoder().encode(prompt);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoded));
  return [...digest]
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function persistSceneImage(imageName: string, imageBlob: Blob): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error('Saving scene images is only available in DEV');
  }
  const buffer = await imageBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const res = await fetch('/api/save-scene-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageName,
      imageBase64: btoa(binary),
      contentType: imageBlob.type || 'image/jpeg',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`save-scene-image failed: ${res.status} ${body}`);
  }
}
