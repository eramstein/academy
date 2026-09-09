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
    { id: 'characters', label: 'NPCs', icon: 'people' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'places', label: 'Places', icon: 'pin' },
    { id: 'collection', label: 'Cards', icon: 'book' },
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
          <span class="tab-face">
            <span class="tab-icon" style="--icon: url('{iconUrl(tab.icon)}')" aria-hidden="true"
            ></span>
            {tab.label}
          </span>
        </button>
      {/each}
    </div>
    <TimeDisplay />
  </nav>

  <div class="pane">
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
    background: transparent;
  }

  .menu {
    --tab-chamfer: 6px;
    --tab-trim: 1px;
    display: flex;
    flex-shrink: 0;
    align-items: stretch;
    justify-content: space-between;
    gap: 0.65rem;
    padding: 0;
    background: transparent;
  }

  .tabs {
    display: flex;
    align-items: stretch;
    gap: 0.2rem;
    min-width: 0;
    flex: 1 1 auto;
    overflow-x: auto;
    padding: 0;
    scrollbar-width: thin;
  }

  .menu-item {
    --chamfer: var(--tab-chamfer);
    --trim: var(--tab-trim);
    appearance: none;
    display: flex;
    align-items: stretch;
    flex: 1 1 0;
    min-width: 0;
    margin: 0;
    padding: var(--trim);
    background: var(--color-golden);
    border: none;
    color: var(--color-muted-label);
    font-family: inherit;
    font-size: 0.85rem;
    white-space: nowrap;
    cursor: pointer;
    clip-path: polygon(
      var(--chamfer) 0,
      calc(100% - var(--chamfer)) 0,
      100% var(--chamfer),
      100% calc(100% - 2px),
      calc(100% - 2px) 100%,
      2px 100%,
      0 calc(100% - 2px),
      0 var(--chamfer)
    );
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.7)) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.45));
  }

  .tab-face {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    gap: 0.4rem;
    padding: 0.42rem 0.4rem 0.44rem;
    box-sizing: border-box;
    background: var(--color-data-hover);
    box-shadow:
      inset 0 1px 0 rgba(240, 230, 200, 0.12),
      inset 0 -2px 4px rgba(0, 0, 0, 0.45);
    clip-path: polygon(
      calc(var(--chamfer) - var(--trim)) 0,
      calc(100% - (var(--chamfer) - var(--trim))) 0,
      100% calc(var(--chamfer) - var(--trim)),
      100% calc(100% - 1px),
      calc(100% - 1px) 100%,
      1px 100%,
      0 calc(100% - 1px),
      0 calc(var(--chamfer) - var(--trim))
    );
  }

  .tab-icon {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
    flex-shrink: 0;
    background: var(--color-golden);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .menu-item:hover {
    color: var(--color-cream);
  }

  .menu-item:hover .tab-face {
    background: color-mix(in srgb, var(--color-data-hover) 78%, var(--color-cream));
  }

  .menu-item.active {
    color: var(--color-cream);
  }

  .menu-item.active .tab-face {
    background: color-mix(in srgb, rgb(56, 138, 158) 58%, var(--color-data-active));
    box-shadow:
      inset 0 1px 0 rgba(210, 240, 245, 0.2),
      inset 0 0 10px rgba(90, 190, 200, 0.18),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  }

  .menu-item:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .pane {
    --edge: var(--color-golden);
    --corner-span: 34px;
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 0 12px 12px 12px;
    overflow: hidden;
    background-color: var(--color-data);
    box-shadow: inset 0 1px 8px rgba(0, 0, 0, 0.28);
    background-image:
      linear-gradient(var(--edge), var(--edge)), linear-gradient(var(--edge), var(--edge)),
      linear-gradient(var(--edge), var(--edge)), linear-gradient(var(--edge), var(--edge)),
      var(--data-bg);
    background-repeat: no-repeat;
    background-position:
      top left,
      bottom center,
      top left,
      right center,
      center;
    background-size:
      calc(100% - var(--corner-span)) 1px,
      calc(100% - 2 * var(--corner-span)) 1px,
      1px calc(100% - var(--corner-span)),
      1px calc(100% - 2 * var(--corner-span)),
      cover;
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
