<script lang="ts">
  import { uiState } from '../_state/state-ui.svelte';

  function handleConfirm() {
    uiState.modal.onConfirm?.();
    uiState.modal.visible = false;
  }
  function handleCancel() {
    uiState.modal.onCancel?.();
    uiState.modal.visible = false;
  }
  function handleOverlayClick() {
    uiState.modal.visible = false;
  }
</script>

{#if uiState.modal && uiState.modal.visible}
  <div class="modal-overlay" onclick={handleOverlayClick}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-title">{uiState.modal.title}</div>
      <div class="modal-body">{@html uiState.modal.body}</div>
      <div class="modal-actions">
        <button class="confirm-btn" onclick={handleConfirm}>Yes</button>
        <button class="cancel-btn" onclick={handleCancel}>No</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  .modal {
    background: linear-gradient(135deg, #23272e 0%, #2c3e50 100%);
    border: 2px solid var(--color-golden);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    min-width: 320px;
    max-width: 90vw;
    text-align: center;
    position: relative;
    left: 0;
    top: 0;
    margin: 0 auto;
  }
  .modal-title {
    font-size: 1.4rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: var(--color-golden);
  }
  .modal-body {
    margin-bottom: 1.5rem;
  }
  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }
  .confirm-btn,
  .cancel-btn {
    padding: 0.5rem 1.2rem;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }
  .confirm-btn {
    background: var(--color-golden);
    color: #23272e;
  }
  .confirm-btn:hover {
    background: #ffd700;
  }
  .cancel-btn {
    background: #444;
    color: #fff;
  }
  .cancel-btn:hover {
    background: #666;
  }
</style>
