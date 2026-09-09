<script lang="ts">
  import type { SimDataTab } from '@/lib/_model';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import Characters from './sim-data/Characters.svelte';
  import Collection from './sim-data/Collection.svelte';
  import Decks from './sim-data/Decks.svelte';
  import League from './sim-data/League.svelte';
  import Places from './sim-data/Places.svelte';
  import Player from './sim-data/Player.svelte';
  import Schedule from './sim-data/Schedule.svelte';
  import SceneData from './sim-data/SceneData.svelte';
  import TimeDisplay from './TimeDisplay.svelte';

  const tabs: { id: SimDataTab; label: string }[] = [
    { id: 'scene', label: 'Scene' },
    { id: 'player', label: 'Player' },
    { id: 'characters', label: 'Characters' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'places', label: 'Places' },
    { id: 'collection', label: 'Collection' },
    { id: 'decks', label: 'Decks' },
    { id: 'league', label: 'League' },
  ];

  const selected = $derived(uiState.sim.dataTab);
  const flush = $derived(
    selected === 'scene' ||
      (selected === 'places' && uiState.sim.selectedPlaceKey !== null) ||
      (selected === 'characters' && uiState.sim.selectedCharacterKey !== null),
  );
</script>

<div class="sim-data">
  <span class="ornament tl" aria-hidden="true"></span>
  <span class="ornament tr" aria-hidden="true"></span>
  <span class="ornament bl" aria-hidden="true"></span>
  <span class="ornament br" aria-hidden="true"></span>

  <nav class="menu">
    <div class="tabs">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          class="menu-item"
          class:active={selected === tab.id}
          onclick={() => (uiState.sim.dataTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <TimeDisplay />
  </nav>

  <div class="content" class:flush>
    {#if selected === 'scene'}
      <SceneData />
    {:else if selected === 'player'}
      <Player />
    {:else if selected === 'characters'}
      <Characters />
    {:else if selected === 'schedule'}
      <Schedule />
    {:else if selected === 'places'}
      <Places />
    {:else if selected === 'collection'}
      <Collection />
    {:else if selected === 'decks'}
      <Decks />
    {:else if selected === 'league'}
      <League />
    {/if}
  </div>
</div>

<style>
  .sim-data {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    border: 1px solid var(--color-golden);
    overflow: hidden;
    box-shadow: inset 0 0 0 4px rgba(26, 48, 72, 0.65);
    background: var(--color-data) var(--data-bg) center / cover;
  }

  .ornament {
    position: absolute;
    z-index: 2;
    width: 28px;
    height: 28px;
    pointer-events: none;
    background: var(--color-golden);
    mask: var(--corner) center / contain no-repeat;
    -webkit-mask: var(--corner) center / contain no-repeat;
  }

  .ornament.tl {
    top: 6px;
    left: 6px;
  }

  .ornament.tr {
    top: 6px;
    right: 6px;
    transform: rotate(90deg);
  }

  .ornament.bl {
    bottom: 6px;
    left: 6px;
    transform: rotate(-90deg);
  }

  .ornament.br {
    bottom: 6px;
    right: 6px;
    transform: rotate(180deg);
  }

  .menu {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.55rem 2.1rem 0.5rem 2.1rem;
    border-bottom: 1px solid var(--color-golden);
    background: rgba(10, 16, 24, 0.45);
  }

  .tabs {
    display: flex;
    gap: 0.25rem;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .menu-item {
    padding: 0.4rem 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--color-muted-label);
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .menu-item:hover {
    color: var(--color-cream);
    border-color: rgba(191, 161, 74, 0.45);
  }

  .menu-item.active {
    color: var(--color-cream);
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.12);
  }

  .content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 0.65rem 0.5rem;
    color: var(--color-cream);
    scrollbar-width: thin;
    scrollbar-color: rgba(191, 161, 74, 0.4) transparent;
  }

  .content::-webkit-scrollbar {
    width: 5px;
  }

  .content::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .content::-webkit-scrollbar-track {
    background: transparent;
  }

  .content::-webkit-scrollbar-thumb {
    background: rgba(191, 161, 74, 0.4);
    border-radius: 3px;
  }

  .content::-webkit-scrollbar-thumb:hover {
    background: rgba(191, 161, 74, 0.6);
  }

  .content.flush {
    padding: 0;
    overflow: hidden;
  }
</style>
