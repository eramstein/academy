import { uiState } from '../../_state';
import { isAttackingLand, isAttackingPlayer, isAttackingUnitDeployed, type UnitDeployed } from '../../_model';
import { canAttack, validAttackTargets } from '@/lib/battle/combat';
import { canMove, validMoveTargets } from '@/lib/battle/move';
import { isUnitsTurn } from '@/lib/battle/player';

export function toggleUnitSelection(unit: UnitDeployed) {
  if (!isUnitsTurn(unit)) return;
  if (uiState.battle.selectedUnit?.instanceId === unit.instanceId) {
    uiState.battle.selectedUnit = null;
    uiState.battle.validTargets = null;
    return;
  }
  uiState.battle.selectedUnit = unit;
  setUnitsTargets(unit);
}

export function setUnitsTargets(unit: UnitDeployed) {
  uiState.battle.validTargets = {
    units: {},
    lands: {},
    players: {},
    cells: {},
  };
  if (canAttack(unit)) {
    const validTargets = validAttackTargets(unit);
    validTargets.forEach((target) => {
      if (isAttackingUnitDeployed(target)) {
        uiState.battle.validTargets!.units![target.instanceId] = true;
      } else if (isAttackingLand(target)) {
        uiState.battle.validTargets!.lands![target.instanceId] = true;
      } else if (isAttackingPlayer(target)) {
        uiState.battle.validTargets!.players![target.id] = true;
      }
    });
  }
  if (canMove(unit)) {
    uiState.battle.validTargets!.cells = validMoveTargets(unit);
  }
}

export function clearSelections() {
  uiState.battle.selectedUnit = null;
  uiState.battle.validTargets = null;
}
