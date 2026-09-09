<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import {
    clearSelectedSimCharacter,
    selectSimCharacter,
    uiState,
  } from '@/lib/_state/state-ui.svelte';
  import Character from '../Character.svelte';
  import CharacterPortrait from '../characters/CharacterPortrait.svelte';

  const characters = $derived(
    Object.values(gs.characters).sort((a, b) => a.name.localeCompare(b.name))
  );

  const selectedCharacter = $derived(
    uiState.sim.selectedCharacterKey === gs.player.key
      ? gs.player
      : uiState.sim.selectedCharacterKey
        ? (gs.characters[uiState.sim.selectedCharacterKey] ?? null)
        : null
  );

  $effect(() => {
    const key = uiState.sim.selectedCharacterKey;
    if (!key) return;
    if (key !== gs.player.key && !gs.characters[key]) {
      uiState.sim.selectedCharacterKey = null;
      uiState.sim.characterBackTab = null;
    }
  });

  function locationName(placeKey: string): string {
    return gs.places[placeKey]?.name ?? placeKey;
  }
</script>

{#if selectedCharacter}
  <div class="character-view">
    <button type="button" class="back-btn" onclick={clearSelectedSimCharacter}>Back</button>
    <Character character={selectedCharacter} />
  </div>
{:else}
  <div class="characters">
    {#if characters.length === 0}
      <p class="empty">No characters yet.</p>
    {:else}
      <ul class="character-list">
        {#each characters as character (character.key)}
          <li>
            <button
              type="button"
              class="character-item"
              onclick={() => selectSimCharacter(character.key)}
            >
              <span class="portrait-frame">
                <CharacterPortrait {character} zoom={1.2} />
              </span>
              <div class="character-info">
                <h4 class="character-name">{character.name}</h4>
                <p class="character-location">{locationName(character.placeKey)}</p>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .character-view {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .character-view :global(.identity) {
    padding-right: 4.75rem;
  }

  .back-btn {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 3;
    padding: 0.5rem 0.9rem;
    background: var(--color-data);
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: var(--color-data-hover);
    border-color: var(--color-golden);
  }

  .characters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    padding: 12px 16px;
  }

  .empty {
    margin: 0;
    font-size: 0.95rem;
    color: var(--color-muted-label);
  }

  .character-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .character-item {
    display: flex;
    gap: 0.75rem;
    min-width: 0;
    width: 100%;
    margin: 0;
    padding: 0.35rem;
    text-align: left;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
  }

  .character-item:hover {
    background: rgba(191, 161, 74, 0.1);
    border-color: var(--color-golden);
  }

  .portrait-frame {
    flex: 0 0 64px;
    width: 64px;
    height: 64px;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--color-golden);
    background: var(--color-deep-brown);
  }

  .portrait-frame :global(.character-portrait) {
    border-radius: 0;
  }

  .character-info {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.15rem;
  }

  .character-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-cream);
  }

  .character-location {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-muted-label);
    line-height: 1.35;
  }
</style>
