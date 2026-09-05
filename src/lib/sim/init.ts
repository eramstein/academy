import { npcs } from '@/data/npcs';
import { PLACES, REGIONS } from '@/data/sim/places';
import { DayPeriod, type GameState } from '../_model';
import { gs } from '../_state';
import { initNpcDecks } from './deck';
import { loadEventTemplates, restoreEventTemplates } from './events';
import { newLeagueSeason } from './league';
import { setSceneEvents } from './scene';

export const defaultGameState: GameState = {
  time: {
    day: 1,
    period: DayPeriod.Morning,
    playedLeagueMatch: false,
    usedActions: {},
    longActionPerformed: false,
  },
  characters: npcs,
  player: {
    key: 'player',
    name: 'Antonio Fibonacci',
    gold: 1000,
    focus: 3,
    maxFocus: 3,
    decks: [],
    collection: [],
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
    cardCrafting: {
      keywords: {
        retaliate: 1,
      },
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
    playedToday: false,
  },
  ongoingBattle: null,
};

export const initSim = async () => {
  console.log('initSim');
  Object.assign(gs, defaultGameState);
  await restoreEventTemplates();
  await loadEventTemplates();
  setSceneEvents();
  newLeagueSeason();
  initNpcDecks();
};
