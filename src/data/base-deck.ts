import { CardColor, CardType, type Deck } from '@/lib/_model';

const lion = {
  id: 'lion',
  name: 'Lion',
  imageFileName: 'lion',
  type: CardType.Unit,
  cost: 1,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 1,
  maxHealth: 1,
};

const island = {
  id: 'island',
  name: 'Island',
  imageFileName: 'island',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Blue, count: 1 }],
  health: 1,
};

const mountain = {
  id: 'mountain',
  name: 'Mountain',
  imageFileName: 'mountain',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Red, count: 1 }],
  health: 1,
};

const forest = {
  id: 'forest',
  name: 'Forest',
  imageFileName: 'forest',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Green, count: 1 }],
  health: 1,
};

const city = {
  id: 'city',
  name: 'City',
  imageFileName: 'city',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Black, count: 1 }],
  health: 1,
};

export const BASE_DECK: Deck = {
  key: 'base',
  name: 'Base',
  cards: [lion, lion, lion, lion, lion, lion, lion, lion, lion, lion, lion],
  lands: [island, mountain, forest, city],
};

export const BASE_DECK2: Deck = {
  key: 'base',
  name: 'Base',
  cards: [lion, lion, lion, lion, lion, lion, lion, lion, lion, lion, lion],
  lands: [island, mountain, forest, city],
};
