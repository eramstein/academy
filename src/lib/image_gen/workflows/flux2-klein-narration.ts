/**
 * Flux.2 Klein narration scene (Comfy).
 *
 * Same base-4B graph as text-to-image, plus a portrait reference:
 * LoadImage → ImageScale → VAEEncode → ReferenceLatent on the positive prompt.
 * That reference is what carries the character's face into the scene.
 *
 * Models expected on the Comfy host:
 * - flux-2-klein-base-4b.safetensors
 * - flux-klein-u.safetensors
 * - flux2-vae.safetensors
 */

import workflowTemplate from './image_flux2_klein_narration_api.json';
import type { ComfyPromptGraph, ComfyWorkflowDefinition } from '../types';

const PROMPT_NODE_ID = '74';
const PORTRAIT_NODE_ID = '76';
const SCALE_NODE_ID = '77';
const SEED_NODE_ID = '73';
const WIDTH_NODE_ID = '68';
const HEIGHT_NODE_ID = '69';
const SAVE_NODE_ID = '9';

const NARRATION_STYLE = [
  'Hand-painted watercolor and gouache on lightly textured paper, with visible brushwork, soft watercolor washes, and natural color variation.',
  'Realistic anatomy and expressive features, detailed face, hair, clothing, and materials.',
  'Medieval clothing and craftsmanship, with only integrated naturally into the design.',
  'Colorful, rich, and atmospheric, with warm ochres, deep greens, muted reds, copper, amber, and occasional vibrant accents.',
  'Painterly and organic, realistic but not photorealistic.',
  'Soft edges, natural lighting, understated ink details.',
  'Simple atmospheric background, strong personality, elegant fantasy RPG art-book aesthetic.',
  'No excessive mechanical details, no visual clutter, no hard outlines, no text, no UI.',
].join(' ');

export function buildNarrationImagePrompt(scene: string): string {
  return [
    scene.trim(),
    'The subject is the person in the reference portrait. Keep that face.',
    NARRATION_STYLE,
  ].join('\n\n');
}

export const flux2KleinNarration: ComfyWorkflowDefinition = {
  id: 'flux2-klein-narration',
  label: 'Flux.2 Klein narration (portrait reference)',
  backend: 'comfy',
  saveNodeId: SAVE_NODE_ID,
  build({ prompt, seed, size, filenamePrefix, referenceImageName }) {
    if (!referenceImageName) {
      throw new Error('Narration image workflow requires a reference portrait');
    }
    const workflow = structuredClone(workflowTemplate) as ComfyPromptGraph;
    workflow[PROMPT_NODE_ID].inputs.text = buildNarrationImagePrompt(prompt);
    workflow[PORTRAIT_NODE_ID].inputs.image = referenceImageName;
    workflow[SCALE_NODE_ID].inputs.width = size;
    workflow[SCALE_NODE_ID].inputs.height = size;
    workflow[SEED_NODE_ID].inputs.noise_seed = seed;
    workflow[WIDTH_NODE_ID].inputs.value = size;
    workflow[HEIGHT_NODE_ID].inputs.value = size;
    workflow[SAVE_NODE_ID].inputs.filename_prefix = filenamePrefix;
    return workflow;
  },
};
