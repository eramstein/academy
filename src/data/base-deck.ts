import {
  AiTurnGoal,
  CardColor,
  CardType,
  TargetType,
  UnitType,
  type Deck,
  type UnitCardTemplate,
} from '@/lib/_model';

// GREEN BASE CARDS
// ---------------------------------------------------------

const lion: UnitCardTemplate = {
  id: 'lion',
  name: 'Lion',
  imageFileName: 'lion',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 2,
  maxHealth: 2,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const not_so_little_pig = {
  id: 'not_so_little_pig',
  name: 'Not So Little Pig',
  imageFileName: 'not_so_little_pig',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 2 }],
  power: 2,
  maxHealth: 4,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
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
  retaliate: 0,
  unitTypes: [UnitType.Beast],
};

const hungry_wolf = {
  id: 'hungry_wolf',
  name: 'Wall of Brambles',
  imageFileName: 'hungry_wolf',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Green, count: 2 }],
  power: 3,
  maxHealth: 3,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const jumping_hare = {
  id: 'jumping_hare',
  name: 'Jaumping Hare',
  imageFileName: 'jumping_hare',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 2,
  maxHealth: 5,
  retaliate: 0,
  unitTypes: [UnitType.Beast],
};

const boring_boar = {
  id: 'boring_boar',
  name: 'Boring Boar',
  imageFileName: 'boring_boar',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 3,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Beast],
};

const pandy_panda = {
  id: 'pandy_panda',
  name: 'Pandy Panda',
  imageFileName: 'pandy_panda',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Green, count: 3 }],
  power: 3,
  maxHealth: 6,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
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
  retaliate: 0,
  unitTypes: [UnitType.Beast],
};

const unicorn = {
  id: 'unicorn',
  name: 'Unicorn',
  imageFileName: 'unicorn',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Green, count: 4 }],
  power: 5,
  maxHealth: 5,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const the_beast = {
  id: 'the_beast',
  name: 'The Beast',
  imageFileName: 'the_beast',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Green, count: 6 }],
  power: 5,
  maxHealth: 6,
  retaliate: 6,
  unitTypes: [UnitType.Beast],
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
  retaliate: 0,
  unitTypes: [UnitType.Beast],
};

const bison = {
  id: 'bison',
  name: 'Bison',
  imageFileName: 'bison',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 5,
  maxHealth: 6,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
  keywords: {
    trample: true,
  },
};

const giant_growth = {
  id: 'giant_growth',
  name: 'Giant Growth',
  imageFileName: 'giant_growth',
  type: CardType.Spell,
  cost: 4,
  colors: [{ color: CardColor.Green, count: 2 }],
  actions: [
    {
      effect: {
        name: 'addCounters',
        args: {
          counterType: 'growth',
          counterValue: 1,
        },
      },
      targets: [
        {
          type: TargetType.Units,
          count: 1,
        },
      ],
    },
  ],
};

const healing_salve = {
  id: 'healing_salve',
  name: 'Healing Salve',
  imageFileName: 'healing_salve',
  type: CardType.Spell,
  cost: 1,
  colors: [{ color: CardColor.Green, count: 2 }],
  actions: [
    {
      effect: {
        name: 'healUnit',
        args: { health: 3 },
      },
      targets: [{ type: TargetType.Units, count: 1 }],
    },
  ],
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
  retaliate: 1,
  unitTypes: [UnitType.Human],
};

const enraged_goblin = {
  id: 'enraged_goblin',
  name: 'Enraged Goblin',
  imageFileName: 'enraged_goblin',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Red, count: 2 }],
  power: 3,
  maxHealth: 2,
  retaliate: 1,
  unitTypes: [UnitType.Monster],
};

const dwarf_berserker = {
  id: 'dwarf_berserker',
  name: 'Dwarf Berserker',
  imageFileName: 'dwarf_berserker',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 4,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Dwarf],
};

const lunging_cougar = {
  id: 'lunging_cougar',
  name: 'Lunging Cougar',
  imageFileName: 'lunging_cougar',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 2 }],
  power: 2,
  maxHealth: 2,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
  keywords: {
    haste: true,
  },
};

