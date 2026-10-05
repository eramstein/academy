<script lang="ts">
  import { usePlayerColorAbility } from '@/lib/battle';
  import { isPayableAfterColorIncrementation } from '@/lib/battle/cost';
  import { config } from '@lib/_config';
  import type { Card, Position } from '@lib/_model';
  import { isUnitCard } from '@lib/_model';
  import { bs, uiState } from '@lib/_state';
  import { getPositionKey, isOnPlayersSide } from '@lib/battle/boards';
  import { moveUnit } from '@lib/battle/move';
  import { deployUnit } from '@lib/battle/unit';
  import {
    clearSelections,
    setUnitsTargets,
    toggleUnitSelection,
  } from '@lib/ui/_helpers/selections';
  import { activateSpell, targetCell, targetUnit } from '@lib/ui/_helpers/targetting';
  import { getPlaymatPath } from '@lib/_utils/asset-paths';
  import { fly } from 'svelte/transition';
  import Land from './Land.svelte';
  import UnitDeployed from './UnitDeployed.svelte';

  /** Slot size and the felt gaps around them. Shared by the grid and unit placement. */
  const CELL = 140;
  const GAP = 6;
  const LAND_GAP = 10;
  const MIDDLE_GAP = 88;
  const PLAYMAT_ASPECT = 1576 / 831;

  const gridWidth =
    (config.boardColumns + 2) * CELL + 2 * LAND_GAP + (config.boardColumns - 1) * GAP + MIDDLE_GAP;
  const gridHeight = config.boardRows * CELL + (config.boardRows - 1) * GAP;
  const playmatHeight = gridHeight + 120;
  const playmatWidth = Math.round(playmatHeight * PLAYMAT_ASPECT) - 100;

  // Create arrays for rows and columns based on config
  const rows = Array.from({ length: config.boardRows }, (_, i) => i);
  const columns = Array.from({ length: config.boardColumns }, (_, i) => i);
  // Calculate the middle column index for the gap
  const middleColumnIndex = Math.floor(config.boardColumns / 2) - 1;

  // Get lands from battle state
  const leftLands = $derived(bs.players[0]?.lands || []);
  const rightLands = $derived(bs.players[1]?.lands || []);

  // Create maps of position to land for efficient lookup
  const leftLandsByPosition = $derived(() => {
    const map = new Map<number, (typeof leftLands)[0]>();
    for (const land of leftLands) {
      map.set(land.position, land);
    }
    return map;
  });

  const rightLandsByPosition = $derived(() => {
    const map = new Map<number, (typeof rightLands)[0]>();
    for (const land of rightLands) {
      map.set(land.position, land);
    }
    return map;
  });

  // Function to get land at a specific position
  function getLeftLandAtPosition(position: number) {
    return leftLandsByPosition().get(position);
  }

  function getRightLandAtPosition(position: number) {
    return rightLandsByPosition().get(position);
  }

  // Track drag state for each cell
  let dragOverCell = $state<{ row: number; column: number } | null>(null);
  let boardEl: HTMLDivElement | null = $state(null);

  /** Resolve board cell under the cursor (works with stage transform:scale). */
  function findCellAtPoint(clientX: number, clientY: number): { row: number; column: number } | null {
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

  function playCardAt(card: Card, row: number, column: number) {
    try {
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
      } else if (card.type === 'spell') {
        const spellCard = card as any;
        if (colorRequirementMet !== true) {
          usePlayerColorAbility(bs.players[card.ownerPlayerId], colorRequirementMet);
        }

        activateSpell(spellCard);

        const hasTargets = spellCard.actions.some(
          (action: any) => action.targets && action.targets.length > 0
        );
        if (hasTargets) {
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
    } catch (error) {
      console.error('Error deploying unit or casting spell:', error);
    }
  }

  function dropCardAt(row: number, column: number) {
    dragOverCell = null;
    const card = uiState.battle.draggingCard;
    uiState.battle.draggingCard = null;
    if (card && bs.isPlayersTurn) {
      playCardAt(card, row, column);
    }
  }

  // Pointer drag tracking (works with scaled layouts; HTML5 DnD is unreliable here).
  $effect(() => {
    if (!uiState.battle.draggingCard) {
      dragOverCell = null;
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!bs.isPlayersTurn) return;
      dragOverCell = findCellAtPoint(event.clientX, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      const cell = findCellAtPoint(event.clientX, event.clientY);
      if (cell) {
        dropCardAt(cell.row, cell.column);
      } else {
        dragOverCell = null;
        uiState.battle.draggingCard = null;
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dragOverCell = null;
    };
  });

  // Function to check if a position is a valid move target
  function isValidMoveTarget(row: number, column: number) {
    const positionKey = getPositionKey({ row, column });
    return uiState.battle.validTargets?.cells?.[positionKey] === true;
  }

  // Units are absolutely positioned over the land column plus the main grid.
  function getUnitPosition(unit: (typeof bs.units)[0]) {
    const left =
      CELL +
      LAND_GAP +
      unit.position.column * (CELL + GAP) +
      (unit.position.column > middleColumnIndex ? MIDDLE_GAP : 0);
    const top = unit.position.row * (CELL + GAP);
    return { left, top };
  }

  // Click handler for board cells
  function handleCellClick(row: number, column: number) {
    const selectedUnit = uiState.battle.selectedUnit;
    // If an ability is pending and this cell is a valid target, use targetCell
    if (uiState.battle.targetBeingSelected) {
      targetCell({ row, column });
      return;
    }
    if (selectedUnit && isValidMoveTarget(row, column)) {
      const targetPosition: Position = { row, column };
      moveUnit(selectedUnit, targetPosition);
      if (selectedUnit.keywords?.moveAndAttack && !selectedUnit.hasAttacked) {
        setUnitsTargets(selectedUnit);
      } else {
        clearSelections();
      }
    }
  }
</script>

<div
  class="playmat"
  style="--cell: {CELL}px; --gap: {GAP}px; --land-gap: {LAND_GAP}px; --middle-gap: {MIDDLE_GAP}px; --mat-w: {playmatWidth}px; --mat-h: {playmatHeight}px;"
>
  <!-- Art + shadow on a non-interactive layer so filter hit-testing can't steal hand events. -->
  <div
    class="playmat-art"
    style="background-image: url('{getPlaymatPath()}');"
    aria-hidden="true"
  ></div>
  <div class="board-container" bind:this={boardEl}>
  <!-- Left column -->
  <div class="side-column left-column">
    {#each rows as row}
      <div class="side-cell" data-row={row} data-side="left">
        {#if getLeftLandAtPosition(row)}
          <Land land={getLeftLandAtPosition(row)!} />
        {/if}
      </div>
    {/each}
  </div>

  <!-- Main board -->
  <div class="board" style="--middle-column: {middleColumnIndex}">
    {#each rows as row}
      <div class="board-row">
        {#each columns as column}
          <div
            class="board-cell"
            class:middle-gap={column === middleColumnIndex}
            class:drag-over={dragOverCell?.row === row && dragOverCell?.column === column}
            class:valid-move-target={isValidMoveTarget(row, column)}
            data-row={row}
            data-column={column}
            onclick={() => handleCellClick(row, column)}
          ></div>
        {/each}
      </div>
    {/each}
  </div>

  <!-- Right column -->
  <div class="side-column right-column">
    {#each rows as row}
      <div class="side-cell" data-row={row} data-side="right">
        {#if getRightLandAtPosition(row)}
          <Land land={getRightLandAtPosition(row)!} />
        {/if}
      </div>
    {/each}
  </div>
  {#each bs.units as unit (unit.instanceId)}
    {@const position = getUnitPosition(unit)}
    {@const isAiUnit = unit.ownerPlayerId === 1}
    <div
      class="unit-container"
      style="left: {position.left}px; top: {position.top}px; width: {CELL}px; height: {CELL}px;"
      class:drag-over={dragOverCell?.row === unit.position.row &&
        dragOverCell?.column === unit.position.column}
      in:fly={isAiUnit ? { y: 0, x: 200, duration: 600 } : undefined}
      out:fly={{ y: 0, x: isAiUnit ? 200 : -200, duration: 350 }}
    >
      <UnitDeployed {unit} />
    </div>
  {/each}
  </div>
</div>

<style>
  .playmat {
    position: relative;
    width: var(--mat-w);
    height: var(--mat-h);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .playmat-art {
    position: absolute;
    inset: 0;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    filter: drop-shadow(0 16px 14px rgba(0, 0, 0, 0.55)) drop-shadow(0 3px 2px rgba(0, 0, 0, 0.5));
    pointer-events: none;
    z-index: 0;
  }

  .board-container {
    position: relative;
    z-index: 1;
    display: flex;
    gap: var(--land-gap);
  }

  .side-column {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }

  .side-cell,
  .board-cell {
    width: var(--cell);
    height: var(--cell);
    box-sizing: border-box;
    border-radius: 5px;
    border: 1px solid rgba(214, 184, 120, 0.28);
    background: rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    cursor: pointer;
  }

  .side-cell:hover,
  .board-cell:hover {
    border-color: rgba(232, 208, 150, 0.45);
    background: rgba(0, 0, 0, 0.2);
  }

  .side-cell:active,
  .board-cell:active {
    background: rgba(0, 0, 0, 0.28);
  }

  .board {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
  }

  .board-row {
    display: flex;
    gap: var(--gap);
  }

  .board-cell.middle-gap {
    margin-right: var(--middle-gap);
  }

  .board-cell.drag-over {
    border-color: rgba(191, 161, 74, 0.85);
    background: linear-gradient(180deg, rgba(191, 161, 74, 0.22), rgba(191, 161, 74, 0.08));
    box-shadow:
      inset 0 0 16px rgba(191, 161, 74, 0.4),
      0 0 8px rgba(191, 161, 74, 0.35);
  }

  .board-cell.valid-move-target {
    border-color: rgba(120, 190, 110, 0.9);
    box-shadow:
      inset 0 0 16px rgba(76, 175, 80, 0.4),
      0 0 8px rgba(76, 175, 80, 0.4);
  }

  .unit-container {
    position: absolute;
    box-sizing: border-box;
    pointer-events: auto;
    z-index: 10;
    transition:
      left 0.3s ease,
      top 0.3s ease;
  }

  .unit-container.drag-over {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
</style>
