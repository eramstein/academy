import { npcs } from '@/data/npcs';
import { type GameState } from '../_model';
import { gs } from '../_state';
import { EVENTS } from '@/data/sim/events';
import { setPossibleActions } from './actions';

export const defaultGameState: GameState = {
  time: {
    day: 1,
    hour: 9,
    minute: 0,
  },
  characters: npcs,
  player: {
    key: 'player',
    name: 'Player',
    gold: 1000,
    focus: 0,
    placeKey: 'admin-office',
    attributes: {
      dexterity: 5,
      intelligence: 5,
      vitality: 5,
      charisma: 5,
      aura: 5,
    },
    subscriptions: {
      academy: 0,
      library: 0,
      inn: 0,
    },
  },
  places: {
    ['admin-office']: {
      key: 'admin-office',
      name: 'Administration Office',
    },
  },
  scene: {
    narration: [],
    actions: [],
  },
  scheduledActivities: [],
};

export const initSim = async () => {
  console.log('initSim');
  Object.assign(gs, defaultGameState);
  gs.scene.narration = [EVENTS['first-day'].narration];
  setPossibleActions();
};
