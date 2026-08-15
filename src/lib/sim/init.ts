import { npcs } from '@/data/npcs';
import { ActionDuration, DayPeriod, type GameState } from '../_model';
import { gs } from '../_state';
import { PLACES, REGIONS } from '@/data/sim/places';
import { setSceneEvents } from './scene';
import { newLeagueSeason } from './league';

export const defaultGameState: GameState = {
  time: {
    day: 1,
    period: DayPeriod.Morning,
    usedActions: {
      [ActionDuration.Instant]: 0,
      [ActionDuration.Short]: 0,
      [ActionDuration.Long]: 0,
    },
    playedLeagueMatch: false,
  },
  characters: npcs,
  player: {
    key: 'player',
    name: 'Antonio Fibonacci',
    gold: 1000,
    focus: 0,
    decks: [],
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
    ...PLACES,
  },
  regions: {
    ...REGIONS,
  },
  scene: {
    narration: [],
    event: undefined,
    actions: [],
  },
  scheduledActivities: [],
  league: {
    season: 0,
    rankings: [],
    records: {},
  },
  ongoingBattle: null,
};

export const initSim = async () => {
  console.log('initSim');
  Object.assign(gs, defaultGameState);
  setSceneEvents();
  newLeagueSeason();
};
