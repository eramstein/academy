<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { selectNextScene } from '@/lib/sim/scene';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import { tick, untrack } from 'svelte';
  import type { InkBeat } from './ink-beat';
  import NarrationList from './NarrationList.svelte';
  import SceneActions from './SceneActions.svelte';

  const flourishPath = getAssetPath('images/ui/decorations/page-flourish.svg');
  const starPath = getAssetPath('images/ui/decorations/page-star.svg');

  const selectingNextPlace = $derived(gs.scene.selectingNextPlace);
  const pendingPeriodEvent = $derived(gs.scene.pendingPeriodEvent);
  const regionsWithPlaces = $derived(
    Object.values(gs.regions)
      .map((region) => ({
        region,
        places: Object.values(gs.places).filter(
          (place) => place.regionKey === region.key && !place.locked
        ),
      }))
      .filter(({ places }) => places.length > 0)
  );

  let bookEl: HTMLElement | undefined = $state();
  let pageEl: HTMLDivElement | undefined = $state();
  let contentEl: HTMLDivElement | undefined = $state();
  let bookHeight = $state<number | undefined>(undefined);
  let heightTransition = $state(false);
  let scrollable = $state(false);
  let scrolling = $state(false);
  let hideScrollbarTimer: ReturnType<typeof setTimeout> | undefined;
  let narrationDone = $state(false);
  /** Last measured actions bar height — kept while narration hides the bar. */
  let reservedActionsHeight = 0;
  /** Reader is at the ink. Cleared when they scroll up into earlier pages. */
  let pinnedToTail = true;
  /** Ink is still being written below a page the reader has scrolled away from. */
  let inkBelow = $state(false);
  let motionFrame = 0;
  let motionToken = 0;

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      const nowScrollable = natural > maxHeight + 0.5;
      const current = untrack(() => bookHeight);
      // Grow with content up to max, but never shrink from transient content
      // churn (prompt swap, conjure reveal) — only yield when maxHeight drops.
      const next =
        current === undefined
          ? Math.min(natural, maxHeight)
          : Math.min(Math.max(natural, current), maxHeight);

      const becameScrollable = nowScrollable && !untrack(() => scrollable);
      scrollable = nowScrollable;

      if (!nowScrollable && pageEl.scrollTop !== 0) {
        pageEl.scrollTop = 0;
      }

      if (current === undefined) {
        bookHeight = next;
      } else if (Math.abs(next - current) >= 2) {
        // Ease every real growth, including a single new line. Instant line
        // steps read as jumps; sub-pixel observer noise is ignored above.
        if (!reduceMotion && !untrack(() => heightTransition)) {
          heightTransition = true;
        }
        bookHeight = next;
      }

      refreshInkCue();
      // The first time the page caps, bring the writing band into view once.
      // Later lines stay put until a paragraph (or a tall paragraph's line) ends.
      if (becameScrollable) queueMicrotask(() => void settleBand());
    };

    const ro = new ResizeObserver(syncHeight);
    ro.observe(contentEl);
    if (bookEl.parentElement) ro.observe(bookEl.parentElement);
    syncHeight();

    const onKeyScroll = (event: KeyboardEvent) => {
      if (!pageEl || !untrack(() => scrollable)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home') {
        pinnedToTail = false;
      } else if (
        (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'End') &&
        tailGap(pageEl) <= 80
      ) {
        pinnedToTail = true;
      }
      refreshInkCue();
    };
    window.addEventListener('keydown', onKeyScroll);

    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', onKeyScroll);
      motionToken += 1;
      if (motionFrame) cancelAnimationFrame(motionFrame);
      motionFrame = 0;
    };
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
    if (bottomEl?.classList.contains('actions') && bottomH > 0) {
      reservedActionsHeight = bottomH;
    }
    // While narration hides the action bar, keep reserving its space so the book
    // doesn't grow then snap shorter when actions return (e.g. after conjure).
    const effectiveBottom = bottomEl ? bottomH : reservedActionsHeight;
    return Math.max(0, scene.clientHeight - padY - effectiveBottom - (effectiveBottom > 0 ? gap : 0));
  }

  function tailGap(el: HTMLElement): number {
    return Math.max(0, el.scrollHeight - el.clientHeight - el.scrollTop);
  }

  function onPageScroll() {
    if (!untrack(() => scrollable)) return;
    scrolling = true;
    clearTimeout(hideScrollbarTimer);
    hideScrollbarTimer = setTimeout(() => {
      scrolling = false;
    }, 800);
    refreshInkCue();
  }

  function onUserWheel(event: WheelEvent) {
    if (!pageEl || !untrack(() => scrollable)) return;
    if (event.deltaY < -4) pinnedToTail = false;
    else if (event.deltaY > 4 && tailGap(pageEl) <= 48) pinnedToTail = true;
    refreshInkCue();
  }

  function onScrollbarPointerDown(event: PointerEvent) {
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    if (event.clientX < rect.right - 14) return;
    const finish = () => {
      window.removeEventListener('pointerup', finish);
      if (!pageEl) return;
      pinnedToTail = tailGap(pageEl) <= 32;
    };
    window.addEventListener('pointerup', finish);
  }

  /** Blank parchment under the ink, from `.page-content` padding. */
  function writingMargin(): number {
    if (!contentEl) return 72;
    const pad = parseFloat(getComputedStyle(contentEl).paddingBottom);
    return Number.isFinite(pad) ? pad : 72;
  }

  function bookIsCapped(): boolean {
    if (!bookEl || bookHeight === undefined) return false;
    if (!untrack(() => scrollable)) return false;
    return bookEl.getBoundingClientRect().height >= bookHeight - 1.5;
  }

  function lineBox(): number {
    if (!contentEl) return 28;
    const parsed = parseFloat(getComputedStyle(contentEl).lineHeight);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return 28;
  }

  function setScrollTop(top: number) {
    if (!pageEl) return;
    pageEl.scrollTop = top;
  }

  function canFollow(): boolean {
    return untrack(() => !!pageEl && pinnedToTail && scrollable && bookIsCapped());
  }

  function refreshInkCue() {
    const el = pageEl;
    inkBelow = untrack(() => !!el && scrollable && !pinnedToTail && tailGap(el) > 24);
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  /** One ease. Cancelled if the reader leaves the tail or a newer motion starts. */
  function easeScrollBy(distance: number, duration: number, token: number): Promise<void> {
    const el = pageEl;
    if (!el || distance <= 0.5) return Promise.resolve();
    const maxTop = el.scrollHeight - el.clientHeight;
    const target = Math.min(maxTop, el.scrollTop + distance);
    const start = el.scrollTop;
    if (target - start <= 0.5) return Promise.resolve();
    if (reduceMotion || duration <= 0) {
      setScrollTop(target);
      refreshInkCue();
      return Promise.resolve();
    }
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const node = pageEl;
        if (token !== motionToken || !node || !untrack(() => pinnedToTail)) {
          motionFrame = 0;
          resolve();
          return;
        }
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - (1 - t) * (1 - t);
        setScrollTop(start + (target - start) * eased);
        if (t < 1) {
          motionFrame = requestAnimationFrame(step);
        } else {
          motionFrame = 0;
          refreshInkCue();
          resolve();
        }
      };
      motionFrame = requestAnimationFrame(step);
    });
  }

  async function pauseThenEase(distance: number, pauseMs: number, duration: number): Promise<void> {
    const token = ++motionToken;
    if (motionFrame) cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    if (pauseMs > 0) await delay(pauseMs);
    const el = pageEl;
    if (token !== motionToken || !el || !untrack(() => pinnedToTail)) return;
    const live = Math.min(distance, tailGap(el));
    if (live <= 1) return;
    await easeScrollBy(live, duration, token);
  }

  /**
   * Images, cards, and other blocks that appear at once.
   * Restores the blank band in a single motion when it has been used up.
   */
  async function settleBand(): Promise<void> {
    const el = pageEl;
    if (!el || !canFollow()) return;
    const margin = writingMargin();
    const gap = tailGap(el);
    if (gap <= margin * 0.85) return;
    const distance = gap - margin * 0.15;
    if (distance <= 1) return;
    await pauseThenEase(distance, 0, 320);
  }

  /** A finished line of a paragraph that cannot fit on the page. */
  async function shiftLine(lineHeight: number): Promise<void> {
    const el = pageEl;
    if (!el || !canFollow()) return;
    const margin = writingMargin();
    const gap = tailGap(el);
    if (gap < margin * 0.85) return;
    const distance = Math.min(lineHeight, gap);
    if (distance <= 1) return;
    await pauseThenEase(distance, reduceMotion ? 0 : 180, 220);
  }

  /**
   * A finished paragraph. The page stays still while it is read.
   * If the next paragraph would leave the blank band, ease up by this paragraph's height.
   */
  async function shiftParagraph(beat: { height: number; lineSettled?: boolean }): Promise<void> {
    if (beat.lineSettled) return;
    const el = pageEl;
    if (!el || !canFollow()) return;
    const margin = writingMargin();
    const gap = tailGap(el);
    const remaining = margin - gap;
    if (remaining >= lineBox()) return;
    const distance =
      beat.height > 1 ? Math.min(beat.height, gap) : Math.max(0, gap - Math.min(8, margin * 0.15));
    if (distance <= 1) return;
    await pauseThenEase(distance, reduceMotion ? 0 : 320, 280);
  }

  function onBookHeightEnd(event: TransitionEvent) {
    if (event.propertyName !== 'height' || event.target !== bookEl) return;
    void settleBand();
  }

  function onInkBeat(beat: InkBeat = { kind: 'layout' }): Promise<void> {
    refreshInkCue();
    if (!untrack(() => scrollable)) return Promise.resolve();
    if (beat.kind === 'line') return shiftLine(beat.height);
    if (beat.kind === 'paragraph') return shiftParagraph(beat);
    return settleBand();
  }

  function resumeTail() {
    pinnedToTail = true;
    inkBelow = false;
    const el = pageEl;
    if (!el) return;
    void pauseThenEase(tailGap(el), 0, 280);
  }
