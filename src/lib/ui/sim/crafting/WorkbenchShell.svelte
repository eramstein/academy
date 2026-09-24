<script lang="ts">
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import type { Snippet } from 'svelte';

  let {
    title,
    subtitle = '',
    ignite = false,
    wide = false,
    scene = 'parchment',
    children,
    footer,
  }: {
    title: string;
    subtitle?: string;
    ignite?: boolean;
    wide?: boolean;
    /** `invocation` paints the card-creation scene instead of a plain parchment sheet. */
    scene?: 'parchment' | 'invocation';
    children: Snippet;
    footer?: Snippet;
  } = $props();

  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
  const scenePath = getAssetPath('images/ui/backgrounds/card-creation.png');
</script>

<div class="overlay" role="presentation">
  <div
    class="frame"
    class:ignite
    class:wide
    class:invocation={scene === 'invocation'}
    role="dialog"
    aria-modal="true"
    aria-labelledby="workbench-title"
    style="--table: url('{tablePath}'); --parchment: url('{parchmentPath}'); --scene: url('{scenePath}')"
  >
    <div class="panel">
      <header class="heading">
        <h2 id="workbench-title" class="title">
          <span class="star" aria-hidden="true"></span>
          {title}
          <span class="star" aria-hidden="true"></span>
        </h2>
        {#if subtitle}
          <p class="subtitle">{subtitle}</p>
        {/if}
      </header>
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

  .frame.invocation {
    width: min(1600px, calc(100vw - 20px));
    height: min(1000px, calc(100vh - 16px));
    max-height: calc(100vh - 16px);
    padding: 0;
    /* Outer wood sits under the footer; the scene lives on .panel. */
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 3px;
    box-shadow: 0 22px 56px rgba(0, 0, 0, 0.62);
    overflow: hidden;
  }

  .frame.invocation .panel {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    border-radius: 0;
    box-shadow: none;
    /* Painted scene fills only the main area — never the footer. */
    background: var(--scene) center / 100% 100% no-repeat;
    padding: 4.2% 4.5% 1.2% 4%;
    color: var(--color-ink);
  }

  .heading {
    flex: 0 0 auto;
  }

  .frame.invocation .heading {
    transform: translateX(-150px);
  }

  .frame.invocation .title {
    margin: 0;
    font-size: 1.55rem;
    font-weight: 600;
    letter-spacing: 0.26em;
    color: var(--color-ink);
  }

  .frame.invocation .star {
    width: 9px;
    height: 9px;
    background: #5c4632;
  }

  .subtitle {
    margin: 2px 0 0;
    text-align: center;
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    font-style: italic;
    letter-spacing: 0.01em;
    color: var(--color-ink-muted);
  }

  .frame.invocation .actions {
    flex: 0 0 auto;
    justify-content: flex-end;
    gap: 14px;
    min-height: 3.4rem;
    margin: 0;
    padding: 10px 22px 12px;
    background: transparent;
    border: none;
    border-top: 1px solid rgba(90, 75, 60, 0.55);
    border-radius: 0;
    box-shadow: inset 0 1px 0 rgba(240, 230, 200, 0.06);
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
