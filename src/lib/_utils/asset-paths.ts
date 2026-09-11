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

export function getSoundPath(soundName: string): string {
  return getAssetPath(`sounds/battle/${soundName}.mp3`);
}

export function getTableImagePath(): string {
  return getAssetPath('images/table.jpg');
}

export function getDataBackgroundPath(): string {
  return getAssetPath('images/data-background.png');
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

/** Semantic UI icon names → extracted PNG files. Unmapped names stay SVG silhouettes. */
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
};

export function isPaintedUiIcon(name: string): boolean {
  return name in PAINTED_UI_ICONS;
}

export function getUiIconPath(name: string): string {
  const file = PAINTED_UI_ICONS[name];
  if (file) return getAssetPath(`images/ui/icons/${file}.png`);
  return getAssetPath(`images/ui/${name}.svg`);
}
