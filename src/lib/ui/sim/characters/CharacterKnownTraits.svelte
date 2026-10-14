<script lang="ts">
  import type { Npc } from '@/lib/_model/model-sim';
  import { getAssetPath, getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';

  let {
    character,
    onClose,
  }: {
    character: Npc;
    onClose: () => void;
  } = $props();

  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
  const dataBgPath = getAssetPath('images/ui/backgrounds/data-background.png');
  const traits = $derived(character.knownTraits ?? []);

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }
</script>

{#snippet icon(name: string)}
  <span
    class="icon"
    class:painted={isPaintedUiIcon(name)}
    style="--icon: url('{iconUrl(name)}')"
    aria-hidden="true"
  ></span>
{/snippet}

<div
  class="notes-overlay"
  style="--parchment: url('{parchmentPath}'); --data-bg: url('{dataBgPath}')"
  role="dialog"
  aria-modal="true"
  aria-labelledby="notes-title"
>
  <header class="notes-header">
    <h2 id="notes-title" class="notes-title">
      {@render icon('book')}
      Notes on {character.name}
    </h2>
    <button type="button" class="close-btn" onclick={onClose}>Close</button>
  </header>

  <div class="notes-body">
    {#if traits.length === 0}
      <p class="empty">Nothing learned yet.</p>
    {:else}
      <ul class="trait-list">
        {#each traits as trait, i (i)}
          <li class="trait-card">
            <p class="trait-text">{trait}</p>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .notes-overlay {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-sizing: border-box;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    background: #1a2433 var(--data-bg) center / cover;
    border-radius: 4px;
  }

  .notes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-shrink: 0;
    padding: 0.85rem 1rem 0.7rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
  }

  .notes-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    min-width: 0;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .icon {
    display: block;
    width: 1.2rem;
    height: 1.2rem;
    flex-shrink: 0;
    color: var(--color-brass);
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .icon.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .close-btn {
    flex-shrink: 0;
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    color: var(--color-cream);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-brass) 55%, transparent);
    border-radius: 4px;
    cursor: pointer;
    padding: 0.4rem 0.85rem;
  }

  .close-btn:hover {
    border-color: var(--color-brass);
    background: var(--color-data-hover);
  }

  .notes-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.1rem 1.25rem;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 142, 103, 0.35) transparent;
  }

  .empty {
    margin: 1.5rem 0 0;
    text-align: center;
    color: var(--color-muted-label);
    font-size: 1rem;
    line-height: 1.6;
  }

  .trait-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .trait-card {
    display: flex;
    align-items: stretch;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    padding: 0.75rem 0.85rem;
    color: var(--color-ink);
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    border: 1px solid var(--color-brown-border);
    border-radius: 5px;
    box-shadow:
      inset 0 0 20px rgba(90, 75, 60, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.28);
  }

  .trait-text {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    font-size: 1.02rem;
    line-height: 1.65;
    color: var(--color-ink);
    white-space: pre-wrap;
  }
</style>
