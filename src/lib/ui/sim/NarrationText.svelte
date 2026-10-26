<script lang="ts">
  import type { Mentions } from '@/lib/_model';
  import { settings, TEXT_SPEED_MS } from '@/lib/_state/settings.svelte';
  import { selectSimCharacter } from '@/lib/_state/state-ui.svelte';
  import { getActionTooltip } from '@/lib/sim/cards/action-templates';
  import Tooltip from '@/lib/ui/Tooltip.svelte';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
  import { tick, untrack } from 'svelte';
  import { revealInk, type InkBeat } from './ink-beat';
  import { segmentNarration, visibleSegments } from './narration-mentions';

  let {
    text,
    mentions,
    animate = false,
    class: className = '',
    msPerChar,
    onBeat,
    onDone,
  }: {
    text: string;
    mentions?: Mentions;
    animate?: boolean;
    class?: string;
    /** Override the Settings text speed (ms per character). 0 = instant. */
    msPerChar?: number;
    onBeat?: (beat: Exclude<InkBeat, { kind: 'layout' }>) => void | Promise<void>;
    onDone?: () => void;
  } = $props();

  let visibleLength = $state(0);
  let hoveredMention = $state<number | null>(null);
  let root: HTMLDivElement | undefined = $state();
  let cancelTyping: (() => void) | null = null;
  let finished = false;

  const segments = $derived(segmentNarration(text, mentions));
  const shown = $derived(visibleSegments(segments, visibleLength));
  const typing = $derived(animate && visibleLength < text.length);

  function skipTyping(event?: MouseEvent) {
    if (!typing) return;
    event?.preventDefault();
    window.getSelection()?.removeAllRanges();
    cancelTyping?.();
    visibleLength = text.length;
    if (!finished) {
      finished = true;
      onDone?.();
    }
  }

  $effect(() => {
    const full = text;
    const shouldAnimate = animate;
    const rawMs = msPerChar ?? TEXT_SPEED_MS[settings.textSpeed];
    const instant = rawMs <= 0;
    const stepMs = instant ? 0 : Math.min(28, Math.max(10, rawMs));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    finished = false;

    if (!shouldAnimate || instant || reduceMotion || full.length === 0) {
      visibleLength = full.length;
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
          visibleLength = length;
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

<!-- prettier-ignore -->
<div
  class={className}
  bind:this={root}
  title={typing ? 'Double-click to skip' : undefined}
  ondblclick={skipTyping}
>{#each shown as segment, i (i)}{#if segment.type === 'text'}{segment.text}{:else if segment.type === 'keyword'}<Tooltip content={getKeywordTooltip(segment.id)} show={hoveredMention === i}><span class="mention" onmouseenter={() => (hoveredMention = i)} onmouseleave={() => (hoveredMention = null)}>{segment.text}</span></Tooltip>{:else if segment.type === 'action'}<Tooltip content={getActionTooltip(segment.id)} show={hoveredMention === i}><span class="mention" onmouseenter={() => (hoveredMention = i)} onmouseleave={() => (hoveredMention = null)}>{segment.text}</span></Tooltip>{:else}<button type="button" class="mention mention-character" onclick={() => selectSimCharacter(segment.id)}>{segment.text}</button>{/if}{/each}{#if animate}<span class="caret" class:done={visibleLength >= text.length} aria-hidden="true"></span>{/if}</div>

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
