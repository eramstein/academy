<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { revealInk, type InkBeat } from './ink-beat';

  let {
    text,
    class: className = '',
    // msPerChar = 18,
    msPerChar = 0,
    onBeat,
    onDone,
  }: {
    text: string;
    class?: string;
    msPerChar?: number;
    onBeat?: (beat: Exclude<InkBeat, { kind: 'layout' }>) => void | Promise<void>;
    onDone?: () => void;
  } = $props();

  let displayed = $state('');
  let root: HTMLParagraphElement | undefined = $state();
  let cancelTyping: (() => void) | null = null;
  let finished = false;

  const typing = $derived(displayed.length < text.length);

  function skipTyping(event?: MouseEvent) {
    if (!typing) return;
    event?.preventDefault();
    window.getSelection()?.removeAllRanges();
    cancelTyping?.();
    displayed = text;
    if (!finished) {
      finished = true;
      onDone?.();
    }
  }

  $effect(() => {
    const full = text;
    const stepMs = Math.min(28, Math.max(10, msPerChar));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    finished = false;

    if (reduceMotion || full.length === 0) {
      displayed = full;
      finished = true;
      untrack(() => onDone?.());
      return;
    }

    let cancelled = false;
    cancelTyping = () => {
      cancelled = true;
    };
    void (async () => {
      await revealInk({
        text: full,
        stepMs,
        isCancelled: () => cancelled,
        reveal: (length) => {
          displayed = full.slice(0, length);
        },
        layout: () => tick(),
        element: () => root,
        onBeat: (beat) => untrack(() => onBeat)?.(beat),
      });
      if (!cancelled) {
        finished = true;
        untrack(() => onDone?.());
      }
    })();

    return () => {
      cancelled = true;
      cancelTyping = null;
    };
  });
</script>

<p
  class={className}
  bind:this={root}
  title={typing ? 'Double-click to skip' : undefined}
  ondblclick={skipTyping}
>
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
