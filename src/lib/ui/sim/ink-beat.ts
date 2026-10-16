/** A beat in the book: layout growth, a finished paragraph, or one line of a paragraph that cannot fit on the page. */
export type InkBeat =
  | { kind: 'layout' }
  | { kind: 'paragraph'; height: number; lineSettled?: boolean }
  | { kind: 'line'; height: number };

/**
 * True when `visibleLength` chars finish a paragraph (a newline, or the end of the text).
 * Adjacent newlines count as one break.
 */
export function isParagraphBoundary(text: string, visibleLength: number): boolean {
  if (visibleLength <= 0 || visibleLength > text.length) return false;
  if (visibleLength === text.length) return true;
  const ch = text[visibleLength - 1];
  if (ch !== '\n') return false;
  // Skip empty lines: the pause belongs after the first break, not each blank line.
  return text[visibleLength] !== '\n';
}

export function nextParagraphEnd(text: string, from: number): number {
  for (let i = from + 1; i <= text.length; i += 1) {
    if (isParagraphBoundary(text, i)) return i;
  }
  return text.length;
}

/** Laid-out paragraph is taller than the visible page, so it cannot be shifted in one motion. */
export function paragraphTallerThanPage(paragraph: string, el: HTMLElement): boolean {
  const page = el.closest('.page-scroll');
  if (!(page instanceof HTMLElement) || el.clientWidth < 8 || paragraph.length === 0) return false;
  const cs = getComputedStyle(el);
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.boxSizing = 'border-box';
  probe.style.whiteSpace = 'pre-line';
  probe.style.width = `${el.clientWidth}px`;
  probe.style.font = cs.font;
  probe.style.lineHeight = cs.lineHeight;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.textContent = paragraph;
  document.body.appendChild(probe);
  const taller = probe.offsetHeight > page.clientHeight + 1;
  probe.remove();
  return taller;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Reveal `text` one character at a time.
 * Pauses on each reported beat so the page can advance while the caret holds still.
 */
export async function revealInk(options: {
  text: string;
  stepMs: number;
  isCancelled: () => boolean;
  reveal: (visibleLength: number) => void;
  layout: () => Promise<void>;
  element: () => HTMLElement | undefined;
  onBeat?: (beat: Exclude<InkBeat, { kind: 'layout' }>) => void | Promise<void>;
}): Promise<void> {
  const { text, stepMs, isCancelled, reveal, layout, element, onBeat } = options;
  let baseline = 0;
  let lastHeight = 0;
  let lineMode = false;

  const arm = (start: number, el: HTMLElement) => {
    const end = nextParagraphEnd(text, start);
    lineMode = paragraphTallerThanPage(text.slice(start, end), el);
    const height = el.offsetHeight;
    // A caret-only box is not written ink, so the first line counts toward the paragraph.
    baseline = start === 0 ? 0 : height;
    lastHeight = height;
  };

  reveal(0);
  await layout();
  if (isCancelled()) return;
  const first = element();
  if (!first) return;
  arm(0, first);

  for (let i = 1; i <= text.length; i += 1) {
    if (isCancelled()) return;
    reveal(i);
    await layout();
    if (isCancelled()) return;
    const el = element();
    if (!el) return;
    const height = el.offsetHeight;
    if (lineMode && height > lastHeight + 1) {
      const lineHeight = height - lastHeight;
      lastHeight = height;
      await onBeat?.({ kind: 'line', height: lineHeight });
    } else {
      lastHeight = height;
    }
    if (isCancelled()) return;
    const atEnd = i === text.length;
    if (isParagraphBoundary(text, i) || atEnd) {
      const grown = Math.max(0, el.offsetHeight - baseline);
      await onBeat?.({ kind: 'paragraph', height: grown, lineSettled: lineMode });
      if (!atEnd) arm(i, el);
    }
    if (!atEnd) await delay(stepMs);
  }
}
