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

export type SimDataTab =
  | 'scene'
  | 'player'
  | 'characters'
  | 'schedule'
  | 'places'
  | 'collection'
  | 'decks'
  | 'league';

export type UiState = {
  currentView: UiView;
  navigationVisible: boolean;
  sim: {
    dataTab: SimDataTab;
    selectedCharacterKey: string | null;
    characterBackTab: SimDataTab | null;
    selectedPlaceKey: string | null;
  };
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
    draggingCard: Card | null;
  };
  modal: {
    visible: boolean;
    title: string;
    body: string;
    onConfirm?: () => void;
    onCancel?: () => void;
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
  deckEditor: {
    visible: boolean;
    deckKey: string | null;
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
  cardEditor: {
    card: CardTemplate | null;
  };
};

export enum UiView {
  Scene = 'Scene',
  Analytics = 'Analytics',
  EventEditor = 'EventEditor',
  Battle = 'Battle',
}
