import type { Table } from 'dexie';
import type { EventTemplate } from '../_model';
import { db } from './database';

export interface StoredEventTemplate extends EventTemplate {
  id?: number;
}

const eventTemplatesTable: Table<StoredEventTemplate> = db.table('eventTemplates');

export async function replaceEventTemplates(templates: EventTemplate[]): Promise<void> {
  await eventTemplatesTable.clear();
  await eventTemplatesTable.bulkAdd(templates);
}

export async function getAllEventTemplates(): Promise<StoredEventTemplate[]> {
  return await eventTemplatesTable.toArray();
}

export async function deleteEventTemplate(id: number): Promise<void> {
  await eventTemplatesTable.delete(id);
}
