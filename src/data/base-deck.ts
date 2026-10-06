import {
  CardColor,
  CardType,
  StatusType,
  TargetType,
  TriggerType,
  UnitType,
  type DeckBlueprint,
  type UnitCardTemplate,
} from '@/lib/_model';

// GREEN BASE CARDS
// ---------------------------------------------------------

const shroomy: UnitCardTemplate = {
  id: 'shroomy',
  name: 'Shroomy',
  imageFileName: 'shroomy',
  type: CardType.Unit,
  cost: 1,
  colors: [{ color: CardColor.Green, count: 3 }],
  power: 1,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Beast],
  abilities: [
    {
      actions: [
        {
          effect: {
            name: 'addCounters',
            args: {
              counterType: 'growth',
              counterValue: 1,
            },
          },
        },
      ],
      trigger: {
        type: TriggerType.OnTurnStart,
        range: {
          self: true,
        },
      },
    },
  ],
};

const savannah_lion: UnitCardTemplate = {
  id: 'savannah_lion',
  name: 'Savannah Lion',
  imageFileName: 'savannah_lion',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 2,
  maxHealth: 2,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const snek: UnitCardTemplate = {
  id: 'snek',
  name: 'Snek',
  imageFileName: 'snek',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 1,
  maxHealth: 2,
  retaliate: 0,
  unitTypes: [UnitType.Beast],
  keywords: {
    poisonous: 1,
  },
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

const young_druidess = {
  id: 'young_druidess',
  name: 'Young Druidess',
  imageFileName: 'young_druidess',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 1 }],
  power: 0,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Halfing],
  abilities: [
    {
      actions: [
        {
          effect: {
            name: 'healUnit',
            args: {
              health: 1,
              range: {
                allies: true,
                adjacent: true,
              },
            },
          },
        },
      ],
      trigger: {
        type: 'After Moving',
        range: {
          self: true,
        },
      },
    },
  ],
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

const vigorous_entling: UnitCardTemplate = {
  id: 'vigorous_entling',
  name: 'Vigorous Entling',
  imageFileName: 'vigorous_entling',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Green, count: 3 }],
  power: 2,
  maxHealth: 5,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
  keywords: {
    regeneration: 3,
  },
};

const pack_of_wolves = {
  id: 'pack_of_wolves',
  name: 'Pack of Wolves',
  imageFileName: 'pack_of_wolves',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Green, count: 2 }],
  power: 3,
  maxHealth: 3,
  retaliate: 1,
  unitTypes: [UnitType.Beast],
};

const halfling_sentinel = {
  id: 'halfling_sentinel',
  name: 'Halfling Sentinel',
  imageFileName: 'halfling_sentinel',
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

const retired_soldier = {
  id: 'retired_soldier',
  name: 'Retired Soldier',
  imageFileName: 'retired_soldier',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Green, count: 4 }],
  power: 5,
  maxHealth: 5,
  retaliate: 1,
  unitTypes: [UnitType.Human],
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

const lazy_elephant = {
  id: 'lazy_elephant',
  name: 'Lazy Elephant',
  imageFileName: 'lazy_elephant',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Green, count: 2 }],
  power: 2,
  maxHealth: 14,
  retaliate: 0,
  unitTypes: [UnitType.Beast],
  keywords: {
    trample: true,
  },
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

const force_of_nature = {
  id: 'force_of_nature',
  name: 'Force of Nature',
  imageFileName: 'force_of_nature',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Green, count: 4 }],
  power: 6,
  maxHealth: 6,
  retaliate: 1,
  unitTypes: [UnitType.Elemental],
  keywords: {
    trample: true,
  },
};

