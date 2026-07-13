<script lang="ts">
  import { loadGameStateFromLocalStorage, saveStateToLocalStorage } from '../../_state/main.svelte';
  import type { SaveGame } from '../../_state/save-games';
  import { deleteGame, getAllGames } from '../../_state/save-games';
  import { uiState } from '../../_state/state-ui.svelte';

  let saves: SaveGame[] = $state([]);
  let newSaveName: string = $state('quicksave');
  let isBusy: boolean = $state(false);
  let errorMessage: string | null = $state(null);

  async function refreshSaves() {
    try {
      isBusy = true;
      errorMessage = null;
      const all = await getAllGames();
      // Sort by createdAt desc
      saves = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error(err);
      errorMessage = 'Failed to load saves.';
    } finally {
      isBusy = false;
    }
  }

  async function onSave() {
    if (!newSaveName.trim()) return;
    try {
      isBusy = true;
      errorMessage = null;
      saveStateToLocalStorage(newSaveName.trim());
      await refreshSaves();
    } catch (err) {
      console.error(err);
      errorMessage = 'Failed to save game.';
    } finally {
      isBusy = false;
    }
  }

  async function onLoad(id: string) {
    try {
      isBusy = true;
      errorMessage = null;
      await loadGameStateFromLocalStorage(id);
      uiState.saveManagerModal.visible = false;
    } catch (err) {
      console.error(err);
      errorMessage = 'Failed to load game.';
    } finally {
      isBusy = false;
    }
  }

  function confirmDelete(id: string) {
    const save = saves.find((s) => s.id === id);
    uiState.modal.title = `Delete save "${save?.id ?? id}"?`;
    uiState.modal.body = 'This action cannot be undone.';
    uiState.modal.onConfirm = async () => {
      try {
        isBusy = true;
        errorMessage = null;
        await deleteGame(id);
        await refreshSaves();
      } catch (err) {
        console.error(err);
        errorMessage = 'Failed to delete save.';
      } finally {
        isBusy = false;
      }
    };
    uiState.modal.onCancel = () => {};
    uiState.modal.visible = true;
  }

  function confirmOverwrite(id: string) {
    const save = saves.find((s) => s.id === id);
    uiState.modal.title = `Overwrite save "${save?.id ?? id}"?`;
    uiState.modal.body = 'This will replace the existing save with the current game.';
    uiState.modal.onConfirm = async () => {
      try {
        isBusy = true;
        errorMessage = null;
        saveStateToLocalStorage(id);
        await refreshSaves();
      } catch (err) {
        console.error(err);
        errorMessage = 'Failed to overwrite save.';
      } finally {
        isBusy = false;
      }
    };
    uiState.modal.onCancel = () => {};
    uiState.modal.visible = true;
  }

  $effect(() => {
    refreshSaves();
  });
</script>

<div class="save-manager">
  <div class="controls">
    <form
      onsubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      style="display: contents;"
    >
      <input placeholder="Save name" bind:value={newSaveName} disabled={isBusy} />
      <button onclick={onSave} disabled={isBusy || !newSaveName.trim()}>Save</button>
    </form>
  </div>

  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}

  <div class="list">
    {#if isBusy && saves.length === 0}
      <div>Loading saves…</div>
    {/if}
    {#if !isBusy && saves.length === 0}
      <div>No saves yet.</div>
    {/if}
    {#each saves as s (s.id)}
      <div class="row">
        <div class="meta">
          <div class="name">{s.id}</div>
          <div class="date">{new Date(s.createdAt).toLocaleString()}</div>
        </div>
        <div class="actions">
          <button onclick={() => onLoad(s.id)} disabled={isBusy}>Load</button>
          <button onclick={() => confirmOverwrite(s.id)} disabled={isBusy}>Save as</button>
          <button class="danger" onclick={() => confirmDelete(s.id)} disabled={isBusy}>
            <span class="icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .save-manager {
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: white;
  }
  .controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
  }
  .meta {
    display: flex;
    flex-direction: column;
  }
  .name {
    font-weight: 600;
  }
  .date {
    font-size: 12px;
    opacity: 0.8;
  }
  .actions {
    display: flex;
    gap: 6px;
  }
  .actions .danger {
    color: #fecaca;
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
  }
  .actions .danger:hover {
    background: rgba(239, 68, 68, 0.18);
    border-color: rgba(239, 68, 68, 0.5);
  }
  .actions .icon {
    margin-right: 4px;
  }
  .error {
    color: #ff6b6b;
  }
</style>
