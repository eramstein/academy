import { probeComfy } from './comfy/client';

let ready: boolean | null = null;
let pending: Promise<boolean> | null = null;

/** Probe ComfyUI once. Later calls reuse the same result for the session. */
export function initImageGen(): Promise<boolean> {
  if (!pending) {
    pending = probeComfy().then((ok) => {
      ready = ok;
      console.info(
        ok
          ? '[image-gen] ComfyUI is ready'
          : '[image-gen] ComfyUI is not reachable; image generation disabled'
      );
      return ok;
    });
  }
  return pending;
}

/** False until `initImageGen` finishes, and false when ComfyUI did not answer. */
export function isImageGenAvailable(): boolean {
  return ready === true;
}
