import { CardColor, UnitType, type CardTemplate, type UnitKeywords } from '@/lib/_model';
import { getRandomFromArray } from '@/lib/_utils/random';

export interface StatsPreference {
  power: number;
  hp: number;
  ret: number;
}

export interface ColorPie {
  statsPreference: StatsPreference;
  unitTypes: UnitType[];
  keywordsPreferences: Partial<Record<keyof UnitKeywords, number>>;
}

export const colorPie: Record<CardColor, ColorPie> = {
  [CardColor.Red]: {
    statsPreference: {
      power: 4,
      hp: 4,
      ret: 2,
    },
    unitTypes: [UnitType.Dwarf, UnitType.Dragon],
    keywordsPreferences: {
      haste: 9,
      moveAndAttack: 6,
      zerk: 3,
    },
  },
  [CardColor.Green]: {
    statsPreference: {
      power: 2,
      hp: 3,
      ret: 1,
    },
    unitTypes: [UnitType.Mushroom, UnitType.Plant],
    keywordsPreferences: {
      regeneration: 6,
      trample: 6,
      poisonous: 5,
      moveAndAttack: -3,
      cleave: 3,
    },
  },
  [CardColor.Blue]: {
    statsPreference: {
      power: 2,
      hp: 3,
      ret: 1,
    },
    unitTypes: [UnitType.Construct],
    keywordsPreferences: {
      ranged: 9,
      moveAndAttack: 6,
      resist: 6,
      cleave: -3,
      flying: 3,
    },
  },
  [CardColor.Black]: {
    statsPreference: {
      power: 2,
      hp: 4,
      ret: 2,
    },
    unitTypes: [UnitType.Demon, UnitType.Construct],
    keywordsPreferences: {
      ranged: 3,
      armor: 6,
      poisonous: 3,
      moveAndAttack: -3,
      lance: 3,
      flying: -3,
    },
  },
};

export function getCardDominantColor(card: CardTemplate): CardColor {
  if (card.colors.length === 0) {
    return CardColor.Red;
  }
  const maxCount = Math.max(...card.colors.map((c) => c.count));
  const tiedColors = card.colors.filter((c) => c.count === maxCount);
  return getRandomFromArray(tiedColors).color;
}
