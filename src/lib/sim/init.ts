import { npcs } from '@/data/npcs';
import { DayPeriod, type GameState } from '../_model';
import { gs } from '../_state';

export const defaultGameState: GameState = {
  time: {
    day: 0,
    period: DayPeriod.Afternoon,
  },
  characters: npcs,
  player: {
    key: 'player',
    name: 'Player',
    gold: 1000,
    placeKey: 'admin-office',
    attributes: {
      dexterity: 5,
      intelligence: 5,
      vitality: 5,
      charisma: 5,
      aura: 5,
    },
  },
  places: [
    {
      key: 'admin-office',
      name: 'Administration Office',
    },
  ],
  scene: {
    narration: [
      'You arrive at the academy and meet the administrator. He asks you for tuition fees.',
    ],
  },
};

export const initSim = async () => {
  console.log('initSim');
  Object.assign(gs, defaultGameState);
};
