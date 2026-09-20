import conjurationTemplatesData from "@/data/sim/conjuration_templates.json";
import {
  CardColor,
  CardType,
  UnitType,
  isSpellCard,
  isUnitCard,
  type CardTemplate,
  type UnitKeywords,
} from "@/lib/_model";
import { getActionTemplateNameForEffect } from "./action-templates";

export interface FlavorTemplate {
  name: string;
  imageName: string;
  cardType: CardType;
  cost: number;
  colors: CardColor[];
  keywords: (keyof UnitKeywords)[];
  unitTypes?: UnitType[];
  /** Action template keys present on the source card (spells + unit/land abilities). */
  actions?: string[];
}

const conjurationTemplates = conjurationTemplatesData as FlavorTemplate[];

export function loadFlavorTemplates(): FlavorTemplate[] {
  return conjurationTemplates;
}

export function extractConjurationFromCardTemplate(cardTemplates: CardTemplate[]): FlavorTemplate[] {
  return cardTemplates.map((card) => {
    const actions = extractActionTemplateKeys(card);
    return {
      name: card.name,
      imageName: card.imageFileName ?? card.id,
      cardType: card.type,
      cost: card.cost,
      colors: card.colors.map((color) => color.color),
      keywords:
        isUnitCard(card) && card.keywords
          ? (Object.keys(card.keywords) as (keyof UnitKeywords)[])
          : [],
      ...(isUnitCard(card) && card.unitTypes?.length ? { unitTypes: card.unitTypes } : {}),
      ...(actions.length ? { actions } : {}),
    };
  });
}

function extractActionTemplateKeys(card: CardTemplate): string[] {
  const keys = new Set<string>();
  const walk = (actions?: { effect: { name: string } }[]) => {
    if (!actions) return;
    for (const action of actions) {
      const name = getActionTemplateNameForEffect(action.effect.name);
      if (name) keys.add(name);
    }
  };

  if (isSpellCard(card)) {
    walk(card.actions);
  } else if ('abilities' in card && card.abilities) {
    for (const ability of card.abilities) {
      walk(ability.actions);
    }
  }
  return [...keys];
}
