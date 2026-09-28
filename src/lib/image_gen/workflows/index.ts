import type { ImageWorkflowDefinition, ImageWorkflowId } from '../types';
import { flux2KleinTextToImage } from './flux2-klein-text-to-image';

const WORKFLOWS: Record<ImageWorkflowId, ImageWorkflowDefinition> = {
  'flux2-klein-text-to-image': flux2KleinTextToImage,
};

export function getWorkflow(id: ImageWorkflowId): ImageWorkflowDefinition {
  const workflow = WORKFLOWS[id];
  if (!workflow) {
    throw new Error(`Unknown image workflow: ${id}`);
  }
  return workflow;
}

export function listWorkflows(): ImageWorkflowDefinition[] {
  return Object.values(WORKFLOWS);
}

export function isImageWorkflowId(value: string): value is ImageWorkflowId {
  return Object.prototype.hasOwnProperty.call(WORKFLOWS, value);
}
