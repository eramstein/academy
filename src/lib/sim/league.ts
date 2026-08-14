import { SchoolName } from '../_model';
import { gs } from '../_state';

export function newLeagueSeason() {
  gs.league.season++;
  gs.league.rankings = [{ characterKey: 'player', points: 0 }];
  for (const character of Object.values(gs.characters)) {
    if (character.school === SchoolName.Academy) {
      gs.league.rankings.push({ characterKey: character.key, points: 0 });
    }
  }
}
