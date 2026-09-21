import { CounterType, StatusType, TargetType } from '@/lib/_model';
import type { ActionDefinition } from '@/lib/_model/model-battle';

export interface ActionTemplate {
  name: string;
  label: string;
  description: string;
  definition: ActionDefinition;
  budget: number;
}

export const actionTemplates: Record<string, (args: any) => ActionTemplate> = {
  directDamage: (args: { damage: number }) => ({
    name: 'directDamage',
    label: 'Direct Damage',
    description: 'Deal damage to a target unit.',
    definition: {
      effect: {
        name: 'damageUnit',
        args: {
          damage: args.damage,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.damage ?? 0) * 4,
  }),
  healUnit: (args: { health: number }) => ({
    name: 'healUnit',
    label: 'Heal',
    description: 'Restore health to a target unit.',
    definition: {
      effect: {
        name: 'healUnit',
        args: {
          health: args.health,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.health ?? 0) * 2,
  }),
  damageLand: (args: { damage: number }) => ({
    name: 'damageLand',
    label: 'Damage Land',
    description: 'Deal damage to a land.',
    definition: {
      effect: {
        name: 'damageLand',
        args: {
          damage: args.damage,
        },
      },
      targets: [
        {
          type: TargetType.Land,
        },
      ],
    },
    budget: (args.damage ?? 0) * 12,
  }),
  destroyUnit: () => ({
    name: 'destroyUnit',
    label: 'Destroy',
    description: 'Destroy a target unit.',
    definition: {
      effect: {
        name: 'destroyUnit',
        args: {},
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: 30,
  }),
  fortifyLand: (args: { amount: number }) => ({
    name: 'fortifyLand',
    label: 'Fortify',
    description: "Increase a land's health.",
    definition: {
      effect: {
        name: 'fortifyLand',
        args: { amount: args.amount },
      },
      targets: [
        {
          type: TargetType.Land,
          count: 1,
        },
      ],
    },
    budget: (args.amount ?? 0) * 4,
  }),
  reanimate: () => ({
    name: 'reanimate',
    label: 'Reanimate',
    description: 'Return a creature from a graveyard to the board.',
    definition: {
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
    budget: 22,
  }),
  damageOpponent: (args: { damage: number }) => ({
    name: 'damageOpponent',
    label: 'Damage Opponent',
    description: 'Deal damage to the opposing player.',
    definition: {
      effect: {
        name: 'damagePlayer',
        args: {
          damage: args.damage,
          opposingPlayer: true,
        },
      },
    },
    budget: (args.damage ?? 0) * 16,
  }),
  addGrowthCounters: (args: { counters: number }) => ({
    name: 'addGrowthCounters',
    label: 'Add Growth Counters',
    description: 'Give growth counters to a target unit.',
    definition: {
      effect: {
        name: 'addCounters',
        args: {
          counterType: CounterType.Growth,
          counterValue: args.counters,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.counters ?? 0) * 6,
  }),
  addDecayCounters: (args: { counters: number }) => ({
    name: 'addDecayCounters',
    label: 'Add Decay Counters',
    description: 'Give decay counters to a target unit.',
    definition: {
      effect: {
        name: 'addCounters',
        args: {
          counterType: CounterType.Decay,
          counterValue: args.counters,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.counters ?? 0) * 5,
  }),
  drawCards: (args: { cardCount: number }) => ({
    name: 'drawCards',
    label: 'Draw Cards',
    description: 'Draw cards.',
    definition: {
      effect: {
        name: 'drawCard',
        args: {
          cardCount: args.cardCount,
        },
      },
    },
    budget: (args.cardCount ?? 0) * 9,
  }),
  mezz: (args: { duration: number }) => ({
    name: 'mezz',
    label: 'Mezz',
    description: 'Mezz a unit. It cannot attack or move; any damage wakes it.',
    definition: {
      effect: {
        name: 'applyUnitStatus',
        args: {
          statusType: StatusType.Mezz,
          duration: args.duration,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.duration ?? 0) * 9,
  }),
  stun: (args: { duration: number }) => ({
    name: 'stun',
    label: 'Stun',
    description: 'Stun a unit. It cannot act.',
    definition: {
      effect: {
        name: 'applyUnitStatus',
        args: {
          statusType: StatusType.Stun,
          duration: args.duration,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.duration ?? 0) * 15,
  }),
  root: (args: { duration: number }) => ({
    name: 'root',
    label: 'Root',
    description: 'Root a unit. It cannot move.',
    definition: {
      effect: {
        name: 'applyUnitStatus',
        args: {
          statusType: StatusType.Root,
          duration: args.duration,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.duration ?? 0) * 4,
  }),
  daze: (args: { duration: number }) => ({
    name: 'daze',
    label: 'Daze',
    description: 'Daze a unit. It cannot attack.',
    definition: {
      effect: {
        name: 'applyUnitStatus',
        args: {
          statusType: StatusType.Daze,
          duration: args.duration,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: (args.duration ?? 0) * 7,
  }),
  bounceUnit: (args: { count: number }) => ({
    name: 'bounceUnit',
    label: 'Bounce',
    description: 'Return target units to hand.',
    definition: {
      effect: {
        name: 'bounceUnit',
        args: {},
      },
      targets: [
        {
          type: TargetType.Units,
          count: args.count ?? 1,
        },
      ],
    },
    budget: (args.count ?? 1) * 16,
  }),
  forceMoveUnit: () => ({
    name: 'forceMoveUnit',
    label: 'Force Move',
    description: 'Move a unit to an empty cell on its side of the board.',
    definition: {
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
          type: TargetType.EmptyCell,
          count: 1,
        },
      ],
    },
    budget: 15,
  }),
  fight: () => ({
    name: 'fight',
    label: 'Fight',
    description: 'Two units fight each other.',
    definition: {
      effect: {
        name: 'fight',
        args: {},
      },
      targets: [
        {
          type: TargetType.Units,
          count: 2,
        },
      ],
    },
    budget: 15,
  }),
  cycleCards: (args: { count: number }) => ({
    name: 'cycleCards',
    label: 'Cycle Cards',
    description: 'Discard cards from hand, then draw that many.',
    definition: {
      effect: {
        name: 'cycleCards',
        args: {},
      },
      targets: [
        {
          type: TargetType.HandCard,
          count: args.count ?? 1,
        },
      ],
    },
    budget: (args.count ?? 1) * 4,
  }),
  tutorCard: () => ({
    name: 'tutorCard',
    label: 'Tutor',
    description: 'Fetch a card from your deck.',
    definition: {
      effect: {
        name: 'tutorCard',
        args: {},
      },
      targets: [
        {
          type: TargetType.DeckCard,
          count: 1,
        },
      ],
    },
    budget: 20,
  }),
  regrowCard: () => ({
    name: 'regrowCard',
    label: 'Regrow',
    description: 'Fetch a card from a graveyard.',
    definition: {
      effect: {
        name: 'regrowCard',
        args: {},
      },
      targets: [
        {
          type: TargetType.GraveyardCard,
          count: 1,
        },
      ],
    },
    budget: 15,
  }),
  addMana: (args: { amount: number }) => ({
    name: 'addMana',
    label: 'Add Mana',
    description: 'Gain mana.',
    definition: {
      effect: {
        name: 'addMana',
        args: {
          amount: args.amount,
        },
      },
    },
    budget: (args.amount ?? 0) * 10,
  }),
};
