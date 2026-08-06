<script lang="ts">
  import { untrack } from 'svelte';

  let {
    text,
    class: className = '',
    msPerChar = 18,
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
      untrack(() => onProgress?.());
      if (i >= full.length) {
        window.clearInterval(id);
        untrack(() => onDone?.());
      }
    }, stepMs);

    return () => window.clearInterval(id);
  });
</script>

<p class={className}>
  {displayed}<span class="caret" class:done={displayed.length >= text.length} aria-hidden="true"></span>
</p>

<style>
  .caret {
    display: inline-block;
    width: 0.55ch;
    height: 1.05em;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: currentColor;
    opacity: 0.55;
    animation: blink 0.85s step-end infinite;
  }

  .caret.done {
    opacity: 0;
    animation: none;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .caret {
      display: none;
    }
  }
</style>
