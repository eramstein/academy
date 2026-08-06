<script lang="ts">
  import type { Character as CharacterModel } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import Character from '../Character.svelte';
  import CharacterPortrait from '../characters/CharacterPortrait.svelte';
  import Location from '../Location.svelte';

  let selectedCharacter: CharacterModel | null = $state(null);

  const presentCharacters = $derived(
    Object.values(gs.characters).filter((c) => c.placeKey === gs.player.placeKey),
  );

  $effect(() => {
    const key = selectedCharacter?.key;
    if (!key) return;
    if (!presentCharacters.some((c) => c.key === key)) {
      selectedCharacter = null;
    }
  });

  function selectCharacter(character: CharacterModel) {
    selectedCharacter = character;
  }

  function clearSelection() {
    selectedCharacter = null;
  }
</script>

<div class="scene-data">
  <div class="top-panel">
    {#if selectedCharacter}
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
          <CharacterPortrait {character} />
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
    width: 72px;
    height: 72px;
    padding: 0;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    overflow: hidden;
  }

  .portrait-btn:hover {
    border-color: rgba(255, 255, 255, 0.35);
  }

  .portrait-btn.selected {
    border-color: rgba(255, 255, 255, 0.55);
  }
</style>
