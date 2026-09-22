import colorPieData from '@/data/color-pie.json';
import { CardColor, CardType, UnitType } from '@/lib/_model';
import { completeChat } from '@/lib/llm/llm-service';
import type { FlavorTemplate, GameplayTemplate } from './types';
import { nameToImageName } from './types';

export interface GeneratedFlavorText {
  name: string;
  imagePrompt: string;
  imageName: string;
  unitType?: UnitType;
}

const IMAGE_PROMPT_TEMPLATE =
  'Whimsical hand-drawn fantasy illustration of a <DEPICTION>. Clear, bold silhouette and instantly recognizable subject, centered and filling most of the square image. Simplified background with only a few readable forest elements. Rich watercolor and ink, clean varied linework, subtle hatching, vivid layered colors, expressive cartoon-like proportions, detailed but not cluttered. Strong shapes, clear lighting, high contrast, designed to remain readable at 300×300 pixels. Square 1:1. No text, border, UI, or padding.';

type ColorPieEntry = {
  description: string;
  unitTypes: string;
};

const colorPieFlavor = colorPieData as Record<string, ColorPieEntry>;

function describeColors(colors: CardColor[]): string {
  if (!colors.length) {
    return 'No specific color — invent a fitting fantasy vibe.';
  }
  return colors
    .map((color) => {
      const entry = colorPieFlavor[color];
      if (!entry) return `- ${color}`;
      return `- ${color}: ${entry.description} Typical unit types: ${entry.unitTypes}.`;
    })
    .join('\n');
}

function assembleImagePrompt(depiction: string): string {
  const cleaned = depiction
    .trim()
    .replace(/^of\s+/i, '')
    .replace(/\.$/, '');
  return IMAGE_PROMPT_TEMPLATE.replace('<DEPICTION>', cleaned);
}

function buildPrompt(gameplay: GameplayTemplate): string {
  const parts = [
    `Card type: ${gameplay.cardType}`,
    `Power level: ${gameplay.powerLevel}`,
    'Colors and what they mean in this game:',
    describeColors(gameplay.colors),
  ];
  if (gameplay.keywords?.length) {
    parts.push(`Keywords: ${gameplay.keywords.join(', ')}`);
  }
  if (gameplay.actions?.length) {
    parts.push(`Actions: ${gameplay.actions.join(', ')}`);
  }
  if (gameplay.unitTypes?.length) {
    parts.push(`Unit types (already chosen): ${gameplay.unitTypes.join(', ')}`);
  }

  const needsUnitType = gameplay.cardType === CardType.Unit && !gameplay.unitTypes?.length;
  const unitTypeHint = needsUnitType
    ? [
        `Also choose one unitType from: ${Object.values(UnitType).join(', ')}.`,
        'Prefer unit types typical of the card colors above when they fit.',
      ].join(' ')
    : 'Do not include unitType.';

  return [
    'You invent flavor for a whimsical fantasy trading-card game.',
    'Return exactly ONE JSON object (not an array) with keys:',
    '- name (string): unique, evocative, 1–4 words, title case',
    '- depiction (string): what the card art shows — a short concrete subject phrase that fits after "illustration of a …" (no style instructions, no camera/framing notes)',
    needsUnitType ? '- unitType (string)' : null,
    unitTypeHint,
    'Match the color vibes and typical creature themes when inventing the name and depiction.',
    'Gameplay context:',
    parts.join('\n'),
  ]
    .filter(Boolean)
    .join('\n');
}

function extractJsonValue(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : trimmed).trim();

  try {
    return JSON.parse(raw);
  } catch {
    // Fall through to brace/bracket slice for partially wrapped replies.
  }

  const objectStart = raw.indexOf('{');
  const arrayStart = raw.indexOf('[');
  const startsAsArray =
    arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart);

  if (startsAsArray) {
    const end = raw.lastIndexOf(']');
    if (end > arrayStart) {
      return JSON.parse(raw.slice(arrayStart, end + 1));
    }
  }

  const start = objectStart;
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM response did not contain JSON');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/** Accept a single object, or the first object if the model returns an array. */
function coerceFlavorFields(parsed: unknown): {
  name?: unknown;
  depiction?: unknown;
  imagePrompt?: unknown;
  unitType?: unknown;
} {
  if (Array.isArray(parsed)) {
    if (!parsed.length || typeof parsed[0] !== 'object' || parsed[0] === null) {
      throw new Error('LLM returned an empty JSON array');
    }
    console.warn('[flavor-text] LLM returned a JSON array; using the first item');
    return parsed[0] as {
      name?: unknown;
      depiction?: unknown;
      imagePrompt?: unknown;
      unitType?: unknown;
    };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('LLM JSON was not an object');
  }
  return parsed as {
    name?: unknown;
    depiction?: unknown;
    imagePrompt?: unknown;
    unitType?: unknown;
  };
}

function parseUnitType(value: unknown): UnitType | undefined {
  if (typeof value !== 'string') return undefined;
  const match = Object.values(UnitType).find((type) => type === value.toLowerCase());
  return match;
}

export async function generateFlavorText(
  gameplay: GameplayTemplate
): Promise<GeneratedFlavorText> {
  const response = await completeChat(
    [
      {
        role: 'system',
        content:
          'You are a concise fantasy card-flavor writer. Reply with a single JSON object only — never an array, never markdown.',
      },
      { role: 'user', content: buildPrompt(gameplay) },
    ],
    { temperature: 0.9, maxTokens: 300, json: true }
  );

  const parsed = coerceFlavorFields(extractJsonValue(response));

  if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
    throw new Error('LLM flavor missing name');
  }

  const depiction =
    typeof parsed.depiction === 'string' && parsed.depiction.trim()
      ? parsed.depiction.trim()
      : typeof parsed.imagePrompt === 'string' && parsed.imagePrompt.trim()
        ? parsed.imagePrompt.trim()
        : '';
  if (!depiction) {
    throw new Error('LLM flavor missing depiction');
  }

  const name = parsed.name.trim();
  return {
    name,
    imagePrompt: assembleImagePrompt(depiction),
    imageName: nameToImageName(name),
    unitType: parseUnitType(parsed.unitType),
  };
}

export function flavorFromGeneratedText(
  gameplay: GameplayTemplate,
  text: GeneratedFlavorText
): FlavorTemplate {
  return {
    name: text.name,
    imageName: text.imageName,
    imagePrompt: text.imagePrompt,
    cardType: gameplay.cardType,
    unitSize: gameplay.powerLevel,
    cheapImage: true,
    colors: [...gameplay.colors],
    keywords: gameplay.keywords ? [...gameplay.keywords] : [],
    ...(text.unitType || gameplay.unitTypes?.length
      ? { unitTypes: text.unitType ? [text.unitType] : [...(gameplay.unitTypes ?? [])] }
      : {}),
    ...(gameplay.actions?.length ? { actions: [...gameplay.actions] } : {}),
  };
}
