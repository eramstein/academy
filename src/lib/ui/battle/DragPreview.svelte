<script lang="ts">
  import { uiState } from '@lib/_state';
  import Card from './Card.svelte';

  let mousePos = $state({ x: 0, y: 0 });

  // Keep last pointer position so the preview appears under the cursor immediately.
  $effect(() => {
    const track = (e: PointerEvent) => {
      mousePos = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', track);
    return () => window.removeEventListener('pointermove', track);
  });
</script>

{#if uiState.battle.draggingCard}
  <div
    class="card-drag-preview"
    style:left="{mousePos.x + 20}px"
    style:top="{mousePos.y - 260}px"
  >
    <Card card={uiState.battle.draggingCard} inHand={false} displayKeywords={false} />
  </div>
{/if}

<style>
  .card-drag-preview {
    position: fixed;
    pointer-events: none;
    z-index: 2000;
    transform: scale(0.9);
    filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.6));
    opacity: 0.95;
    transition: none;
  }
</style>
