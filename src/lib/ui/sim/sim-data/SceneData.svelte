<script lang="ts">
  import type { Character as CharacterModel } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { selectSimCharacter, uiState } from '@/lib/_state/state-ui.svelte';
  import { getCharactersAtScene } from '@/lib/sim/characters';
  import CharacterPortrait from '../characters/CharacterPortrait.svelte';
  import Location from '../Location.svelte';

  const presentCharacters = $derived([gs.player, ...getCharactersAtScene()]);

  function inspectCharacter(character: CharacterModel) {
    if (character.key === gs.player.key) {
      uiState.sim.dataTab = 'player';
      return;
    }
    selectSimCharacter(character.key);
  }
</script>

<div class="scene-data">
  <div class="top-panel">
    <Location />
  </div>

  <div class="bottom-panel">
    <div class="portraits">
      {#each presentCharacters as character (character.key)}
        <button type="button" class="portrait-btn" onclick={() => inspectCharacter(character)}>
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
    box-sizing: border-box;
    /* Leave the pane's 1px golden edge borders visible under flush content */
    padding: 1px;
    color: var(--color-cream);
    min-height: 0;
    background: transparent;
  }

  .top-panel {
    flex: 1 1 60%;
    min-height: 0;
    overflow: hidden;
  }

  .bottom-panel {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--color-brass);
    background: rgba(10, 16, 24, 0.55);
    min-height: 0;
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
    border-radius: 6px;
    border: 1px solid var(--color-brass);
    background: var(--color-deep-brown);
    cursor: pointer;
    overflow: hidden;
  }

  .portrait-btn :global(.character-portrait) {
    display: block;
    border-radius: 0;
  }

  .portrait-btn:hover {
    border-color: var(--color-brass);
  }
</style>
