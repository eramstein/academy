<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';

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
    variant?: 'default' | 'cancel' | 'long';
    icon?: string;
    lead?: Snippet;
    children?: Snippet;
    type?: 'button' | 'submit' | 'reset';
  } = $props();

  const iconUrl = $derived(icon ? getAssetPath(`images/ui/${icon}.svg`) : undefined);
  const cornerUrl = getAssetPath('images/ui/corner.svg');
</script>

<button
  {type}
  class="ornate-button"
  class:cancel={variant === 'cancel'}
  class:long={variant === 'long'}
  class:has-lead={!!lead}
  class:has-icon={!!iconUrl}
  style="--corner: url('{cornerUrl}')"
  {disabled}
  {onclick}
>
  <span class="frame" aria-hidden="true">
    <span class="fill"></span>
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
  </span>
  <span class="content">
    {#if lead}
      {@render lead()}
    {:else if iconUrl}
      <span class="icon" style="--icon: url('{iconUrl}')"></span>
    {/if}
    {#if children}
      <span class="label">{@render children()}</span>
    {/if}
  </span>
</button>

<style>
  .ornate-button {
    --radius: 7px;
    --ring: 2px;
    --gap: 1.5px;
    --metal-hi: #d4bc6a;
    --metal-mid: var(--color-golden);
    --metal-lo: #6e5a28;
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
    filter:
      drop-shadow(0 1px 0 rgba(0, 0, 0, 0.65)) drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4))
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
    border-radius: var(--radius);
    background: linear-gradient(
      145deg,
      var(--metal-hi) 0%,
      var(--metal-mid) 42%,
      var(--metal-lo) 100%
    );
    padding: var(--ring);
    box-shadow: inset 0 1px 0 rgba(232, 212, 150, 0.28);
  }

  .fill {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: calc(var(--radius) - var(--ring));
    border: var(--gap) solid color-mix(in srgb, var(--metal-mid) 70%, var(--metal-lo));
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 36%),
      radial-gradient(120% 90% at 50% 0%, rgba(240, 230, 200, 0.06), transparent 55%),
      var(--color-data);
    box-shadow:
      inset 0 2px 3px rgba(0, 0, 0, 0.55),
      inset 0 -1px 0 rgba(240, 230, 200, 0.06),
      inset 0 0 10px rgba(0, 0, 0, 0.35);
  }

  .corner {
    position: absolute;
    z-index: 1;
    width: 11px;
    height: 11px;
    opacity: 0.72;
    background: var(--metal-hi);
    mask: var(--corner) center / contain no-repeat;
    -webkit-mask: var(--corner) center / contain no-repeat;
  }

  .corner.tl {
    top: 1px;
    left: 1px;
  }

  .corner.tr {
    top: 1px;
    right: 1px;
    transform: scaleX(-1);
  }

  .corner.bl {
    bottom: 1px;
    left: 1px;
    transform: scaleY(-1);
  }

  .corner.br {
    bottom: 1px;
    right: 1px;
    transform: scale(-1);
  }

  .content {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.55rem;
    padding: 0.5rem 1.4rem;
    box-sizing: border-box;
  }

  .ornate-button.has-lead .content {
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

  .label {
    display: inline-flex;
    align-items: center;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.65);
  }

  .ornate-button.has-lead .label {
    padding: 0.5rem 1.4rem 0.5rem 0.85rem;
  }

  .ornate-button:hover:not(:disabled) .fill {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 36%),
      radial-gradient(120% 90% at 50% 0%, rgba(240, 230, 200, 0.09), transparent 55%),
      var(--color-data-hover);
  }

  .ornate-button:hover:not(:disabled) .frame {
    background: linear-gradient(145deg, #cbb56a 0%, var(--metal-mid) 42%, var(--metal-lo) 100%);
  }

  .ornate-button:hover:not(:disabled) .corner {
    opacity: 0.85;
  }

  .ornate-button:active:not(:disabled) {
    transform: translateY(1px);
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.55)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }

  .ornate-button:active:not(:disabled) .fill {
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.12), transparent 50%),
      var(--color-data-active);
    box-shadow:
      inset 0 3px 5px rgba(0, 0, 0, 0.65),
      inset 0 0 8px rgba(0, 0, 0, 0.4);
  }

  .ornate-button:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 3px;
  }

  .ornate-button.cancel {
    color: var(--color-muted-label);
  }

  .ornate-button.cancel .icon {
    background: var(--color-muted-label);
  }

  .ornate-button.cancel .fill {
    background: rgba(0, 0, 0, 0.4);
    box-shadow:
      inset 0 2px 3px rgba(0, 0, 0, 0.5),
      inset 0 0 8px rgba(0, 0, 0, 0.3);
  }

  .ornate-button.cancel .corner {
    opacity: 0.4;
  }

  .ornate-button.cancel:hover:not(:disabled) {
    color: var(--color-cream);
  }

  .ornate-button.cancel:hover:not(:disabled) .icon {
    background: var(--metal-hi);
  }

  .ornate-button.cancel:hover:not(:disabled) .fill {
    background: var(--color-data);
  }

  .ornate-button.cancel:hover:not(:disabled) .corner {
    opacity: 0.72;
  }
</style>
