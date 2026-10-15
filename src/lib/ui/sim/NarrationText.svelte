<script lang="ts">
  import { untrack } from 'svelte';
  import type { Mentions } from '@/lib/_model';
  import { selectSimCharacter } from '@/lib/_state/state-ui.svelte';
  import { getActionTooltip } from '@/lib/sim/cards/action-templates';
  import Tooltip from '@/lib/ui/Tooltip.svelte';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
  import { segmentNarration, visibleSegments } from './narration-mentions';

  let {
    text,
    mentions,
    animate = false,
    class: className = '',
    msPerChar = 0,
    onProgress,
    onDone,
  }: {
    text: string;
    mentions?: Mentions;
    animate?: boolean;
    class?: string;
    msPerChar?: number;
    onProgress?: () => void;
    onDone?: () => void;
  } = $props();

  let visibleLength = $state(0);
  let hoveredMention = $state<number | null>(null);
  let root: HTMLDivElement | undefined = $state();

  const segments = $derived(segmentNarration(text, mentions));
  const shown = $derived(visibleSegments(segments, visibleLength));

  $effect(() => {
    const full = text;
    const shouldAnimate = animate;
    const stepMs = Math.min(28, Math.max(10, msPerChar));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!shouldAnimate || reduceMotion || full.length === 0) {
      visibleLength = full.length;
      untrack(() => onDone?.());
      return;
    }

    visibleLength = 0;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      visibleLength = i;
      if (i >= full.length) {
        window.clearInterval(id);
        untrack(() => onDone?.());
      }
    }, stepMs);

    return () => window.clearInterval(id);
  });

  // Tell the page when a line is added. Per-glyph progress snaps the scroll
  // on every wrap, which yanks the lines already on the page.
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

<!-- prettier-ignore -->
<div class={className} bind:this={root}>{#each shown as segment, i (i)}{#if segment.type === 'text'}{segment.text}{:else if segment.type === 'keyword'}<Tooltip content={getKeywordTooltip(segment.id)} show={hoveredMention === i}><span class="mention" onmouseenter={() => (hoveredMention = i)} onmouseleave={() => (hoveredMention = null)}>{segment.text}</span></Tooltip>{:else if segment.type === 'action'}<Tooltip content={getActionTooltip(segment.id)} show={hoveredMention === i}><span class="mention" onmouseenter={() => (hoveredMention = i)} onmouseleave={() => (hoveredMention = null)}>{segment.text}</span></Tooltip>{:else}<button type="button" class="mention mention-character" onclick={() => selectSimCharacter(segment.id)}>{segment.text}</button>{/if}{/each}{#if animate}<span class="caret" class:done={visibleLength >= text.length} aria-hidden="true"></span>{/if}</div>

<style>
  .mention {
    text-decoration: underline;
    text-decoration-color: rgba(44, 37, 29, 0.32);
    text-underline-offset: 0.16em;
    text-decoration-thickness: 1px;
    cursor: help;
  }

  div :global(.tooltip-reference) {
    display: inline;
  }

  .mention-character {
    display: inline;
    padding: 0;
    margin: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    line-height: inherit;
    cursor: pointer;
  }

  .mention-character:hover,
  .mention-character:focus-visible {
    text-decoration-color: rgba(44, 37, 29, 0.55);
  }

  .mention-character:focus {
    outline: none;
  }

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
