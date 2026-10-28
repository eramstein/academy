<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, onBack, children }: { title: string; onBack: () => void; children: Snippet } =
    $props();
</script>

<div class="detail">
  <div class="bar">
    <button type="button" class="back" onclick={onBack}>
      <span class="chevron" aria-hidden="true"></span>
      Back
    </button>
    <h2>{title}</h2>
  </div>
  <div class="body">
    {@render children()}
  </div>
</div>

<style>
  .detail {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    color: var(--color-cream);
    font-family: var(--font-narrative);
  }

  .bar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.85rem;
    padding: 0.9rem 1.2rem 0.35rem;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.7rem 0.35rem 0.55rem;
    background: transparent;
    border: 1px solid rgba(175, 142, 103, 0.45);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back:hover {
    background: var(--color-data-hover);
  }

  .back:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .chevron {
    width: 0.4rem;
    height: 0.4rem;
    border-top: 2px solid currentColor;
    border-left: 2px solid currentColor;
    transform: rotate(-45deg);
  }

  h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 0.55rem 1.2rem 1.2rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 142, 103, 0.35) transparent;
  }

  .body :global(.pending) {
    margin: 0.2rem 0 0;
    color: var(--color-muted-label);
    font-size: 0.95rem;
    line-height: 1.5;
  }
</style>
