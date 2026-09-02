import { CardColor, CardType, UnitType, type UnitCardTemplate, type UnitKeywords } from "@/lib/_model";
import { getRandomFromArray, getRandomInteger } from "@/lib/_utils/random";
import type { ConjurationParameters } from "../actions";
import { colorPie } from "./color-pie";

type UnitIdentityKeys = "id" | "cost" | "name" | "imageFileName";
export type PartialConjuredUnit = Omit<UnitCardTemplate, UnitIdentityKeys>;

export function conjureUnitCard(parameters: ConjurationParameters): PartialConjuredUnit {
  const card = getRandomUnitCardTemplate(parameters.colors);
  if (parameters.keywords) {
    card.keywords = parameters.keywords;
  }
  if (parameters.unitTypes) {
    card.unitTypes = parameters.unitTypes;
  }
  if (parameters.power !== undefined) {
    card.power = parameters.power;
  }
  if (parameters.hp !== undefined) {
    card.maxHealth = parameters.hp;
  }
  return card;
}

const NUMERIC_KEYWORDS = new Set<keyof UnitKeywords>([
  "retaliate",
  "armor",
  "resist",
  "poisonous",
  "regeneration",
]);

const KEYWORD_KEYS: (keyof UnitKeywords)[] = [
  "ranged",
  "haste",
  "moveAndAttack",
  "retaliate",
  "armor",
  "resist",
  "poisonous",
  "regeneration",
  "trample",
  "zerk",
  "cleave",
  "lance",
  "flying",
  "immobile",
  "armorPiercing",
];

function getRandomUnitCardTemplate(colors?: CardColor[]): PartialConjuredUnit {
  const cardColors = colors?.length
    ? colors.map((color) => ({ color, count: 1 }))
    : [{ color: getRandomFromArray(Object.values(CardColor)), count: 1 }];
  return {
    type: CardType.Unit,
    colors: cardColors,
    power: getRandomInteger(0, 8),
    maxHealth: getRandomInteger(1, 9),
    keywords: randomKeywords(),
    unitTypes: randomUnitTypes(cardColors.map((entry) => entry.color)),
  };
}

function randomUnitTypes(colors: CardColor[]): UnitType[] {
  return [getRandomFromArray(allowedUnitTypesForColors(colors))];
}

function allowedUnitTypesForColors(colors: CardColor[]): UnitType[] {
  const restrictedTypes = new Set(Object.values(colorPie).flatMap((pie) => pie.unitTypes));
  const typesForCardColors = new Set(colors.flatMap((color) => colorPie[color].unitTypes));
  return Object.values(UnitType).filter(
    (unitType) => !restrictedTypes.has(unitType) || typesForCardColors.has(unitType)
  );
}

function randomKeywords(): UnitKeywords {
  const keywords: UnitKeywords = {};
  const key = getRandomFromArray(KEYWORD_KEYS);
  if (NUMERIC_KEYWORDS.has(key)) {
    (keywords[key] as number) = getRandomInteger(1, 3);
  } else {
    (keywords[key] as boolean) = true;
  }
  return keywords;
}
