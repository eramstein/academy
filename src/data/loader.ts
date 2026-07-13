import {
  CardType,
  type CardTemplate,
  type LandTemplate,
  type UnitCardTemplate,
} from '@/lib/_model';
import { getRandomFromArray } from '@/lib/_utils/random';
import allCards from './_all_cards.json';

// Load all cards from the _all_cards.json file
export const cards: Record<string, CardTemplate> = {};
export const lands: Record<string, LandTemplate> = {};

// Function to load game data - this will be called when the game starts
export async function loadGameData() {
  console.log('loadGameData');

  // Load all cards from _all_cards.json
  for (const card of allCards) {
    if (card.type === CardType.Land) {
      lands[card.id] = card as LandTemplate;
    } else {
      cards[card.id] = card as CardTemplate;
    }
  }
}

// Returns a random unit card from the full catalog in _all_cards.json
export function getRandomUnitCardFromAll(manaCost?: number): UnitCardTemplate {
  return getRandomFromArray(
    allCards.filter(
      (card) => card.type === CardType.Unit && (manaCost ? card.cost === manaCost : true)
    ) as UnitCardTemplate[]
  );
}
