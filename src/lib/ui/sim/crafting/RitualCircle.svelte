<script lang="ts">
  import { getUiIconPath } from '@/lib/_utils/asset-paths';

  let {
    charge = 0,
    ignite = false,
    dim = false,
    fed = 0,
    /** Hide the rotating core glyph (e.g. when a forming card sits in the circle). */
    suppressCore = false,
    /** Gold constellation used by the invocation scene. */
    ornate = false,
  }: {
    charge?: number;
    ignite?: boolean;
    dim?: boolean;
    fed?: number;
    suppressCore?: boolean;
    ornate?: boolean;
  } = $props();

  const spiral = getUiIconPath('conjure');
  const clamped = $derived(Math.min(1, Math.max(0, charge)));
  const lit = $derived(clamped > 0 || ignite);
  const unstable = $derived(clamped >= 1);
</script>

<div
  class="circle"
  class:lit
  class:ignite
  class:dim
  class:unstable
  class:suppress-core={suppressCore}
  class:ornate
  style="--charge: {clamped}; --spiral: url('{spiral}')"
  aria-hidden="true"
>
  <span class="ring outer"></span>
  <span class="ring mid"></span>
  <span class="ring inner"></span>
  {#if ornate}
    <svg class="chart" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="47.5" />
      <circle cx="50" cy="50" r="39" />
      <circle cx="50" cy="50" r="31" class="dashed" />
      <path d="M50 3.5 V14 M50 86 V96.5 M3.5 50 H14 M86 50 H96.5" />
    </svg>
    <span class="ticks"></span>
    <span class="dust"></span>
  {/if}
  <span class="core"></span>
  <span class="spiral"></span>
  {#key fed}
    {#if fed > 0}
      <span class="flash"></span>
    {/if}
  {/key}
</div>

<style>
  .circle {
    position: relative;
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    transition:
      transform 0.45s ease,
      opacity 0.45s ease,
      filter 0.45s ease;
  }

  .circle.ignite {
    transform: scale(1.08);
  }

  .circle.dim {
    opacity: 0.28;
    filter: blur(0.4px);
  }

  .circle.unstable:not(.dim):not(.ignite) {
    animation: shiver 0.18s linear infinite;
  }

  .ring {
    position: absolute;
    border-radius: 50%;
    box-sizing: border-box;
    pointer-events: none;
  }

  .ring.outer {
    inset: 0;
    border: 2px solid color-mix(in srgb, var(--color-brass) 55%, transparent);
    box-shadow:
      0 0 calc(8px + var(--charge) * 18px)
        color-mix(in srgb, var(--color-golden) calc(var(--charge) * 55%), transparent),
      inset 0 0 calc(6px + var(--charge) * 12px)
        color-mix(in srgb, var(--color-golden) calc(var(--charge) * 22%), transparent);
    animation: spin 22s linear infinite;
    opacity: 0.55;
  }

  .ring.mid {
    inset: 18px;
    border: 1px solid color-mix(in srgb, var(--color-brass) 42%, transparent);
    animation: spin 16s linear infinite reverse;
    opacity: 0.55;
  }

  .ring.inner {
    inset: 38px;
    border: 1px dashed color-mix(in srgb, var(--color-golden) 38%, transparent);
    animation: spin 11s linear infinite;
    opacity: calc(0.25 + var(--charge) * 0.55);
  }

  .lit .ring.outer {
    opacity: 1;
  }

  .core {
    position: absolute;
    inset: 58px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--color-golden) calc(12% + var(--charge) * 38%), transparent),
      transparent 72%
    );
    opacity: calc(0.35 + var(--charge) * 0.65);
    transition: opacity 0.3s ease;
  }

  .ignite .core {
    animation: pulse 0.7s ease-in-out infinite alternate;
  }

  .spiral {
    position: absolute;
    inset: 34%;
    background: var(--spiral) center / contain no-repeat;
    opacity: calc(0.45 + var(--charge) * 0.4);
    filter: drop-shadow(
      0 0 calc(4px + var(--charge) * 10px)
        color-mix(in srgb, var(--color-golden) calc(var(--charge) * 80%), transparent)
    );
    animation: spin 18s linear infinite reverse;
    transition: opacity 0.35s ease, transform 0.35s ease;
  }

  .suppress-core .spiral,
  .suppress-core .core {
    opacity: 0;
    transform: scale(0.6);
    pointer-events: none;
  }

  .flash {
    position: absolute;
    inset: 24px;
    border-radius: 50%;
    border: 2px solid var(--color-golden);
    box-shadow: 0 0 18px var(--color-golden);
    animation: flash-out 0.45s ease-out forwards;
    pointer-events: none;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    from {
      opacity: 0.55;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1.08);
    }
  }

  @keyframes shiver {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(0.6px, -0.5px) scale(1);
    }
    75% {
      transform: translate(-0.5px, 0.4px) scale(1);
    }
  }

  @keyframes flash-out {
    from {
      opacity: 0.9;
      transform: scale(0.72);
    }
    to {
      opacity: 0;
      transform: scale(1.35);
    }
  }

  .circle.ornate::before {
    content: '';
    position: absolute;
    inset: -5%;
    border-radius: 50%;
    border: 2px solid rgba(226, 194, 122, 0.9);
    box-shadow:
      0 0 14px rgba(191, 161, 74, 0.7),
      0 0 36px rgba(191, 161, 74, 0.35),
      inset 0 0 18px rgba(191, 161, 74, 0.2);
    pointer-events: none;
  }

  .chart {
    position: absolute;
    inset: -6%;
    width: auto;
    height: auto;
    overflow: visible;
    pointer-events: none;
  }

  .chart circle,
  .chart path {
    fill: none;
    stroke: #e2c27a;
    stroke-width: 0.45;
  }

  .chart circle.dashed {
    stroke-width: 0.35;
    stroke-dasharray: 0.6 1.35;
  }

  .circle.ornate .ring.outer {
    inset: -2%;
    border: 1.5px solid rgba(226, 194, 122, 0.95);
    box-shadow:
      0 0 12px rgba(191, 161, 74, 0.7),
      0 0 32px rgba(191, 161, 74, 0.35),
      inset 0 0 16px rgba(191, 161, 74, 0.18);
    opacity: 1;
    animation-duration: 80s;
  }

  .circle.ornate .ring.mid {
    inset: 9%;
    border: 1px solid rgba(198, 161, 90, 0.55);
    opacity: 0.8;
    animation-duration: 56s;
  }

  .circle.ornate .ring.inner {
    inset: 18%;
    border: 1px dashed rgba(232, 196, 122, 0.55);
    opacity: 0.7;
    animation-duration: 40s;
  }

  .ticks {
    position: absolute;
    inset: -2%;
    border-radius: 50%;
    background: repeating-conic-gradient(
      from 0deg,
      rgba(240, 230, 200, 0.95) 0 1.4deg,
      transparent 1.4deg 10deg
    );
    mask: radial-gradient(circle, transparent 63%, #000 64.2%, #000 66.2%, transparent 67.4%);
    -webkit-mask: radial-gradient(circle, transparent 63%, #000 64.2%, #000 66.2%, transparent 67.4%);
    opacity: 0.75;
    animation: spin 90s linear infinite;
    pointer-events: none;
  }

  .dust {
    position: absolute;
    inset: -8%;
    border-radius: 50%;
    background:
      radial-gradient(circle at 18% 22%, rgba(240, 230, 200, 0.95) 0 1.5px, transparent 2.2px),
      radial-gradient(circle at 78% 12%, rgba(198, 161, 90, 0.9) 0 1.2px, transparent 2px),
      radial-gradient(circle at 92% 48%, rgba(240, 230, 200, 0.8) 0 1.4px, transparent 2.1px),
      radial-gradient(circle at 70% 86%, rgba(198, 161, 90, 0.85) 0 1.3px, transparent 2px),
      radial-gradient(circle at 28% 78%, rgba(240, 230, 200, 0.75) 0 1.1px, transparent 1.8px),
      radial-gradient(circle at 8% 58%, rgba(198, 161, 90, 0.7) 0 1.2px, transparent 1.9px);
    filter: drop-shadow(0 0 3px rgba(191, 161, 74, 0.8));
    animation: spin 36s linear infinite reverse;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .ring,
    .spiral,
    .ticks,
    .dust,
    .circle.unstable,
    .ignite .core {
      animation: none;
    }
  }
</style>
