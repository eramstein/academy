import conjurationTemplatesData from "@/data/sim/conjuration_templates.json";
import { CardColor, CardType, isUnitCard, type CardTemplate, type UnitKeywords } from "@/lib/_model";

export interface ConjurationTemplate {
  name: string;
  imageName: string;
  cardType: CardType; 
  cost: number;
  colors: CardColor[];
  keywords: (keyof UnitKeywords)[];
}

const conjurationTemplates = conjurationTemplatesData as ConjurationTemplate[];

export function loadConjurationTemplates(): ConjurationTemplate[] {
  return conjurationTemplates;
}

export function extractConjurationFromCardTemplate(cardTemplates: CardTemplate[]): ConjurationTemplate[] {
  return cardTemplates.map(card => ({
    name: card.name,
    imageName: card.imageFileName ?? card.id,
    cardType: card.type,
    cost: card.cost,
    colors: card.colors.map(color => color.color),
    keywords: isUnitCard(card) && card.keywords
      ? (Object.keys(card.keywords) as (keyof UnitKeywords)[])
      : [],
  }));
}