const sudden_growth = {
  id: 'sudden_growth',
  name: 'Sudden Growth',
  imageFileName: 'sudden_growth',
  type: CardType.Spell,
  cost: 4,
  colors: [{ color: CardColor.Green, count: 2 }],
  actions: [
    {
      effect: {
        name: 'addCounters',
        args: {
          counterType: 'growth',
          counterValue: 2,
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

const healing_balm = {
  id: 'healing_balm',
  name: 'Healing Balm',
  imageFileName: 'healing_balm',
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

const regrowth = {
  id: 'regrowth',
  name: 'Regrowth',
  imageFileName: 'regrowth',
  type: CardType.Spell,
  cost: 2,
  colors: [{ color: CardColor.Green, count: 2 }],
  actions: [
    {
      effect: {
        name: 'regrowCard',
        args: {},
      },
      targets: [{ type: TargetType.GraveyardCard, count: 1 }],
    },
  ],
};

// RED BASE CARDS
// ---------------------------------------------------------

const manticore_pup = {
  id: 'manticore_pup',
  name: 'Manticore Pup',
  imageFileName: 'manticore_pup',
  type: CardType.Unit,
  cost: 1,
  colors: [{ color: CardColor.Red, count: 3 }],
  power: 1,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Monster],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeath,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'damageUnit',
            args: {
              damage: 2,
              randomTargets: 1,
              range: {
                ennemies: true,
              },
            },
          },
        },
      ],
    },
  ],
};

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

const salamander = {
  id: 'salamander',
  name: 'Salamander',
  imageFileName: 'salamander',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Red, count: 2 }],
  power: 2,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Beast],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'damageUnit',
            args: {
              damage: 1,
              range: {
                sameRow: true,
                excludeSelf: true,
              },
            },
          },
        },
      ],
    },
  ],
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

const fire_golem = {
  id: 'fire_golem',
  name: 'Fire Golem',
  imageFileName: 'fire_golem',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 1,
  maxHealth: 2,
  retaliate: 0,
  unitTypes: [UnitType.Elemental],
  abilities: [
    {
      trigger: {
        type: TriggerType.AfterMove,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'staticStats',
            args: { power: 1, range: { self: true } },
          },
        },
      ],
    },
  ],
};

const dwarf_pikeman = {
  id: 'dwarf_pikeman',
  name: 'Dwarf Pikeman',
  imageFileName: 'dwarf_pikeman',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 2 }],
  power: 3,
  maxHealth: 2,
  retaliate: 0,
  unitTypes: [UnitType.Dwarf],
  keywords: {
    lance: true,
  },
};

const dwarf_berserker = {
  id: 'dwarf_berserker',
  name: 'Dwarf Berserker',
  imageFileName: 'dwarf_berserker',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 5,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Dwarf],
  keywords: {
    zerk: true,
  },
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

const orc_warrior = {
  id: 'orc_warrior',
  name: 'Orc Warrior',
  imageFileName: 'orc_warrior',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Red, count: 3 }],
  power: 4,
  maxHealth: 4,
  retaliate: 1,
  unitTypes: [UnitType.Monster],
};

const gargoyle = {
  id: 'gargoyle',
  name: 'Gargoyle',
  imageFileName: 'gargoyle',
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

const jarl_bodyguard = {
  id: 'jarl_bodyguard',
  name: 'Jarl Bodyguard',
  imageFileName: 'jarl_bodyguard',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Red, count: 1 }],
  power: 5,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Human],
};

const stone_colossus = {
  id: 'stone_colossus',
  name: 'Stone Colossus',
  imageFileName: 'stone_colossus',
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
  cost: 2,
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
};

