<script lang="ts">
  import type { ResourceType } from '@/lib/_model/enums-sim';
  import {
    getResourceIconCell,
    getResourceIconSheetCols,
    getResourceIconSheetPath,
    getResourceIconSheetRows,
  } from '@/lib/_utils/asset-paths';

  let {
    type,
    class: className = '',
    alt = '',
  }: {
    type: ResourceType;
    class?: string;
    alt?: string;
  } = $props();

  const sheetPath = getResourceIconSheetPath();
  const cols = getResourceIconSheetCols();
  const rows = getResourceIconSheetRows();
  const cell = $derived(getResourceIconCell(type));
</script>

<span
  class="resource-icon {className}"
  role={alt ? 'img' : undefined}
  aria-label={alt || undefined}
  aria-hidden={alt ? undefined : true}
  style:--cols={cols}
  style:--rows={rows}
  style:--col={cell.col}
  style:--row={cell.row}
>
  <img src={sheetPath} alt="" draggable="false" />
</span>

<style>
  .resource-icon {
    position: relative;
    display: block;
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    /* Promote a layer so downscales stay sharper than CSS backgrounds. */
    transform: translateZ(0);
  }

  .resource-icon img {
    position: absolute;
    /* One sheet cell fills the crop; left/top % are relative to the crop box. */
    width: calc(var(--cols) * 100%);
    height: calc(var(--rows) * 100%);
    max-width: none;
    left: calc(var(--col) * -100%);
    top: calc(var(--row) * -100%);
    pointer-events: none;
    user-select: none;
  }
</style>
