import type { ComfyPromptGraph } from '../types';
import { getComfyBaseUrl, getImageGenConfig } from '../config';

export interface ComfyHistoryImage {
  filename: string;
  subfolder: string;
  type: string;
}

type ComfyHistoryEntry = {
  outputs?: Record<string, { images?: ComfyHistoryImage[] }>;
  status?: { completed?: boolean; status_str?: string };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function firstHistoryImage(
  entry: ComfyHistoryEntry | undefined,
  preferredSaveNodeId?: string
): ComfyHistoryImage | null {
  if (!entry?.outputs) return null;
  if (preferredSaveNodeId) {
    const preferred = entry.outputs[preferredSaveNodeId]?.images?.[0];
    if (preferred) return preferred;
  }
  for (const output of Object.values(entry.outputs)) {
    if (output.images?.length) return output.images[0];
  }
  return null;
}

export async function queueComfyPrompt(graph: ComfyPromptGraph): Promise<string> {
  const base = getComfyBaseUrl();
  const queueRes = await fetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: graph }),
  });
  if (!queueRes.ok) {
    const detail = await queueRes.text().catch(() => '');
    throw new Error(`Comfy /prompt failed: ${queueRes.status} ${detail}`);
  }
  const { prompt_id: promptId } = (await queueRes.json()) as { prompt_id: string };
  if (!promptId) {
    throw new Error('Comfy /prompt returned no prompt_id');
  }
  return promptId;
}

export async function waitForComfyImage(
  promptId: string,
  saveNodeId?: string
): Promise<ComfyHistoryImage> {
  const { pollIntervalMs, pollTimeoutMs } = getImageGenConfig();
  const base = getComfyBaseUrl();
  const deadline = Date.now() + pollTimeoutMs;

  while (Date.now() < deadline) {
    await sleep(pollIntervalMs);
    const historyRes = await fetch(`${base}/history/${promptId}`);
    if (!historyRes.ok) continue;
    const history = (await historyRes.json()) as Record<string, ComfyHistoryEntry>;
    const entry = history[promptId];
    if (entry?.status?.status_str === 'error') {
      throw new Error('Comfy workflow failed');
    }
    const img = firstHistoryImage(entry, saveNodeId);
    if (img) return img;
  }

  throw new Error('Comfy image generation timed out');
}

export async function fetchComfyView(image: ComfyHistoryImage): Promise<Blob> {
  const base = getComfyBaseUrl();
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder ?? '',
    type: image.type ?? 'output',
  });
  const viewRes = await fetch(`${base}/view?${params}`);
  if (!viewRes.ok) {
    throw new Error(`Comfy /view failed: ${viewRes.status}`);
  }
  return viewRes.blob();
}

/** Comfy SaveImage writes PNG; many app assets are served as .jpg. */
export async function toJpegBlob(source: Blob, quality = 0.9): Promise<Blob> {
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

export async function runComfyWorkflow(
  graph: ComfyPromptGraph,
  saveNodeId: string,
  options: { outputJpeg: boolean; jpegQuality: number }
): Promise<Blob> {
  const promptId = await queueComfyPrompt(graph);
  const image = await waitForComfyImage(promptId, saveNodeId);
  const blob = await fetchComfyView(image);
  if (!options.outputJpeg) return blob;
  return toJpegBlob(blob, options.jpegQuality);
}