const sneaky_raid = {
  id: 'sneaky_raid',
  name: 'Sneaky Raid',
  imageFileName: 'sneaky_raid',
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

const fireball = {
  id: 'fireball',
  name: 'Fireball',
  imageFileName: 'fireball',
  type: CardType.Spell,
  cost: 5,
  colors: [{ color: CardColor.Red, count: 3 }],
  actions: [
    {
      effect: {
        name: 'damageUnit',
        args: {
          damage: 4,
          range: {
            addSelf: true,
            adjacent: true,
          },
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

const earthquake = {
  id: 'earthquake',
  name: 'Earthquake',
  imageFileName: 'earthquake',
  type: CardType.Spell,
  cost: 4,
  colors: [{ color: CardColor.Red, count: 3 }],
  actions: [
    {
      effect: {
        name: 'damageUnit',
        args: {
          damage: 3,
          range: {
            all: true,
          },
        },
      },
    },
  ],
};

// BLUE BASE CARDS
// ---------------------------------------------------------

const fleeting_spirit = {
  id: 'fleeting_spirit',
  name: 'Fleeting Spirit',
  imageFileName: 'fleeting_spirit',
  type: CardType.Unit,
  cost: 1,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 0,
  maxHealth: 2,
  retaliate: 0,
  unitTypes: [UnitType.Spirit],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeath,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'bounceUnit',
            args: {
              range: {
                sameRow: true,
              },
            },
          },
        },
      ],
    },
  ],
};

const daring_spirit = {
  id: 'daring_spirit',
  name: 'Daring Spirit',
  imageFileName: 'daring_spirit',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 2,
  maxHealth: 2,
  retaliate: 1,
  unitTypes: [UnitType.Spirit],
};

const hurried_student = {
  id: 'hurried_student',
  name: 'Hurried Student',
  imageFileName: 'hurried_student',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Blue, count: 2 }],
  power: 1,
  maxHealth: 2,
  retaliate: 0,
  unitTypes: [UnitType.Spirit],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'drawCard',
            args: { cardCount: 1 },
          },
        },
      ],
    },
  ],
};

const mechanical_toy = {
  id: 'mechanical_toy',
  name: 'Mechanical Toy',
  imageFileName: 'mechanical_toy',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 1,
  maxHealth: 3,
  retaliate: 2,
  unitTypes: [UnitType.Construct],
};

const security_golem = {
  id: 'security_golem',
  name: 'Security Golem',
  imageFileName: 'security_golem',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Blue, count: 2 }],
  power: 3,
  maxHealth: 2,
  retaliate: 0,
  unitTypes: [UnitType.Construct],
};

const gifted_apprentice = {
  id: 'gifted_apprentice',
  name: 'Gifted Apprentice',
  imageFileName: 'gifted_apprentice',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 1,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Human],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'cycleCards',
            args: {},
          },
          targets: [
            {
              type: TargetType.HandCard,
              count: 1,
            },
          ],
        },
      ],
    },
  ],
};

const hyptnotic_witch = {
  id: 'hyptnotic_witch',
  name: 'Hyptnotic Witch',
  imageFileName: 'hyptnotic_witch',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Blue, count: 2 }],
  power: 1,
  maxHealth: 4,
  retaliate: 0,
  abilities: [
    {
      trigger: {
        type: TriggerType.AfterCombat,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'applyUnitStatus',
            args: {
              statusType: StatusType.Mezz,
              duration: 2,
              fromTriggerParam: 'defender',
            },
          },
        },
      ],
    },
  ],
};

const recycling_bot = {
  id: 'recycling_bot',
  name: 'Recycling Bot',
  imageFileName: 'recycling_bot',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 3,
  maxHealth: 3,
  retaliate: 3,
  unitTypes: [UnitType.Construct],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'recycleCard',
            args: {},
          },
          targets: [
            {
              type: TargetType.GraveyardCard,
              count: 3,
            },
          ],
        },
      ],
    },
  ],
};

const buffoon = {
  id: 'buffoon',
  name: 'Buffoon',
  imageFileName: 'buffoon',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 1,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Human],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'bounceUnit',
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
    },
  ],
};

const arcane_sniper = {
  id: 'arcane_sniper',
  name: 'Arcane Sniper',
  imageFileName: 'arcane_sniper',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Blue, count: 2 }],
  power: 2,
  maxHealth: 5,
  retaliate: 2,
  unitTypes: [UnitType.Human],
  keywords: {
    moveAndAttack: true,
  },
};

