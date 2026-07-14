<script lang="ts">
  import type { Player } from '@lib/_model';
  import { UiView } from '@lib/_model';
  import { uiState } from '@lib/_state';
  import { gs, resetBattleState } from '@lib/_state/main.svelte';
  import { getCharacterImagePath } from '@lib/_utils/asset-paths';

  let { winningPlayer }: { winningPlayer: Player } = $props();

  // Convert player name to filename format (lowercase with underscores)
  let characterImageName = $derived(winningPlayer.name.toLowerCase().replace(/\s+/g, '_'));
  let characterImagePath = $derived(getCharacterImagePath(characterImageName));

  const closeModal = () => {
    resetBattleState();
    uiState.currentView = UiView.CurrentPlace;
  };
</script>

<div class="game-won-overlay" onclick={closeModal}>
  <div class="game-won-modal" onclick={(e) => e.stopPropagation()}>
    <div class="victory-text">
      <h1>Victory!</h1>
      <p>{winningPlayer.name} has won the game!</p>
    </div>
    <div class="winner-info">
      <div class="winner-avatar" style="background-image: url('{characterImagePath}')"></div>
      <div class="winner-details">
        <h2>{winningPlayer.name}</h2>
        <p>Final Life: {winningPlayer.life}</p>
      </div>
    </div>
    <div class="modal-actions">
      <button class="back-button" onclick={closeModal}>Back</button>
    </div>
  </div>
</div>

<style>
  .game-won-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.5s ease-out;
  }

  .game-won-modal {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border: 3px solid #f39c12;
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    color: white;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.6),
      0 10px 30px rgba(0, 0, 0, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);
    animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 500px;
    width: 90%;
  }

  .victory-text h1 {
    font-size: 3rem;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .victory-text p {
    font-size: 1.5rem;
    margin: 0 0 2rem 0;
    color: #ecf0f1;
  }

  .winner-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .winner-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 3px solid #f39c12;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  .winner-details h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #f39c12;
  }

  .winner-details p {
    margin: 0;
    font-size: 1rem;
    color: #bdc3c7;
  }

  .modal-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }

  .back-button {
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
  }

  .back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
    background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  }

  .back-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(243, 156, 18, 0.3);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-50px) scale(0.9);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
</style>
