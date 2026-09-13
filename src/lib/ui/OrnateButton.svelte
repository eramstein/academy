<script lang="ts">
  import { getAssetPath, getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import type { Snippet } from 'svelte';

  let {
    onclick,
    disabled = false,
    variant = 'default',
    icon,
    lead,
    children,
    type = 'button',
  }: {
    onclick?: (e: MouseEvent) => void;
    disabled?: boolean;
    variant?: 'default' | 'long';
    icon?: string;
    lead?: Snippet;
    children?: Snippet;
    type?: 'button' | 'submit' | 'reset';
  } = $props();

  const iconUrl = $derived(icon ? getUiIconPath(icon) : undefined);
  const paintedIcon = $derived(!!icon && isPaintedUiIcon(icon));
  const borderUrl = getAssetPath('images/border.png');
  const cornerUrl = getAssetPath('images/corner.png');
</script>

<button
  {type}
  class="ornate-button"
  class:long={variant === 'long'}
  class:has-lead={!!lead}
  class:has-icon={!!iconUrl}
  style="--border-img: url('{borderUrl}'); --corner-img: url('{cornerUrl}')"
  {disabled}
  {onclick}
>
  <span class="frame" aria-hidden="true">
    <span class="fill"></span>
    <span class="edge top"></span>
    <span class="edge right"><span class="strip"></span></span>
    <span class="edge bottom"></span>
    <span class="edge left"><span class="strip"></span></span>
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
  </span>
  <span class="content">
    {#if lead}
      {@render lead()}
    {:else if iconUrl}
      <span class="icon" class:painted={paintedIcon} style="--icon: url('{iconUrl}')"></span>
    {/if}
    {#if children}
      <span class="label">{@render children()}</span>
    {/if}
  </span>
</button>

<style>
  .ornate-button {
    /*
      Native assets: corner 32×32, border strip 192×15; the corner's arm meets
      the strip at 11/32 in. The strip is squashed to 7px rather than its
      proportional 7.5px: at 7.5px the browser rounds up and the strip's gold
      band renders a pixel wider than the corner's, leaving a step at the join.
    */
    --corner-size: 16px;
    --border-w: calc(var(--corner-size) * 7 / 16);
    --edge-inset: calc(var(--corner-size) * 11 / 32);
    --radius: 7px;
    --metal-hi: #c9a87a;
    position: relative;
    display: inline-flex;
    align-items: stretch;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    font-size: 1rem;
    line-height: 1.2;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 80ms ease,
      filter 80ms ease;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.65)) drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4))
      drop-shadow(0 8px 12px rgba(0, 0, 0, 0.22));
  }

  .ornate-button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .frame {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .fill {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border-radius: var(--radius);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 36%),
      radial-gradient(120% 90% at 50% 0%, rgba(240, 230, 200, 0.06), transparent 55%),
      var(--color-data);
    box-shadow:
      inset 0 2px 3px rgba(0, 0, 0, 0.55),
      inset 0 -1px 0 rgba(240, 230, 200, 0.06),
      inset 0 0 10px rgba(0, 0, 0, 0.35);
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: var(--border-img) center / 100% 100% no-repeat;
  }

  .edge.top {
    top: 0;
    left: var(--edge-inset);
    right: var(--edge-inset);
    height: var(--border-w);
  }

  .edge.bottom {
    bottom: 0;
    left: var(--edge-inset);
    right: var(--edge-inset);
    height: var(--border-w);
    transform: rotate(180deg);
  }

  .edge.left,
  .edge.right {
    top: var(--edge-inset);
    bottom: var(--edge-inset);
    width: var(--border-w);
    background: none;
    overflow: hidden;
    container-type: size;
  }

  .edge.left {
    left: 0;
  }

  .edge.right {
    right: 0;
  }

  .edge .strip {
    position: absolute;
    top: 0;
    left: 0;
    width: 100cqh;
    height: 100cqw;
    background: var(--border-img) center / 100% 100% no-repeat;
  }

  .edge.right .strip {
    transform-origin: top left;
    transform: rotate(90deg) translateY(-100%);
  }

  .edge.left .strip {
    transform-origin: top left;
    transform: rotate(-90deg) translateX(-100%);
  }

  .corner {
    position: absolute;
    z-index: 2;
    width: var(--corner-size);
    height: var(--corner-size);
    background: var(--corner-img) center / 100% 100% no-repeat;
  }

  .corner.tl {
    top: 0;
    left: 0;
  }

  .corner.tr {
    top: 0;
    right: 0;
    transform: rotate(90deg);
  }

  .corner.bl {
    bottom: 0;
    left: 0;
    transform: rotate(270deg);
  }

  .corner.br {
    bottom: 0;
    right: 0;
    transform: rotate(180deg);
  }

  .content {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.65rem;
    padding: calc(0.55rem + 5px) 1.5rem;
    box-sizing: border-box;
  }

  .ornate-button.has-lead .content {
    z-index: 3;
    align-items: stretch;
    padding: 0;
    gap: 0;
  }

  .icon {
    display: block;
    width: 1.3rem;
    height: 1.3rem;
    flex-shrink: 0;
    background: var(--metal-hi);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.55));
  }

  .icon.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .label {
    display: inline-flex;
    align-items: center;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.65);
  }

  .ornate-button.has-lead .label {
    padding: calc(0.5rem + 5px) 1.4rem calc(0.5rem + 5px) 0.85rem;
  }

  .ornate-button:hover:not(:disabled) .fill {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 36%),
      radial-gradient(120% 90% at 50% 0%, rgba(240, 230, 200, 0.09), transparent 55%),
      var(--color-data-hover);
  }

  .ornate-button:hover:not(:disabled) .edge,
  .ornate-button:hover:not(:disabled) .corner {
    filter: brightness(1.08);
  }

  .ornate-button:active:not(:disabled) {
    transform: translateY(1px);
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.55)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }

  .ornate-button:active:not(:disabled) .fill {
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.12), transparent 50%), var(--color-data-active);
    box-shadow:
      inset 0 3px 5px rgba(0, 0, 0, 0.65),
      inset 0 0 8px rgba(0, 0, 0, 0.4);
  }

  .ornate-button:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 3px;
  }
</style>
