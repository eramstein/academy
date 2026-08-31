import Dexie from 'dexie';

// Initialize Dexie database
export const db = new Dexie('AcademyDB');

// Define schema
db.version(1).stores({
  savedGamesAcademy: 'id',
});

db.version(2).stores({
  eventTemplates: '++id',
});
