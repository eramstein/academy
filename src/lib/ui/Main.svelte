<script lang="ts">
  import { bs, gs } from '../_state';
  import Battle from './battle/Battle.svelte';
  import ConsoleCommand from './ConsoleCommand.svelte';
  import ModalHost from './ModalHost.svelte';
  import Sim from './sim/Sim.svelte';
  import Toast from './Toast.svelte';
</script>

<ModalHost />
<div class="main">
  <div class="scene-container">
    {#if gs.ongoingBattle && bs.turn > 0}
      <Battle />
    {:else}
      <Sim />
    {/if}
  </div>

  <!-- Tooltip portal - all tooltips will be rendered here -->
  <div id="tooltip-portal" class="tooltip-portal"></div>
</div>

<!-- Toast notifications -->
<Toast />

<!-- Console command overlay -->
<ConsoleCommand />

<style>
  .main {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .scene-container {
    width: 100%;
    height: 100%;
  }

  .tooltip-portal {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 999999;
  }
</style>
