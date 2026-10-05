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

const hungry_wolf = {
  id: 'hungry_wolf',
  name: 'Hungry Wolf',
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

const dazing_spirit = {
  id: 'dazing_spirit',
  name: 'Dazing Spirit',
  imageFileName: 'dazing_spirit',
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

const born_from_magic = {
  id: 'born_from_magic',
  name: 'Born from Magic',
  imageFileName: 'born_from_magic',
  type: CardType.Unit,
  cost: 2,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 1,
  maxHealth: 3,
  retaliate: 2,
  unitTypes: [UnitType.Elemental],
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
        type: 'On Deploy',
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
              type: 'hand_card',
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

const donatello = {
  id: 'donatello',
  name: 'Donatello',
  imageFileName: 'donatello',
  type: CardType.Unit,
  cost: 3,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 3,
  maxHealth: 3,
  retaliate: 3,
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
            name: 'recycleCard',
          },
          targets: [
            {
              type: 'graveyard_card',
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
  power: 0,
  maxHealth: 10,
  retaliate: 3,
  unitTypes: [UnitType.Human],
  keywords: {
    immobile: true,
  },
  abilities: [
    {
      trigger: {
        type: 'On Deploy',
        range: {
          self: true,
        },
      },
      actions: [
        {
          effect: {
            name: 'bounceUnit',
            args: {
              count: 1,
            },
          },
          targets: [
            {
              type: 'units',
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

const luring_enchantress = {
  id: 'luring_enchantress',
  name: 'Luring Enchantress',
  imageFileName: 'luring_enchantress',
  type: CardType.Unit,
  cost: 5,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 4,
  maxHealth: 4,
  retaliate: 2,
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
        type: 'On Deploy',
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

const mentalist = {
  id: 'mentalist',
  name: 'Mentalist',
  imageFileName: 'mentalist',
  type: CardType.Unit,
  cost: 6,
  colors: [{ color: CardColor.Blue, count: 1 }],
  power: 4,
  maxHealth: 6,
  retaliate: 3,
};

const council_envoy = {
  id: 'council_envoy',
  name: 'Council Envoy',
  imageFileName: 'council_envoy',
  type: CardType.Unit,
  cost: 7,
  colors: [{ color: CardColor.Blue, count: 2 }],
  power: 4,
  maxHealth: 7,
  retaliate: 5,
};

const zeppelin = {
  id: 'zeppelin',
  name: 'Zeppelin',
  imageFileName: 'zeppelin',
  type: CardType.Unit,
  cost: 8,
  colors: [{ color: CardColor.Blue, count: 3 }],
  power: 3,
  maxHealth: 9,
  retaliate: 3,
  unitTypes: [UnitType.Human, UnitType.Monster],
  keywords: {
    flying: true,
  },
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
        args: {
          count: 1,
        },
      },
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
        args: {
          count: 1,
        },
      },
    },
  ],
};

// BLACK BASE CARDS
// ---------------------------------------------------------

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

const blacksmith = {
  id: 'blacksmith',
  name: 'Expendable Recruit',
  imageFileName: 'blacksmith',
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

const raise_dead = {
  id: 'raise_dead',
  name: 'Raise Dead',
  imageFileName: 'raise_dead',
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
    zombie,
    ogre_guard,
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
    blacksmith,
    ornithopter,
    raise_dead,
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
    dazing_spirit,
    born_from_magic,
    gifted_apprentice,
    donatello,
    buffoon,
    arcane_sniper,
    shameless_imitator,
    luring_enchantress,
    professore,
    mentalist,
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
  learntActions: ['bounceUnit', 'drawCards', 'cycleCards', 'mezz', 'recycleCard', 'forceMoveUnit'],
};
