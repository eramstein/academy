import { ActionType, type Action, type CardTemplate, type Deck, type Place } from '@/lib/_model';
import { gs } from '@/lib/_state';
import { getGuardianImagePath } from '@/lib/_utils/asset-paths';
import { initBattle } from '@/lib/battle/init';
import { makeUniqueId } from './deck';
import { narrateText } from './narration';

const npcDeckModules = import.meta.glob('@/data/sim/npc_decks/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, { key: string; name: string; cards: CardTemplate[]; lands: CardTemplate[] }>;

function getGuardianDeckBlueprint(guardianKey: string) {
  const path = Object.keys(npcDeckModules).find((modulePath) =>
    modulePath.endsWith(`/${guardianKey}.json`)
  );
  return path ? npcDeckModules[path] : undefined;
}

/** Locked places stay hidden until unlocked. Guardians still gate entry after unlock. */
export function isPlaceVisible(place: Place): boolean {
  return !place.locked;
}

export function placeNeedsGuardian(placeKey: string): boolean {
  const guardian = gs.places[placeKey]?.guardian;
  return !!guardian && !guardian.defeated;
}

/** Build a battle-ready deck + ephemeral collection from the guardian's npc_decks JSON. */
export function loadGuardianBattleDeck(guardianKey: string): {
  deck: Deck;
  collection: CardTemplate[];
} | null {
  const blueprint = getGuardianDeckBlueprint(guardianKey);
  if (!blueprint) return null;

  const collection: CardTemplate[] = [];
  const claim = (template: CardTemplate) => {
    const card = makeUniqueId(template);
    collection.push(card);
    return card;
  };
  const cards = blueprint.cards.map(claim);
  const lands = blueprint.lands.map(claim);
  return {
    deck: {
      key: blueprint.key,
      name: blueprint.name,
      cards: cards.map((c) => c.id),
      lands: lands.map((c) => c.id),
    },
    collection,
  };
}

/** Intercept entry: narrate the guardian and offer a single start-match action. */
export function presentGuardianEncounter(placeKey: string): boolean {
  const place = gs.places[placeKey];
  const guardian = place?.guardian;
  if (!guardian || guardian.defeated) return false;

  gs.scene.selectingNextPlace = false;
  gs.scene.pendingGuardianPlaceKey = placeKey;
  gs.scene.event = undefined;
  gs.scene.manualTriggers = [];
  gs.scene.pendingPeriodEvent = undefined;

  narrateText(guardian.description, {
    title: guardian.name,
    imageUrl: getGuardianImagePath(guardian.key),
    imageSize: 'small',
  });

  const decks = gs.player.decks.map(
    (deck, index) => [String(index), deck.name] as [string, string]
  );
  gs.scene.actions = [
    {
      label: `Challenge ${guardian.name}`,
      actionType: ActionType.StartMatch,
      isLongAction: false,
      actionParameters: {
        opponentKey: guardian.key,
        placeKey,
      },
      missingParameters: {
        playerDeckKey: decks,
      },
    } satisfies Action,
  ];
  return true;
}

export function startGuardianMatch(placeKey: string, playerDeck: Deck): string {
  const place = gs.places[placeKey];
  const guardian = place?.guardian;
  if (!guardian || guardian.defeated) {
    return 'There is no guardian to challenge.';
  }

  const loaded = loadGuardianBattleDeck(guardian.key);
  if (!loaded) {
    return `Missing deck for ${guardian.name}.`;
  }

  gs.ongoingBattle = {
    opponentKey: guardian.key,
    playerDeck,
    opponentDeck: loaded.deck,
    isLeagueMatch: false,
    guardianPlaceKey: placeKey,
    opponentCollection: loaded.collection,
    opponentDisplayName: guardian.name,
  };
  initBattle(guardian.key, playerDeck, loaded.deck, loaded.collection, guardian.name);
  return `You challenge ${guardian.name}.`;
}

/**
 * Apply win/lose after a guardian fight.
 * Caller should run setSceneEvents on `'entered'` and setPossibleActions on `'retry'`.
 */
export function resolveGuardianBattle(won: boolean): 'entered' | 'retry' | null {
  const placeKey = gs.ongoingBattle?.guardianPlaceKey ?? gs.scene.pendingGuardianPlaceKey;
  if (!placeKey) return null;

  const place = gs.places[placeKey];
  const guardian = place?.guardian;
  if (!guardian) return null;

  gs.scene.pendingGuardianPlaceKey = undefined;

  if (won) {
    guardian.defeated = true;
    place.locked = false;
    gs.player.placeKey = placeKey;
    gs.scene.image = undefined;
    narrateText(`You defeat ${guardian.name} and enter ${place.name}.`);
    return 'entered';
  }

  narrateText(`You are defeated by ${guardian.name}. You'll have to retry another day.`);
  gs.time.longActionPerformed = true;
  return 'retry';
}
