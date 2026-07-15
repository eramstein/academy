import type { CardColor } from './enums-battle';
import type {
  Ability,
  Card,
  CardTemplate,
  EffectTargets,
  Land,
  SpellCard,
  SpellCardTemplate,
  TargetDefinition,
  UnitDeployed,
} from './model-battle';

export type UiState = {
  currentView: UiView;
  navigationVisible: boolean;
  battle: {
    selectedUnit: UnitDeployed | null;
    validTargets: {
      units?: Record<string, boolean>;
      lands?: Record<string, boolean>;
      players?: Record<number, boolean>;
      cells?: Record<string, boolean>;
      cards?: Record<string, boolean>;
    } | null;
    abilityPending: { unit?: UnitDeployed; land?: Land; ability: Ability } | null;
    spellPending: SpellCard | null;
    triggeredAbilityPending: { unit: UnitDeployed; ability: Ability; triggerParams: any } | null;
    selectedTargets: EffectTargets[][];
    currentEffectIndex: number;
    currentTargetIndex: number;
    targetBeingSelected: TargetDefinition | null;
    attackingUnitId: string | null;
    playedSpell: SpellCardTemplate | null;
    playedSpellTargets: EffectTargets[][] | null;
    colorBeingIncremented: CardColor | null;
    graveyardModal: {
      visible: boolean;
      playerId: number | null;
    };
    deckModal: {
      visible: boolean;
      playerId: number | null;
    };
    displayChat: boolean;
    draggingCard: Card | null;
  };
  modal: {
    visible: boolean;
    title: string;
    body: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    custom?: {
      component: any;
      props?: Record<string, any>;
      width?: number;
      height?: number;
      overlayOpacity?: number; // 0..1, default 0.7
      closeOnOutsideClick?: boolean;
    } | null;
  };
  cardFullOverlay: {
    visible: boolean;
    card: CardTemplate | null;
  };
  confirmPopover: {
    visible: boolean;
    title: string;
    body: string;
    anchorEl: HTMLElement | null;
    onConfirm?: () => void;
    onCancel?: () => void;
  };
  saveManagerModal: {
    visible: boolean;
  };
  toast: {
    visible: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  };
  consoleCommand: {
    visible: boolean;
  };
  isHeadless?: boolean;
  suppressAnimations?: boolean;
  cardEditor: {
    card: CardTemplate | null;
  };
};

export enum UiView {
  Scene = 'Scene',
  Analytics = 'Analytics',
  CardBuilder = 'CardBuilder',
  Battle = 'Battle',
}
