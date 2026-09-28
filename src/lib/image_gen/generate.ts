import { initImageGen } from './availability';
import { getImageGenConfig } from './config';
import { runComfyWorkflow, uploadComfyImage } from './comfy/client';
import type { GenerateImageOptions, GenerateImageResult } from './types';
import { getWorkflow } from './workflows';

/**
 * Generate an image from a text prompt using the configured backend / workflow.
 * Defaults: ComfyUI + Flux.2 Klein at 512×512, JPEG output.
 */
export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<GenerateImageResult> {
  if (!(await initImageGen())) {
    throw new Error('ComfyUI is not reachable');
  }
  const config = getImageGenConfig();
  const workflowId = options.workflow ?? config.defaultWorkflow;
  const workflow = getWorkflow(workflowId);
  const seed = options.seed ?? Math.floor(Math.random() * 1_000_000_000_000);
  const size = options.size ?? config.defaultSize;
  const filenamePrefix = options.filenamePrefix ?? config.filenamePrefix;
  const outputJpeg = options.outputJpeg ?? config.outputJpeg;
  const jpegQuality = options.jpegQuality ?? config.jpegQuality;

  if (workflow.backend !== 'comfy' || config.backend !== 'comfy') {
    throw new Error(
      `Unsupported image backend: workflow=${workflow.backend} config=${config.backend}`
    );
  }

  const referenceImageName = options.referenceImage
    ? await uploadComfyImage(
        options.referenceImage,
        `academy_ref_${seed}.${options.referenceImage.type === 'image/png' ? 'png' : 'jpg'}`
      )
    : undefined;

  const graph = workflow.build({ prompt, seed, size, filenamePrefix, referenceImageName });
  const blob = await runComfyWorkflow(graph, workflow.saveNodeId, {
    outputJpeg,
    jpegQuality,
  });

  return {
    blob,
    seed,
    workflow: workflowId,
    backend: 'comfy',
  };
}
