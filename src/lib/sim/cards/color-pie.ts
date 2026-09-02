import { CardColor, UnitType, type CardTemplate } from "@/lib/_model";
import { getRandomFromArray } from "@/lib/_utils/random";

export interface ColorPie {
  statsPreference: Record<string, number>;
  unitTypes: UnitType[];
}

export const colorPie: Record<CardColor, ColorPie> = {
  [CardColor.Red]: {
    statsPreference: {
      power: 3,
      hp: 1,
      ret: 1,
    },
    unitTypes: [UnitType.Dwarf, UnitType.Dragon],
  },
  [CardColor.Green]: {
    statsPreference: {
      power: 1,
      hp: 1,
      ret: 0,
    },
    unitTypes: [UnitType.Mushroom, UnitType.Plant],
  },
  [CardColor.Blue]: {
    statsPreference: {
      power: 1,
      hp: 1,
      ret: 1,
    },
    unitTypes: [UnitType.Construct],
  },
  [CardColor.Black]: {
    statsPreference: {
      power: 1,
      hp: 3,
      ret: 2,
    },
    unitTypes: [UnitType.Demon, UnitType.Construct],
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