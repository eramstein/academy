import { usePlayerColorAbility } from '@/lib/battle';
import { isPayableAfterColorIncrementation } from '@/lib/battle/cost';
import type { Card, Position, SpellCard } from '@lib/_model';
import { isSpellCard, isUnitCard } from '@lib/_model';
import { bs, uiState } from '@lib/_state';
import { isOnPlayersSide } from '@lib/battle/boards';
import { deployUnit } from '@lib/battle/unit';
import { toggleUnitSelection } from '@lib/ui/_helpers/selections';
import { activateSpell, targetCell, targetUnit } from '@lib/ui/_helpers/targetting';

export function isNoTargetSpell(card: Card | null | undefined): card is SpellCard {
  if (!card || !isSpellCard(card)) return false;
  return !card.actions.some((action) => action.targets && action.targets.length > 0);
}

/** Resolve board cell under the cursor (works with stage transform:scale). */
export function findCellAtPoint(
  clientX: number,
  clientY: number
): { row: number; column: number } | null {
  const boardEl = document.querySelector('.board-container');
  if (!boardEl) return null;
  for (const el of boardEl.querySelectorAll<HTMLElement>('.board-cell')) {
    const rect = el.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX < rect.right &&
      clientY >= rect.top &&
      clientY < rect.bottom
    ) {
      return { row: Number(el.dataset.row), column: Number(el.dataset.column) };
    }
  }
  return null;
}

export function isPointOnBoard(clientX: number, clientY: number): boolean {
  const boardEl = document.querySelector('.board-container');
  if (!boardEl) return false;
  const rect = boardEl.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX < rect.right &&
    clientY >= rect.top &&
    clientY < rect.bottom
  );
}

function playNoTargetSpell(card: SpellCard) {
  const colorRequirementMet = isPayableAfterColorIncrementation(card);
  if (colorRequirementMet === false) return;
  if (colorRequirementMet !== true) {
    usePlayerColorAbility(bs.players[card.ownerPlayerId], colorRequirementMet);
  }
  activateSpell(card);
}

function playCardAt(card: Card, row: number, column: number) {
  const position: Position = { row, column };
  const colorRequirementMet = isPayableAfterColorIncrementation(card);

  if (colorRequirementMet === false) return;

  if (isUnitCard(card)) {
    if (isOnPlayersSide(position, card.ownerPlayerId)) {
      if (colorRequirementMet !== true) {
        usePlayerColorAbility(bs.players[card.ownerPlayerId], colorRequirementMet);
      }
      deployUnit(card, position);
      if (card.keywords?.haste) {
        toggleUnitSelection(bs.units[bs.units.length - 1]);
      }
    }
  } else if (isSpellCard(card)) {
    if (isNoTargetSpell(card)) {
      playNoTargetSpell(card);
      return;
    }

    if (colorRequirementMet !== true) {
      usePlayerColorAbility(bs.players[card.ownerPlayerId], colorRequirementMet);
    }

    activateSpell(card);

    const unitAtPosition = bs.units.find(
      (u) => u.position.row === row && u.position.column === column
    );
    if (unitAtPosition) {
      targetUnit(unitAtPosition);
    } else {
      targetCell(position);
    }
  }
}

/**
 * Resolve a hand-card drag drop. Must run from the gesture that started the drag
 * (Card pointerup) — Board $effect listeners can miss a fast release.
 */
export function finishCardDrag(clientX: number, clientY: number) {
  const card = uiState.battle.draggingCard;
  uiState.battle.draggingCard = null;
  if (!card || !bs.isPlayersTurn) return;

  try {
    if (isNoTargetSpell(card) && isPointOnBoard(clientX, clientY)) {
      playNoTargetSpell(card);
      return;
    }

    const cell = findCellAtPoint(clientX, clientY);
    if (cell) {
      playCardAt(card, cell.row, cell.column);
    }
  } catch (error) {
    console.error('Error deploying unit or casting spell:', error);
  }
}
