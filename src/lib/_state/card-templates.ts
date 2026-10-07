import type { Table } from 'dexie';
import type { CardTemplate } from '../_model';
import { db } from './database';

const cardTemplatesTable: Table<CardTemplate, string> = db.table('cardTemplates');

export async function replaceCardTemplates(templates: CardTemplate[]): Promise<void> {
  // Dexie/IndexedDB cannot store Svelte proxies; persist plain objects only.
  const plain = JSON.parse(JSON.stringify(templates)) as CardTemplate[];
  await cardTemplatesTable.clear();
  await cardTemplatesTable.bulkPut(plain);
}

export async function getAllCardTemplates(): Promise<CardTemplate[]> {
  return await cardTemplatesTable.toArray();
}

export async function getCardTemplateById(id: string): Promise<CardTemplate | undefined> {
  return await cardTemplatesTable.get(id);
}
