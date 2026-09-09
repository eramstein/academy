import { CardColor, CardType, type CardTemplate } from '@/lib/_model';

export type CardFilterState = {
  color: CardColor | null;
  cost: number | null;
  type: CardType | null;
};

export function matchesCardFilters(card: CardTemplate, filters: CardFilterState): boolean {
  if (filters.color && !card.colors.some((c) => c.color === filters.color)) return false;
  if (filters.cost !== null && card.cost !== filters.cost) return false;
  if (filters.type && card.type !== filters.type) return false;
  return true;
}

export function hasActiveCardFilters(filters: CardFilterState): boolean {
  return filters.color !== null || filters.cost !== null || filters.type !== null;
}
