<script lang="ts">
  import {
    getPieceDisplayName,
    getPieceIconCell,
    getPieceIconSheetCols,
    getPieceIconSheetPath,
    getPieceIconSheetRows,
  } from '@/lib/_utils/asset-paths';

  let { name }: { name: string } = $props();

  const sheetPath = getPieceIconSheetPath();
  const cols = getPieceIconSheetCols();
  const rows = getPieceIconSheetRows();
  const cell = $derived(getPieceIconCell(name));
  const label = $derived(getPieceDisplayName(name));
</script>

<span class="piece-icon" role="img" aria-label={label}>
  {#if cell}
    <span
      class="crop"
      style:--cols={cols}
      style:--rows={rows}
      style:--col={cell.col}
      style:--row={cell.row}
    >
      <img src={sheetPath} alt="" draggable="false" />
    </span>
  {:else}
    <span class="fallback" aria-hidden="true">{label.slice(0, 1)}</span>
  {/if}
</span>

<style>
  .piece-icon {
    display: block;
    width: 100%;
    height: 100%;
  }

  .crop {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transform: translateZ(0);
  }

  .crop img {
    position: absolute;
    width: calc(var(--cols) * 100%);
    height: calc(var(--rows) * 100%);
    max-width: none;
    left: calc(var(--col) * -100%);
    top: calc(var(--row) * -100%);
    pointer-events: none;
    user-select: none;
  }

  .fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-family: var(--font-narrative);
    font-size: 1.4rem;
    color: var(--color-ink-muted);
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
  }
</style>
