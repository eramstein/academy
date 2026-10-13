/**
 * Local mods live in `<repo>/mods/<modId>/` and are not part of the git repo.
 * A mod may contain `events.json`, `images/activities/`, and `images/events/`.
 * Dev and preview serve a live scan at `/api/mods`. Static builds read `mods/index.json`.
 */

export type ModImageKind = 'activities' | 'events';

export type ModManifestEntry = {
  id: string;
  activityImages: string[];
  eventImages: string[];
  events: unknown[];
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

export function getLoadedMods(): readonly ModManifestEntry[] {
  return mods;
}

export function getLoadedModEvents<T = unknown>(): T[] {
  return mods.flatMap((mod) => (Array.isArray(mod.events) ? (mod.events as T[]) : []));
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
  for (const mod of mods) {
    if (!mod[field].includes(fileName)) continue;
    hits.push({ modId: mod.id, url: modImageUrl(mod.id, kind, fileName) });
  }
  return hits;
}
