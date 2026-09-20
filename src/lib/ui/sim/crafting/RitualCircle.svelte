<script lang="ts">
  import { getUiIconPath } from '@/lib/_utils/asset-paths';

  let {
    charge = 0,
    ignite = false,
    dim = false,
    fed = 0,
  }: {
    charge?: number;
    ignite?: boolean;
    dim?: boolean;
    fed?: number;
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
  style="--charge: {clamped}; --spiral: url('{spiral}')"
  aria-hidden="true"
>
  <span class="ring outer"></span>
  <span class="ring mid"></span>
  <span class="ring inner"></span>
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
    width: 200px;
    height: 200px;
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
    inset: 68px;
    background: var(--spiral) center / contain no-repeat;
    opacity: calc(0.45 + var(--charge) * 0.4);
    filter: drop-shadow(
      0 0 calc(4px + var(--charge) * 10px)
        color-mix(in srgb, var(--color-golden) calc(var(--charge) * 80%), transparent)
    );
    animation: spin 18s linear infinite reverse;
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

  @media (prefers-reduced-motion: reduce) {
    .ring,
    .spiral,
    .circle.unstable,
    .ignite .core {
      animation: none;
    }
  }
</style>
