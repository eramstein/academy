<script lang="ts">
  import type { Player } from '@lib/_model';
  import { UiView } from '@lib/_model';
  import { uiState } from '@lib/_state';
  import { resetBattleState } from '@lib/_state/main.svelte';
  import { getAssetPath, getCharacterImagePath } from '@lib/_utils/asset-paths';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';

  let { winningPlayer }: { winningPlayer: Player } = $props();

  let characterImageName = $derived(winningPlayer.name.toLowerCase().replace(/\s+/g, '_'));
  let characterImagePath = $derived(getCharacterImagePath(characterImageName));

  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');

  const closeModal = () => {
    resetBattleState();
    uiState.currentView = UiView.Scene;
  };

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="overlay" role="presentation" onclick={closeModal}>
  <div
    class="frame"
    role="dialog"
    aria-modal="true"
    aria-labelledby="victory-title"
    style="--table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="panel">
      <header class="heading">
        <h2 id="victory-title" class="title">
          <span class="star" aria-hidden="true"></span>
          Victory
          <span class="star" aria-hidden="true"></span>
        </h2>
        <p class="subtitle">{winningPlayer.name} has won the game!</p>
      </header>

      <div class="winner">
        <div
          class="portrait"
          style="background-image: url('{characterImagePath}')"
          role="img"
          aria-label={winningPlayer.name}
        ></div>
        <div class="details">
          <h3 class="name">{winningPlayer.name}</h3>
          <p class="life">Final life — {winningPlayer.life}</p>
        </div>
      </div>
    </div>

    <footer class="actions">
      <OrnateButton icon="arrow-left" onclick={closeModal}>Return to the academy</OrnateButton>
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
    animation: fade-in 0.4s ease-out;
  }

  .frame {
    position: relative;
    width: min(420px, 100%);
    display: flex;
    flex-direction: column;
    padding: 10px 10px 8px;
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
    animation: rise-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .panel {
    display: flex;
    flex-direction: column;
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: var(--color-ink);
    padding: 18px 22px 20px;
    box-sizing: border-box;
    font-family: var(--font-narrative);
    border-radius: 3px;
    box-shadow:
      inset 0 0 28px rgba(90, 75, 60, 0.12),
      inset 0 0 80px color-mix(in srgb, var(--color-golden) 14%, transparent);
  }

  .heading {
    margin-bottom: 1rem;
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-ink);
    text-align: center;
  }

  .star {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    background: #4a3f32;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .subtitle {
    margin: 6px 0 0;
    text-align: center;
    font-size: 1rem;
    font-style: italic;
    letter-spacing: 0.01em;
    color: var(--color-ink-muted);
  }

  .winner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
  }

  .portrait {
    width: 140px;
    height: 168px;
    border-radius: 6px;
    background-size: cover;
    background-position: top center;
    border: 2px solid var(--color-brown-border);
    box-shadow:
      0 6px 18px rgba(44, 37, 29, 0.35),
      inset 0 0 0 1px color-mix(in srgb, var(--color-golden) 35%, transparent);
  }

  .details {
    text-align: center;
  }

  .name {
    margin: 0 0 0.3rem;
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--color-ink);
  }

  .life {
    margin: 0;
    font-size: 0.98rem;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 3.2rem;
    padding: 10px 8px 4px;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes rise-in {
    from {
      transform: translateY(-28px) scale(0.96);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .overlay,
    .frame {
      animation: none;
    }
  }
</style>
