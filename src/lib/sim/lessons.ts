import { ActivityType, EventEffectType, EventOutcomeType, SchoolName } from '../_model';
import { gs } from '../_state';
import { getRandomFromArray } from '../_utils/random';
import { setEvent } from './scene';
import { getCurrentScheduledActivity } from './schedule';
import { BASE_DECK_RED } from '@/data/base-deck';
import { BASE_DECK_BLACK } from '@/data/base-deck';
import { BASE_DECK_GREEN } from '@/data/base-deck';

export function initialLessonEvent() {
  if (
    gs.player.decks.length === 0 &&
    getCurrentScheduledActivity()?.type === ActivityType.Class &&
    (gs.player.placeKey === 'artificery-room' || gs.player.placeKey === 'enchanting-room')
  ) {
    // give other studenst a deck
    const otherStudents = Object.values(gs.characters).filter(
      (character) => character.school === SchoolName.Academy && character.key !== gs.player.key
    );
    otherStudents.forEach((student) => {
      student.decks.push(getRandomFromArray([BASE_DECK_RED, BASE_DECK_BLACK, BASE_DECK_GREEN]));
    });
    setEvent({
      text: 'Get a deck, noob!',
      options: [
        {
          text: 'Red',
          outcome: {
            type: EventOutcomeType.Decision,
            effects: [
              {
                type: EventEffectType.GetDeck,
                parameters: {
                  deckKey: 'base_red',
                },
              },
            ],
          },
        },
        {
          text: 'Black',
          outcome: {
            type: EventOutcomeType.Decision,
            effects: [
              {
                type: EventEffectType.GetDeck,
                parameters: {
                  deckKey: 'base_black',
                },
              },
            ],
          },
        },
        {
          text: 'Green',
          outcome: {
            type: EventOutcomeType.Decision,
            effects: [
              {
                type: EventEffectType.GetDeck,
                parameters: {
                  deckKey: 'base_green',
                },
              },
            ],
          },
        },
      ],
    });
  }
}
