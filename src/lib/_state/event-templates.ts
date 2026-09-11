import type { Table } from 'dexie';
import type { EventTemplate } from '../_model';
import { db } from './database';

export interface StoredEventTemplate extends EventTemplate {
  id?: number;
}

const eventTemplatesTable: Table<StoredEventTemplate> = db.table('eventTemplates');

export async function replaceEventTemplates(templates: EventTemplate[]): Promise<void> {
  // Dexie/IndexedDB cannot store Svelte proxies; persist plain objects only.
  const plain = JSON.parse(JSON.stringify(templates)) as EventTemplate[];
  await eventTemplatesTable.clear();
  await eventTemplatesTable.bulkAdd(plain);
}

export async function getAllEventTemplates(): Promise<StoredEventTemplate[]> {
  return await eventTemplatesTable.toArray();
}

export async function deleteEventTemplate(id: number): Promise<void> {
  await eventTemplatesTable.delete(id);
}
