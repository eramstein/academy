<script lang="ts">
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import type { Snippet } from 'svelte';

  let {
    title,
    ignite = false,
    wide = false,
    children,
    footer,
  }: {
    title: string;
    ignite?: boolean;
    wide?: boolean;
    children: Snippet;
    footer?: Snippet;
  } = $props();

  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
</script>

<div class="overlay" role="presentation">
  <div
    class="frame"
    class:ignite
    class:wide
    role="dialog"
    aria-modal="true"
    aria-labelledby="workbench-title"
    style="--table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="workbench-title" class="title">
        <span class="star" aria-hidden="true"></span>
        {title}
        <span class="star" aria-hidden="true"></span>
      </h2>
      {@render children()}
    </div>
    {#if footer}
      <footer class="actions">{@render footer()}</footer>
    {/if}
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
    width: min(860px, 100%);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    padding: 10px 10px 8px;
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .frame.wide {
    width: min(1180px, calc(100vw - 24px));
    max-height: min(96vh, 940px);
    /* Avoid scrollbar flash when vessel / card transitions briefly overflow. */
    overflow: hidden;
  }

  .panel {
    position: relative;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    /* overflow-x:hidden + overflow-y:visible computes to auto and flashes scrollbars */
    overflow: hidden;
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: var(--color-ink);
    padding: 16px 20px 18px;
    box-sizing: border-box;
    font-family: var(--font-narrative);
    font-size: 1rem;
    border-radius: 3px;
    box-shadow: inset 0 0 28px rgba(90, 75, 60, 0.12);
  }

  .frame.wide .panel {
    overflow: visible;
    padding: 18px 22px 20px;
  }

  .frame.ignite .panel {
    box-shadow:
      inset 0 0 28px rgba(90, 75, 60, 0.12),
      inset 0 0 80px color-mix(in srgb, var(--color-golden) 18%, transparent);
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 0 12px;
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

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 3.2rem;
    padding: 10px 8px 4px;
  }
</style>
