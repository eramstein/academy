<script lang="ts">
  import { UiView } from '@/lib/_model';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import Scene from './Scene.svelte';
  import SimData from './SimData.svelte';
</script>

<div class="sim-container">
  <div class="current-view">
    {#if uiState.currentView === UiView.Scene}
      <Scene />
    {/if}
  </div>
  <aside class="sim-data-panel">
    <SimData />
  </aside>
</div>

<style>
  .sim-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    color: white;
    display: flex;
    flex-direction: row;
  }

  .current-view {
    flex: 1 1 50%;
    position: relative;
    width: 50%;
    z-index: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .sim-data-panel {
    flex: 1 1 50%;
    width: 50%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
</style>
