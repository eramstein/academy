/**
 * Local ComfyUI client using the Flux.2 Klein text-to-image workflow
 * (image_flux2_klein_text_to_image — base 4B subgraph, 512×512).
 *
 * Expects Comfy Desktop/ComfyUI at VITE_COMFY_URL (default http://127.0.0.1:8188).
 * In DEV, requests go through the Vite `/comfy-api` proxy to avoid CORS.
 * Outputs land in Comfy's configured output dir (e.g. ComfyUI-Shared/output)
 * and are fetched via Comfy's `/view` API.
 */

import workflowTemplate from './workflows/image_flux2_klein_text_to_image_api.json';

const DEFAULT_COMFY_URL = 'http://127.0.0.1:8188';
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 180_000;

const PROMPT_NODE_ID = '74';
const SEED_NODE_ID = '73';
const WIDTH_NODE_ID = '68';
const HEIGHT_NODE_ID = '69';
const SAVE_NODE_ID = '9';

type ComfyWorkflow = Record<
  string,
  {
    class_type: string;
    inputs: Record<string, unknown>;
  }
>;

function getComfyBaseUrl(): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/comfy-api`;
  }
  const fromEnv = import.meta.env.VITE_COMFY_URL
    ? String(import.meta.env.VITE_COMFY_URL)
    : '';
  return (fromEnv || DEFAULT_COMFY_URL).replace(/\/$/, '');
}

function buildWorkflow(prompt: string, seed: number, size = 512): ComfyWorkflow {
  const workflow = structuredClone(workflowTemplate) as ComfyWorkflow;
  workflow[PROMPT_NODE_ID].inputs.text = prompt;
  workflow[SEED_NODE_ID].inputs.noise_seed = seed;
  workflow[WIDTH_NODE_ID].inputs.value = size;
  workflow[HEIGHT_NODE_ID].inputs.value = size;
  workflow[SAVE_NODE_ID].inputs.filename_prefix = 'academy_card';
  return workflow;
}

function firstHistoryImage(
  entry: {
    outputs?: Record<string, { images?: { filename: string; subfolder: string; type: string }[] }>;
  } | undefined
): { filename: string; subfolder: string; type: string } | null {
  if (!entry?.outputs) return null;
  const saveOut = entry.outputs[SAVE_NODE_ID]?.images?.[0];
  if (saveOut) return saveOut;
  for (const output of Object.values(entry.outputs)) {
    if (output.images?.length) return output.images[0];
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Comfy SaveImage writes PNG; card assets are served as .jpg. */
async function toJpegBlob(source: Blob, quality = 0.9): Promise<Blob> {
  if (source.type === 'image/jpeg' || source.type === 'image/jpg') {
    return source;
  }
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Could not create canvas for JPEG conversion');
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  );
  if (!jpeg) {
    throw new Error('JPEG conversion failed');
  }
  return jpeg;
}

export async function generateCheapCardImage(imagePrompt: string): Promise<Blob> {
  const base = getComfyBaseUrl();
  const seed = Math.floor(Math.random() * 1_000_000_000_000);
  const promptPayload = {
    prompt: buildWorkflow(imagePrompt, seed, 512),
  };

  const queueRes = await fetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promptPayload),
  });
  if (!queueRes.ok) {
    const detail = await queueRes.text().catch(() => '');
    throw new Error(`Comfy /prompt failed: ${queueRes.status} ${detail}`);
  }
  const { prompt_id: promptId } = (await queueRes.json()) as { prompt_id: string };
  if (!promptId) {
    throw new Error('Comfy /prompt returned no prompt_id');
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const historyRes = await fetch(`${base}/history/${promptId}`);
    if (!historyRes.ok) continue;
    const history = (await historyRes.json()) as Record<
      string,
      {
        outputs?: Record<
          string,
          { images?: { filename: string; subfolder: string; type: string }[] }
        >;
        status?: { completed?: boolean; status_str?: string };
      }
    >;
    const entry = history[promptId];
    if (entry?.status?.status_str === 'error') {
      throw new Error('Comfy workflow failed');
    }
    const img = firstHistoryImage(entry);
    if (!img) continue;

    const params = new URLSearchParams({
      filename: img.filename,
      subfolder: img.subfolder ?? '',
      type: img.type ?? 'output',
    });
    const viewRes = await fetch(`${base}/view?${params}`);
    if (!viewRes.ok) {
      throw new Error(`Comfy /view failed: ${viewRes.status}`);
    }
    return toJpegBlob(await viewRes.blob());
  }

  throw new Error('Comfy image generation timed out');
}
