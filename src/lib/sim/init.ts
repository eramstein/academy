import { DayPeriod, type GameState } from '../_model';

export const defaultGameState: GameState = {
  time: {
    day: 0,
    period: DayPeriod.Afternoon,
  },
  characters: {
    dude: {
      key: 'the-dude',
      name: 'The Dude',
    },
  },
  player: {
    key: 'player',
    name: 'Player',
  },
  places: [
    {
      key: 'cave',
      name: 'Cave',
    },
  ],
};

export const initSim = async () => {
  console.log('initSim');
};
