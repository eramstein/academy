import { npcs } from '@/data/npcs';
import { PLACES, REGIONS } from '@/data/sim/places';
import { DayPeriod, ResourceType, type GameState } from '../_model';
import { gs } from '../_state';
import { loadArtifacts } from './artifacts';
import { clearUsedFlavors } from './cards/flavor-generation-pipeline/used-flavors';
import { loadCardTemplates, restoreCardTemplates } from './cards/npc-card-templates';
import { initChatTopics } from './chat-topics';
import { getBasicLands, initNpcDecks } from './deck';
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
  characters: npcs,
  player: {
    key: 'player',
    name: 'Antonio Fibonacci',
    gold: 2000,
    focus: 3,
    maxFocus: 3,
    artifactProgress: [],
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
    artifacts: {
      patterns: [],
      tools: [],
      trinkets: [],
    },
    equippedArtifacts: { tool: null, trinket: null },
    resources: {
      [ResourceType.MagicDust]: 2,
      [ResourceType.Silver]: 2,
      [ResourceType.Moxes]: 2,
      [ResourceType.MollysBeads]: 0,
      [ResourceType.SchlupakMushrooms]: 0,
      [ResourceType.Dreamspheres]: 2,
      [ResourceType.SchlupakSpores]: 0,
      [ResourceType.SchlupakHoney]: 0,
      [ResourceType.Mithril]: 2,
      [ResourceType.IthildinCrystal]: 2,
    },
    subscriptions: {
      academy: 0,
      library: 0,
      inn: 0,
    },
    craftingKnowledge: {
      keywords: {},
    },
    colorMasteryPoints: {
      green: 10,
      red: 10,
      blue: 10,
      black: 10,
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
  chatTopics: [],
  chatTopicTexts: [],
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
  loadArtifacts();
  await initChatTopics();
  getBasicLands();
  setSceneEvents();
  initNpcDecks();
};
