import type { Table } from 'dexie';
import { db } from '@/lib/_state/database';

export interface UsedFlavorRecord {
  imageName: string;
  name?: string;
  usedAt: number;
}

const usedFlavorTable: Table<UsedFlavorRecord, string> = db.table('usedFlavorTemplates');

export async function clearUsedFlavors(): Promise<void> {
  await usedFlavorTable.clear();
}

export async function getUsedFlavorImageNames(): Promise<Set<string>> {
  const rows = await usedFlavorTable.toArray();
  return new Set(rows.map((row) => row.imageName));
}

export async function markFlavorUsed(imageName: string, name?: string): Promise<void> {
  await usedFlavorTable.put({
    imageName,
    name,
    usedAt: Date.now(),
  });
}

export async function isFlavorUsed(imageName: string): Promise<boolean> {
  const row = await usedFlavorTable.get(imageName);
  return row !== undefined;
}
