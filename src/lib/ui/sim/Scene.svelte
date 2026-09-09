<script lang="ts">
  import type { CardTemplate, Narration } from '@/lib/_model';
  import { NarrationType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { addCardToDeck } from '@/lib/sim/deck';
  import { selectNextScene } from '@/lib/sim/scene';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import { tick, untrack } from 'svelte';
  import AttributeCheckEntry from './AttributeCheckEntry.svelte';
  import NarrationText from './NarrationText.svelte';
  import SceneActions from './SceneActions.svelte';

  const flourishPath = getAssetPath('images/ui/page-flourish.svg');
  const starPath = getAssetPath('images/ui/page-star.svg');

  const narration = $derived(gs.scene.narration);
  const selectingNextPlace = $derived(gs.scene.selectingNextPlace);
  const regionsWithPlaces = $derived(
    Object.values(gs.regions).map((region) => ({
      region,
      places: Object.values(gs.places).filter((place) => place.regionKey === region.key),
    }))
  );

  let bookEl: HTMLElement | undefined = $state();
  let pageEl: HTMLDivElement | undefined = $state();
  let contentEl: HTMLDivElement | undefined = $state();
  let completedIds = $state<string[]>([]);
  let bookHeight = $state<number | undefined>(undefined);
  let heightTransition = $state(false);
  let scrollable = $state(false);
  let scrolling = $state(false);
  let hideScrollbarTimer: ReturnType<typeof setTimeout> | undefined;

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
      const frameEl = pageEl.parentElement;
      if (!frameEl) return;
      const pageStyles = getComputedStyle(frameEl);
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

  // After first layout, jump to the latest entries (e.g. remounting the scene view).
  let didOpenScroll = false;
  $effect(() => {
    if (didOpenScroll || !pageEl || !scrollable) return;
    didOpenScroll = true;
    const el = pageEl;
    void tick().then(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    });
  });

  function getMaxBookHeight(): number {
    const scene = bookEl?.parentElement;
    if (!scene) return Number.POSITIVE_INFINITY;
    const styles = getComputedStyle(scene);
    const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const gap = parseFloat(styles.gap) || 0;
    const bottomEl = scene.querySelector('.actions, .place-picker') as HTMLElement | null;
    const bottomH = bottomEl?.offsetHeight ?? 0;
    return Math.max(0, scene.clientHeight - padY - bottomH - (bottomEl ? gap : 0));
  }

  function revealScrollbar() {
    if (!untrack(() => scrollable)) return;
    scrolling = true;
    clearTimeout(hideScrollbarTimer);
    hideScrollbarTimer = setTimeout(() => {
      scrolling = false;
    }, 800);
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

  function cardsForEntry(entry: Narration): CardTemplate[] {
    if (!entry.cardIds?.length) return [];
    return entry.cardIds
      .map((id) => gs.player.collection.find((card) => card.id === id))
      .filter((card): card is CardTemplate => card !== undefined);
  }

  function firstDeck() {
    return gs.player.decks[0];
  }

  function cardsInFirstDeck(entry: Narration): boolean {
    const deck = firstDeck();
    const cards = cardsForEntry(entry);
    if (!deck || cards.length === 0) return false;
    return cards.every((card) => deck.cards.some((c) => c.id === card.id));
  }

  function addConjuredCardsToDeck(entry: Narration) {
    const deck = firstDeck();
    if (!deck || cardsInFirstDeck(entry)) return;
    for (const card of cardsForEntry(entry)) {
      if (!deck.cards.some((c) => c.id === card.id)) {
        addCardToDeck(deck, card);
      }
    }
  }

  function onTextDone(entry: Narration) {
    if (entry.attributeCheck) return;
    completeEntry(entry.id);
  }
</script>

<div
  class="scene"
  style="--page-flourish: url('{flourishPath}'); --page-star: url('{starPath}');"
>
  <article
    class="book"
    class:height-transition={heightTransition && !reduceMotion}
    bind:this={bookEl}
    style:height={bookHeight !== undefined ? `${bookHeight}px` : undefined}
  >
    <div class="page">
      <div
        class="page-scroll"
        class:scrollable
        class:scrolling
        bind:this={pageEl}
        onscroll={revealScrollbar}
      >
        <div class="page-content" bind:this={contentEl}>
          {#each narration as entry (entry.id)}
            {#if completedSet.has(entry.id)}
              {@render narrationEntry(entry, false)}
            {:else if activeEntry?.id === entry.id}
              {@render narrationEntry(entry, true)}
            {/if}
          {/each}
          {#if selectingNextPlace}
            <p class="prompt">Where do you go?</p>
          {:else if narrationDone}
            <p class="prompt">What do you do?</p>
          {/if}
        </div>
      </div>
    </div>
    <div class="page-chrome" aria-hidden="true">
      <span class="ink-frame"></span>
      <span class="ornament flourish tl"></span>
      <span class="ornament star tr"></span>
      <span class="ornament flourish bl"></span>
      <span class="ornament star br"></span>
    </div>
  </article>

  {#if selectingNextPlace}
    <div class="place-picker">
      {#each regionsWithPlaces as { region, places } (region.key)}
        <section class="place-region">
          <h3 class="place-region-title">{region.name}</h3>
          <div class="place-buttons">
            {#each places as place (place.key)}
              <button type="button" class="action-btn" onclick={() => selectNextScene(place.key)}
                >{place.name}</button
              >
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {:else if narrationDone}
    <SceneActions />
  {/if}
</div>

{#snippet narrationEntry(entry: Narration, animate: boolean)}
  {@const cards = cardsForEntry(entry)}
  {@const inDeck = cardsInFirstDeck(entry)}
  {@const canAddToDeck =
    entry.type === NarrationType.ConjuredCard && !!firstDeck() && cards.length > 0 && !inDeck}
  <NarrationText
    class="narration"
    text={entry.text}
    mentions={entry.mentions}
    {animate}
    onProgress={() => scrollPageToBottom('auto')}
    onDone={() => onTextDone(entry)}
  />
  {#if entry.cardTemplates?.length}
    <div class="narration-cards">
      {#each entry.cardTemplates as card, i (`${card.id}-${i}`)}
        {#if i > 0}
          <span class="card-arrow" aria-hidden="true">→</span>
        {/if}
        <CardCompact {card} />
      {/each}
    </div>
  {/if}
  {#if cards.length > 0}
    <div class="narration-cards">
      {#each cards as card (card.id)}
        <CardCompact {card} />
      {/each}
    </div>
  {/if}
  {#if entry.attributeCheck}
    <AttributeCheckEntry
      check={entry.attributeCheck}
      {animate}
      onProgress={() => scrollPageToBottom('auto')}
      onDone={() => completeEntry(entry.id)}
    />
  {/if}
  {#if entry.type === NarrationType.ConjuredCard && cards.length > 0}
    <div class="narration-actions">
      <button
        type="button"
        class="action-btn add-to-deck"
        disabled={!canAddToDeck}
        onclick={() => addConjuredCardsToDeck(entry)}
      >
        {inDeck ? 'Added to deck' : 'Add to deck'}
      </button>
    </div>
  {/if}
{/snippet}

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
    --page-edge: 14px;
    position: relative;
    isolation: isolate;
    width: 100%;
    flex: 0 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-parchment);
    border-radius: 3px;
    box-shadow:
      -1px -1px 0 rgba(232, 220, 196, 0.18),
      1px 1px 0 rgba(42, 24, 16, 0.55),
      2px 3px 0 rgba(42, 24, 16, 0.32),
      0 10px 22px rgba(0, 0, 0, 0.42),
      0 22px 40px rgba(0, 0, 0, 0.28);
  }

  .page-chrome {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .page-chrome::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 40% at 22% 12%, rgba(255, 248, 230, 0.22), transparent 58%),
      radial-gradient(ellipse 50% 45% at 82% 88%, rgba(90, 75, 60, 0.16), transparent 62%),
      radial-gradient(ellipse 90% 80% at 50% 42%, transparent 46%, rgba(42, 24, 16, 0.2) 100%);
    mix-blend-mode: multiply;
  }

  .ink-frame {
    position: absolute;
    inset: var(--page-edge);
    border: 1px solid var(--color-brown-border);
    opacity: 0.42;
    box-shadow:
      inset 0 0 0 3px rgba(232, 220, 196, 0.08),
      0 0 0 1px rgba(90, 75, 60, 0.12);
  }

  .ornament {
    position: absolute;
    width: 48px;
    height: 48px;
    opacity: 0.48;
    background: var(--color-ink-muted);
  }

  .ornament.flourish {
    mask: var(--page-flourish) center / contain no-repeat;
    -webkit-mask: var(--page-flourish) center / contain no-repeat;
  }

  .ornament.star {
    width: 36px;
    height: 36px;
    mask: var(--page-star) center / contain no-repeat;
    -webkit-mask: var(--page-star) center / contain no-repeat;
  }

  .ornament.tl {
    top: 10px;
    left: 12px;
  }

  .ornament.tr {
    top: 16px;
    right: 16px;
  }

  .ornament.bl {
    bottom: 10px;
    left: 12px;
    transform: scaleY(-1);
  }

  .ornament.br {
    bottom: 16px;
    right: 16px;
    transform: scaleY(-1);
  }

  .book.height-transition {
    transition: height 0.3s ease-out;
  }

  .page {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background-color: var(--color-parchment);
    background-image:
      radial-gradient(ellipse 80% 65% at 48% 32%, rgba(255, 250, 235, 0.32), transparent 58%),
      radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(90, 75, 60, 0.22) 100%),
      var(--parchment);
    background-size: cover;
    background-position: center;
    background-blend-mode: multiply;
    color: var(--color-ink);
    padding: 52px 28px 44px 48px;
    border: 1px solid var(--color-brown-border);
    border-radius: 3px;
    font-family: var(--font-narrative);
    font-size: 1.05rem;
    line-height: 1.7;
    box-shadow:
      inset 0 1px 0 rgba(255, 248, 230, 0.35),
      inset 0 -18px 28px rgba(90, 75, 60, 0.1),
      inset 16px 0 32px rgba(90, 75, 60, 0.08),
      inset -18px 0 32px rgba(90, 75, 60, 0.12),
      inset 0 0 72px rgba(90, 75, 60, 0.12);
    box-sizing: border-box;
  }

  .page-scroll {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .page-scroll.scrollable {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .page-content {
    min-height: min-content;
  }

  /* Chrome 121+ prefers scrollbar-* over ::-webkit-*, which brings OS arrows back */
  @supports not selector(::-webkit-scrollbar) {
    .page-scroll.scrollable {
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
    }

    .page-scroll.scrollable.scrolling {
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .page-scroll.scrollable::-webkit-scrollbar {
    width: 6px;
  }

  .page-scroll.scrollable::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .page-scroll.scrollable::-webkit-scrollbar-track {
    background: transparent;
  }

  .page-scroll.scrollable::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
  }

  .page-scroll.scrollable.scrolling::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.45);
  }

  .page-scroll.scrollable.scrolling::-webkit-scrollbar-thumb:hover {
    background: rgba(90, 75, 60, 0.65);
  }

  .page :global(.narration) {
    margin: 0 0 1.25em;
  }

  .narration-cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin: 0 0 1.25em;
  }

  .card-arrow {
    flex-shrink: 0;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-ink-muted);
  }

  .narration-actions {
    display: flex;
    justify-content: center;
    margin: 0 0 1.25em;
  }

  .add-to-deck:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .add-to-deck:disabled:hover,
  .add-to-deck:disabled:active {
    background: var(--color-data);
    border-color: var(--color-golden);
  }

  .prompt {
    margin: 0.75em 0 0;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .place-picker {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-shrink: 0;
    width: 100%;
    margin-top: auto;
    max-height: 45%;
    overflow-y: auto;
  }

  .place-region {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .place-region-title {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    text-align: center;
  }

  .place-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .action-btn {
    font-family: var(--font-narrative);
    font-size: 1rem;
    color: var(--color-cream);
    background: var(--color-data);
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    padding: 10px 24px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: var(--color-data-hover);
    border-color: var(--color-golden);
  }

  .action-btn:active {
    background: var(--color-data-active);
  }
</style>
