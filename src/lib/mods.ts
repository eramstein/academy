/**
 * Local mods live in `<repo>/mods/<modId>/` and are not part of the git repo.
 * A mod may contain `events.json`, `interactions.json`, `images/activities/`,
 * and `images/events/`. Dev and preview serve a live scan at `/api/mods`.
 * Static builds read `mods/index.json`.
 *
 * Enable/disable is persisted in settings (`disabledMods`). Content helpers
 * below only return data from enabled mods; {@link getLoadedMods} lists all.
 */

import { isModEnabled } from '@/lib/_state/settings.svelte';

export type ModImageKind = 'activities' | 'events';

export type ModManifestEntry = {
  id: string;
  activityImages: string[];
  eventImages: string[];
  events: unknown[];
  interactions?: unknown[];
};

type ModsManifest = { mods: ModManifestEntry[] };

let mods: ModManifestEntry[] = [];

async function fetchManifest(url: string): Promise<ModsManifest | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = (await response.json()) as ModsManifest;
    if (!data || !Array.isArray(data.mods)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function loadMods(): Promise<void> {
  const manifest =
    (await fetchManifest('/api/mods')) ??
    (await fetchManifest(`${import.meta.env.BASE_URL}mods/index.json`));
  mods = manifest?.mods ?? [];
}

/** Every discovered mod, including ones the player has disabled. */
export function getLoadedMods(): readonly ModManifestEntry[] {
  return mods;
}

function enabledMods(): ModManifestEntry[] {
  return mods.filter((mod) => isModEnabled(mod.id));
}

/** Event keys contributed by any loaded mod (enabled or not). */
export function getAllModEventKeys(): Set<string> {
  const keys = new Set<string>();
  for (const mod of mods) {
    if (!Array.isArray(mod.events)) continue;
    for (const event of mod.events) {
      if (event && typeof event === 'object' && 'key' in event) {
        const key = (event as { key?: unknown }).key;
        if (typeof key === 'string' && key) keys.add(key);
      }
    }
  }
  return keys;
}

/** Event keys that belong only to currently disabled mods. */
export function getDisabledModEventKeys(): Set<string> {
  const enabledKeys = new Set<string>();
  for (const mod of enabledMods()) {
    if (!Array.isArray(mod.events)) continue;
    for (const event of mod.events) {
      if (event && typeof event === 'object' && 'key' in event) {
        const key = (event as { key?: unknown }).key;
        if (typeof key === 'string' && key) enabledKeys.add(key);
      }
    }
  }
  const disabledKeys = new Set<string>();
  for (const key of getAllModEventKeys()) {
    if (!enabledKeys.has(key)) disabledKeys.add(key);
  }
  return disabledKeys;
}

export function getLoadedModEvents<T = unknown>(): T[] {
  return enabledMods().flatMap((mod) => (Array.isArray(mod.events) ? (mod.events as T[]) : []));
}

export function getLoadedModInteractions<T = unknown>(): T[] {
  return enabledMods().flatMap((mod) =>
    Array.isArray(mod.interactions) ? (mod.interactions as T[]) : []
  );
}

export function modImageUrl(modId: string, kind: ModImageKind, fileName: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/mods/${modId}/images/${kind}/${fileName}`;
}

export function findModImages(
  kind: ModImageKind,
  fileName: string
): { modId: string; url: string }[] {
  const field = kind === 'activities' ? 'activityImages' : 'eventImages';
  const hits: { modId: string; url: string }[] = [];
  for (const mod of enabledMods()) {
    if (!mod[field].includes(fileName)) continue;
    hits.push({ modId: mod.id, url: modImageUrl(mod.id, kind, fileName) });
  }
  return hits;
}
