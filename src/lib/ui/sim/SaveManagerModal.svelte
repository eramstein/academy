<script lang="ts">
  import { uiState } from '@/lib/_state';
  import { getDataBackgroundPath } from '@/lib/_utils/asset-paths';
  import SaveManager from './SaveManager.svelte';

  const dataBgPath = getDataBackgroundPath();

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      uiState.saveManagerModal.visible = false;
    }
  }
</script>

{#if uiState.saveManagerModal.visible}
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <div
      class="modal-content"
      style="--data-bg: url('{dataBgPath}')"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="modal-header">
        <h2>Save / Load Game</h2>
        <button class="close" onclick={() => (uiState.saveManagerModal.visible = false)}
          >Close</button
        >
      </div>
      <div class="modal-body">
        <SaveManager />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: var(--color-data) var(--data-bg) center / cover;
    border-radius: 4px;
    border: 1px solid var(--color-brass);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    max-width: 640px;
    width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    color: var(--color-cream);
    font-family: var(--font-narrative);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-brass);
    background: rgba(10, 16, 24, 0.55);
    color: var(--color-cream);
  }
  .modal-header h2 {
    margin: 0;
    color: var(--color-cream);
    font-size: 1.2em;
    font-weight: 600;
  }
  .close {
    padding: 6px 12px;
    background: var(--color-data);
    color: var(--color-cream);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    font-family: inherit;
    cursor: pointer;
  }
  .close:hover {
    background: var(--color-data-hover);
  }
  .modal-body {
    padding: 12px 16px;
    overflow-y: auto;
    max-height: calc(90vh - 64px);
  }
</style>
