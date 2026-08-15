import { CardColor, CardType, type Deck } from '@/lib/_model';

// GREEN BASE CARDS
// ---------------------------------------------------------

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

// RED BASE CARDS
// ---------------------------------------------------------

const young_viking = {
  id: 'young_viking',
  name: 'Young Viking',
  imageFileName: 'young_viking',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 2,
  maxHealth: 2,
};

const rock_elemental = {
  id: 'rock_elemental',
  name: 'Rock Elemental',
  imageFileName: 'rock_elemental',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 3,
  maxHealth: 3,
};

const northern_challenger = {
  id: 'northern_challenger',
  name: 'Northern Challenger',
  imageFileName: 'northern_challenger',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 5,
  maxHealth: 1,
};

const dwarf_berserker = {
  id: 'dwarf_berserker',
  name: 'Dwarf Berserker',
  imageFileName: 'dwarf_berserker',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 5,
  maxHealth: 3,
};

const modis_chosen = {
  id: 'modis_chosen',
  name: 'Modis Chosen',
  imageFileName: 'modis_chosen',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 6,
  maxHealth: 3,
};

const frenzied_shaman = {
  id: 'frenzied_shaman',
  name: 'Frenzied Shaman',
  imageFileName: 'frenzied_shaman',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 6,
  maxHealth: 5,
};

const mountain_giant = {
  id: 'mountain_giant',
  name: 'Mountain Giant',
  imageFileName: 'mountain_giant',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 7,
  maxHealth: 5,
};

// BLACK BASE CARDS
// ---------------------------------------------------------

const sewer_rat = {
  id: 'sewer_rat',
  name: 'Sewer Rat',
  imageFileName: 'sewer_rat',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 1,
  maxHealth: 4,
};

const zombie = {
  id: 'zombie',
  name: 'Zombie',
  imageFileName: 'zombie',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 2,
  maxHealth: 5,
};

const grim_guard = {
  id: 'grim_guard',
  name: 'Grim Guard',
  imageFileName: 'grim_guard',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 3,
  maxHealth: 5,
};

const iron_golem = {
  id: 'iron_golem',
  name: 'Iron Golem',
  imageFileName: 'iron_golem',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 3,
  maxHealth: 7,
};

const royal_halberdier = {
  id: 'royal_halberdier',
  name: 'Royal Halberdier',
  imageFileName: 'royal_halberdier',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 4,
  maxHealth: 7,
};

const vigilant_knight = {
  id: 'vigilant_knight',
  name: 'Vigilant Knight',
  imageFileName: 'vigilant_knight',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 4,
  maxHealth: 9,
};

const expensive_mercenary = {
  id: 'expensive_mercenary',
  name: 'Expensive Mercenary',
  imageFileName: 'franz',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 5,
  maxHealth: 9,
};

// BASIC LANDS
// ---------------------------------------------------------

const island = {
  id: 'island',
  name: 'Island',
  imageFileName: 'island',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Blue, count: 1 }],
  health: 10,
};

const mountain = {
  id: 'mountain',
  name: 'Mountain',
  imageFileName: 'mountain',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Red, count: 1 }],
  health: 10,
};

const forest = {
  id: 'forest',
  name: 'Forest',
  imageFileName: 'forest',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Green, count: 1 }],
  health: 10,
};

const city = {
  id: 'city',
  name: 'City',
  imageFileName: 'city',
  type: CardType.Land,
  cost: 0,
  colors: [{ color: CardColor.Black, count: 1 }],
  health: 10,
};

export const BASE_DECK_GREEN: Deck = {
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
  lands: [forest, forest, forest, forest],
};

export const BASE_DECK_RED: Deck = {
  key: 'base',
  name: 'Base',
  cards: [
    young_viking,
    rock_elemental,
    northern_challenger,
    ferocious_badger,
    dwarf_berserker,
    modis_chosen,
    frenzied_shaman,
    mountain_giant,
    young_viking,
    rock_elemental,
    northern_challenger,
    ferocious_badger,
    dwarf_berserker,
    modis_chosen,
    frenzied_shaman,
    mountain_giant,
  ],
  lands: [mountain, mountain, mountain, mountain],
};

export const BASE_DECK_BLACK: Deck = {
  key: 'base',
  name: 'Base',
  cards: [
    sewer_rat,
    zombie,
    grim_guard,
    iron_golem,
    royal_halberdier,
    vigilant_knight,
    expensive_mercenary,
    sewer_rat,
    zombie,
    grim_guard,
    iron_golem,
    royal_halberdier,
    vigilant_knight,
    expensive_mercenary,
  ],
  lands: [city, city, city, city],
};