const shameless_imitator = {
  id: 'shameless_imitator',
  name: 'Shameless Imitator',
  imageFileName: 'shameless_imitator',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Blue, count: 2 }],
  power: 3,
  maxHealth: 3,
  retaliate: 2,
  unitTypes: [UnitType.Human],
  keywords: {
    ranged: true,
  },
};

const ice_golem = {
  id: 'ice_golem',
  name: 'Ice Golem',
  imageFileName: 'ice_golem',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 4,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Elemental],
};

const professore = {
  id: 'professore',
  name: 'Professor',
  imageFileName: 'professore',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 2,
  maxHealth: 5,
  retaliate: 2,
  unitTypes: [UnitType.Human],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'drawCard',
            args: {
              cardCount: 1,
            },
          },
        },
      ],
    },
  ],
};

const water_elemental = {
  id: 'water_elemental',
  name: 'Water Elemental',
  imageFileName: 'water_elemental',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 4,
  maxHealth: 6,
  retaliate: 3,
  unitTypes: [UnitType.Elemental],
};

const zeppelin = {
  id: 'zeppelin',
  name: 'Zeppelin',
  imageFileName: 'zeppelin',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 2,
  maxHealth: 9,
  retaliate: 3,
  unitTypes: [UnitType.Human, UnitType.Monster],
  keywords: {
    flying: true,
  },
};

const council_envoy = {
  id: 'council_envoy',
  name: 'Council Envoy',
  imageFileName: 'council_envoy',
  type: CardType.Unit,
  cost: 9,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 0,
  maxHealth: 1,
  retaliate: 0,
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'controlUnit',
            args: {
              count: 1,
            },
          },
        },
      ],
    },
  ],
};

const unsummon = {
  id: 'unsummon',
  name: 'Unsummon',
  imageFileName: 'unsummon',
  type: CardType.Spell,
  cost: 1,
  colors: [{ color: CardColor.Blue, count: 3 }],
  actions: [
    {
      effect: {
        name: 'bounceUnit',
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
};

const basic_research = {
  id: 'basic_research',
  name: 'Basic Research',
  imageFileName: 'basic_research',
  type: CardType.Spell,
  cost: 3,
  colors: [{ color: CardColor.Blue, count: 2 }],
  actions: [
    {
      effect: {
        name: 'drawCard',
        args: {
          cardCount: 2,
        },
      },
    },
  ],
};

const ancient_memories = {
  id: 'ancient_memories',
  name: 'Ancient Memories',
  imageFileName: 'ancient_memories',
  type: CardType.Spell,
  cost: 1,
  colors: [{ color: CardColor.Blue, count: 6 }],
  actions: [
    {
      effect: {
        name: 'drawCard',
        args: {
          cardCount: 3,
        },
      },
    },
  ],
};

const carnival_of_miracles = {
  id: 'carnival_of_miracles',
  name: 'Carnival of Miracles',
  imageFileName: 'carnival_of_miracles',
  type: CardType.Spell,
  cost: 2,
  colors: [{ color: CardColor.Blue, count: 2 }],
  actions: [
    {
      effect: {
        name: 'forceMoveUnit',
        args: {},
      },
      targets: [
        {
          type: TargetType.Units,
          count: 1,
        },
        {
          type: TargetType.EnemyCell,
          count: 1,
        },
      ],
    },
  ],
};

// BLACK BASE CARDS
// ---------------------------------------------------------

const peasant = {
  id: 'peasant',
  name: 'Peasant',
  imageFileName: 'peasant',
  type: CardType.Unit,
  cost: 1,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 0,
  maxHealth: 4,
  retaliate: 0,
  unitTypes: [UnitType.Human],
};

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

const skeletal_archer = {
  id: 'skeletal_archer',
  name: 'Skeletal Archer',
  imageFileName: 'skeletal_archer',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 2,
  maxHealth: 1,
  retaliate: 0,
  unitTypes: [UnitType.Undead],
  keywords: {
    ranged: true,
  },
};

const squire = {
  id: 'squire',
  name: 'Squire',
  imageFileName: 'squire',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Black, count: 2 }],
  power: 2,
  maxHealth: 2,
  retaliate: 1,
  unitTypes: [UnitType.Human],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnDeploy,
      },
      actions: [
        {
          effect: {
            name: 'staticKeyword',
            args: {
              abilityName: 'blacksmithArmor',
              keyword: 'armor',
              keyWordValue: 1,
              reset: false,
              range: {
                sameRow: true,
                allies: true,
              },
            },
          },
        },
      ],
    },
  ],
};

