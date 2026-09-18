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
  // keywordsPreferences: +3: strong, 0: neutral, -3: weak
  keywordsPreferences: Partial<Record<keyof UnitKeywords, number>>;
  actionPreferences: Partial<Record<string, number>>;
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
      haste: 3,
      moveAndAttack: 1,
      zerk: 1,
      ranged: 0,
      armor: -1,
      resist: -1,
      poisonous: -1,
      regeneration: -1,
      trample: -1,
      cleave: -1,
      lance: 1,
      flying: 0,
      immobile: -1,
      armorPiercing: 0,
    },
    actionPreferences: {
      destroyUnit: -1,
      fortifyLand: -3,
      directDamage: 3,
      healUnit: -3,
      grow: -3,
      damageLand: 3,
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
      haste: -2,
      moveAndAttack: -2,
      zerk: -1,
      ranged: -1,
      armor: -1,
      resist: 0,
      poisonous: 2,
      regeneration: 3,
      trample: 3,
      cleave: 1,
      lance: -1,
      flying: -1,
      immobile: -1,
      armorPiercing: -1,
    },
    actionPreferences: {
      destroyUnit: -3,
      fortifyLand: -1,
      directDamage: -3,
      healUnit: 3,
      grow: 3,
      damageLand: -3,
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
      haste: -1,
      moveAndAttack: 3,
      zerk: -1,
      ranged: 2,
      armor: 0,
      resist: 1,
      poisonous: -1,
      regeneration: -1,
      trample: -3,
      cleave: -1,
      lance: -1,
      flying: 2,
      immobile: 0,
      armorPiercing: 1,
    },
    actionPreferences: {
      destroyUnit: -1,
      fortifyLand: -1,
      directDamage: 0,
      healUnit: -3,
      grow: -3,
      damageLand: 0,
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
      haste: -1,
      moveAndAttack: -1,
      zerk: -1,
      ranged: 3,
      armor: 3,
      resist: -1,
      poisonous: -1,
      regeneration: -1,
      trample: -1,
      cleave: -1,
      lance: -1,
      flying: 1,
      immobile: 2,
      armorPiercing: 0,
    },
    actionPreferences: {
      destroyUnit: 3,
      fortifyLand: 3,
      directDamage: -3,
      healUnit: -3,
      grow: -3,
      damageLand: 0,
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
