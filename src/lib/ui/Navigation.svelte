<script lang="ts">
  import { UiView } from '../_model';
  import { uiState } from '../_state';
  import { gs, resetBattleState } from '../_state/main.svelte';
  import { endBattle } from '../battle/win';

  const navItems = [
    { view: UiView.Battle, label: 'Game', icon: '🎮' },
    { view: UiView.Analytics, label: 'Analytics', icon: '📊' },
    { view: UiView.CardBuilder, label: 'Card Builder', icon: '🃏' },
  ];

  const stopBattle = () => {
    endBattle(true);
    resetBattleState();
    uiState.currentView = UiView.CurrentPlace;
    uiState.navigationVisible = false;
  };
</script>

<div class="navigation-overlay" onclick={() => (uiState.navigationVisible = false)}>
  <nav class="navigation" onclick={(e) => e.stopPropagation()}>
    {#each navItems as item}
      <button
        class="nav-item"
        class:active={uiState.currentView === item.view}
        onclick={() => {
          uiState.currentView = item.view;
          uiState.navigationVisible = false;
        }}
      >
        <span class="icon">{item.icon}</span>
        <span class="label">{item.label}</span>
      </button>
    {/each}

    {#if uiState.currentView === UiView.Battle}
      <button class="nav-item stop-battle" onclick={stopBattle}>
        <span class="icon">⏹️</span>
        <span class="label">Concede Match</span>
      </button>
    {/if}

    <div class="admin-section">
      <div class="admin-divider"></div>
      <button class="nav-item admin-item" onclick={() => (uiState.saveManagerModal.visible = true)}>
        <span class="icon">💾</span>
        <span class="label">Save / Load</span>
      </button>
    </div>
  </nav>
</div>

<style>
  .navigation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .navigation {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    padding: 1rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    min-width: 160px;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .nav-item.active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .icon {
    font-size: 1.2rem;
  }

  .label {
    font-weight: 500;
  }

  .stop-battle {
    background: rgba(220, 38, 38, 0.1);
    border-color: rgba(220, 38, 38, 0.3);
    color: #fca5a5;
  }

  .stop-battle:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
  }

  .admin-section {
    margin-top: 1rem;
  }

  .admin-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0.5rem 0;
  }

  .admin-item {
    background: rgba(156, 163, 175, 0.1);
    border-color: rgba(156, 163, 175, 0.2);
    color: #d1d5db;
    margin: 0.5rem 0;
    width: 100%;
  }

  .admin-item:hover {
    background: rgba(156, 163, 175, 0.2);
    border-color: rgba(156, 163, 175, 0.3);
  }
</style>
