<script lang="ts">
  import { getAssetPath } from '@/lib/_utils/asset-paths';

  let {
    patternKey,
    size = 'md',
    muted = false,
  }: {
    patternKey: string;
    size?: 'sm' | 'md';
    muted?: boolean;
  } = $props();

  const cornerPath = getAssetPath('images/ui/decorations/corner.svg');
  const src = $derived(getAssetPath(`images/artifacts/${patternKey}.jpg`));

  function hideBrokenImage(event: Event) {
    const target = event.currentTarget;
    if (target instanceof HTMLImageElement) target.hidden = true;
  }
</script>

<span
  class="artifact-thumb"
  class:sm={size === 'sm'}
  class:md={size === 'md'}
  class:muted
  style="--corner: url('{cornerPath}')"
>
  <span class="ornament tl" aria-hidden="true"></span>
  <span class="ornament tr" aria-hidden="true"></span>
  <span class="ornament bl" aria-hidden="true"></span>
  <span class="ornament br" aria-hidden="true"></span>
  <span class="inner">
    <img {src} alt="" onerror={hideBrokenImage} />
  </span>
</span>

<style>
  .artifact-thumb {
    position: relative;
    display: block;
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 2px;
    background: #0b1018;
    border: 1.5px solid var(--color-brass);
    border-radius: 3px;
    box-shadow:
      0 3px 10px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(191, 161, 74, 0.18),
      inset 0 0 0 1px rgba(240, 230, 200, 0.12);
  }

  .artifact-thumb.sm {
    width: 3.25rem;
    height: 3.25rem;
  }

  .artifact-thumb.md {
    width: 4.5rem;
    height: 4.5rem;
  }

  .artifact-thumb.muted {
    opacity: 0.88;
  }

  .inner {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.35);
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.72);
  }

  .inner img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ornament {
    position: absolute;
    z-index: 2;
    width: 11px;
    height: 11px;
    pointer-events: none;
    color: var(--color-golden);
    background: currentColor;
    mask: var(--corner) center / contain no-repeat;
    -webkit-mask: var(--corner) center / contain no-repeat;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
  }

  .artifact-thumb.sm .ornament {
    width: 9px;
    height: 9px;
  }

  .ornament.tl {
    top: 0;
    left: 0;
  }

  .ornament.tr {
    top: 0;
    right: 0;
    transform: rotate(90deg);
  }

  .ornament.bl {
    bottom: 0;
    left: 0;
    transform: rotate(-90deg);
  }

  .ornament.br {
    bottom: 0;
    right: 0;
    transform: rotate(180deg);
  }
</style>
