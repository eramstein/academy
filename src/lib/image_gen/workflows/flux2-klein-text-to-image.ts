/**
 * Flux.2 Klein text-to-image (Comfy Desktop base-4B subgraph, default 512×512).
 *
 * Models expected on the Comfy host:
 * - flux-2-klein-base-4b.safetensors
 * - flux-klein-u.safetensors
 * - flux2-vae.safetensors
 */

import workflowTemplate from './image_flux2_klein_text_to_image_api.json';
import type { ComfyPromptGraph, ComfyWorkflowDefinition } from '../types';

const PROMPT_NODE_ID = '74';
const SEED_NODE_ID = '73';
const STEPS_NODE_ID = '62';
const WIDTH_NODE_ID = '68';
const HEIGHT_NODE_ID = '69';
const SAVE_NODE_ID = '9';
/** More steps than the Comfy default (20) for slightly richer card art. */
const SAMPLE_STEPS = 28;

export const flux2KleinTextToImage: ComfyWorkflowDefinition = {
  id: 'flux2-klein-text-to-image',
  label: 'Flux.2 Klein text-to-image (base 4B)',
  backend: 'comfy',
  saveNodeId: SAVE_NODE_ID,
  build({ prompt, seed, size, filenamePrefix }) {
    const workflow = structuredClone(workflowTemplate) as ComfyPromptGraph;
    workflow[PROMPT_NODE_ID].inputs.text = prompt;
    workflow[SEED_NODE_ID].inputs.noise_seed = seed;
    workflow[STEPS_NODE_ID].inputs.steps = SAMPLE_STEPS;
    workflow[WIDTH_NODE_ID].inputs.value = size;
    workflow[HEIGHT_NODE_ID].inputs.value = size;
    workflow[SAVE_NODE_ID].inputs.filename_prefix = filenamePrefix;
    return workflow;
  },
};