const angry_lizard = {
  id: 'angry_lizard',
  name: 'Angry Lizard',
  imageFileName: 'angry_lizard',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 3,
  maxHealth: 3,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const northern_challenger = {
  id: 'northern_challenger',
  name: 'Northern Challenger',
  imageFileName: 'northern_challenger',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 3,
  maxHealth: 5,
  retaliate: 0,
  unitTypes: [UnitType.Human],
};

const ogre_brawler = {
  id: 'ogre_brawler',
  name: 'Ogre Brawler',
  imageFileName: 'ogre_brawler',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Red, count: 3 }],
  power: 4,
  maxHealth: 4,
  retaliate: 1,
  unitTypes: [UnitType.Monster],
};

const rock_elemental = {
  id: 'rock_elemental',
  name: 'Rock Elemental',
  imageFileName: 'rock_elemental',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 4,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Elemental],
};

const hill_troll = {
  id: 'hill_troll',
  name: 'Hill Troll',
  imageFileName: 'hill_troll',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Red, count: 2 }],
  power: 3,
  maxHealth: 5,
  retaliate: 3,
  unitTypes: [UnitType.Monster],
};

const modis_chosen = {
  id: 'modis_chosen',
  name: 'Modis Chosen',
  imageFileName: 'modis_chosen',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 5,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Dwarf],
};

const frenzied_shaman = {
  id: 'frenzied_shaman',
  name: 'Frenzied Shaman',
  imageFileName: 'frenzied_shaman',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 5,
  maxHealth: 6,
  retaliate: 2,
  unitTypes: [UnitType.Human],
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
  retaliate: 0,
  unitTypes: [UnitType.Monster],
};

const lightning_bolt = {
  id: 'lightning_bolt',
  name: 'Lightning Bolt',
  imageFileName: 'lightning_bolt',
  type: CardType.Spell,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 2 }],
  actions: [
    {
      effect: {
        name: 'damageUnit',
        args: {
          damage: 3,
        },
      },
      targets: [
        {
          type: TargetType.Units,
          count: 1,
        },
      ],
    },
  ],
  aiHints: [AiTurnGoal.RemoveUnit],
};

const rock_drop = {
  id: 'rock_drop',
  name: 'Rock Drop',
  imageFileName: 'rock_drop',
  type: CardType.Spell,
  cost: 2,
  colors: [{ color: CardColor.Red, count: 2 }],
  actions: [
    {
      effect: {
        name: 'damageLand',
        args: {
          damage: 2,
        },
      },
      targets: [
        {
          type: TargetType.Land,
          count: 1,
        },
      ],
    },
  ],
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
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const expendable_recruit = {
  id: 'expendable_recruit',
  name: 'Expendable Recruit',
  imageFileName: 'expendable_recruit',
  type: CardType.Unit,
  cost: 1,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 0,
  maxHealth: 4,
  retaliate: 0,
  unitTypes: [UnitType.Human],
};

const zombie = {
  id: 'zombie',
  name: 'Zombie',
  imageFileName: 'zombie',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 2,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Undead],
};

const market_beggar = {
  id: 'market_beggar',
  name: 'Market Beggar',
  imageFileName: 'market_beggar',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 2 }],
  power: 1,
  maxHealth: 6,
  retaliate: 3,
  unitTypes: [UnitType.Human],
};

const gate_keepers = {
  id: 'gate_keepers',
  name: 'Gatekeepers',
  imageFileName: 'gate_keepers',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 0,
  maxHealth: 10,
  retaliate: 3,
  unitTypes: [UnitType.Human],
  keywords: {
    immobile: true,
  },
};

const grim_guard = {
  id: 'grim_guard',
  name: 'Grim Guard',
  imageFileName: 'grim_guard',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 2,
  maxHealth: 6,
  retaliate: 2,
};

const street_slinger = {
  id: 'street_slinger',
  name: 'Street Slinger',
  imageFileName: 'street_slinger',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Black, count: 2 }],
  power: 3,
  maxHealth: 4,
  retaliate: 0,
  unitTypes: [UnitType.Human],
  keywords: {
    ranged: true,
  },
};

const iron_golem = {
  id: 'iron_golem',
  name: 'Iron Golem',
  imageFileName: 'iron_golem',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 3,
  maxHealth: 6,
  retaliate: 2,
};

const elite_crossbowmen = {
  id: 'elite_crossbowmen',
  name: 'Elite Crossbowmen',
  imageFileName: 'elite_crossbowmen',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Black, count: 3 }],
  power: 2,
  maxHealth: 8,
  retaliate: 2,
  unitTypes: [UnitType.Human],
  keywords: {
    ranged: true,
  },
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
  retaliate: 0,
};

