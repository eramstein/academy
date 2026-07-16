import { BASE_DECK, BASE_DECK2 } from '@/data/base-deck';
import { config } from '../_config';
import { AiTurnStrategy, type BattleState, type Card, type Deck, type Land } from '../_model';
import { bs, gs } from '../_state';
import { drawCard, shuffleDeck } from './deck';
import { initColorsFromLands } from './land';
import { playAiTurn } from './ai/ai';

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

export const initBattle = (
  foeKey: string = 'administrator',
  playerDeck: Deck = BASE_DECK,
  foeDeck: Deck = BASE_DECK2
) => {
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
      deck: shuffleDeck(loadDeckCards(playerDeck, 0)),
      graveyard: [],
      colors: {},
      lands: loadDeckLands(playerDeck, 0),
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
      deck: shuffleDeck(loadDeckCards(foeDeck, 1)),
      graveyard: [],
      colors: {},
      lands: loadDeckLands(foeDeck, 1),
      abilityUsed: false,
    },
  ];
  for (let i = 0; i < config.initialHandSize; i++) {
    drawCard(bs.players[0]);
    drawCard(bs.players[1]);
  }
  bs.players[0].hand.sort((a, b) => a.cost - b.cost);
  initColorsFromLands(bs.players[0]);
  initColorsFromLands(bs.players[1]);
  // playersStartWithSameMana();
  if (!bs.isPlayersTurn) {
    playAiTurn();
  }
};

function playersStartWithSameMana() {
  if (bs.isPlayersTurn) {
    bs.players[0].mana = config.initialMana;
    bs.players[0].maxMana = config.initialMana;
    bs.players[1].mana = config.initialMana - 1;
    bs.players[1].maxMana = config.initialMana - 1;
  } else {
    bs.players[1].mana = config.initialMana;
    bs.players[1].maxMana = config.initialMana;
    bs.players[0].mana = config.initialMana - 1;
    bs.players[0].maxMana = config.initialMana - 1;
  }
}

function loadDeckCards(deck: Deck, ownerPlayerId: number): Card[] {
  const deckCards: Card[] = [];
  for (const card of deck.cards) {
    deckCards.push({
      ...card,
      ownerPlayerId: ownerPlayerId,
      instanceId: crypto.randomUUID(),
    } as Card);
  }
  return deckCards;
}

function loadDeckLands(deck: Deck, ownerPlayerId: number): Land[] {
  const deckLands: Land[] = [];
  for (const [index, land] of deck.lands.entries()) {
    deckLands.push({
      ...land,
      ownerPlayerId: ownerPlayerId,
      instanceId: crypto.randomUUID(),
      position: index,
      isRuined: false,
    } as Land);
  }
  return deckLands;
}