const weak_zombie = {
  id: 'weak_zombie',
  name: 'Weak Zombie',
  imageFileName: 'weak_zombie',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 2,
  maxHealth: 4,
  retaliate: 2,
  unitTypes: [UnitType.Undead],
};

const plague_spreader = {
  id: 'plague_spreader',
  name: 'Plague Spreader',
  imageFileName: 'plague_spreader',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 2 }],
  power: 0,
  maxHealth: 4,
  retaliate: 1,
  unitTypes: [UnitType.Undead],
  abilities: [
    {
      trigger: {
        type: TriggerType.OnTurnStart,
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'addCounters',
            args: {
              counterType: 'decay',
              counterValue: 1,
              range: {
                sameRow: true,
              },
            },
          },
        },
      ],
    },
  ],
};

const street_thugs = {
  id: 'street_thugs',
  name: 'Street Thugs',
  imageFileName: 'street_thugs',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 2 }],
  power: 1,
  maxHealth: 6,
  retaliate: 3,
  unitTypes: [UnitType.Human],
};

const spiky_wall = {
  id: 'spiky_wall',
  name: 'Spiky Wall',
  imageFileName: 'spiky_wall',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 0,
  maxHealth: 10,
  retaliate: 3,
  unitTypes: [UnitType.Building],
  keywords: {
    immobile: true,
  },
};

const ornithopter = {
  id: 'ornithopter',
  name: 'Ornithopter',
  imageFileName: 'ornithopter',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 2 }],
  power: 1,
  maxHealth: 3,
  retaliate: 1,
  unitTypes: [UnitType.Construct],
  keywords: {
    flying: true,
  },
};

