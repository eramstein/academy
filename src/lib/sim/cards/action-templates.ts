import { TargetType } from '@/lib/_model';
import type { ActionDefinition } from '@/lib/_model/model-battle';

export interface ActionTemplate {
  name: string;
  definition: ActionDefinition;
  budget: number;
}

export const actionTemplates: Record<string, (args: any) => ActionTemplate> = {
  directDamage: (args: { damage: number }) => ({
    name: 'directDamage',
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
    budget: args.damage * 4,
  }),
  grow: (args: { counters: number }) => ({
    name: 'grow',
    definition: {
      effect: {
        name: 'addCounters',
        args: {
          counterType: 'growth',
          damage: args.counters,
        },
      },
      targets: [
        {
          type: TargetType.Units,
        },
      ],
    },
    budget: args.counters * 8,
  }),
  healUnit: (args: { health: number }) => ({
    name: 'healUnit',
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
    budget: args.health * 2,
  }),
  damageLand: (args: { damage: number }) => ({
    name: 'damageLand',
    definition: {
      effect: {
        name: 'damageLand',
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
    budget: args.damage * 12,
  }),
  destroyUnit: () => ({
    name: 'destroyUnit',
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
    budget: args.amount * 4,
  }),
};
