<script lang="ts">
  import type { SimDataTab } from '@/lib/_model';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
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
    { id: 'schedule', label: 'Events', icon: 'calendar' },
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

  const paneCornerPath = getAssetPath('images/ui/data-corner.svg');
  const borderUrl = getAssetPath('images/border.png');
  const cornerUrl = getAssetPath('images/corner.png');
  const joinUrl = getAssetPath('images/tab-join.png');

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }
</script>

<div
  class="sim-data"
  style="--data-corner: url('{paneCornerPath}'); --border-img: url('{borderUrl}'); --corner-img: url('{cornerUrl}'); --join-img: url('{joinUrl}')"
>
  <nav class="menu">
    <div class="tabs" role="tablist">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          class="menu-item"
          class:active={selected === tab.id}
          role="tab"
          aria-selected={selected === tab.id}
          onclick={() => (uiState.sim.dataTab = tab.id)}
        >
          <span class="tab-frame" aria-hidden="true">
            <span class="tab-fill"></span>
            <span class="edge top"></span>
            <span class="edge right"><span class="strip"></span></span>
            <span class="edge bottom"></span>
            <span class="edge left"><span class="strip"></span></span>
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="join"></span>
            <span class="seam"></span>
          </span>
          <span class="tab-face">
            <span class="tab-icon" style="--icon: url('{iconUrl(tab.icon)}')" aria-hidden="true"
            ></span>
            <span class="tab-label">{tab.label}</span>
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
    display: flex;
    flex-shrink: 0;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.65rem;
    padding: 0;
    background: transparent;
  }

  .tabs {
    display: flex;
    align-items: flex-end;
    gap: 0;
    min-width: 0;
    flex: 1 1 auto;
    overflow-x: auto;
    padding: 0;
    scrollbar-width: thin;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.65)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  .menu-item {
    --corner-size: 12px;
    --border-w: calc(var(--corner-size) * 15 / 32);
    --edge-inset: calc(var(--corner-size) * 0.34);
    /* Native tab-join.png is 56×40; scale so its rail profile matches --border-w. */
    --join-scale: calc(var(--border-w) / 15);
    --join-w: calc(56 * var(--join-scale));
    --join-h: calc(40 * var(--join-scale));
    --join-half: calc(var(--join-w) * 0.42);
    --radius: 5px;
    appearance: none;
    position: relative;
    display: flex;
    align-items: stretch;
    flex: 1 1 0;
    min-width: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--color-muted-label);
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }

  .tab-frame {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .tab-fill {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border-radius: var(--radius) var(--radius) 0 0;
    background-color: var(--color-data);
    background-image: var(--data-bg);
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    box-shadow:
      inset 0 1px 0 rgba(240, 230, 200, 0.12),
      inset 0 2px 3px rgba(0, 0, 0, 0.5),
      inset 0 -1px 0 rgba(240, 230, 200, 0.05),
      inset 0 0 8px rgba(0, 0, 0, 0.32);
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: var(--border-img) center / 100% 100% no-repeat;
  }

  .edge.top {
    top: 0;
    left: var(--edge-inset);
    right: var(--edge-inset);
    height: var(--border-w);
  }

  /* Meet the Y-join instead of a second corner where tabs touch. */
  .menu-item:not(:last-child) .edge.top {
    right: var(--join-half);
  }

  .menu-item:not(:first-child) .edge.top {
    left: var(--join-half);
  }

  .edge.bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--border-w);
    transform: rotate(180deg);
  }

  .edge.left,
  .edge.right {
    top: var(--edge-inset);
    bottom: var(--border-w);
    width: var(--border-w);
    background: none;
    overflow: hidden;
    container-type: size;
  }

  .edge.left {
    left: 0;
  }

  .edge.right {
    right: 0;
  }

  /* Outer rails only on the strip ends; shared seams use join + gold fade. */
  .menu-item:not(:first-child) .edge.left,
  .menu-item:not(:last-child) .edge.right {
    display: none;
  }

  .edge .strip {
    position: absolute;
    top: 0;
    left: 0;
    width: 100cqh;
    height: 100cqw;
    background: var(--border-img) center / 100% 100% no-repeat;
  }

  .edge.right .strip {
    transform-origin: top left;
    transform: rotate(90deg) translateY(-100%);
  }

  .edge.left .strip {
    transform-origin: top left;
    transform: rotate(-90deg) translateX(-100%);
  }

  .corner {
    position: absolute;
    z-index: 2;
    width: var(--corner-size);
    height: var(--corner-size);
    background: var(--corner-img) center / 100% 100% no-repeat;
  }

  .corner.tl {
    top: 0;
    left: 0;
  }

  .corner.tr {
    top: 0;
    right: 0;
    transform: rotate(90deg);
  }

  .menu-item:not(:first-child) .corner.tl,
  .menu-item:not(:last-child) .corner.tr {
    display: none;
  }

  .join {
    display: none;
    position: absolute;
    z-index: 3;
    top: 0;
    left: 0;
    width: var(--join-w);
    height: var(--join-h);
    transform: translateX(-50%);
    background: var(--join-img) left top / 100% 100% no-repeat;
    pointer-events: none;
  }

  .menu-item:not(:first-child) .join {
    display: block;
  }

  .seam {
    display: none;
    position: absolute;
    z-index: 2;
    top: calc(var(--join-h) * 0.42);
    bottom: 0;
    left: 0;
    width: 3px;
    transform: translateX(-50%);
    pointer-events: none;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brass) 75%, #e8d4a8) 0%,
      var(--color-brass) 22%,
      color-mix(in srgb, var(--color-brass) 55%, transparent) 58%,
      color-mix(in srgb, var(--color-brass) 18%, transparent) 82%,
      transparent 100%
    );
    box-shadow: 0 0 4px color-mix(in srgb, var(--color-brass) 35%, transparent);
  }

  .menu-item:not(:first-child) .seam {
    display: block;
  }

  .tab-face {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    gap: 0.32rem;
    padding: calc(0.42rem + 5px) 0.5rem calc(0.4rem + 5px);
    box-sizing: border-box;
  }

  .tab-icon {
    display: block;
    width: 1.7rem;
    height: 1.7rem;
    flex-shrink: 0;
    background: var(--icon) center / contain no-repeat;
  }

  .tab-label {
    min-width: 0;
  }

  .menu-item:hover {
    color: var(--color-cream);
  }

  .menu-item:hover .tab-fill {
    background-color: color-mix(in srgb, var(--color-data) 78%, var(--color-cream));
  }

  .menu-item:hover .edge,
  .menu-item:hover .corner,
  .menu-item:hover .join,
  .menu-item:hover .seam {
    filter: brightness(1.08);
  }

  .menu-item.active {
    z-index: 1;
    color: var(--color-golden);
  }

  .menu-item.active .tab-fill {
    background-color: color-mix(in srgb, var(--color-data) 86%, var(--color-golden));
    box-shadow:
      inset 0 1px 0 rgba(240, 220, 160, 0.2),
      inset 0 0 10px rgba(191, 161, 74, 0.12),
      inset 0 2px 3px rgba(0, 0, 0, 0.4),
      inset 0 -1px 0 rgba(240, 230, 200, 0.06);
  }

  .menu-item.active .edge,
  .menu-item.active .corner,
  .menu-item.active .join,
  .menu-item.active .seam {
    filter: brightness(1.12);
  }

  .menu-item:not(.active) .edge,
  .menu-item:not(.active) .corner,
  .menu-item:not(.active) .join,
  .menu-item:not(.active) .seam {
    opacity: 0.88;
  }

  .menu-item:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .pane {
    --edge: var(--color-brass);
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
    background: var(--color-brass);
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
    scrollbar-color: rgba(175, 142, 103, 0.4) transparent;
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
    background: rgba(175, 142, 103, 0.4);
    border-radius: 3px;
  }

  .content::-webkit-scrollbar-thumb:hover {
    background: rgba(175, 142, 103, 0.6);
  }

  .content.flush {
    padding: 0;
    overflow: hidden;
  }
</style>
