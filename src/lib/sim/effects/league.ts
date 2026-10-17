import { gs } from '@/lib/_state';
import { newLeagueSeason as startNewLeagueSeason } from '../league';

export interface NewLeagueSeasonParameters {
  /** Character key of the season winner, or null/omit to start a season with no ceremony. */
  winnerKey?: string | null;
}

export function newLeagueSeason(parameters: NewLeagueSeasonParameters = {}): string {
  const { winnerKey = null } = parameters;
  if (winnerKey && winnerKey !== 'player' && !gs.characters[winnerKey]) {
    return `Invalid winner key: ${winnerKey}.`;
  }
  startNewLeagueSeason(winnerKey);
  // Ceremony narration is handled inside startNewLeagueSeason when a winner is set.
  if (winnerKey) {
    return '';
  }
  return 'A new league season begins.';
}
