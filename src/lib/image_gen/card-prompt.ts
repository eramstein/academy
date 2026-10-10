/**
 * Card-art prompt assembly: subject depiction + optional color-pie background
 * caption, then the shared watercolor style wrapper for Comfy.
 */
import colorPieData from '@/data/color-pie.json';

type ColorScene = {
  locationTypes?: string[];
  dominantColors?: string[];
  atmospheres?: string[];
};

const COLOR_PIE = colorPieData as Record<string, ColorScene>;

const IMAGE_PROMPT_TEMPLATE = `Whimsical hand-drawn fantasy illustration of <DEPICTION>. Clear, bold silhouette and instantly recognizable subject, centered and filling most of the square image.
Rich storybook watercolor and gouache: layered translucent washes, soft color blooms, gentle pigment granulation, and varied brushwork. Add readable material detail on the subject — bark, cloth, metal, leaves, soil, fur, stone, or magic glow — with a few fine ink accents on edges and focal points. Supporting background with atmospheric depth, soft light shafts or mist, and a handful of concrete props that reinforce the scene (not empty flat color).
Expressive slightly cartoon-like proportions, warm natural lighting, strong contrast, and lush hand-painted European fantasy storybook quality. Intricate but organized: the main subject stays crisp when shrunk to 300×300. Square 1:1, full bleed. No text, border, UI, or padding.`;

function pickOne<T>(items: readonly T[], random: () => number): T | undefined {
  if (!items.length) return undefined;
  return items[Math.floor(random() * items.length)];
}

function hasSceneLists(color: string): boolean {
  const entry = COLOR_PIE[color];
  return Boolean(
    entry?.locationTypes?.length && entry?.dominantColors?.length && entry?.atmospheres?.length
  );
}

/** True when the depiction already ends with a background caption sentence. */
export function hasBackgroundCaption(depiction: string): boolean {
  const parts = depiction
    .trim()
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2;
}

/**
 * Pick one location, palette, and atmosphere for a color and format them as a
 * comma-separated background caption (e.g. "Rocky mountains, slate gray and
 * muted green, overcast and cloudy.").
 */
export function pickBackgroundCaption(
  color: string,
  random: () => number = Math.random
): string | null {
  const entry = COLOR_PIE[color];
  if (!entry) return null;
  const location = pickOne(entry.locationTypes ?? [], random);
  const palette = pickOne(entry.dominantColors ?? [], random);
  const atmosphere = pickOne(entry.atmospheres ?? [], random);
  if (!location || !palette || !atmosphere) return null;
  return `${location}, ${palette.toLowerCase()}, ${atmosphere.toLowerCase()}.`;
}

function ensurePeriod(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed) return trimmed;
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

/**
 * Keep a one-sentence subject as-is, and append a color-pie background caption
 * when the depiction does not already have a second sentence.
 */
export function withBackgroundCaption(
  subject: string,
  colors: readonly string[],
  random: () => number = Math.random
): string {
  const trimmed = subject.trim();
  if (!trimmed) return trimmed;
  if (hasBackgroundCaption(trimmed)) return ensurePeriod(trimmed);

  const color = colors.find(hasSceneLists);
  if (!color) return ensurePeriod(trimmed);

  const background = pickBackgroundCaption(color, random);
  if (!background) return ensurePeriod(trimmed);

  return `${ensurePeriod(trimmed)} ${background}`;
}

/** Clean a depiction phrase for storage / style-template insertion. */
export function cleanDepiction(depiction: string): string {
  return depiction
    .trim()
    .replace(/^of\s+/i, '')
    .replace(/^an?\s+/i, '')
    .replace(/\.$/, '');
}

export interface AssembleCardImagePromptOptions {
  /** Card colors used to pick a background when the depiction has only a subject. */
  colors?: readonly string[];
  /** Injectable RNG for tests / deterministic picks. */
  random?: () => number;
}

/**
 * Expand a stored card depiction into the full Comfy image prompt.
 * When `colors` are provided and the depiction has no background sentence yet,
 * appends one from that color's locationTypes / dominantColors / atmospheres.
 */
export function assembleCardImagePrompt(
  depiction: string,
  options: AssembleCardImagePromptOptions = {}
): string {
  const subject =
    options.colors?.length
      ? withBackgroundCaption(depiction, options.colors, options.random)
      : depiction.trim();
  return IMAGE_PROMPT_TEMPLATE.replace('<DEPICTION>', cleanDepiction(subject));
}

/** @deprecated Prefer {@link assembleCardImagePrompt}. */
export function assembleImagePrompt(depiction: string): string {
  return assembleCardImagePrompt(depiction);
}
