import type { CardTemplate } from '@/lib/_model';
import {
  getAllCardTemplates,
  getCardTemplateById,
  replaceCardTemplates,
} from '@/lib/_state/card-templates';

const npcCardModules = import.meta.glob('@/data/sim/npc_cards/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, CardTemplate[]>;

let cardTemplates: CardTemplate[] = [];

function readNpcCardTemplatesSource(): CardTemplate[] {
  return Object.values(npcCardModules).flat();
}

/** Replace IndexedDB card templates with the authored npc_cards JSON files. */
export async function restoreCardTemplates() {
  const templates = readNpcCardTemplatesSource();
  await replaceCardTemplates(templates);
}

/** Load card templates from IndexedDB into the in-memory catalog. */
export async function loadCardTemplates() {
  cardTemplates = await getAllCardTemplates();
}

export function getLoadedCardTemplates(): CardTemplate[] {
  return cardTemplates;
}

export function getLoadedCardTemplate(id: string): CardTemplate | undefined {
  return cardTemplates.find((template) => template.id === id);
}

/** Returns cards that include every key in `poolKeys`. */
export function getCardTemplatesByPoolKeys(poolKeys: string[]): CardTemplate[] {
  if (poolKeys.length === 0) {
    return [];
  }
  return cardTemplates.filter((template) =>
    poolKeys.every((key) => template.poolKeys?.includes(key))
  );
}

export async function fetchCardTemplate(id: string): Promise<CardTemplate | undefined> {
  return getLoadedCardTemplate(id) ?? (await getCardTemplateById(id));
}
