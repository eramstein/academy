<script lang="ts">
  import { untrack } from 'svelte';
  import { config } from '@/lib/_config';
  import { ActionDuration } from '@/lib/_model';
  import { performAction } from '@/lib/sim/actions';
  import { selectOption } from '@/lib/sim/scene';
  import { gs } from '@/lib/_state/main.svelte';
  import { NarrationType } from '@/lib/_model/enums-sim';
  import TypedText from './TypedText.svelte';
  import AttributeCheckEntry from './AttributeCheckEntry.svelte';

  const narration = $derived(gs.scene.narration);
  const event = $derived(gs.scene.event);
  const actions = $derived(gs.scene.actions);
  const shortUsed = $derived(gs.time.usedActions[ActionDuration.Short]);
  const longUsed = $derived(gs.time.usedActions[ActionDuration.Long]);

  let bookEl: HTMLElement | undefined = $state();
  let pageEl: HTMLDivElement | undefined = $state();
  let contentEl: HTMLDivElement | undefined = $state();
  let completedIds = $state<string[]>([]);
  let bookHeight = $state<number | undefined>(undefined);
  let heightTransition = $state(false);
  let scrollable = $state(false);

  const completedSet = $derived(new Set(completedIds));
  const activeEntry = $derived(narration.find((entry) => !completedSet.has(entry.id)));
  const narrationDone = $derived(narration.length > 0 && completedIds.length >= narration.length);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // When scene is replaced (save load / init), show existing narration instantly.
  // Live pushes keep the same scene object, so new entries still animate.
  $effect.pre(() => {
    const scene = gs.scene;
    untrack(() => {
      completedIds = scene.narration.map((entry) => entry.id);
    });
  });

  $effect(() => {
    const ids = new Set(narration.map((entry) => entry.id));
    const next = completedIds.filter((id) => ids.has(id));
    if (next.length !== completedIds.length) {
      completedIds = next;
    }
  });

  $effect(() => {
    if (!bookEl || !pageEl || !contentEl) return;

    const syncHeight = () => {
      if (!bookEl || !pageEl || !contentEl) return;
      const pageStyles = getComputedStyle(pageEl);
      const chromeY =
        parseFloat(pageStyles.paddingTop) +
        parseFloat(pageStyles.paddingBottom) +
        parseFloat(pageStyles.borderTopWidth) +
        parseFloat(pageStyles.borderBottomWidth);
      const maxHeight = getMaxBookHeight();
      const natural = Math.ceil(contentEl.scrollHeight + chromeY);
      const next = Math.min(natural, maxHeight);
      const nowScrollable = natural > maxHeight + 0.5;
      const current = untrack(() => bookHeight);

      scrollable = nowScrollable;

      if (!nowScrollable && pageEl.scrollTop !== 0) {
        pageEl.scrollTop = 0;
      }

      if (current === undefined) {
        bookHeight = next;
        return;
      }

      if (next === current) return;

      const delta = Math.abs(next - current);
      // Small changes (line wraps while typing) follow instantly; larger jumps ease.
      if (reduceMotion || delta < 48) {
        const wasTransitioning = untrack(() => heightTransition);
        if (wasTransitioning) heightTransition = false;
        bookHeight = next;
        if (wasTransitioning && !reduceMotion) {
          requestAnimationFrame(() => {
            heightTransition = true;
          });
        }
      } else {
        if (!untrack(() => heightTransition) && !reduceMotion) {
          heightTransition = true;
        }
        bookHeight = next;
      }
    };

    const ro = new ResizeObserver(syncHeight);
    ro.observe(contentEl);
    if (bookEl.parentElement) ro.observe(bookEl.parentElement);
    syncHeight();

    return () => ro.disconnect();
  });

  function getMaxBookHeight(): number {
    const scene = bookEl?.parentElement;
    if (!scene) return Number.POSITIVE_INFINITY;
    const styles = getComputedStyle(scene);
    const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const gap = parseFloat(styles.gap) || 0;
    const actionsEl = scene.querySelector('.actions') as HTMLElement | null;
    const actionsH = actionsEl?.offsetHeight ?? 0;
    return Math.max(0, scene.clientHeight - padY - actionsH - (actionsEl ? gap : 0));
  }

  function scrollPageToBottom(behavior: ScrollBehavior = 'smooth') {
    if (!untrack(() => scrollable)) return;
    queueMicrotask(() => {
      pageEl?.scrollTo({ top: pageEl.scrollHeight, behavior });
    });
  }

  function completeEntry(id: string) {
    if (completedSet.has(id)) return;
    completedIds = [...completedIds, id];
    scrollPageToBottom('smooth');
  }
