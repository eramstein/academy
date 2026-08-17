import type { Player } from '../_model';
import { bs } from '../_state';
import { getAiPlayer } from './player';

export function checkIfPlayerLost(player: Player) {
  if (player.life <= 0) {
    bs.playerIdWon = player.id === 0 ? 1 : 0;
    endBattle();
  }
}

export function endBattle(concession: boolean = false) {
  if (concession) {
    bs.playerIdWon = getAiPlayer().id;
  }
}
