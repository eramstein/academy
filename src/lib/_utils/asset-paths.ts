import { Emotion } from '@/lib/_model/enums-sim';

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

/** Event illustration at images/events/{fileName}. */
export function getEventImagePath(imageFileName: string): string {
  return getAssetPath(`images/events/${imageFileName}`);
}

/**
 * Event art filename from the template's `image` field (e.g. `emma-l1.png`).
 * Place the file at public/assets/images/events/{image}.
 */
export function resolveEventImageFileName(_eventKey: string, image?: string): string | undefined {
  if (!image) return undefined;
  return image;
}

export function getJobImagePath(jobName: string): string {
  return getAssetPath(`images/jobs/${jobName}.jpg`);
}

const ACTIVITY_IMAGE_FOLDERS = ['activities', 'activities_more'] as const;

/** Max N probed for `{character}-p-{N}.jpg` physical-romance art. */
const PHYSICAL_ROMANCE_IMAGE_MAX = 12;

/**
 * Activity illustration candidates relative to `images/`, tried in order:
 * `{type}_{participants}_{placeKey}.jpg` then `{type}_{participants}.jpg`,
 * each under `activities` then `activities_more`.
 */
export function getActivityImageRelPath(
  activityType: string,
  characterKeys: string[],
  placeKey?: string
): string[] {
  const participants = [...characterKeys].sort().join('_');
  const basenames = [
    ...(placeKey ? [`${activityType}_${participants}_${placeKey}.jpg`] : []),
    `${activityType}_${participants}.jpg`,
  ];
  return basenames.flatMap((basename) =>
    ACTIVITY_IMAGE_FOLDERS.map((folder) => `${folder}/${basename}`)
  );
}

/**
 * Activity illustration candidates, tried in order:
 * `{type}_{participants}_{placeKey}.jpg` then `{type}_{participants}.jpg`,
 * each under `images/activities` then `images/activities_more`.
 */
export function getActivityImagePath(
  activityType: string,
  characterKeys: string[],
  placeKey?: string
): string[] {
  return getActivityImageRelPath(activityType, characterKeys, placeKey).map((rel) =>
    getAssetPath(`images/${rel}`)
  );
}

/** Physical-romance art: `images/activities_more/{characterKey}-p-{n}.jpg`. */
export function getPhysicalRomanceImagePath(characterKey: string, n: number): string {
  return getAssetPath(`images/activities_more/${characterKey}-p-${n}.jpg`);
}

/** Candidate paths for `{characterKey}-p-1.jpg` … `p-{MAX}`. */
export function getPhysicalRomanceImageCandidates(characterKey: string): string[] {
  return Array.from({ length: PHYSICAL_ROMANCE_IMAGE_MAX }, (_, i) =>
    getPhysicalRomanceImagePath(characterKey, i + 1)
  );
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
