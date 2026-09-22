import colorPieData from '@/data/color-pie.json';
import { CardColor, CardType, UnitType } from '@/lib/_model';
import { completeChat } from '@/lib/llm/llm-service';
import { z } from 'zod';
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

const UNIT_TYPE_VALUES = Object.values(UnitType) as [UnitType, ...UnitType[]];

const FlavorTextSchema = z.object({
  name: z.string().min(1),
  depiction: z.string().min(1),
});

const FlavorTextWithUnitSchema = FlavorTextSchema.extend({
  unitType: z.enum(UNIT_TYPE_VALUES),
});

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

function buildPrompt(gameplay: GameplayTemplate, needsUnitType: boolean): string {
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

  const unitTypeHint = needsUnitType
    ? [
        `Also choose one unitType from: ${UNIT_TYPE_VALUES.join(', ')}.`,
        'Prefer unit types typical of the card colors above when they fit.',
      ].join(' ')
    : 'Do not include a unitType field.';

  return [
    'You invent flavor for a whimsical fantasy trading-card game.',
    'Return exactly ONE JSON object with keys:',
    '- name (string): unique, evocative, 1–4 words, title case',
    '- depiction (string): what the card art shows — a short concrete subject phrase that fits after "illustration of a …" (no style instructions, no camera/framing notes)',
    needsUnitType ? '- unitType (string): one of the allowed values' : null,
    unitTypeHint,
    'Match the color vibes and typical creature themes when inventing the name and depiction.',
    'Gameplay context:',
    parts.join('\n'),
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateFlavorText(
  gameplay: GameplayTemplate
): Promise<GeneratedFlavorText> {
  const needsUnitType = gameplay.cardType === CardType.Unit && !gameplay.unitTypes?.length;
  const messages = [
    {
      role: 'system' as const,
      content:
        'You are a concise fantasy card-flavor writer. Reply with a single JSON object only — never an array, never markdown.',
    },
    { role: 'user' as const, content: buildPrompt(gameplay, needsUnitType) },
  ];

  if (needsUnitType) {
    const parsed = await completeChat(messages, {
      temperature: 0.9,
      maxTokens: 300,
      schema: FlavorTextWithUnitSchema,
      schemaName: 'flavor-text-unit',
    });
    const name = parsed.name.trim();
    const depiction = parsed.depiction.trim();
    if (!name || !depiction) {
      throw new Error('LLM flavor missing name or depiction');
    }
    return {
      name,
      imagePrompt: assembleImagePrompt(depiction),
      imageName: nameToImageName(name),
      unitType: parsed.unitType,
    };
  }

  const parsed = await completeChat(messages, {
    temperature: 0.9,
    maxTokens: 300,
    schema: FlavorTextSchema,
    schemaName: 'flavor-text',
  });
  const name = parsed.name.trim();
  const depiction = parsed.depiction.trim();
  if (!name || !depiction) {
    throw new Error('LLM flavor missing name or depiction');
  }
  return {
    name,
    imagePrompt: assembleImagePrompt(depiction),
    imageName: nameToImageName(name),
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
