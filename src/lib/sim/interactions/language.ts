/** Language of LLM-written interaction scenes and choice buttons. */
export type InteractionLanguage = 'en' | 'fr';

export const INTERACTION_LANGUAGE_OPTIONS: {
  value: InteractionLanguage;
  label: string;
  hint: string;
}[] = [
  { value: 'en', label: 'English', hint: 'Scenes and choices in English' },
  { value: 'fr', label: 'Français', hint: 'Scènes et choix en français' },
];

export function isInteractionLanguage(value: unknown): value is InteractionLanguage {
  return value === 'en' || value === 'fr';
}

const COPY = {
  en: {
    stop: 'Stop there',
    nobody: 'There is no one here to do that with.',
    passed: 'The moment has passed.',
    stalled: 'The conversation stalls before it can go anywhere.',
    emptyScene: 'The argument hangs in the air between you.',
    mood: 'Mood',
    unchanged: 'unchanged',
    address: 'you',
    /** Appended to the system prompt. Action types and value keys stay identifiers. */
    rule: 'Write the scene and every choice text in English. Address the player as "you".',
  },
  fr: {
    stop: 'En rester là',
    nobody: "Il n'y a personne ici pour ça.",
    passed: 'Le moment est passé.',
    stalled: "La conversation s'interrompt avant d'aller plus loin.",
    emptyScene: 'La discussion reste en suspens.',
    mood: 'Humeur',
    unchanged: 'inchangé',
    address: 'tu',
    rule: 'Write the scene and every choice text in French. Address the player as "tu" (second person singular, present tense). Keep action type strings and value keys exactly as given; they are identifiers, not prose.',
  },
} as const;

export function interactionCopy(language: InteractionLanguage) {
  return COPY[language];
}
