import { config } from '@/lib/_config';
import {
  AiTurnStrategy,
  CardType,
  isUnitCard,
  type BattleState,
  type Player,
  type SpellCard,
  type UnitCard,
} from '@/lib/_model';
import { bs, uiState } from '@/lib/_state';
import { isBoardSizeFull } from '../boards';
import { canAttack } from '../combat';
import { isPayable } from '../cost';
import { canMove } from '../move';
import { getAiPlayer, usePlayerColorAbility } from '../player';
import { nextTurn } from '../turn';
import AiWorker from './ai.worker?worker';
import { applyCandidate } from './apply';
import { getColorToIncrement, incrementRandomColor } from './colors';
import { getAiGoals } from './goals';
import { usePlayerLandAbility } from './lands';
import { PersonaType, WeightPreset, type AiPersona, type PossibleActions } from './model';
import { AiPersonaToType } from './personas/mappings';
import { chooseAction } from './search';
import { getAiStrategy, getWeightPreset } from './strategy';

const AI_PERSONA: PersonaType = PersonaType.Normal;
const MAX_ACTIONS_SAFETY_NET = 100;
let actionsPlayedthisTurn = 0;
export let simulatedNextTurn: BattleState | null = null;

export function playAiTurn() {
  if (uiState.isHeadless) return;
  actionsPlayedthisTurn = 0;
  if (config.aiPolicy === 'heuristic') {
    playHeuristicTurn();
    return;
  }
  const preset = getWeightPreset();
  bs.aiState.strategy = presetToStrategy(preset);
  bs.aiState.goals = [];
  bs.aiState.dismissedCards = {};
  setTimeout(() => {
    void loopSearch();
  }, 500);
}

async function loopSearch() {
  actionsPlayedthisTurn++;
  if (bs.playerIdWon !== null) return;
  if (actionsPlayedthisTurn > MAX_ACTIONS_SAFETY_NET) {
    console.log('AI safety net, passing', actionsPlayedthisTurn);
    nextTurn();
    return;
  }

  try {
    const decision = await chooseAction();
    if (decision.candidate.kind === 'pass' || bs.playerIdWon !== null) {
      if (bs.playerIdWon === null) nextTurn();
      return;
    }
    applyCandidate(decision.candidate);
  } catch (error) {
    console.warn('AI search failed, passing', error);
    if (bs.playerIdWon === null) nextTurn();
    return;
  }

  if (bs.playerIdWon !== null) return;
  setTimeout(() => {
    void loopSearch();
  }, config.aiActionInterval);
}

function presetToStrategy(preset: WeightPreset): AiTurnStrategy {
  if (preset === WeightPreset.Aggro) return AiTurnStrategy.Attack;
  if (preset === WeightPreset.Defend) return AiTurnStrategy.Defend;
  return AiTurnStrategy.Normal;
}

function playHeuristicTurn() {
  const persona: AiPersona = AiPersonaToType[AI_PERSONA];

  bs.aiState.strategy = getAiStrategy(AI_PERSONA);
  bs.aiState.goals = getAiGoals(AI_PERSONA);
  bs.aiState.dismissedCards = {};

  setTimeout(() => {
    loopAiActions(persona);
  }, 500);
}

async function loopAiActions(persona: AiPersona) {
  actionsPlayedthisTurn++;

  const possibleActions = getPossibleActions(false);
  simulatedNextTurn = await evaluateMove(bs, 'EVALUATE_PASS_TURN');

  if (possibleActions.count === 0 || actionsPlayedthisTurn > MAX_ACTIONS_SAFETY_NET) {
    console.log('No actions screenLeft, passing', actionsPlayedthisTurn);
    nextTurn();
    return;
  }

  if (possibleActions.playerAbility) {
    usePlayerAbility(persona, getAiPlayer());
  } else {
    persona.executeAction(possibleActions);
  }

  if (bs.playerIdWon !== null) {
    return;
  }

  setTimeout(() => {
    loopAiActions(persona);
  }, config.aiActionInterval);
}

function usePlayerAbility(persona: AiPersona, player: Player) {
  const neededColor = getColorToIncrement(player);
  if (neededColor) {
    usePlayerColorAbility(player, neededColor);
  } else {
    const playedAbility = usePlayerLandAbility(player);
    if (!playedAbility) {
      incrementRandomColor(player);
    }
  }
}

function getPossibleActions(isLeaderPlayer: boolean): PossibleActions {
  const leader = isLeaderPlayer ? bs.players[0] : bs.players[1];
  const leaderUnits = bs.units.filter((u) => u.ownerPlayerId === leader.id);
  const boardFull = isBoardSizeFull(leader);
  const deployableUnits = boardFull
    ? []
    : (leader.hand.filter(
        (unit) => isUnitCard(unit) && isPayable(unit) && !bs.aiState.dismissedCards[unit.id]
      ) as UnitCard[]);
  const playableSpells = leader.hand.filter(
    (spell) =>
      spell.type === CardType.Spell && isPayable(spell) && !bs.aiState.dismissedCards[spell.id]
  ) as SpellCard[];
  const unitsWhoCanMove = boardFull ? [] : leaderUnits.filter((unit) => canMove(unit));
  const unitsWhoCanAttack = leaderUnits
    .filter((unit) => canAttack(unit))
    .filter((unit) => unit.power > 0);
  const playerAbility = !leader.abilityUsed;
  return {
    deployableUnits,
    playableSpells,
    unitsWhoCanMove,
    unitsWhoCanAttack,
    playerAbility,
    count:
      deployableUnits.length +
      unitsWhoCanMove.length +
      unitsWhoCanAttack.length +
      playableSpells.length +
      (playerAbility ? 1 : 0),
  };
}

/**
 * Runs a simulation in a worker to see "what if" a certain action is taken.
 */
export async function evaluateMove(
  snapshot: BattleState,
  type: 'EVALUATE_PASS_TURN'
): Promise<BattleState> {
  return new Promise((resolve) => {
    const worker = new AiWorker();

    worker.onmessage = (event) => {
      const { resultingState } = event.data;
      worker.terminate();
      resolve(resultingState);
    };

    worker.postMessage({
      type,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    });
  });
}
