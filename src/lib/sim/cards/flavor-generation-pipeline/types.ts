import {
  CardColor,
  CardType,
  UnitType,
  type UnitKeywords,
} from '@/lib/_model';
import type { CardCreationParameters } from '../../actions';

export type PowerLevel = 'weak' | 'medium' | 'powerful';

export interface GameplayTemplate {
  cardType: CardType.Unit | CardType.Spell;
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

export function toGameplayTemplate(parameters: CardCreationParameters): GameplayTemplate {
  const cardType =
    parameters.cardType === CardType.Spell ? CardType.Spell : CardType.Unit;
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
