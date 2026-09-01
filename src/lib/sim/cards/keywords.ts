import type { UnitCardTemplate, UnitKeywords } from "@/lib/_model";

export function addKeyword(card: UnitCardTemplate, keyword: keyof UnitKeywords, value: number) {
  if (!card.keywords) {
    card.keywords = {};
  }
  const current = card.keywords[keyword];
  if (typeof current === 'number') {
    (card.keywords[keyword] as number) = current + value;
  } else {
    (card.keywords[keyword] as number) = value;
  }
}