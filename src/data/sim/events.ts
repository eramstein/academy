import { NarrationType } from '@/lib/_model/enums-sim';
import type { Action, Narration } from '@/lib/_model/model-game';

export const EVENTS: Record<string, { narration: Narration; actions: Action[] }> = {
  'first-day': {
    narration: {
      text: 'After a long journey, you finally arrive at the academy. A clerk directs you to the administration office. The administrator asks you for tuition fees.',
      type: NarrationType.Text,
    },
    actions: [],
  },
};
