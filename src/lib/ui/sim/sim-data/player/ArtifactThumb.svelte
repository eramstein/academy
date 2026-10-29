<script lang="ts">
  import {
    getArtifactIconCell,
    getArtifactIconSheetCols,
    getArtifactIconSheetPath,
    getArtifactIconSheetRows,
    getAssetPath,
  } from '@/lib/_utils/asset-paths';

  let {
    patternKey,
    image,
    size = 'md',
    muted = false,
    selected = false,
  }: {
    patternKey: string;
    image?: string;
    size?: 'sm' | 'md' | 'fill';
    muted?: boolean;
    selected?: boolean;
  } = $props();

  const cornerPath = getAssetPath('images/ui/decorations/corner.svg');
  const sheetPath = getArtifactIconSheetPath();
  const cols = getArtifactIconSheetCols();
  const rows = getArtifactIconSheetRows();
  const cell = $derived(getArtifactIconCell(image ?? patternKey));
</script>

<span
  class="artifact-thumb"
  class:sm={size === 'sm'}
  class:md={size === 'md'}
  class:fill={size === 'fill'}
  class:muted
  class:selected
  style="--corner: url('{cornerPath}')"
>
  <span class="ornament tl" aria-hidden="true"></span>
  <span class="ornament tr" aria-hidden="true"></span>
  <span class="ornament bl" aria-hidden="true"></span>
  <span class="ornament br" aria-hidden="true"></span>
  <span
    class="inner"
    style:--cols={cols}
    style:--rows={rows}
    style:--col={cell.col}
    style:--row={cell.row}
  >
    <img src={sheetPath} alt="" draggable="false" />
  </span>
</span>

<style>
  .artifact-thumb {
    position: relative;
    display: block;
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 2px;
    background: #0b1018;
    border: 1.5px solid var(--color-brass);
    border-radius: 3px;
    box-shadow:
      0 3px 10px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(191, 161, 74, 0.18),
      inset 0 0 0 1px rgba(240, 230, 200, 0.12);
  }

  .artifact-thumb.sm {
    width: 3.25rem;
    height: 3.25rem;
  }

  .artifact-thumb.md {
    width: 4.5rem;
    height: 4.5rem;
  }

  .artifact-thumb.fill {
    width: 100%;
    height: 100%;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .artifact-thumb.fill .inner {
    background: transparent;
    border-radius: 0;
    box-shadow: none;
  }

  .artifact-thumb.fill .ornament {
    display: none;
  }

  .artifact-thumb.muted {
    opacity: 0.88;
  }

  .artifact-thumb.selected {
    border-color: var(--color-golden);
    box-shadow:
      0 3px 10px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(191, 161, 74, 0.45),
      inset 0 0 0 1px rgba(240, 230, 200, 0.18);
  }

  .artifact-thumb.selected .ornament {
    color: var(--color-golden);
  }

  .inner {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.35);
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.72);
    transform: translateZ(0);
  }

  .inner img {
    position: absolute;
    width: calc(var(--cols) * 100%);
    height: calc(var(--rows) * 100%);
    max-width: none;
    left: calc(var(--col) * -100%);
    top: calc(var(--row) * -100%);
    pointer-events: none;
    user-select: none;
  }

  .ornament {
    position: absolute;
    z-index: 2;
    width: 11px;
    height: 11px;
    pointer-events: none;
    color: var(--color-golden);
    background: currentColor;
    mask: var(--corner) center / contain no-repeat;
    -webkit-mask: var(--corner) center / contain no-repeat;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
  }

  .artifact-thumb.sm .ornament {
    width: 9px;
    height: 9px;
  }

  .artifact-thumb.fill .ornament {
    width: clamp(11px, 11%, 18px);
    height: clamp(11px, 11%, 18px);
  }

  .ornament.tl {
    top: 0;
    left: 0;
  }

  .ornament.tr {
    top: 0;
    right: 0;
    transform: rotate(90deg);
  }

  .ornament.bl {
    bottom: 0;
    left: 0;
    transform: rotate(-90deg);
  }

  .ornament.br {
    bottom: 0;
    right: 0;
    transform: rotate(180deg);
  }
</style>
