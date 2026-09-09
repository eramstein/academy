<script lang="ts">
  import { UiView } from '@/lib/_model';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import { getAssetPath, getDataBackgroundPath, getTableImagePath } from '@/lib/_utils/asset-paths';
  import DeckEditor from './DeckEditor.svelte';
  import Scene from './Scene.svelte';
  import SimData from './SimData.svelte';

  const parchmentPath = getAssetPath('images/parchment.png');
  const tablePath = getTableImagePath();
  const dataBgPath = getDataBackgroundPath();
  const cornerPath = getAssetPath('images/ui/corner.svg');
</script>

<div
  class="sim-container"
  style="--parchment: url('{parchmentPath}'); --table: url('{tablePath}'); --data-bg: url('{dataBgPath}'); --corner: url('{cornerPath}');"
>
  <div class="current-view">
    {#if uiState.currentView === UiView.Scene}
      <Scene />
    {/if}
  </div>
  <div class="table-seam" aria-hidden="true"></div>
  <aside class="sim-data-panel">
    <SimData />
  </aside>
  <DeckEditor />
</div>

<style>
  .sim-container {
    position: relative;
    width: 100%;
    height: 100%;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    display: flex;
    flex-direction: row;
    background: var(--color-wood) var(--table) center / cover;
  }

  .current-view {
    flex: 1 1 45%;
    position: relative;
    width: 45%;
    z-index: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .table-seam {
    flex: 0 0 4px;
    width: 4px;
    align-self: stretch;
    pointer-events: none;
    border-left: 1px solid rgba(212, 180, 128, 0.34);
    background: rgba(6, 3, 0, 0.58);
    box-shadow:
      1px 0 2px rgba(0, 0, 0, 0.5),
      4px 0 7px rgba(0, 0, 0, 0.28);
  }

  .sim-data-panel {
    flex: 1 1 55%;
    width: 55%;
    min-width: 0;
    min-height: 0;
    padding: 24px 24px 24px 12px;
    box-sizing: border-box;
  }
</style>
