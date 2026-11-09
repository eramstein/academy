import type { UnitFilterArgs } from '@/lib/battle/effects';

/** Picker order for the crafting board. Empty key means the chosen targets only. */
export const AREA_PICK_KEYS = ['', 'all', 'row', 'column', 'around', 'explosion'] as const;

/**
 * 5×5 miniature of each area.
 * `.` empty, `+` affected, `*` the chosen unit.
 * Adjacent patterns are orthogonal, matching `getAdjacentUnits`.
 */
const AREA_GLYPHS: Record<string, readonly string[]> = {
  '': ['.....', '.....', '..*..', '.....', '.....'],
  all: ['.....', '.+++.', '.+*+.', '.+++.', '.....'],
  row: ['.....', '.....', '++*++', '.....', '.....'],
  column: ['..+..', '..+..', '..*..', '..+..', '..+..'],
  around: ['.....', '..+..', '.+.+.', '..+..', '.....'],
  explosion: ['.....', '..+..', '.+*+.', '..+..', '.....'],
};

export type AreaCell = 'empty' | 'hit' | 'mark';

export const rangeTemplates: Record<
  string,
  { name: string; label: string; args: UnitFilterArgs; budgetMultiplier: number }
> = {
  all: {
    name: 'All',
    label: 'All Units',
    args: {
      all: true,
    },
    budgetMultiplier: 3,
  },
  explosion: {
    name: 'Explosion',
    label: 'Target and all units around it',
    args: {
      adjacent: true,
      addSelf: true,
    },
    budgetMultiplier: 2.5,
  },
  around: {
    name: 'Around',
    label: 'All units around the target',
    args: {
      adjacent: true,
    },
    budgetMultiplier: 2,
  },
  row: {
    name: 'Row',
    label: 'All units in the same row as the target',
    args: {
      sameRow: true,
    },
    budgetMultiplier: 1.5,
  },
  column: {
    name: 'Column',
    label: 'All units in the same column as the target',
    args: {
      sameColumn: true,
    },
    budgetMultiplier: 3,
  },
};

export function areaCells(rangeKey: string): AreaCell[] {
  const rows = AREA_GLYPHS[rangeKey] ?? AREA_GLYPHS[''];
  const cells: AreaCell[] = [];
  for (const row of rows) {
    for (const cell of row) {
      cells.push(cell === '*' ? 'mark' : cell === '+' ? 'hit' : 'empty');
    }
  }
  return cells;
}

export function areaPickLabel(rangeKey: string): string {
  if (!rangeKey) return 'Targets';
  return rangeTemplates[rangeKey]?.name ?? rangeKey;
}

export function readRangeArg(value: unknown): string {
  return typeof value === 'string' && value in rangeTemplates ? value : '';
}

export function rangeTemplateKeyFor(filter: UnitFilterArgs | undefined): string | undefined {
  if (!filter) return undefined;
  for (const [key, template] of Object.entries(rangeTemplates)) {
    if (sameUnitFilter(template.args, filter)) return key;
  }
  return undefined;
}

function sameUnitFilter(a: UnitFilterArgs, b: UnitFilterArgs): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof UnitFilterArgs>;
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
