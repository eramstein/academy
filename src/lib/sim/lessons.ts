import { ActivityType, EventEffectType, EventOutcomeType } from '../_model';
import { gs } from '../_state';
import { setEvent } from './scene';
import { getCurrentScheduledActivity } from './schedule';

export function initialLessonEvent() {
  if (
    gs.player.decks.length === 0 &&
    getCurrentScheduledActivity()?.type === ActivityType.Class &&
    (gs.player.placeKey === 'artificery-room' || gs.player.placeKey === 'enchanting-room')
  ) {
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
