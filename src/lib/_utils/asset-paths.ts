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

export function getCardBackImagePath(): string {
  return getAssetPath('images/card_back.jpg');
}

export function getItemImagePath(itemKey: string): string {
  return getAssetPath(`images/items/${itemKey}.jpg`);
}

export function getPlaceImagePath(placeKey: string): string {
  return getAssetPath(`images/places/${placeKey}.jpg`);
}