</script>

<div class="scene">
  <article
    class="book"
    class:height-transition={heightTransition && !reduceMotion}
    bind:this={bookEl}
    style:height={bookHeight !== undefined ? `${bookHeight}px` : undefined}
  >
    <div class="page" class:scrollable bind:this={pageEl}>
      <div class="page-content" bind:this={contentEl}>
        {#each narration as entry (entry.id)}
          {#if completedSet.has(entry.id)}
            {#if entry.type === NarrationType.Text}
              <p class="narration">{entry.text}</p>
            {:else if entry.type === NarrationType.AttributeCheck && entry.attributeCheck}
              {@const check = entry.attributeCheck}
              <AttributeCheckEntry check={check} animate={false} />
            {/if}
          {:else if activeEntry?.id === entry.id}
            {#if entry.type === NarrationType.Text}
              <TypedText
                class="narration"
                text={entry.text}
                onProgress={() => scrollPageToBottom('auto')}
                onDone={() => completeEntry(entry.id)}
              />
            {:else if entry.type === NarrationType.AttributeCheck && entry.attributeCheck}
              <AttributeCheckEntry
                check={entry.attributeCheck}
                onProgress={() => scrollPageToBottom('auto')}
                onDone={() => completeEntry(entry.id)}
              />
            {/if}
          {/if}
        {/each}
        {#if narrationDone}
          <p class="prompt">What do you do?</p>
        {/if}
      </div>
    </div>
  </article>

  {#if narrationDone}
    <div class="actions">
      <div class="action-budget">
        <span class="action-count">
          Short <strong>{shortUsed}/{config.shortActionsPerScene}</strong>
        </span>
        <span class="action-count">
          Long <strong>{longUsed}/{config.longActionsPerScene}</strong>
        </span>
      </div>
      <div class="action-buttons">
        {#if event}
          {#each event.options as option, i (i)}
            <button type="button" class="action-btn" onclick={() => selectOption(option)}
              >{option.text}</button
            >
          {/each}
        {:else}
          {#each actions as action (action.label)}
            <button type="button" class="action-btn" onclick={() => performAction(action)}
              >{action.label}</button
            >
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .scene {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 32px;
    padding: 32px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .book {
    width: 100%;
    max-width: 640px;
    flex: 0 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.5),
      inset -8px 0 16px rgba(0, 0, 0, 0.08);
    border-radius: 4px 12px 12px 4px;
    border-left: 6px solid #5a4b3c;
  }

  .book.height-transition {
    transition: height 0.3s ease-out;
  }

  .page {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background: #e8dcc4 url('/assets/images/parchment.png') center/cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 40px 48px;
    border: 1px solid #5a4b3c;
    border-radius: 4px 12px 12px 4px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.05rem;
    line-height: 1.7;
    box-shadow: inset 0 0 40px rgba(90, 75, 60, 0.15);
    box-sizing: border-box;
  }

  .page.scrollable {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .page-content {
    min-height: min-content;
  }

  /* Chrome 121+ prefers scrollbar-* over ::-webkit-*, which brings OS arrows back */
  @supports not selector(::-webkit-scrollbar) {
    .page.scrollable {
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .page.scrollable::-webkit-scrollbar {
    width: 6px;
  }

  .page.scrollable::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .page.scrollable::-webkit-scrollbar-track {
    background: transparent;
  }

  .page.scrollable::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.45);
    border-radius: 3px;
  }

  .page.scrollable::-webkit-scrollbar-thumb:hover {
    background: rgba(90, 75, 60, 0.65);
  }

  .narration,
  .page :global(.narration) {
    margin: 0 0 1.25em;
  }

  .prompt {
    margin: 0.75em 0 0;
    font-style: italic;
    color: #4a3f32;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-shrink: 0;
    width: 100%;
    max-width: 640px;
    margin-top: auto;
  }

  .action-budget {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.85rem;
    color: #a89880;
    line-height: 1.2;
  }

  .action-count strong {
    font-variant-numeric: tabular-nums;
    color: #e8dcc4;
    font-weight: 600;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .action-btn {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    padding: 10px 24px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .action-btn:active {
    background: #2c251d;
  }
</style>
