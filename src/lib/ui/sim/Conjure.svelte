<script lang="ts">
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import type { CardCreationResult } from '@/lib/sim/actions';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';

  let {
    options,
    onPick,
    onDone,
  }: {
    options: CardCreationResult[];
    onPick: (result: CardCreationResult) => void;
    onDone: () => void;
  } = $props();

  const tablePath = getAssetPath('images/table.jpg');
  const parchmentPath = getAssetPath('images/parchment.png');

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="overlay" role="presentation">
  <div
    class="frame"
    role="dialog"
    aria-labelledby="conjure-title"
    style="--table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="conjure-title" class="title">
        <span class="star" aria-hidden="true"></span>
        Choose a Template
        <span class="star" aria-hidden="true"></span>
      </h2>

      <section class="section cards-section" aria-label="Templates">
        {#if options.length === 0}
          <p class="empty">No templates appeared.</p>
        {:else}
          <div class="card-grid">
            {#each options as option (option.template.id)}
              <button type="button" class="card-pick" onclick={() => onPick(option)}>
                <CardCompact card={option.template} />
              </button>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .frame {
    position: relative;
    width: min(720px, 100%);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: #4a2a18 var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
  }

  .panel {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: var(--color-ink);
    padding: 16px 16px 12px;
    box-sizing: border-box;
    font-family: var(--font-narrative);
    font-size: 1rem;
    box-shadow: inset 0 0 28px rgba(90, 75, 60, 0.12);
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 0 10px;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.08em;
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

  .section {
    padding: 10px 12px 12px;
    margin-bottom: 0;
    border: 1px solid rgba(44, 37, 29, 0.45);
    border-radius: 4px;
    background: rgba(255, 248, 230, 0.18);
    box-sizing: border-box;
  }

  .cards-section {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
  }

  .card-pick {
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 0;
    cursor: pointer;
  }

  .card-pick:hover {
    border-color: var(--color-golden);
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: #6a5c4c;
  }
</style>
