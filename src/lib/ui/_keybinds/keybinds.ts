import {
  gs,
  loadGameStateFromLocalStorage,
  resetBattleState,
  saveStateToLocalStorage,
} from '../../_state';
import { uiState } from '../../_state/state-ui.svelte';
import { handleEndTurn } from '../_helpers/end-turn';

export function handleKeybinds(event: KeyboardEvent) {
  // Skip keybinds if user is typing in an input field
  const target = event.target as HTMLElement;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]'))
  ) {
    return;
  }

  if (event.key === 'F4') {
    event.preventDefault();
    const loadedState = loadGameStateFromLocalStorage('quicksave');
    console.log('State reloaded from localStorage', loadedState);
  } else if (event.key === 'F5') {
    event.preventDefault();
    saveStateToLocalStorage();
    console.log('State saved to localStorage');
  } else if (event.key === 'r') {
    event.preventDefault();
    resetBattleState();
    console.log('Battle state reset');
  } else if (event.key === 'Escape') {
    event.preventDefault();
    uiState.navigationVisible = !uiState.navigationVisible;
  } else if (event.key === ' ') {
    event.preventDefault();
    handleEndTurn();
  } else if (event.key === '^') {
    event.preventDefault();
    uiState.consoleCommand.visible = !uiState.consoleCommand.visible;
  }
}
