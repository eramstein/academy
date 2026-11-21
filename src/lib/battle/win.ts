import type { Player } from '../_model';
import { bs } from '../_state';
import { uiState } from '../_state/state-ui.svelte';
import { recordBattleResult } from '../sim/ongoing-battle';
import { getAiPlayer, getHumanPlayer } from './player';

export function checkIfPlayerLost(player: Player) {
  if (player.life <= 0) {
    endBattle(player.id === 0);
  }
}

export function endBattle(won: boolean = false) {
  // Extra damage after lethal (multi-attack, trample, etc.) must not
  // re-record match results or raise the same crafting knowledge again.
  if (bs.playerIdWon !== null) return;
  if (won) {
    bs.playerIdWon = getAiPlayer().id;
  } else {
    bs.playerIdWon = getHumanPlayer().id;
  }
  if (uiState.isHeadless) return;
  recordBattleResult(bs.playerIdWon === 0);
}
