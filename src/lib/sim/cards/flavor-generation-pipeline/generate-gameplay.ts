import colorPieData from '@/data/color-pie.json';
import { CardColor, CardType, UnitType, type UnitKeywords } from '@/lib/_model';
import { completeChat } from '@/lib/llm/llm-service';
import { KEYWORD_TOOLTIPS, getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
import { z } from 'zod';
import { ACTION_TEMPLATE_KEYS, getActionTemplateMeta } from '../action-templates';
import type { GameplayTemplate, PowerLevel } from './types';

type ColorPieEntry = {
  description: string;
  unitTypes: string;
};

const colorPieFlavor = colorPieData as Record<string, ColorPieEntry>;

const CARD_TYPE_VALUES = [CardType.Unit, CardType.Spell] as const;
const COLOR_VALUES = Object.values(CardColor) as [CardColor, ...CardColor[]];
const POWER_LEVEL_VALUES = ['weak', 'medium', 'powerful'] as const satisfies readonly PowerLevel[];
const UNIT_TYPE_VALUES = Object.values(UnitType) as [UnitType, ...UnitType[]];

/** Unit keyword keys that have tooltip copy (excludes retaliate, which is end-of-turn only). */
const KEYWORD_VALUES = (Object.keys(KEYWORD_TOOLTIPS) as string[]).filter(
  (key): key is keyof UnitKeywords => key !== 'retaliate'
) as [keyof UnitKeywords, ...(keyof UnitKeywords)[]];

const ACTION_VALUES = ACTION_TEMPLATE_KEYS as [string, ...string[]];

const GameplayFromFlavorSchema = z.object({
  cardType: z.enum(CARD_TYPE_VALUES),
  colors: z.array(z.enum(COLOR_VALUES)).min(1),
  powerLevel: z.enum(POWER_LEVEL_VALUES),
  keywords: z.array(z.enum(KEYWORD_VALUES)).nullable().optional(),
  actions: z.array(z.enum(ACTION_VALUES)).nullable().optional(),
  unitTypes: z.array(z.enum(UNIT_TYPE_VALUES)).nullable().optional(),
});

function describeColors(): string {
  return COLOR_VALUES.map((color) => {
    const entry = colorPieFlavor[color];
    if (!entry) return `- ${color}`;
    return `- ${color}: ${entry.description} Typical unit types: ${entry.unitTypes}.`;
  }).join('\n');
}

function describeKeywords(): string {
  return KEYWORD_VALUES.map((key) => `- ${key}: ${getKeywordTooltip(key)}`).join('\n');
}

function describeActions(): string {
  return ACTION_VALUES.map((name) => {
    const meta = getActionTemplateMeta(name);
    if (!meta) return `- ${name}`;
    return `- ${name} (${meta.label}): ${meta.description}`;
  }).join('\n');
}

function buildPrompt(flavorText: string): string {
  return [
    'You design gameplay stats for a whimsical fantasy trading-card game.',
    'Given a short flavor description from the user, invent a matching GameplayTemplate.',
    'Return exactly ONE JSON object with keys:',
    '- cardType (string): "unit" or "spell"',
    '- colors (string[]): one or more of red, blue, green, black — pick colors whose vibes fit the flavor',
    '- powerLevel (string): "weak", "medium", or "powerful"',
    '- keywords (string[] | null): unit keywords only; null for spells or when none fit',
    '- actions (string[] | null): action template names for spell effects or unit abilities; null when none fit',
    '- unitTypes (string[] | null): unit creature types; null for spells',
    'Use only values from the allowed lists below. Prefer a coherent, thematic fit over stuffing many keywords/actions.',
    'For a simple creature with no special ability, prefer keywords over actions and leave actions null.',
    '',
    'Colors:',
    describeColors(),
    '',
    'Keywords (units only):',
    describeKeywords(),
    '',
    'Action templates:',
    describeActions(),
    '',
    `Allowed unitTypes: ${UNIT_TYPE_VALUES.join(', ')}`,
    '',
    `User flavor: ${flavorText.trim()}`,
  ].join('\n');
}

function normalizeGameplay(parsed: z.infer<typeof GameplayFromFlavorSchema>): GameplayTemplate {
  const isUnit = parsed.cardType === CardType.Unit;
  const keywords = isUnit
    ? parsed.keywords?.filter(Boolean)
    : undefined;
  const unitTypes = isUnit
    ? parsed.unitTypes?.filter(Boolean)
    : undefined;
  const actions = parsed.actions?.filter(Boolean);

  return {
    cardType: parsed.cardType,
    colors: [...parsed.colors],
    powerLevel: parsed.powerLevel,
    ...(keywords?.length ? { keywords } : {}),
    ...(actions?.length ? { actions } : {}),
    ...(unitTypes?.length ? { unitTypes } : {}),
  };
}

/**
 * Inverse of flavor generation: turn free-text flavor into a GameplayTemplate via the remote LLM.
 */
export async function generateGameplayFromFlavor(flavorText: string): Promise<GameplayTemplate> {
  const trimmed = flavorText.trim();
  if (!trimmed) {
    throw new Error('Flavor text is required');
  }

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are a concise fantasy card-game designer. Reply with a single JSON object only — never an array, never markdown.',
    },
    { role: 'user' as const, content: buildPrompt(trimmed) },
  ];

  const parsed = await completeChat(messages, {
    temperature: 0.7,
    maxTokens: 400,
    schema: GameplayFromFlavorSchema,
    schemaName: 'gameplay-from-flavor',
  });

  return normalizeGameplay(parsed);
}
