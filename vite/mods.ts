import fs from 'fs';
import path from 'path';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export type EventRow = { key?: string; [field: string]: unknown };

export type ModImageKind = 'activities' | 'events';

export type ModManifestEntry = {
  id: string;
  activityImages: string[];
  eventImages: string[];
  events: EventRow[];
};

export type ModsManifest = { mods: ModManifestEntry[] };

let projectRoot = process.cwd();

export function setProjectRoot(root: string) {
  projectRoot = root;
}

function modsRoot(): string {
  return path.resolve(projectRoot, 'mods');
}

function isSafeModId(id: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id);
}

function isSafeImageFile(name: string): boolean {
  if (name !== path.basename(name) || name.includes('..')) return false;
  const ext = path.extname(name).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}

function readEventsArray(filePath: string): EventRow[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(parsed)) {
      console.error(`${filePath} is not an array`);
      return [];
    }
    return parsed;
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return [];
  }
}

function writeEventsArray(filePath: string, events: EventRow[]) {
  fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n', 'utf-8');
}

function listImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isSafeImageFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

type ModOnDisk = ModManifestEntry & { eventsPath: string };

function listMods(): ModOnDisk[] {
  const root = modsRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isSafeModId(entry.name))
    .map((entry) => {
      const dir = path.join(root, entry.name);
      return {
        id: entry.name,
        activityImages: listImageFiles(path.join(dir, 'images', 'activities')),
        eventImages: listImageFiles(path.join(dir, 'images', 'events')),
        events: readEventsArray(path.join(dir, 'events.json')),
        eventsPath: path.join(dir, 'events.json'),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function buildModsManifest(): ModsManifest {
  return {
    mods: listMods().map(({ id, activityImages, eventImages, events }) => ({
      id,
      activityImages,
      eventImages,
      events,
    })),
  };
}

export function readMergedEvents(mainEventsPath: string): EventRow[] {
  return [...readEventsArray(mainEventsPath), ...listMods().flatMap((mod) => mod.events)];
}

/** Update the catalog that already owns `event.key`. New keys go to the main file. */
export function saveCatalogEvent(mainEventsPath: string, event: EventRow): { target: string } {
  const mainEvents = readEventsArray(mainEventsPath);
  const mainIndex = mainEvents.findIndex((row) => row.key === event.key);
  if (mainIndex !== -1) {
    mainEvents[mainIndex] = event;
    writeEventsArray(mainEventsPath, mainEvents);
    return { target: mainEventsPath };
  }

  for (const mod of listMods()) {
    const index = mod.events.findIndex((row) => row.key === event.key);
    if (index === -1) continue;
    mod.events[index] = event;
    writeEventsArray(mod.eventsPath, mod.events);
    return { target: mod.eventsPath };
  }

  mainEvents.push(event);
  writeEventsArray(mainEventsPath, mainEvents);
  return { target: mainEventsPath };
}

export function resolveModImageFile(modId: string, kind: string, fileName: string): string | null {
  if (!isSafeModId(modId) || (kind !== 'activities' && kind !== 'events')) return null;
  if (!isSafeImageFile(fileName)) return null;
  const allowed = path.resolve(modsRoot(), modId, 'images', kind);
  const filePath = path.resolve(allowed, fileName);
  if (filePath !== path.join(allowed, fileName)) return null;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  return filePath;
}

export function imageContentType(fileName: string): string | null {
  return CONTENT_TYPES[path.extname(fileName).toLowerCase()] ?? null;
}

function copyImageDir(fromDir: string, toDir: string) {
  if (!fs.existsSync(fromDir)) return;
  fs.mkdirSync(toDir, { recursive: true });
  for (const name of listImageFiles(fromDir)) {
    fs.copyFileSync(path.join(fromDir, name), path.join(toDir, name));
  }
}

/** Snapshot mods into the static build so a host without the dev server can still load them. */
export function writeModsBundle(outDir: string) {
  const destRoot = path.resolve(outDir, 'mods');
  fs.mkdirSync(destRoot, { recursive: true });
  const manifest = buildModsManifest();
  for (const mod of manifest.mods) {
    const source = path.join(modsRoot(), mod.id, 'images');
    copyImageDir(
      path.join(source, 'activities'),
      path.join(destRoot, mod.id, 'images', 'activities')
    );
    copyImageDir(path.join(source, 'events'), path.join(destRoot, mod.id, 'images', 'events'));
  }
  fs.writeFileSync(
    path.join(destRoot, 'index.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  );
}
