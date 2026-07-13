export interface Color {
  color: string;
  count: number;
}

export interface Card {
  id: string;
  name: string;
  rarity: string;
  type: string;
  cost: number;
  colors: Color[];
  power?: number;
  maxHealth?: number;
  unitTypes?: string[];
  keywords?: Record<string, any>;
  actions?: any[];
  abilities?: any[];
}

export interface Filters {
  cardType?: string;
  colorCombination?: string;
  cost?: number;
}
