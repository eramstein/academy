import { CardColor, CardType, type Deck } from '@/lib/_model';

const lion = {
  id: 'lion',
  name: 'Lion',
  imageFileName: 'lion',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 2,
  maxHealth: 2,
};

const bear_minimum = {
  id: 'bear_minimum',
  name: 'Bear Minimum',
  imageFileName: 'bear_minimum',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 3,
  maxHealth: 3,
};

const boring_boar = {
  id: 'boring_boar',
  name: 'Boring Boar',
  imageFileName: 'boring_boar',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 4,
  maxHealth: 3,
};

const ferocious_badger = {
  id: 'ferocious_badger',
  name: 'Ferocious Badger',
  imageFileName: 'ferocious_badger',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 4,
  maxHealth: 5,
};

const wolf = {
  id: 'wolf',
  name: 'Wolf',
  imageFileName: 'wolf',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 5,
  maxHealth: 5,
};

const deer = {
  id: 'deer',
  name: 'Deer',
  imageFileName: 'deer',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 5,
  maxHealth: 7,
};

const bison = {
  id: 'bison',
  name: 'Bison',
  imageFileName: 'bison',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 6,
  maxHealth: 7,
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
  cards: [
    lion,
    bear_minimum,
    boring_boar,
    ferocious_badger,
    wolf,
    deer,
    bison,
    lion,
    bear_minimum,
    boring_boar,
    ferocious_badger,
    wolf,
    deer,
    bison,
  ],
  lands: [island, mountain, forest, city],
};

export const BASE_DECK2: Deck = {
  key: 'base',
  name: 'Base',
  cards: [
    lion,
    bear_minimum,
    boring_boar,
    ferocious_badger,
    wolf,
    deer,
    bison,
    lion,
    bear_minimum,
    boring_boar,
    ferocious_badger,
    wolf,
    deer,
    bison,
  ],
  lands: [island, mountain, forest, city],
};
