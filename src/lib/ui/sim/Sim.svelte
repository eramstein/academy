<script lang="ts">
  import { UiView } from '@/lib/_model';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import Scene from './Scene.svelte';
</script>

<div class="sim-container">
  <div class="current-view">
    {#if uiState.currentView === UiView.Scene}
      <Scene />
    {/if}
  </div>
</div>

<style>
  .sim-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    color: white;
    display: flex;
    flex-direction: column;
  }

  .current-view {
    flex: 1 1 auto;
    position: relative;
    width: 100%;
    z-index: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
