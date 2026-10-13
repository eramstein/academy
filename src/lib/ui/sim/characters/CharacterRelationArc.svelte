<script lang="ts">
  import type { Npc } from '@/lib/_model/model-sim';
  import {
    getAssetPath,
    getUiIconPath,
    isPaintedUiIcon,
    resolveStoredImage,
    storedImageCandidates,
  } from '@/lib/_utils/asset-paths';

  let {
    character,
    onClose,
  }: {
    character: Npc;
    onClose: () => void;
  } = $props();

  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
  const dataBgPath = getAssetPath('images/ui/backgrounds/data-background.png');
  const beats = $derived(character.relationArc ?? []);
  let expandedIndex = $state<number | null>(null);

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }

  /** Event filenames, `folder/file` under images/, or `mod/<id>/...`. */
  function resolveImage(image: string): string {
    return resolveStoredImage(image);
  }

  /** Try the next candidate: built-in art, then mods, including legacy `*_more/` paths. */
  function onBeatImageError(event: Event, image: string) {
    const img = event.currentTarget as HTMLImageElement;
    const candidates = storedImageCandidates(image);
    const attrSrc = img.getAttribute('src') ?? '';
    const failedIndex = candidates.findIndex((url) => attrSrc === url || attrSrc.endsWith(url));
    const fallback = candidates[failedIndex + 1];
    if (fallback) {
      img.src = fallback;
    }
  }

  function toggleImage(index: number) {
    expandedIndex = expandedIndex === index ? null : index;
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
  class="arc-overlay"
  style="--parchment: url('{parchmentPath}'); --data-bg: url('{dataBgPath}')"
  role="dialog"
  aria-modal="true"
  aria-labelledby="arc-title"
>
  <header class="arc-header">
    <h2 id="arc-title" class="arc-title">
      {@render icon('feather')}
      Story with {character.name}
    </h2>
    <button type="button" class="close-btn" onclick={onClose}>Close</button>
  </header>

  <div class="arc-body">
    {#if beats.length === 0}
      <p class="empty">No shared moments yet.</p>
    {:else}
      <ul class="beat-list">
        {#each beats as beat, i (i)}
          {@const expanded = expandedIndex === i}
          <li class="beat-card" class:has-image={!!beat.image} class:expanded>
            {#if beat.image}
              <button
                type="button"
                class="beat-image-btn"
                class:expanded
                aria-expanded={expanded}
                aria-label={expanded ? 'Shrink image' : 'Enlarge image'}
                onclick={() => toggleImage(i)}
              >
                <img
                  class="beat-image"
                  src={resolveImage(beat.image)}
                  alt=""
                  onerror={(e) => onBeatImageError(e, beat.image)}
                />
              </button>
            {/if}
            <p class="beat-text">{beat.text}</p>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .arc-overlay {
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

  .arc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-shrink: 0;
    padding: 0.85rem 1rem 0.7rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
  }

  .arc-title {
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
    padding: 0.4rem 0.85rem;
    cursor: pointer;
  }

  .close-btn:hover {
    border-color: var(--color-brass);
    background: var(--color-data-hover);
  }

  .arc-body {
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

  .beat-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .beat-card {
    display: flex;
    align-items: stretch;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    color: var(--color-ink);
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    border: 1px solid var(--color-brown-border);
    border-radius: 5px;
    box-shadow:
      inset 0 0 20px rgba(90, 75, 60, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.28);
  }

  .beat-card:not(.has-image) {
    padding: 0.75rem 0.85rem;
  }

  .beat-image-btn {
    flex: 0 0 296px;
    width: 296px;
    height: 296px;
    align-self: flex-start;
    margin: 0;
    padding: 0;
    border: none;
    border-right: 1px solid rgba(90, 75, 60, 0.35);
    border-radius: 0;
    background: var(--color-deep-brown);
    cursor: zoom-in;
    overflow: hidden;
    transition:
      flex-basis 0.2s ease,
      width 0.2s ease,
      height 0.2s ease;
  }

  .beat-card.expanded {
    flex-direction: column;
  }

  .beat-image-btn.expanded {
    flex: 0 0 auto;
    align-self: stretch;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    border-right: none;
    border-bottom: 1px solid rgba(90, 75, 60, 0.35);
    cursor: zoom-out;
  }

  .beat-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .beat-text {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    font-size: 1.02rem;
    line-height: 1.65;
    color: var(--color-ink);
    white-space: pre-wrap;
  }

  .beat-card.has-image .beat-text {
    padding: 0.75rem 0.85rem;
  }
</style>
