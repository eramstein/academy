import { CardColor, type CardTemplate } from '@/lib/_model';
import { MAX_MANA_COST } from '@/lib/sim/cards/card-budget';

const npcCardModules = import.meta.glob('@/data/sim/npc_cards/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, CardTemplate[]>;

export type NpcCardRecord = {
  card: CardTemplate;
  /** File stem under `src/data/sim/npc_cards`, such as `emma`. */
  source: string;
  key: string;
};

export type NpcCardQuery = {
  /** Card must include every selected color. */
  colors: CardColor[];
  /** Card has an empty color list. */
  colorless: boolean;
  /** Card cost is one of these values. */
  costs: number[];
  /** Card must include every selected pool key. */
  poolKeys: string[];
};

export const NPC_COLORS = [CardColor.Red, CardColor.Blue, CardColor.Green, CardColor.Black];

export const MANA_COSTS = Array.from({ length: MAX_MANA_COST + 1 }, (_, cost) => cost);

function sourceName(modulePath: string): string {
  const file = modulePath.split(/[/\\]/).pop() ?? modulePath;
  return file.replace(/\.json$/, '');
}

function costRank(card: CardTemplate): number {
  return typeof card.cost === 'number' ? card.cost : MAX_MANA_COST + 1;
}

export const npcCardCatalog: NpcCardRecord[] = Object.entries(npcCardModules)
  .flatMap(([path, cards]) => {
    const source = sourceName(path);
    const list = Array.isArray(cards) ? cards : [];
    return list.map((card, index) => ({
      card,
      source,
      key: `${source}:${index}:${card.id}`,
    }));
  })
  .sort(
    (a, b) =>
      costRank(a.card) - costRank(b.card) ||
      a.card.name.localeCompare(b.card.name) ||
      a.key.localeCompare(b.key)
  );

export function poolKeyOptions(records: NpcCardRecord[]): string[] {
  const keys = new Set<string>();
  for (const record of records) {
    for (const key of record.card.poolKeys ?? []) keys.add(key);
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

export function createEmptyQuery(): NpcCardQuery {
  return { colors: [], colorless: false, costs: [], poolKeys: [] };
}

export function isQueryEmpty(query: NpcCardQuery): boolean {
  return (
    query.colors.length === 0 &&
    !query.colorless &&
    query.costs.length === 0 &&
    query.poolKeys.length === 0
  );
}

export function filterNpcCards(records: NpcCardRecord[], query: NpcCardQuery): NpcCardRecord[] {
  return records.filter((record) => matchesQuery(record.card, query));
}

function matchesQuery(card: CardTemplate, query: NpcCardQuery): boolean {
  const cardColors = (card.colors ?? []).map((entry) => entry.color);
  if (query.colorless) {
    if (cardColors.length > 0) return false;
  } else if (query.colors.length > 0) {
    if (!query.colors.every((color) => cardColors.includes(color))) return false;
  }
  if (query.costs.length > 0) {
    if (typeof card.cost !== 'number' || !query.costs.includes(card.cost)) return false;
  }
  if (query.poolKeys.length > 0) {
    const keys = card.poolKeys ?? [];
    if (!query.poolKeys.every((key) => keys.includes(key))) return false;
  }
  return true;
}
