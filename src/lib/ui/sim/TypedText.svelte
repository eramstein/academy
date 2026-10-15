<script lang="ts">
  import { untrack } from 'svelte';

  let {
    text,
    class: className = '',
    // msPerChar = 18,
    msPerChar = 0,
    onProgress,
    onDone,
  }: {
    text: string;
    class?: string;
    msPerChar?: number;
    onProgress?: () => void;
    onDone?: () => void;
  } = $props();

  let displayed = $state('');
  let root: HTMLParagraphElement | undefined = $state();

  $effect(() => {
    const full = text;
    const stepMs = Math.min(28, Math.max(10, msPerChar));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || full.length === 0) {
      displayed = full;
      untrack(() => onDone?.());
      return;
    }

    displayed = '';
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      displayed = full.slice(0, i);
      if (i >= full.length) {
        window.clearInterval(id);
        untrack(() => onDone?.());
      }
    }, stepMs);

    return () => window.clearInterval(id);
  });

  // Line growth only. A callback per glyph makes the page snap on every wrap.
  $effect(() => {
    const el = root;
    const notify = onProgress;
    if (!el || !notify) return;
    let height = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      const next = el.offsetHeight;
      if (next === height) return;
      height = next;
      untrack(() => notify());
    });
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<p class={className} bind:this={root}>
  {displayed}<span class="caret" class:done={displayed.length >= text.length} aria-hidden="true"
  ></span>
</p>

<style>
  .caret {
    display: inline-block;
    width: 0;
    height: 1.05em;
    vertical-align: text-bottom;
    position: relative;
  }

  .caret::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 2px;
    height: 100%;
    background: currentColor;
    opacity: 0.55;
    animation: blink 0.85s step-end infinite;
  }

  .caret.done::after {
    opacity: 0;
    animation: none;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .caret,
    .caret::after {
      display: none;
    }
  }
</style>
