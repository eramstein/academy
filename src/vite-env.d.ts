/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MISTRAL_API_KEY: string;
  readonly VITE_COMFY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
