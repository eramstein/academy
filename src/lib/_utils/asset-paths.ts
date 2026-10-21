import { Emotion } from '@/lib/_model/enums-sim';
import { findModImages, modImageUrl, type ModImageKind } from '@/lib/mods';

/** Characters with a 4×4 emotion spritesheet (314px cells → 1256×1256) under images/characters/sheets. */
const CHARACTER_EMOTION_SHEETS = new Set(['molly', 'emma']);

const EMOTION_SHEET_COLS = 4;
const EMOTION_SHEET_ROWS = 4;

/** Grid position [col, row] for each emotion on character sheets. */
const EMOTION_SHEET_CELLS: Record<Emotion, readonly [number, number]> = {
  [Emotion.Neutral]: [0, 0],
  [Emotion.Happy]: [1, 0],
  [Emotion.Laughing]: [2, 0],
  [Emotion.Sad]: [3, 0],
  [Emotion.Angry]: [0, 1],
  [Emotion.Surprised]: [1, 1],
  [Emotion.Flirtatious]: [2, 1],
  [Emotion.Taunting]: [3, 1],
  [Emotion.Dreaming]: [0, 2],
  [Emotion.Proud]: [1, 2],
  [Emotion.Embarrassed]: [2, 2],
  [Emotion.Scared]: [3, 2],
  [Emotion.Amused]: [0, 3],
  [Emotion.Disappointed]: [1, 3],
  [Emotion.Excited]: [2, 3],
  [Emotion.Disgusted]: [3, 3],
};

// Utility function to get the correct asset path for both development and production
export function getAssetPath(path: string): string {
  // Assets are now in the public directory
  // In development, serve from root
  // In production, include the base path (/artimine/)
  if (import.meta.env.DEV) {
    return `/assets/${path}`;
  } else {
    return `/artimine/assets/${path}`;
  }
}

// Specific asset path helpers
export function getCardImagePath(imageFileName: string): string {
  return getAssetPath(`images/cards/${imageFileName}.jpg`);
}

export function getLandImagePath(imageFileName: string): string {
  return getAssetPath(`images/cards/${imageFileName}.jpg`);
}

export function getCharacterImagePath(characterName: string): string {
  return getAssetPath(`images/characters/${characterName}.jpg`);
}

export function getCharacterSheetPath(characterKey: string): string {
  return getAssetPath(`images/characters/sheets/${characterKey}.jpg`);
}

export function hasCharacterEmotionSheet(characterKey: string): boolean {
  return CHARACTER_EMOTION_SHEETS.has(characterKey);
}

/** CSS background-position percentages for a cell on a 4×4 emotion sheet. */
export function getEmotionSheetBackgroundPosition(emotion: Emotion): { x: number; y: number } {
  const [col, row] = EMOTION_SHEET_CELLS[emotion];
  return {
    x: (col / (EMOTION_SHEET_COLS - 1)) * 100,
    y: (row / (EMOTION_SHEET_ROWS - 1)) * 100,
  };
}

/** CSS background-size for a 4×4 emotion sheet (`400% 400%`). */
export function getEmotionSheetBackgroundSize(): string {
  return `${EMOTION_SHEET_COLS * 100}% ${EMOTION_SHEET_ROWS * 100}%`;
}

export function getSoundPath(soundName: string): string {
  return getAssetPath(`sounds/battle/${soundName}.mp3`);
}

export function getSimSoundPath(soundName: string): string {
  return getAssetPath(`sounds/sim/${soundName}.wav`);
}

export function getTableImagePath(): string {
  return getAssetPath('images/ui/backgrounds/table.jpg');
}

export function getBattleBackgroundPath(): string {
  return getAssetPath('images/ui/backgrounds/battle-background.png');
}

export function getPlaymatPath(): string {
  return getAssetPath('images/ui/backgrounds/playmat.png');
}

export function getDataBackgroundPath(): string {
  return getAssetPath('images/ui/backgrounds/data-background.png');
}

export function getCardBackImagePath(): string {
  return getAssetPath('images/card_back.jpg');
}

export function getItemImagePath(itemKey: string): string {
  return getAssetPath(`images/items/${itemKey}.jpg`);
}

export function getPlaceImagePath(placeKey: string): string {
  return getAssetPath(`images/places/${placeKey}.jpg`);
}

/** A loadable illustration and the value stored on relation-arc beats. */
export type ImageRef = { url: string; stored: string };

/**
 * Event illustration candidates, tried in order:
 * `images/events/{fileName}`, then each loaded mod that has that file.
 */
export function getEventImageRefs(imageFileName: string): ImageRef[] {
  const refs: ImageRef[] = [
    {
      url: getAssetPath(`images/events/${imageFileName}`),
      stored: imageFileName,
    },
  ];
  for (const hit of findModImages('events', imageFileName)) {
    refs.push({
      url: hit.url,
      stored: `mod/${hit.modId}/events/${imageFileName}`,
    });
  }
  return refs;
}

