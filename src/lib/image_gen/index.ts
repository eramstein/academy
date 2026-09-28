/**
 * Application-wide image generation service.
 *
 * Defaults: local ComfyUI via VITE_COMFY_URL / Vite `/comfy-api` proxy,
 * Flux.2 Klein text-to-image at 512×512.
 * Narration scenes use `flux2-klein-narration` (portrait reference + watercolor style).
 *
 * Configure at runtime with `configureImageGen(...)` while experimenting
 * with models and hosts. Register additional workflows under `./workflows`.
 */

export {
  configureImageGen,
  getComfyBaseUrl,
  getImageGenConfig,
  IMAGE_GEN_DEFAULTS,
  resetImageGenConfig,
} from './config';
export { generateImage } from './generate';
export { getWorkflow, isImageWorkflowId, listWorkflows } from './workflows';
export type {
  ComfyPromptGraph,
  ComfyWorkflowBuildParams,
  ComfyWorkflowDefinition,
  GenerateImageOptions,
  GenerateImageResult,
  ImageBackendId,
  ImageGenConfig,
  ImageWorkflowDefinition,
  ImageWorkflowId,
} from './types';
