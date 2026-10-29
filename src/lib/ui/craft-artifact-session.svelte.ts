import { ActionType, type Action } from '@/lib/_model';

export const craftArtifactSession = $state({
  action: null as Action | null,
});

/** Open the Craft Artifact workbench overlay (same action as the workshop button). */
export function openCraftArtifactAction() {
  craftArtifactSession.action = {
    label: 'Craft Artifact',
    actionType: ActionType.CraftArtifact,
    isLongAction: true,
    actionParameters: {},
  };
}

export function closeCraftArtifactAction() {
  craftArtifactSession.action = null;
}
