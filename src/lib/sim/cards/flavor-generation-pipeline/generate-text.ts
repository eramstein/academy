import colorPieData from '@/data/color-pie.json';
import { CardColor, CardType, UnitType, type UnitKeywords } from '@/lib/_model';
import { completeChat } from '@/lib/llm/llm-service';
import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
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

/** How each keyword must read in the card art (silhouette / pose / creature choice). */
const KEYWORD_VISUAL_CUES: Partial<Record<keyof UnitKeywords, string>> = {
  flying: 'show the subject airborne — wings, mid-flight, or hovering above the ground (e.g. dragon, bird, winged beast)',
  ranged: 'show a projectile weapon, bow, or spell cast at distance',
  haste: 'dynamic leaping or charging pose — motion and urgency',
  moveAndAttack: 'subject mid-stride or charging into a strike',
  zerk: 'feral, frenzied attack pose',
  armor: 'heavy plating, shell, or armored hide',
  resist: 'arcane wards, glowing runes, or magical barrier',
  poisonous: 'fangs, venom, toxic glow, or poisonous flora',
  regeneration: 'living growth, vines, or wounds knitting shut',
  trample: 'huge charging bulk that could crush what is ahead',
  cleave: 'wide sweeping weapon or claws striking multiple foes',
  lance: 'long spear, horn, or piercing charge down a line',
  immobile: 'rooted, planted, or statue-like — not mid-run',
  armorPiercing: 'sharp drill-like horn, spike, or armor-cracking weapon',
};

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

function describeKeywords(keywords: (keyof UnitKeywords)[]): string {
  return keywords
    .map((key) => {
      const rules = getKeywordTooltip(key);
      const visual = KEYWORD_VISUAL_CUES[key];
      return visual
        ? `- ${key}: ${rules} Art MUST show: ${visual}.`
        : `- ${key}: ${rules}`;
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

function buildPrompt(
  gameplay: GameplayTemplate,
  needsUnitType: boolean,
  flavorText?: string
): string {
  const parts = [
    `Card type: ${gameplay.cardType}`,
    `Power level: ${gameplay.powerLevel}`,
    'Colors and what they mean in this game:',
    describeColors(gameplay.colors),
  ];
  if (gameplay.keywords?.length) {
    parts.push(
      'Keywords (CRITICAL — every keyword must be visually obvious in the depiction; pick creature / pose / gear so a player can read the keyword from the art alone):',
      describeKeywords(gameplay.keywords)
    );
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
        gameplay.keywords?.includes('flying')
          ? 'If flying is present, strongly prefer dragon, spirit, elemental, or another winged/airborne type.'
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    : 'Do not include a unitType field.';

  const visionHint = flavorText?.trim()
    ? [
        `Player vision (must honor this when inventing name and depiction): ${flavorText.trim()}`,
        'The depiction should clearly portray that vision; the name should fit it.',
        'If keywords conflict with a vague reading of the vision, choose the interpretation that also expresses the keywords (e.g. flying fire monster → a flying dragon, not a grounded beast).',
      ].join('\n')
    : null;

  const keywordArtRule = gameplay.keywords?.length
    ? 'Do not invent a subject that hides or ignores keywords. Weave each keyword into the depiction phrase itself (not as a list of keyword names).'
    : null;

  return [
    'You invent flavor for a whimsical fantasy trading-card game.',
    'Return exactly ONE JSON object with keys:',
    '- name (string): unique, evocative, 1–4 words, title case',
    '- depiction (string): what the card art shows — a short concrete subject phrase that fits after "illustration of a …" (no style instructions, no camera/framing notes)',
    needsUnitType ? '- unitType (string): one of the allowed values' : null,
    unitTypeHint,
    visionHint,
    keywordArtRule,
    'Match the color vibes and typical creature themes when inventing the name and depiction.',
    'Gameplay context:',
    parts.join('\n'),
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateFlavorText(
  gameplay: GameplayTemplate,
  flavorText?: string
): Promise<GeneratedFlavorText> {
  const needsUnitType = gameplay.cardType === CardType.Unit && !gameplay.unitTypes?.length;
  const messages = [
    {
      role: 'system' as const,
      content:
        'You are a concise fantasy card-flavor writer. Reply with a single JSON object only — never an array, never markdown.',
    },
    { role: 'user' as const, content: buildPrompt(gameplay, needsUnitType, flavorText) },
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