</script>

<div class="scene" style="--page-flourish: url('{flourishPath}'); --page-star: url('{starPath}');">
  <article
    class="book"
    class:height-transition={heightTransition && !reduceMotion}
    bind:this={bookEl}
    style:height={bookHeight !== undefined ? `${bookHeight}px` : undefined}
    ontransitionend={onBookHeightEnd}
  >
    <div class="page">
      <div
        class="page-scroll"
        class:scrollable
        class:scrolling
        bind:this={pageEl}
        onscroll={onPageScroll}
        onwheel={onUserWheel}
        onpointerdown={onScrollbarPointerDown}
      >
        <div class="page-content" bind:this={contentEl}>
          <NarrationList bind:done={narrationDone} onProgress={onInkBeat} />
          {#if selectingNextPlace}
            <p class="prompt">Where do you go?</p>
          {:else if pendingPeriodEvent && narrationDone}
            <p class="prompt">Something else unfolds…</p>
          {:else if narrationDone}
            <p class="prompt">What do you do?</p>
          {/if}
        </div>
      </div>
    </div>
    {#if inkBelow}
      <button type="button" class="ink-below" aria-label="New text continues below" onclick={resumeTail}>
        continues
      </button>
    {/if}
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
              <OrnateButton onclick={() => selectNextScene(place.key)}>{place.name}</OrnateButton>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {:else if narrationDone}
    <SceneActions />
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
    padding: 16px 16px 32px 32px;
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
    transition: height 0.4s ease-out;
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
    overflow-anchor: none;
  }

  .page-scroll.scrollable {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .page-content {
    min-height: min-content;
    overflow-x: clip;
    /* Writing band. A paragraph fills this blank before the page advances,
       so the lines already inked stay still. */
    padding-bottom: 5.1em;
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

  .ink-below {
    position: absolute;
    left: 50%;
    bottom: 22px;
    z-index: 3;
    transform: translateX(-50%);
    margin: 0;
    padding: 2px 12px;
    border: none;
    background: transparent;
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    font-style: italic;
    color: var(--color-ink-muted);
    cursor: pointer;
  }

  .ink-below:hover,
  .ink-below:focus-visible {
    color: var(--color-ink);
  }

  .ink-below:focus-visible {
    outline: 1px solid var(--color-brown-border);
    outline-offset: 2px;
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
</style>
