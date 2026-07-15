import { UiView, type UiState } from '../_model/model-ui';

export const defaultUiState: UiState = {
  currentView: UiView.Scene,
  navigationVisible: false,
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
    displayChat: false,
    draggingCard: null,
  },
  modal: {
    visible: false,
    title: '',
    body: '',
    onConfirm: undefined,
    onCancel: undefined,
    custom: null,
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
  toast: {
    visible: false,
    message: '',
    type: 'info' as const,
  },
  consoleCommand: {
    visible: false,
  },
  isHeadless: false,
  suppressAnimations: false,
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
