import type { Player } from '../_model';
import { bs } from '../_state';
import { uiState } from '../_state/state-ui.svelte';
import { recordBattleResult } from '../sim/ongoing-battle';
import { getAiPlayer, getHumanPlayer } from './player';

export function checkIfPlayerLost(player: Player) {
  if (player.life <= 0) {
    bs.playerIdWon = player.id === 0 ? 1 : 0;
    endBattle();
  }
}

export function endBattle(concession: boolean = false) {
  if (concession) {
    bs.playerIdWon = getAiPlayer().id;
  } else {
    bs.playerIdWon = getHumanPlayer().id;
  }
  if (uiState.isHeadless) return;
  recordBattleResult(bs.playerIdWon === 0);
}
