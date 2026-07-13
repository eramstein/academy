import type { Table } from 'dexie';
import type { GameState } from '../_model';
import { db } from './database';

export interface SaveGame {
  id: string;
  createdAt: Date;
  gameState: GameState;
}

const savedGames: Table<SaveGame> = db.table('savedGamesAcademy');

// Save a game to the database
export async function saveGame(game: SaveGame): Promise<number> {
  console.log('Saving game:', game);
  try {
    const serializableGame = {
      id: String(game.id),
      createdAt: game.createdAt,
      gameState: game.gameState,
    };
    return await savedGames.put(serializableGame);
  } catch (error) {
    console.error('Error saving game:', error);
    throw error;
  }
}

// Get a save from the database
export async function getGame(id: string): Promise<SaveGame | undefined> {
  return await savedGames.get(id);
}

// Get all saves from the database
export async function getAllGames(): Promise<SaveGame[]> {
  return await savedGames.toArray();
}

// Delete a save from the database
export async function deleteGame(id: string): Promise<void> {
  await savedGames.delete(id);
}

// Get the most recently created save game by date
export async function getLatestGame(): Promise<SaveGame | undefined> {
  const games = await savedGames.toArray();
  if (games.length === 0) return undefined;
  games.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return games[0];
}
