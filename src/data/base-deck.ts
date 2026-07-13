import type { Deck } from '@/lib/_model';

export const BASE_DECK: Deck = {
  key: 'base',
  name: 'Base',
  cards: [
    {
      cardTemplateId: 'lion',
      count: 30,
    },
  ],
  lands: ['island', 'city', 'mountain', 'forest'],
};

export const BASE_DECK2: Deck = {
  key: 'base',
  name: 'Base',
  cards: [
    {
      cardTemplateId: 'lion',
      count: 30,
    },
  ],
  lands: ['island', 'city', 'mountain', 'forest'],
};
