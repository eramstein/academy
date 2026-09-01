import { isUnitCard, type CardTemplate } from "@/lib/_model";
import { gs } from "@/lib/_state";
import { cardBudget, featureCosts } from "../cards/card-budget";
import { colorPie, getCardDominantColor } from "../cards/color-pie";
import { getRandomFromObjectWeights } from "@/lib/_utils/random";
import { addKeyword } from "../cards/keywords";

export interface AugmentParameters {
  cardId: string;
}

export function augment(parameters: AugmentParameters): string {
  const card = gs.player.collection.find((card) => card.id === parameters.cardId);
  if (!card) {
    return `Card not found: ${parameters.cardId}.`;
  }
  if (card.cost >= 9) {
    return `Card is already at max cost: ${card.cost}.`;
  }

  card.cost++;
  let budget = cardBudget[card.cost] - cardBudget[card.cost - 1];
  const upgrades: Record<string, number> = {};

  if (isUnitCard(card)) {
    const costs: Record<string, number> = {
      power: featureCosts.power(card),
      hp: featureCosts.hp(card),
      ret: featureCosts.ret(card),
    };

    while (budget > 0) {
      const upgradePreference = getUpgradePreference(card, costs, budget);
      if (upgradePreference === '') {
        break;
      }
      budget -= costs[upgradePreference];
      upgrades[upgradePreference] = (upgrades[upgradePreference] ?? 0) + 1;
      switch (upgradePreference) {
        case 'power':
          card.power++;
          break;
        case 'hp':
          card.maxHealth++;
          break;
        case 'ret':
          addKeyword(card, 'retaliate', 1);
          break;
      }
    }
  }

  const summary = formatUpgradeSummary(upgrades);
  return summary
    ? `You augmented ${card.name}: ${summary}.`
    : `You augmented ${card.name}.`;
}

const upgradeLabels: Record<string, string> = {
  power: 'power',
  hp: 'health',
  ret: 'retaliate',
};

function formatUpgradeSummary(upgrades: Record<string, number>): string {
  return Object.entries(upgrades)
    .map(([key, amount]) => `+${amount} ${upgradeLabels[key] ?? key}`)
    .join(', ');
}

function getUpgradePreference(card: CardTemplate, costs: Record<string, number>, budget: number): string {
  const preferences = Object.fromEntries(
    Object.entries(colorPie[getCardDominantColor(card)].statsPreference).filter(
      ([key]) => costs[key] <= budget
    )
  );
  if (Object.keys(preferences).length === 0) {
    return '';
  }
  return getRandomFromObjectWeights(preferences);
}