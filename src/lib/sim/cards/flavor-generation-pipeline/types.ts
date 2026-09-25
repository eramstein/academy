import {
  CardColor,
  CardType,
  UnitType,
  type UnitKeywords,
} from '@/lib/_model';
import type { CardCreationParameters } from '../../actions';
import { NUMERIC_KEYWORDS } from '../keywords';

export type PowerLevel = 'weak' | 'medium' | 'powerful';

export interface GameplayTemplate {
  cardType: CardType.Unit | CardType.Spell | CardType.Land;
  colors: CardColor[];
  powerLevel: PowerLevel;
  keywords?: (keyof UnitKeywords)[];
  actions?: string[];
  unitTypes?: UnitType[];
}

export interface FlavorTemplate {
  name: string;
  imageName: string;
  imagePrompt: string;
  cardType: CardType;
  unitSize: PowerLevel;
  cheapImage: boolean;
  colors: CardColor[];
  keywords: (keyof UnitKeywords)[];
  unitTypes?: UnitType[];
  actions?: string[];
}

export function costToPowerLevel(cost: number): PowerLevel {
  if (cost <= 3) return 'weak';
  if (cost <= 6) return 'medium';
  return 'powerful';
}

/** Representative mana cost in each power band (0–3 / 4–6 / 7+). */
export function powerLevelToCost(powerLevel: PowerLevel): number {
  if (powerLevel === 'weak') return 2;
  if (powerLevel === 'medium') return 5;
  return 8;
}

function keywordsFromKeys(keys: (keyof UnitKeywords)[]): UnitKeywords {
  const keywords: UnitKeywords = {};
  for (const key of keys) {
    if (NUMERIC_KEYWORDS.has(key)) {
      (keywords[key] as number) = 1;
    } else {
      (keywords[key] as boolean) = true;
    }
  }
  return keywords;
}

/** Overlay a GameplayTemplate onto CardCreationParameters (gameplay wins on overlap). */
export function mergeGameplayIntoParameters(
  parameters: CardCreationParameters,
  gameplay: GameplayTemplate
): CardCreationParameters {
  return {
    ...parameters,
    cardType: gameplay.cardType,
    colors: gameplay.colors.length ? [...gameplay.colors] : parameters.colors,
    cost: powerLevelToCost(gameplay.powerLevel),
    ...(gameplay.keywords?.length
      ? { keywords: keywordsFromKeys(gameplay.keywords) }
      : {}),
    ...(gameplay.actions?.length ? { actions: [...gameplay.actions] } : {}),
    ...(gameplay.unitTypes?.length ? { unitTypes: [...gameplay.unitTypes] } : {}),
  };
}

export function toGameplayTemplate(parameters: CardCreationParameters): GameplayTemplate {
  const cardType =
    parameters.cardType === CardType.Spell
      ? CardType.Spell
      : parameters.cardType === CardType.Land
        ? CardType.Land
        : CardType.Unit;
  const cost = parameters.cost ?? 0;
  const keywordKeys = parameters.keywords
    ? (Object.keys(parameters.keywords) as (keyof UnitKeywords)[]).filter(
        (key) => parameters.keywords?.[key]
      )
    : undefined;

  return {
    cardType,
    colors: parameters.colors ?? [],
    powerLevel: costToPowerLevel(cost),
    ...(keywordKeys?.length ? { keywords: keywordKeys } : {}),
    ...(parameters.actions?.length ? { actions: parameters.actions } : {}),
    ...(parameters.unitTypes?.length ? { unitTypes: parameters.unitTypes } : {}),
  };
}

export function nameToImageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}
