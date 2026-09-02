import { CardColor, type UnitCardTemplate, type UnitKeywords, type UnitType } from "@/lib/_model";
import { gs } from "@/lib/_state";
import { loadConjurationTemplates } from "../cards/conjuration-templates";
import { filterConjurationTemplates } from "../cards/conjuration-filters";
import { conjureUnitCard } from "../cards/conjuration";
import { getCardBudget, getCostFromBudget } from "../cards/card-budget";
import { getRandomFromArray } from "@/lib/_utils/random";

export interface ConjurationParameters {
  colors?: CardColor[];
  cost?: number;
  power?: number;
  hp?: number;
  keywords?: UnitKeywords;
  unitTypes?: UnitType[];
}

export function conjureUnit(parameters: ConjurationParameters): string {
  const template = getUnitTemplate(parameters);
  gs.player.collection.push(template);
  return `You conjured ${template.name}`;
}

function getUnitTemplate(parameters: ConjurationParameters): UnitCardTemplate {
  const conjurationTemplates = loadConjurationTemplates();

  // 1. create card template based on parameters (randomize rest)
  const conjuredBase = conjureUnitCard(parameters);
  // 2. get budget for card
  const budget = getCardBudget(conjuredBase);
  // 3. define mana cost based on budget
  const { cost, colors, extraHealth } = getCostFromBudget(
    budget,
    conjuredBase.colors.map((entry) => entry.color)
  );
  
  const conjured: Omit<UnitCardTemplate, "id" | "name" | "imageFileName"> = {
    ...conjuredBase,
    cost,
    colors,
    maxHealth: conjuredBase.maxHealth + extraHealth,
  };
  const templateParameters = {
    ...parameters,
    colors: colors.map((entry) => entry.color),
    cost,
  }

  // 4. pick template  
  const filteredTemplates = filterConjurationTemplates(conjurationTemplates, templateParameters);
  const template = getRandomFromArray(filteredTemplates);

  return {
    ...conjured,
    id: template.name + crypto.randomUUID(),
    imageFileName: template.imageName,
    name: template.name,    
  };
}
