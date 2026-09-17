import { config } from '../_config';
import {
  AiTurnStrategy,
  type BattleState,
  type Card,
  type CardTemplate,
  type Deck,
  type Land,
} from '../_model';
import { bs, gs } from '../_state';
import { resolveDeckCards } from '../sim/deck';
import { playAiTurn } from './ai/ai';
import { drawCard, shuffleDeck } from './deck';
import { initColorsFromLands } from './land';

export const defaultBattleState: BattleState = {
  turn: 0,
  isPlayersTurn: true,
  playerIdWon: null,
  players: [],
  units: [],
  aiState: {
    strategy: AiTurnStrategy.Normal,
    goals: [],
    dismissedCards: {},
  },
};

export const initBattle = (foeKey: string = 'administrator', playerDeck: Deck, foeDeck: Deck) => {
  const playerCollection = gs.player.collection;
  const foeCollection = gs.characters[foeKey].collection;

  bs.turn = 1;
  bs.isPlayersTurn = Math.random() > 0.5;
  bs.players = [
    {
      id: 0,
      name: gs.player.key,
      isPlayer: true,
      mana: config.initialMana,
      maxMana: config.initialMana,
      life: config.initialLife,
      hand: [],
      deck: shuffleDeck(loadDeckCards(playerDeck, playerCollection, 0)),
      graveyard: [],
      colors: {},
      lands: loadDeckLands(playerDeck, playerCollection, 0),
      abilityUsed: false,
    },
    {
      id: 1,
      name: foeKey,
      isPlayer: false,
      mana: config.initialMana,
      maxMana: config.initialMana,
      life: config.initialLife,
      hand: [],
      deck: shuffleDeck(loadDeckCards(foeDeck, foeCollection, 1)),
      graveyard: [],
      colors: {},
      lands: loadDeckLands(foeDeck, foeCollection, 1),
      abilityUsed: false,
    },
  ];
  for (let i = 0; i < config.initialHandSize; i++) {
    drawCard(bs.players[0]);
    drawCard(bs.players[1]);
  }
  // starting player draws
  if (bs.isPlayersTurn) {
    drawCard(bs.players[0]);
  } else {
    drawCard(bs.players[1]);
  }
  bs.players[0].hand.sort((a, b) => a.cost - b.cost);
  initColorsFromLands(bs.players[0]);
  initColorsFromLands(bs.players[1]);
  if (!bs.isPlayersTurn) {
    playAiTurn();
  }
};

function loadDeckCards(
  deck: Deck,
  collection: CardTemplate[],
  ownerPlayerId: number
): Card[] {
  return resolveDeckCards(deck.cards, collection).map(
    (card) =>
      ({
        ...card,
        ownerPlayerId,
        instanceId: crypto.randomUUID(),
      }) as Card
  );
}

function loadDeckLands(
  deck: Deck,
  collection: CardTemplate[],
  ownerPlayerId: number
): Land[] {
  return resolveDeckCards(deck.lands, collection).map(
    (land, index) =>
      ({
        ...land,
        ownerPlayerId,
        instanceId: crypto.randomUUID(),
        position: index,
        isRuined: false,
      }) as Land
  );
}
