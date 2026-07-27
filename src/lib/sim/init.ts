import { npcs } from '@/data/npcs';
import { DayPeriod, SubscriptionType, type GameState } from '../_model';
import { gs } from '../_state';
import { EVENTS } from '@/data/sim/events';

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
  places: [
    {
      key: 'admin-office',
      name: 'Administration Office',
    },
  ],
  scene: {
    narration: [],
    actions: [],
  },
};

export const initSim = async () => {
  console.log('initSim');
  Object.assign(gs, defaultGameState);
  gs.scene.narration = [EVENTS['first-day'].narration];
  gs.scene.actions = EVENTS['first-day'].actions;
};
