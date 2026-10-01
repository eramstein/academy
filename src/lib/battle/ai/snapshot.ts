import type { BattleState } from '@/lib/_model';
import { bs, uiState } from '@/lib/_state';

export function snapshotBattle(): BattleState {
  return JSON.parse(JSON.stringify(bs)) as BattleState;
}

/** Replace battle state from a deep clone. Object.assign would keep the previous trial's objects. */
export function replaceBattleState(snapshot: BattleState) {
  const fresh = JSON.parse(JSON.stringify(snapshot)) as BattleState;
  bs.turn = fresh.turn;
  bs.isPlayersTurn = fresh.isPlayersTurn;
  bs.playerIdWon = fresh.playerIdWon;
  bs.players = fresh.players;
  bs.units = fresh.units;
  bs.aiState = {
    strategy: fresh.aiState.strategy,
    goals: fresh.aiState.goals ?? [],
    dismissedCards: { ...(fresh.aiState.dismissedCards ?? {}) },
  };
}

export function resetBattleUiPending() {
  const battle = uiState.battle;
  battle.playedSpell = null;
  battle.playedSpellTargets = null;
  battle.abilityPending = null;
  battle.spellPending = null;
  battle.triggeredAbilityPending = null;
  battle.selectedTargets = [];
  battle.currentEffectIndex = 0;
  battle.currentTargetIndex = 0;
  battle.targetBeingSelected = null;
  battle.attackingUnitId = null;
  battle.colorBeingIncremented = null;
  battle.landAbilityAnimating = null;
  battle.validTargets = null;
}
