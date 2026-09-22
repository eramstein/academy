import cardFlavorTemplatesData from '@/data/sim/card_flavor_templates.json';
import {
  isSpellCard,
  isUnitCard,
  type CardTemplate,
  type UnitKeywords,
} from '@/lib/_model';
import { getActionTemplateNameForEffect } from './action-templates';
import {
  costToPowerLevel,
  type FlavorTemplate,
} from './flavor-generation-pipeline/types';

export type { FlavorTemplate } from './flavor-generation-pipeline/types';

const flavorTemplates: FlavorTemplate[] = [
  ...(cardFlavorTemplatesData as FlavorTemplate[]),
];

export function loadFlavorTemplates(): FlavorTemplate[] {
  return flavorTemplates;
}

/** Keep the in-memory catalog in sync after DEV generation (before HMR reload). */
export function registerFlavorTemplate(flavor: FlavorTemplate): void {
  const index = flavorTemplates.findIndex((row) => row.imageName === flavor.imageName);
  if (index >= 0) {
    flavorTemplates[index] = flavor;
  } else {
    flavorTemplates.push(flavor);
  }
}

export function extractConjurationFromCardTemplate(cardTemplates: CardTemplate[]): FlavorTemplate[] {
  return cardTemplates.map((card) => {
    const actions = extractActionTemplateKeys(card);
    return {
      name: card.name,
      imageName: card.imageFileName ?? card.id,
      imagePrompt: card.name,
      cardType: card.type,
      unitSize: costToPowerLevel(card.cost),
      cheapImage: false,
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
