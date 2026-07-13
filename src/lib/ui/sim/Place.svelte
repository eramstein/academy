<script lang="ts">
  import { UiView, type Npc, type Place } from '@/lib/_model';
  import { initBattle } from '@/lib/battle/init';
  import { gs } from '@/lib/_state/main.svelte';
  import { uiState } from '@/lib/_state/state-ui.svelte';
  import { getPlaceImagePath } from '@/lib/_utils/asset-paths';
  import CharacterPortrait from './characters/CharacterPortrait.svelte';

  let { place }: { place: Place } = $props();

  const imagePath = $derived(getPlaceImagePath(place.key));
  const npcs = $derived(Object.values(gs.characters));

  function handlePortraitClick(character: Npc) {
    initBattle(character.key);
    uiState.currentView = UiView.Battle;
  }
</script>

<div class="place-container" style="--bg-image: url('{imagePath}')">
  <div class="characters-overlay">
    {#each npcs as character (character.key)}
      <button
        type="button"
        class="character-portrait-container"
        onclick={() => handlePortraitClick(character)}
      >
        <CharacterPortrait {character} />
      </button>
    {/each}
  </div>
</div>

<style>
  .place-container {
    position: relative;
    width: 100%;
    height: 100%;
    background-image: var(--bg-image);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .characters-overlay {
    position: absolute;
    bottom: 40px;
    left: 40px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px;
    max-height: calc(100% - 80px);
    overflow: hidden;
  }

  .character-portrait-container {
    width: 280px;
    height: 280px;
    padding: 0;
    border-radius: 12px;
    cursor: pointer;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.6),
      0 4px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(6px);
    border: 3px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
  }

  .character-portrait-container:hover {
    border-color: rgba(255, 255, 255, 0.35);
  }
</style>
