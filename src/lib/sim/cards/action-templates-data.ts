import { TargetType } from '@/lib/_model';
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
  grow: (args: { counters: number }) => ({
    name: 'grow',
    label: 'Grow',
    description: 'Give growth counters to a target unit.',
    definition: {
      effect: {
        name: 'addCounters',
        args: {
          counterType: 'growth',
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
};
