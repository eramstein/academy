import type { ImageGenConfig } from './types';

const DEFAULT_COMFY_URL = 'http://127.0.0.1:8188';

export const IMAGE_GEN_DEFAULTS: ImageGenConfig = {
  backend: 'comfy',
  defaultWorkflow: 'flux2-klein-text-to-image',
  comfyUrl: DEFAULT_COMFY_URL,
  pollIntervalMs: 1000,
  pollTimeoutMs: 180_000,
  defaultSize: 512,
  outputJpeg: true,
  jpegQuality: 0.9,
  filenamePrefix: 'academy',
};

let runtimeConfig: ImageGenConfig = {
  ...IMAGE_GEN_DEFAULTS,
  comfyUrl: resolveEnvComfyUrl(),
};

function resolveEnvComfyUrl(): string {
  const fromEnv = import.meta.env.VITE_COMFY_URL
    ? String(import.meta.env.VITE_COMFY_URL)
    : '';
  return (fromEnv || DEFAULT_COMFY_URL).replace(/\/$/, '');
}

/**
 * Merge overrides into the runtime image-gen config.
 * Useful while experimenting with models, URLs, and timeouts.
 */
export function configureImageGen(overrides: Partial<ImageGenConfig>): ImageGenConfig {
  runtimeConfig = {
    ...runtimeConfig,
    ...overrides,
    comfyUrl: (overrides.comfyUrl ?? runtimeConfig.comfyUrl).replace(/\/$/, ''),
  };
  return getImageGenConfig();
}

export function getImageGenConfig(): ImageGenConfig {
  return { ...runtimeConfig };
}

export function resetImageGenConfig(): ImageGenConfig {
  runtimeConfig = {
    ...IMAGE_GEN_DEFAULTS,
    comfyUrl: resolveEnvComfyUrl(),
  };
  return getImageGenConfig();
}

/** Comfy HTTP base: Vite proxy in DEV browser, otherwise configured URL. */
export function getComfyBaseUrl(config: ImageGenConfig = runtimeConfig): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/comfy-api`;
  }
  return config.comfyUrl.replace(/\/$/, '');
}