/** Full URLs for event art candidates (built-in `events/`, then mods). */
export function getEventImageCandidates(imageFileName: string): string[] {
  return getEventImageRefs(imageFileName).map((ref) => ref.url);
}

/**
 * First event-illustration candidate URL (`images/events/{fileName}`).
 * Prefer {@link getEventImageCandidates} when the file may live in a mod.
 */
export function getEventImagePath(imageFileName: string): string {
  return getEventImageCandidates(imageFileName)[0];
}

/**
 * Event art filename from the template's `image` field (e.g. `emma-l1.jpg`).
 * Place the file at public/assets/images/events/{image} or mods/<id>/images/events/{image}.
 */
export function resolveEventImageFileName(_eventKey: string, image?: string): string | undefined {
  if (!image) return undefined;
  return image;
}

const LEGACY_MOD_FOLDERS: Record<string, ModImageKind> = {
  activities_more: 'activities',
  events_more: 'events',
};

/** Resolve a stored illustration (`events/file`, bare event file, `mod/<id>/...`, or legacy `*_more/`). */
export function resolveStoredImage(image: string): string {
  return storedImageCandidates(image)[0];
}

/** Candidate URLs for a stored illustration, in lookup order. */
export function storedImageCandidates(image: string): string[] {
  const normalized = image.replace(/\\/g, '/');
  const modStored = /^mod\/([^/]+)\/(activities|events)\/([^/]+)$/.exec(normalized);
  if (modStored) {
    return [modImageUrl(modStored[1], modStored[2] as ModImageKind, modStored[3])];
  }
  const legacy = /^(activities_more|events_more)\/([^/]+)$/.exec(normalized);
  if (legacy) {
    const hits = findModImages(LEGACY_MOD_FOLDERS[legacy[1]], legacy[2]).map((hit) => hit.url);
    if (hits.length > 0) return hits;
    return [getAssetPath(`images/${normalized}`)];
  }
  if (normalized.includes('/')) {
    return [getAssetPath(`images/${normalized}`)];
  }
  return getEventImageCandidates(normalized);
}

export function getJobImagePath(jobName: string): string {
  return getAssetPath(`images/jobs/${jobName}.jpg`);
}

/**
 * Activity illustration candidates, tried in order:
 * `{type}_{participants}_{placeKey}.jpg` then `{type}_{participants}.jpg`,
 * each under `images/activities` and then any mod that has that file.
 */
export function getActivityImageRefs(
  activityType: string,
  characterKeys: string[],
  placeKey?: string
): ImageRef[] {
  const participants = [...characterKeys].sort().join('_');
  const basenames = [
    ...(placeKey ? [`${activityType}_${participants}_${placeKey}.jpg`] : []),
    `${activityType}_${participants}.jpg`,
  ];
  const refs: ImageRef[] = [];
  for (const basename of basenames) {
    refs.push({
      url: getAssetPath(`images/activities/${basename}`),
      stored: `activities/${basename}`,
    });
    for (const hit of findModImages('activities', basename)) {
      refs.push({
        url: hit.url,
        stored: `mod/${hit.modId}/activities/${basename}`,
      });
    }
  }
  return refs;
}

/** Activity illustration URLs. See {@link getActivityImageRefs}. */
export function getActivityImagePath(
  activityType: string,
  characterKeys: string[],
  placeKey?: string
): string[] {
  return getActivityImageRefs(activityType, characterKeys, placeKey).map((ref) => ref.url);
}

/** Semantic UI icon names → painted PNG files in images/ui/icons. */
const PAINTED_UI_ICONS: Record<string, string> = {
  sunrise: 'morning',
  sun: 'afternoon',
  moon: 'evening',
  book: 'book',
  calendar: 'calendar',
  people: 'characters',
  person: 'player',
  spiral: 'conjure',
  cards: 'decks',
  compass: 'menu-icons',
  trophy: 'league',
  pin: 'places',
  heart: 'heart',
  hourglass: 'wait',
  star: 'star',
  'page-star': 'star',
  feather: 'feather',
  boot: 'boot',
  coin: 'coin',
  mug: 'mug',
  leaf: 'leaf',
  temple: 'temple',
  handshake: 'handshake',
  finger_pointing: 'finger_pointing',
  gem: 'gem',
  magic_dust: 'magic_dust',
  metal_bar: 'metal_bar',
  crown: 'more_icons',
  befriend: 'handshake',
  taunt: 'finger_pointing',
  impress: 'more_icons',
  flirt: 'heart',
};

export function isPaintedUiIcon(name: string): boolean {
  return name in PAINTED_UI_ICONS;
}

export function getUiIconPath(name: string): string {
  const file = PAINTED_UI_ICONS[name] ?? name;
  return getAssetPath(`images/ui/icons/${file}.png`);
}

/** Per-action-type icons for crafting incantations (images/ui/icons/action_types). */
export function getActionTypeIconPath(actionName: string): string {
  return getAssetPath(`images/ui/icons/action_types/${actionName}.png`);
}
