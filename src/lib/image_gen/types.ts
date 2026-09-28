/**
 * Shared types for the image generation service.
 * Workflows are pluggable; today only Comfy backends are registered.
 */

export type ImageBackendId = 'comfy';

/** Known workflow ids. Extend as new graphs / providers are added. */
export type ImageWorkflowId = 'flux2-klein-text-to-image' | 'flux2-klein-narration';

export interface ImageGenConfig {
  /** Active backend. Default: `'comfy'`. */
  backend: ImageBackendId;
  /** Default workflow when callers omit `workflow`. */
  defaultWorkflow: ImageWorkflowId;
  /** ComfyUI base URL (ignored in DEV browser — uses `/comfy-api` proxy). */
  comfyUrl: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  /** Default square size passed to size-aware workflows. */
  defaultSize: number;
  /** Convert non-JPEG output to JPEG before returning. */
  outputJpeg: boolean;
  jpegQuality: number;
  /** Default SaveImage / file prefix for Comfy workflows. */
  filenamePrefix: string;
}

export interface GenerateImageOptions {
  /** Override config.defaultWorkflow. */
  workflow?: ImageWorkflowId;
  /** Square edge length for size-aware workflows. */
  size?: number;
  /** Fixed seed; random if omitted. */
  seed?: number;
  /** Comfy SaveImage filename prefix. */
  filenamePrefix?: string;
  /** Override config.outputJpeg for this call. */
  outputJpeg?: boolean;
  jpegQuality?: number;
  /** Reference portrait uploaded to Comfy and wired into LoadImage (narration workflow). */
  referenceImage?: Blob;
}

export interface GenerateImageResult {
  blob: Blob;
  seed: number;
  workflow: ImageWorkflowId;
  backend: ImageBackendId;
}

/** Parameters every Comfy text-to-image workflow builder receives. */
export interface ComfyWorkflowBuildParams {
  prompt: string;
  seed: number;
  size: number;
  filenamePrefix: string;
  /** Comfy input filename from /upload/image, when the workflow has a LoadImage node. */
  referenceImageName?: string;
}

export type ComfyPromptGraph = Record<
  string,
  {
    class_type: string;
    inputs: Record<string, unknown>;
  }
>;

export interface ComfyWorkflowDefinition {
  id: ImageWorkflowId;
  label: string;
  backend: 'comfy';
  /** Node id of the SaveImage (or equivalent) whose output we prefer. */
  saveNodeId: string;
  build(params: ComfyWorkflowBuildParams): ComfyPromptGraph;
}

export type ImageWorkflowDefinition = ComfyWorkflowDefinition;