const ogre_guard = {
  id: 'ogre_guard',
  name: 'Ogre Guard',
  imageFileName: 'ogre_guard',
  type: CardType.Unit,
  cost: 4,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 2,
  maxHealth: 6,
  retaliate: 2,
  unitTypes: [UnitType.Monster],
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

const heavy_bowman = {
  id: 'heavy_bowman',
  name: 'Heavy Bowman',
  imageFileName: 'heavy_bowman',
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

const royal_guard = {
  id: 'royal_guard',
  name: 'Royal Guard',
  imageFileName: 'royal_guard',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 4,
  maxHealth: 7,
  retaliate: 0,
};

const valiant_protector = {
  id: 'valiant_protector',
  name: 'Valiant Protector',
  imageFileName: 'valiant_protector',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Black, count: 1 }],
  power: 4,
  maxHealth: 7,
  retaliate: 4,
  unitTypes: [UnitType.Human],
  keywords: {
    armor: 1,
  },
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

const sudden_death = {
  id: 'sudden_death',
  name: 'Sudden Death',
  imageFileName: 'sudden_death',
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

const reanimate = {
  id: 'reanimate',
  name: 'Reanimate',
  imageFileName: 'reanimate',
  type: CardType.Spell,
  cost: 3,
  colors: [{ color: CardColor.Black, count: 3 }],
  actions: [
    {
      effect: {
        name: 'reanimate',
        args: {},
      },
      targets: [
        {
          type: TargetType.GraveyardCard,
          count: 1,
        },
        {
          type: TargetType.EmptyCell,
          count: 1,
        },
      ],
    },
  ],
};

const demonic_tutor = {
  id: 'demonic_tutor',
  name: 'Demonic Tutor',
  imageFileName: 'demonic_tutor',
  type: CardType.Spell,
  cost: 2,
  colors: [{ color: CardColor.Black, count: 3 }],
  actions: [
    {
      effect: {
        name: 'tutorCard',
        args: {},
      },
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
  health: 15,
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
      cost: 6,
      exhausts: true,
    },
  ],
};

export const BASE_DECK_GREEN: DeckBlueprint = {
  key: 'base',
  name: 'Base Green',
  cards: [
    savannah_lion,
    bear_minimum,
    boring_boar,
    ferocious_badger,
    halfling_sentinel,
    healing_balm,
    not_so_little_pig,
    pack_of_wolves,
    pandy_panda,
    retired_soldier,
    the_beast,
    deer,
    force_of_nature,
    sudden_growth,
    young_druidess,
    shroomy,
    lazy_elephant,
    regrowth,
    vigorous_entling,
    snek,
  ],
  lands: [forest, plains, market, enchanter_lair],
  learntKeywords: ['poisonous', 'regeneration', 'trample'],
  learntActions: ['addGrowthCounters', 'healUnit', 'regrowCard'],
};

export const BASE_DECK_RED: DeckBlueprint = {
  key: 'base',
  name: 'Base Red',
  cards: [
    young_viking,
    gargoyle,
    northern_challenger,
    dwarf_berserker,
    jarl_bodyguard,
    stone_colossus,
    mountain_giant,
    lightning_bolt,
    sneaky_raid,
    lunging_cougar,
    angry_lizard,
    orc_warrior,
    hill_troll,
    enraged_goblin,
    dwarf_pikeman,
    fireball,
    manticore_pup,
    fire_golem,
    salamander,
    earthquake,
  ],
  lands: [mountain, plains, market, enchanter_lair],
  learntKeywords: ['lance', 'zerk', 'haste'],
  learntActions: ['directDamage', 'damageLand'],
};

export const BASE_DECK_BLACK: DeckBlueprint = {
  key: 'base',
  name: 'Base Black',
  cards: [
    sewer_rat,
    weak_zombie,
    ogre_guard,
    iron_golem,
    royal_guard,
    valiant_protector,
    big_bertha,
    sudden_death,
    spiky_wall,
    heavy_bowman,
    fortify,
    street_thugs,
    street_slinger,
    peasant,
    squire,
    ornithopter,
    reanimate,
    demonic_tutor,
    skeletal_archer,
    plague_spreader,
  ],
  lands: [city, plains, market, enchanter_lair],
  learntKeywords: ['ranged', 'immobile', 'flying'],
  learntActions: ['addDecayCounters', 'destroyUnit', 'fortifyLand', 'reanimate', 'tutorCard'],
};

export const BASE_DECK_BLUE: DeckBlueprint = {
  key: 'base',
  name: 'Base Blue',
  cards: [
    daring_spirit,
    mechanical_toy,
    gifted_apprentice,
    recycling_bot,
    buffoon,
    arcane_sniper,
    shameless_imitator,
    ice_golem,
    professore,
    water_elemental,
    council_envoy,
    zeppelin,
    basic_research,
    carnival_of_miracles,
    security_golem,
    fleeting_spirit,
    hyptnotic_witch,
    ancient_memories,
    unsummon,
    hurried_student,
  ],
  lands: [island, plains, market, enchanter_lair],
  learntKeywords: ['immobile', 'moveAndAttack', 'ranged', 'flying'],
  learntActions: [
    'bounceUnit',
    'controlUnit',
    'drawCards',
    'cycleCards',
    'mezz',
    'recycleCard',
    'forceMoveUnit',
  ],
};
