<script lang="ts">
  import type { Character as CharacterModel } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import {
    clearSelectedSimCharacter,
    selectSimCharacter,
    uiState,
  } from '@/lib/_state/state-ui.svelte';
  import { getCharactersAtScene } from '@/lib/sim/characters';
  import Character from '../Character.svelte';
  import CharacterPortrait from '../characters/CharacterPortrait.svelte';
  import Location from '../Location.svelte';
  import Player from './Player.svelte';

  const presentCharacters = $derived([gs.player, ...getCharactersAtScene()]);
  const selectedCharacter = $derived(
    uiState.sim.selectedCharacterKey === gs.player.key
      ? gs.player
      : uiState.sim.selectedCharacterKey
        ? (gs.characters[uiState.sim.selectedCharacterKey] ?? null)
        : null
  );
  const playerSelected = $derived(selectedCharacter?.key === gs.player.key);

  $effect(() => {
    const key = uiState.sim.selectedCharacterKey;
    if (!key) return;
    if (key !== gs.player.key && !gs.characters[key]) {
      uiState.sim.selectedCharacterKey = null;
    }
  });

  function selectCharacter(character: CharacterModel) {
    selectSimCharacter(character.key);
  }

  function clearSelection() {
    clearSelectedSimCharacter();
  }
</script>

<div class="scene-data">
  <div class="top-panel">
    {#if playerSelected}
      <div class="player-view">
        <Player />
      </div>
    {:else if selectedCharacter}
      <Character character={selectedCharacter} />
    {:else}
      <Location />
    {/if}
  </div>

  <div class="bottom-panel">
    {#if selectedCharacter}
      <button type="button" class="back-btn" onclick={clearSelection}>Back</button>
    {/if}
    <div class="portraits">
      {#each presentCharacters as character (character.key)}
        <button
          type="button"
          class="portrait-btn"
          class:selected={selectedCharacter?.key === character.key}
          onclick={() => selectCharacter(character)}
        >
          <CharacterPortrait {character} zoom={1.2} />
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .scene-data {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    color: white;
    min-height: 0;
  }

  .top-panel {
    flex: 1 1 60%;
    min-height: 0;
    overflow: hidden;
  }

  .player-view {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 1rem 0.85rem;
    box-sizing: border-box;
  }

  .bottom-panel {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: #141414;
    min-height: 0;
  }

  .back-btn {
    flex-shrink: 0;
    padding: 0.5rem 0.9rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #cccccc;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  .portraits {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .portrait-btn {
    width: 144px;
    height: 144px;
    padding: 0;
    flex-shrink: 0;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    overflow: hidden;
  }

  .portrait-btn :global(.character-portrait) {
    display: block;
    border-radius: 0;
  }

  .portrait-btn:hover {
    border-color: rgba(255, 255, 255, 0.35);
  }

  .portrait-btn.selected {
    border-color: rgba(255, 255, 255, 0.55);
  }
</style>