const vigilant_knight = {
  id: 'vigilant_knight',
  name: 'Vigilant Knight',
  imageFileName: 'vigilant_knight',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 4,
  maxHealth: 7,
  retaliate: 4,
};

const big_bertha = {
  id: 'big_bertha',
  name: 'Big Bertha',
  imageFileName: 'big_bertha',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Black, count: 4 }],
  power: 5,
  maxHealth: 9,
  retaliate: 3,
  unitTypes: [UnitType.Human, UnitType.Monster],
  keywords: {
    ranged: true,
  },
};

const execution = {
  id: 'execution',
  name: 'Execution',
  imageFileName: 'execution',
  type: CardType.Spell,
  cost: 6,
  colors: [{ color: CardColor.Black, count: 2 }],
  actions: [
    {
      effect: {
        name: 'destroyUnit',
        args: {},
      },
      targets: [
        {
          type: TargetType.Units,
          count: 1,
        },
      ],
    },
  ],
  aiHints: [AiTurnGoal.RemoveUnit],
};

const fortify = {
  id: 'fortify',
  name: 'Fortify',
  imageFileName: 'fortify',
  type: CardType.Spell,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 2 }],
  actions: [
    {
      effect: {
        name: 'fortifyLand',
        args: {
          amount: 8,
        },
      },
      targets: [
        {
          type: TargetType.Land,
          count: 1,
        },
      ],
    },
  ],
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

const plains = {
  id: 'plains',
  name: 'Plains',
  imageFileName: 'plains',
  type: CardType.Land,
  cost: 0,
  colors: [],
  health: 10,
  abilities: [
    {
      trigger: {
        type: 'Activated',
      },
      actions: [
        {
          effect: {
            name: 'damagePlayer',
            args: {
              damage: -1,
              opposingPlayer: false,
            },
          },
        },
      ],
      cost: 0,
      exhausts: true,
    },
  ],
};

const market = {
  id: 'market',
  name: 'Market',
  imageFileName: 'market',
  type: CardType.Land,
  cost: 0,
  colors: [],
  health: 10,
  abilities: [
    {
      trigger: {
        type: 'Activated',
      },
      actions: [
        {
          effect: {
            name: 'drawCard',
            args: {
              count: 1,
            },
          },
        },
      ],
      cost: 1,
      exhausts: true,
    },
  ],
};

const enchanter_lair = {
  id: 'enchanter_lair',
  name: 'Enchanter Lair',
  imageFileName: 'enchanter_lair',
  type: CardType.Land,
  cost: 0,
  colors: [],
  health: 10,
  abilities: [
    {
      trigger: {
        type: 'Activated',
      },
      actions: [
        {
          effect: {
            name: 'damageUnit',
            args: {
              damage: 1,
            },
          },
          targets: [
            {
              type: TargetType.Units,
              count: 1,
            },
          ],
        },
      ],
      cost: 3,
      exhausts: true,
    },
  ],
  aiHints: [AiTurnGoal.RemoveUnit],
};

export const BASE_DECK_GREEN: Deck = {
  key: 'base',
  name: 'Base Green',
  cards: [
    lion,
    bear_minimum,
    boring_boar,
    ferocious_badger,
    jumping_hare,
    healing_salve,
    not_so_little_pig,
    hungry_wolf,
    pandy_panda,
    unicorn,
    the_beast,
    deer,
    bison,
    giant_growth,
  ],
  lands: [forest, plains, market, enchanter_lair],
};

export const BASE_DECK_RED: Deck = {
  key: 'base',
  name: 'Base Red',
  cards: [
    young_viking,
    rock_elemental,
    northern_challenger,
    dwarf_berserker,
    modis_chosen,
    frenzied_shaman,
    mountain_giant,
    lightning_bolt,
    rock_drop,
    lunging_cougar,
    angry_lizard,
    ogre_brawler,
    hill_troll,
    enraged_goblin,
  ],
  lands: [mountain, plains, market, enchanter_lair],
};

export const BASE_DECK_BLACK: Deck = {
  key: 'base',
  name: 'Base Black',
  cards: [
    sewer_rat,
    zombie,
    grim_guard,
    iron_golem,
    royal_halberdier,
    vigilant_knight,
    big_bertha,
    execution,
    gate_keepers,
    elite_crossbowmen,
    fortify,
    market_beggar,
    street_slinger,
    expendable_recruit,
  ],
  lands: [city, plains, market, enchanter_lair],
};
