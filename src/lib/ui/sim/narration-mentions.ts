import type { Mentions } from '@/lib/_model';

export type NarrationSegment =
  | { type: 'text'; text: string }
  | { type: 'keyword'; text: string; id: string }
  | { type: 'character'; text: string; id: string };

export function segmentNarration(text: string, mentions?: Mentions): NarrationSegment[] {
  if (!mentions) return [{ type: 'text', text }];

  const candidates = [
    ...mentions.keywords.map(([word, id]) => ({ word, id, type: 'keyword' as const })),
    ...mentions.characters.map(([word, id]) => ({ word, id, type: 'character' as const })),
  ].sort((a, b) => b.word.length - a.word.length);

  type Hit = { start: number; end: number; text: string; id: string; type: 'keyword' | 'character' };
  const hits: Hit[] = [];
  const taken: [number, number][] = [];

  for (const candidate of candidates) {
    const re = new RegExp(`\\b${escapeRegExp(candidate.word)}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      taken.push([start, end]);
      hits.push({ start, end, text: match[0], id: candidate.id, type: candidate.type });
    }
  }

  hits.sort((a, b) => a.start - b.start);

  const segments: NarrationSegment[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, hit.start) });
    }
    segments.push({ type: hit.type, text: hit.text, id: hit.id });
    cursor = hit.end;
  }
  if (cursor < text.length || segments.length === 0) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }
  return segments;
}

export function visibleSegments(segments: NarrationSegment[], length: number): NarrationSegment[] {
  let remaining = length;
  const visible: NarrationSegment[] = [];
  for (const segment of segments) {
    if (remaining <= 0) break;
    if (segment.text.length <= remaining) {
      visible.push(segment);
      remaining -= segment.text.length;
    } else {
      visible.push({ type: 'text', text: segment.text.slice(0, remaining) });
      remaining = 0;
    }
  }
  return visible;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
