import { CardColor, UnitType, type CardTemplate, type UnitKeywords } from '@/lib/_model';
import { getRandomFromArray } from '@/lib/_utils/random';
import { actionTemplates } from './action-templates-data';
import { KEYWORD_KEYS } from './keywords';

export interface StatsPreference {
  power: number;
  hp: number;
  ret: number;
}

export interface ColorPie {
  statsPreference: StatsPreference;
  unitTypes: UnitType[];
  // keywordsPreferences and actionPreferences: +3: strong, 0: neutral, -3: weak
  keywordsPreferences: Record<keyof UnitKeywords, number>;
  actionPreferences: Record<string, number>;
}

const defaultKeywordPreferences: Record<keyof UnitKeywords, number> = Object.fromEntries(
  KEYWORD_KEYS.map((name) => [name, -1])
) as Record<keyof UnitKeywords, number>;

const defaultActionPreferences: Record<string, number> = Object.fromEntries(
  Object.keys(actionTemplates).map((name) => [name, -1])
);

export const colorPie: Record<CardColor, ColorPie> = {
  [CardColor.Red]: {
    statsPreference: {
      power: 4,
      hp: 4,
      ret: 2,
    },
    unitTypes: [UnitType.Dwarf, UnitType.Dragon],
    keywordsPreferences: {
      ...defaultKeywordPreferences,
      haste: 3,
      moveAndAttack: 1,
      zerk: 1,
      ranged: 0,
      lance: 1,
      flying: 0,
      armorPiercing: 0,
    },
    actionPreferences: {
      ...defaultActionPreferences,
      fortifyLand: -3,
      directDamage: 3,
      healUnit: -3,
      addGrowthCounters: -3,
      damageLand: 3,
      stun: 1,
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
      ...defaultKeywordPreferences,
      haste: -2,
      moveAndAttack: -2,
      resist: 0,
      poisonous: 2,
      regeneration: 3,
      trample: 3,
      cleave: 1,
    },
    actionPreferences: {
      ...defaultActionPreferences,
      destroyUnit: -3,
      directDamage: -3,
      healUnit: 3,
      addGrowthCounters: 3,
      damageLand: -3,
      damageOpponent: -3,
      root: 3,
      fight: 3,
      regrowCard: 3,
      addMana: 3,
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
      ...defaultKeywordPreferences,
      moveAndAttack: 3,
      ranged: 2,
      armor: 0,
      resist: 1,
      trample: -3,
      flying: 2,
      immobile: 0,
      armorPiercing: 1,
    },
    actionPreferences: {
      ...defaultActionPreferences,
      directDamage: 0,
      healUnit: -3,
      addGrowthCounters: -3,
      damageLand: 0,
      damageOpponent: 1,
      drawCards: 3,
      bounceUnit: 3,
      mezz: 3,
      daze: 3,
      forceMoveUnit: 3,
      cycleCards: 3,
      fight: -3,
      tutorCard: 2,
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
      ...defaultKeywordPreferences,
      ranged: 3,
      armor: 3,
      flying: 1,
      immobile: 2,
      armorPiercing: 0,
    },
    actionPreferences: {
      ...defaultActionPreferences,
      destroyUnit: 3,
      fortifyLand: 3,
      directDamage: -3,
      healUnit: -3,
      addGrowthCounters: -3,
      damageLand: 0,
      reanimate: 3,
      damageOpponent: 0,
      addDecayCounters: 3,
      tutorCard: 2,
      regrowCard: 2,
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
