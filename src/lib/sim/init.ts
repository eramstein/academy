import { npcs } from '@/data/npcs';
import { PLACES, REGIONS } from '@/data/sim/places';
import { DayPeriod, ResourceType, type GameState } from '../_model';
import { gs } from '../_state';
import { clearUsedFlavors } from './cards/flavor-generation-pipeline/used-flavors';
import { loadCardTemplates, restoreCardTemplates } from './cards/npc-card-templates';
import { getBasicLands, initNpcDecks } from './deck';
import { loadRumors } from './effects/rumors';
import { loadEventTemplates, restoreEventTemplates } from './events';
import { setSceneEvents } from './scene';

export const defaultGameState: GameState = {
  time: {
    day: 1,
    period: DayPeriod.Morning,
    playedLeagueMatch: false,
    usedActions: {},
    longActionPerformed: false,
  },
  rumors: [],
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
      intelligence: 15,
      vitality: 8,
      charisma: 8,
      aura: 7,
    },
    possessions: [],
    resources: {
      [ResourceType.MagicDust]: 2,
      [ResourceType.Mithril]: 2,
      [ResourceType.Moxes]: 2,
      [ResourceType.MollysBeads]: 0,
      [ResourceType.SchlupakMushrooms]: 0,
      [ResourceType.SchlupakDreamspheres]: 0,
      [ResourceType.SchlupakSpores]: 0,
    },
    subscriptions: {
      academy: 0,
      library: 0,
      inn: 0,
    },
    craftingKnowledge: {
      colors: {
        red: 1,
        green: 1,
        blue: 1,
        black: 1,
      },
      keywords: {},
    },
    craftingSkills: {
      mastery: 1,
      erudition: 1,
      inspiration: 1,
    },
    jobs: [],
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
    manualTriggers: [],
    eventsThisPeriod: 0,
  },
  scheduledActivities: [],
  league: {
    season: 0,
    rankings: [],
    records: {},
    playedToday: false,
    pastWinners: [],
  },
  ongoingBattle: null,
  storyTags: {},
};

export const initSim = async () => {
  console.log('initSim');
  const fresh = structuredClone(defaultGameState);
  Object.assign(gs, fresh);
  gs.player = fresh.player;
  gs.storyTags = {};
  await clearUsedFlavors();
  await restoreEventTemplates();
  await loadEventTemplates();
  await restoreCardTemplates();
  await loadCardTemplates();
  loadRumors();
  getBasicLands();
  setSceneEvents();
  initNpcDecks();
};
