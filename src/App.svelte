<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { UiView } from './lib/_model';
  import { loadGameStateFromLocalStorage, uiState } from './lib/_state';
  import { handleKeybinds } from './lib/ui/_keybinds/keybinds';
  import Main from './lib/ui/Main.svelte';
  import Navigation from './lib/ui/Navigation.svelte';
  import SaveManagerModal from './lib/ui/sim/SaveManagerModal.svelte';
  import Analytics from './tools/analytics/Analytics.svelte';
  import CardBuilder from './tools/generator/card-builder-ui/CardBuilder.svelte';

  let isLoading = $state(true);

  onMount(async () => {
    window.addEventListener('keydown', handleKeybinds);
    try {
      await loadGameStateFromLocalStorage('quicksave');
    } catch (error) {
      console.error('Failed to initialize game:', error);
    } finally {
      isLoading = false;
    }
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeybinds);
  });
</script>

{#if isLoading}
  <div class="loading-screen">
    <div class="loading-spinner"></div>
    <p>Loading game data...</p>
  </div>
{:else}
  {#key uiState.currentView}
    {#if uiState.currentView === UiView.CardBuilder}
      <CardBuilder />
    {:else if uiState.currentView === UiView.Analytics}
      <Analytics />
    {:else}
      <Main />
    {/if}
  {/key}

  {#if uiState.navigationVisible}
    <Navigation />
  {/if}
  <SaveManagerModal />
{/if}

<style>
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #1a1a1a;
    color: white;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #333;
    border-top: 3px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
