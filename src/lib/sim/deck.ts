import { gs } from "../_state";
import { getRandomFromArray } from "../_utils/random";
import { BASE_DECK_RED } from '@/data/base-deck';
import { BASE_DECK_BLACK } from '@/data/base-deck';
import { BASE_DECK_GREEN } from '@/data/base-deck';
import { SchoolName } from "../_model";

export function initNpcDecks() {
  // give other studenst a deck
  const otherStudents = Object.values(gs.characters).filter(
    (character) => character.school === SchoolName.Academy && character.key !== gs.player.key
  );
  otherStudents.forEach((student) => {
    student.decks.push(getRandomFromArray([BASE_DECK_RED, BASE_DECK_BLACK, BASE_DECK_GREEN]));
  });
}