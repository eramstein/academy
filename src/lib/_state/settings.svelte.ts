const LOCAL_STORAGE_KEY_SETTINGS = 'academySettings';

export type TextSpeed = 'instant' | 'fast' | 'normal' | 'slow';

export type GameSettings = {
  textSpeed: TextSpeed;
};

export const TEXT_SPEED_OPTIONS: { value: TextSpeed; label: string; hint: string }[] = [
  { value: 'instant', label: 'Instant', hint: 'Show all text at once' },
  { value: 'fast', label: 'Fast', hint: 'Quick typewriter' },
  { value: 'normal', label: 'Normal', hint: 'Default pace' },
  { value: 'slow', label: 'Slow', hint: 'Deliberate reveal' },
];

/** Milliseconds per character. 0 means instant (no typing animation). */
export const TEXT_SPEED_MS: Record<TextSpeed, number> = {
  instant: 0,
  fast: 10,
  normal: 18,
  slow: 28,
};

const defaultSettings: GameSettings = {
  textSpeed: 'normal',
};

function loadSettings(): GameSettings {
  if (typeof localStorage === 'undefined') {
    return { ...defaultSettings };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const textSpeed = TEXT_SPEED_OPTIONS.some((o) => o.value === parsed.textSpeed)
      ? (parsed.textSpeed as TextSpeed)
      : defaultSettings.textSpeed;
    return { textSpeed };
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return { ...defaultSettings };
  }
}

export const settings: GameSettings = $state(loadSettings());

export function saveSettings(): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

export function setTextSpeed(textSpeed: TextSpeed): void {
  settings.textSpeed = textSpeed;
  saveSettings();
}

export function getTextSpeedMs(): number {
  return TEXT_SPEED_MS[settings.textSpeed];
}
