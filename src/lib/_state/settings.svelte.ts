import {
  isInteractionLanguage,
  type InteractionLanguage,
} from '@/lib/sim/interactions/language';

const LOCAL_STORAGE_KEY_SETTINGS = 'academySettings';

export type TextSpeed = 'instant' | 'fast' | 'normal' | 'slow';

export type GameSettings = {
  textSpeed: TextSpeed;
  /** LLM-backed content: interactions, and any event gated on `llm_features`. */
  llmFeaturesEnabled: boolean;
  /** Language of generated interaction scenes and choice buttons. */
  language: InteractionLanguage;
  /** Mod ids the player has turned off. Missing ids stay enabled. */
  disabledMods: string[];
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
  llmFeaturesEnabled: true,
  language: 'en',
  disabledMods: [],
};

function normalizeDisabledMods(value: unknown): string[] {
  if (!Array.isArray(value)) return [...defaultSettings.disabledMods];
  const ids = value.filter((id): id is string => typeof id === 'string' && id.length > 0);
  return [...new Set(ids)];
}

function loadSettings(): GameSettings {
  if (typeof localStorage === 'undefined') {
    return { ...defaultSettings, disabledMods: [...defaultSettings.disabledMods] };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (!raw) return { ...defaultSettings, disabledMods: [...defaultSettings.disabledMods] };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const textSpeed = TEXT_SPEED_OPTIONS.some((o) => o.value === parsed.textSpeed)
      ? (parsed.textSpeed as TextSpeed)
      : defaultSettings.textSpeed;
    const llmFeaturesEnabled =
      typeof parsed.llmFeaturesEnabled === 'boolean'
        ? parsed.llmFeaturesEnabled
        : defaultSettings.llmFeaturesEnabled;
    const language = isInteractionLanguage(parsed.language)
      ? parsed.language
      : defaultSettings.language;
    const disabledMods = normalizeDisabledMods(parsed.disabledMods);
    return { textSpeed, llmFeaturesEnabled, language, disabledMods };
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return { ...defaultSettings, disabledMods: [...defaultSettings.disabledMods] };
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

export function setLlmFeaturesEnabled(enabled: boolean): void {
  settings.llmFeaturesEnabled = enabled;
  saveSettings();
}

export function setInteractionLanguage(language: InteractionLanguage): void {
  settings.language = language;
  saveSettings();
}

export function isModEnabled(modId: string): boolean {
  return !settings.disabledMods.includes(modId);
}

export function setModEnabled(modId: string, enabled: boolean): void {
  const disabled = new Set(settings.disabledMods);
  if (enabled) disabled.delete(modId);
  else disabled.add(modId);
  settings.disabledMods = [...disabled];
  saveSettings();
}

export function getTextSpeedMs(): number {
  return TEXT_SPEED_MS[settings.textSpeed];
}
