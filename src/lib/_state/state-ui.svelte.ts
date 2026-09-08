import { UiView, type UiState } from '@/lib/_model';

export const defaultUiState: UiState = {
  currentView: UiView.Scene,
  navigationVisible: false,
  sim: {
    dataTab: 'scene',
    selectedCharacterKey: null,
    characterBackTab: null,
    selectedPlaceKey: null,
  },
  battle: {
    selectedUnit: null,
    validTargets: null,
    abilityPending: null,
    spellPending: null,
    triggeredAbilityPending: null,
    selectedTargets: [],
    currentTargetIndex: 0,
    targetBeingSelected: null,
    attackingUnitId: null,
    playedSpell: null,
    playedSpellTargets: null,
    colorBeingIncremented: null,
    graveyardModal: {
      visible: false,
      playerId: null,
    },
    deckModal: {
      visible: false,
      playerId: null,
    },
    currentEffectIndex: 0,
    draggingCard: null,
  },
  modal: {
    visible: false,
    title: '',
    body: '',
    onConfirm: undefined,
    onCancel: undefined,
  },
  cardFullOverlay: {
    visible: false,
    card: null,
  },
  confirmPopover: {
    visible: false,
    title: '',
    body: '',
    anchorEl: null as unknown as HTMLElement | null,
    onConfirm: undefined,
    onCancel: undefined,
  },
  saveManagerModal: {
    visible: false,
  },
  deckEditor: {
    visible: false,
    deckKey: null,
  },
  toast: {
    visible: false,
    message: '',
    type: 'info' as const,
  },
  consoleCommand: {
    visible: false,
  },
  isHeadless: false,
  cardEditor: {
    card: null,
  },
};

export const uiState: UiState = $state(defaultUiState);

export const resetUiState = (): void => {
  Object.assign(uiState, structuredClone(defaultUiState));
};

export function showToast(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  uiState.toast.message = message;
  uiState.toast.type = type;
  uiState.toast.visible = true;
}

export function hideToast() {
  uiState.toast.visible = false;
}

export function selectSimCharacter(characterKey: string) {
  uiState.sim.characterBackTab = uiState.sim.dataTab;
  uiState.sim.dataTab = 'characters';
  uiState.sim.selectedCharacterKey = characterKey;
}

export function clearSelectedSimCharacter() {
  const backTab = uiState.sim.characterBackTab ?? 'characters';
  uiState.sim.selectedCharacterKey = null;
  uiState.sim.characterBackTab = null;
  uiState.sim.dataTab = backTab;
}

export function selectSimPlace(placeKey: string) {
  uiState.sim.dataTab = 'places';
  uiState.sim.selectedPlaceKey = placeKey;
}

export function clearSelectedSimPlace() {
  uiState.sim.selectedPlaceKey = null;
}
