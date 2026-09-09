<script lang="ts">
  import type { SimDataTab } from '@/lib/_model';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import Characters from './sim-data/Characters.svelte';
  import Collection from './sim-data/Collection.svelte';
  import Decks from './sim-data/Decks.svelte';
  import League from './sim-data/League.svelte';
  import Places from './sim-data/Places.svelte';
  import Player from './sim-data/Player.svelte';
  import SceneData from './sim-data/SceneData.svelte';
  import Schedule from './sim-data/Schedule.svelte';
  import TimeDisplay from './TimeDisplay.svelte';

  const tabs: { id: SimDataTab; label: string; icon: string }[] = [
    { id: 'scene', label: 'Scene', icon: 'compass' },
    { id: 'player', label: 'Player', icon: 'person' },
    { id: 'characters', label: 'Characters', icon: 'people' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'places', label: 'Places', icon: 'pin' },
    { id: 'collection', label: 'Collection', icon: 'book' },
    { id: 'decks', label: 'Decks', icon: 'cards' },
    { id: 'league', label: 'League', icon: 'trophy' },
  ];

  const selected = $derived(uiState.sim.dataTab);
  const flush = $derived(
    selected === 'scene' ||
      selected === 'player' ||
      (selected === 'places' && uiState.sim.selectedPlaceKey !== null) ||
      (selected === 'characters' && uiState.sim.selectedCharacterKey !== null)
  );

  const cornerPath = getAssetPath('images/ui/data-corner.svg');

  function iconUrl(name: string) {
    return getAssetPath(`images/ui/${name}.svg`);
  }
</script>

<div class="sim-data" style="--data-corner: url('{cornerPath}');">
  <nav class="menu">
    <div class="tabs">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          class="menu-item"
          class:active={selected === tab.id}
          onclick={() => (uiState.sim.dataTab = tab.id)}
        >
          <span class="tab-icon" style="--icon: url('{iconUrl(tab.icon)}')" aria-hidden="true"
          ></span>
          {tab.label}
        </button>
      {/each}
    </div>
    <TimeDisplay />
  </nav>

  <div class="pane">
    <span class="ornament tl" aria-hidden="true"></span>
    <span class="ornament tr" aria-hidden="true"></span>
    <span class="ornament bl" aria-hidden="true"></span>
    <span class="ornament br" aria-hidden="true"></span>

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
</div>

<style>
  .sim-data {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    background: var(--color-data) var(--data-bg) center / cover;
  }

  .menu {
    display: flex;
    flex-shrink: 0;
    align-items: stretch;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.35rem 0.7rem 0;
    background: rgba(8, 12, 18, 0.28);
  }

  .tabs {
    display: flex;
    gap: 0.15rem;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .menu-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.7rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 4px 4px 0 0;
    color: var(--color-muted-label);
    font-family: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .tab-icon {
    display: block;
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .menu-item:hover {
    color: var(--color-cream);
    background: rgba(56, 138, 158, 0.16);
  }

  .menu-item.active {
    color: var(--color-cream);
    background: rgba(56, 138, 158, 0.42);
    box-shadow: inset 0 0 12px rgba(90, 190, 200, 0.18);
  }

  .pane {
    --edge: var(--color-golden);
    --corner-span: 34px;
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 1px 8px rgba(0, 0, 0, 0.28);
    background-image:
      linear-gradient(var(--edge), var(--edge)), linear-gradient(var(--edge), var(--edge)),
      linear-gradient(var(--edge), var(--edge)), linear-gradient(var(--edge), var(--edge));
    background-repeat: no-repeat;
    background-position:
      top center,
      bottom center,
      center left,
      center right;
    background-size:
      calc(100% - 2 * var(--corner-span)) 1px,
      calc(100% - 2 * var(--corner-span)) 1px,
      1px calc(100% - 2 * var(--corner-span)),
      1px calc(100% - 2 * var(--corner-span));
  }

  .ornament {
    position: absolute;
    z-index: 2;
    width: 40px;
    height: 40px;
    pointer-events: none;
    background: var(--color-golden);
    mask: var(--data-corner) 0 0 / 40px 40px no-repeat;
    -webkit-mask: var(--data-corner) 0 0 / 40px 40px no-repeat;
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
