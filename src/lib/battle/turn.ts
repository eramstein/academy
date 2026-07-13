import type { Player, UnitDeployed } from '../_model';
import { bs } from '../_state';
import { uiState } from '../_state/state-ui.svelte';
import { clearSelections } from '../ui/_helpers/selections';
import { playAiTurn } from './ai/ai';
import { autoAttack } from './combat';
import { drawCard } from './deck';
import { onTurnStart } from './listeners';
import { gainGold } from './player';
import { soundManager } from './sound';
import { removeTemporaryEffects } from './temporary-effects';
import { damageUnit, healUnit } from './unit';

export function nextTurn() {
  if (!uiState.isHeadless) clearSelections();
  const previousPlayer = bs.isPlayersTurn ? bs.players[0] : bs.players[1];
  updateGold(previousPlayer);
  updateStatuses(previousPlayer);
  bs.turn++;
  bs.isPlayersTurn = !bs.isPlayersTurn;
  const player = bs.isPlayersTurn ? bs.players[0] : bs.players[1];
  initPlayerTurn(player);
  onTurnStart(player);
  if (!bs.isPlayersTurn) {
    if (!uiState.isHeadless) soundManager.playSound('button');
    playAiTurn();
  }
}

function initPlayerTurn(player: Player) {
  player.maxMana++;
  player.mana = player.maxMana;
  player.abilityUsed = false;
  updateUnits(player);
  drawCard(player);
}

// if some mana wasn't used, get 1 gold
function updateGold(player: Player) {
  if (player.mana > 0) {
    gainGold(player, 1);
    player.mana = 0;
  }
}

function updateStatuses(player: Player) {
  bs.units
    .filter((unit) => unit.ownerPlayerId === player.id)
    .forEach((unit) => {
      statuses(unit);
    });
}

function updateUnits(player: Player) {
  bs.units
    .filter((unit) => unit.ownerPlayerId === player.id)
    .forEach((unit) => {
      unit.hasAttacked = false;
      unit.hasMoved = false;
      unit.exhausted = false;
      removeTemporaryEffects(unit);
      hotAndDot(unit);
      forcedActions(unit);
    });
}

function hotAndDot(unit: UnitDeployed) {
  let hpChange = (unit.keywords?.regeneration || 0) - (unit.statuses.poison || 0);
  if (hpChange < 0) {
    damageUnit(unit, -hpChange);
  }
  if (hpChange > 0) {
    healUnit(unit, hpChange);
  }
}

function statuses(unit: UnitDeployed) {
  if (unit.statuses.mezz && unit.statuses.mezz > 0) {
    unit.statuses.mezz--;
  }
  if (unit.statuses.stun && unit.statuses.stun > 0) {
    unit.statuses.stun--;
  }
  if (unit.statuses.root && unit.statuses.root > 0) {
    unit.statuses.root--;
  }
  if (unit.statuses.daze && unit.statuses.daze > 0) {
    unit.statuses.daze--;
  }
}

function forcedActions(unit: UnitDeployed) {
  if (unit.keywords?.zerk) {
    autoAttack(unit);
  }
}
