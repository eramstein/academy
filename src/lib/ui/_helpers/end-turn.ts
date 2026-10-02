import { saveStateToLocalStorage } from '../../_state';
import { nextTurn } from '../../battle/turn';

export function handleEndTurn() {
  saveStateToLocalStorage();
  nextTurn();
}
