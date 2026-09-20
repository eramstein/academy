import { uiState } from '@/lib/_state';
import { getSimSoundPath } from '@/lib/_utils/asset-paths';

const ADD_SOUNDS = ['plop', 'swoosh'] as const;
const ALL_SOUNDS = ['plop', 'swoosh', 'big-swoosh', 'glinggling'] as const;
const ADD_DEBOUNCE_MS = 160;

export type SimSound = (typeof ALL_SOUNDS)[number];

const cache = new Map<string, HTMLAudioElement>();
let lastAddAt = 0;

function ensure(name: SimSound): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(getSimSoundPath(name));
    audio.preload = 'auto';
    cache.set(name, audio);
  }
  return audio;
}

if (typeof window !== 'undefined') {
  for (const name of ALL_SOUNDS) ensure(name);
}

export function playSimSound(name: SimSound) {
  if (uiState.isHeadless) return;
  const source = ensure(name);
  if (!source) return;
  const clip = source.cloneNode(true) as HTMLAudioElement;
  clip.play().catch(() => {});
}

export function playAddResourceSound() {
  const now = performance.now();
  if (now - lastAddAt < ADD_DEBOUNCE_MS) return;
  lastAddAt = now;
  playSimSound(ADD_SOUNDS[Math.random() < 0.5 ? 0 : 1]);
}
