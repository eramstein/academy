import { SchoolName, type Character } from '../_model';
import { gs } from '../_state';
import { getCharactersAtScene } from './characters';

export function newLeagueSeason() {
  gs.league.season++;
  gs.league.rankings = [{ characterKey: 'player', points: 0 }];
  gs.league.records = {};
  for (const character of Object.values(gs.characters)) {
    if (character.school === SchoolName.Academy) {
      gs.league.rankings.push({ characterKey: character.key, points: 0 });
    }
  }
}

export function getPossibleLeagueOpponents(): Character[] {
  return getCharactersAtScene().filter(
    (character) =>
      character.school === SchoolName.Academy &&
      !gs.league.records['player']?.find((record) => record.opponentKey === character.key)
  );
}
