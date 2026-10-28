import type { Artifact, ArtifactTool } from '@/lib/_model';

const artifactModules = import.meta.glob('@/data/sim/artifacts/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Artifact[]>;

let artifacts: Artifact[] = [];
let artifactsLoaded = false;

function readArtifactsSource(): Artifact[] {
  return Object.values(artifactModules).flat();
}

/** Load authored artifact definitions from src/data/sim/artifacts into memory. */
export function loadArtifacts() {
  artifacts = readArtifactsSource();
  artifactsLoaded = true;
}

function ensureArtifactsLoaded() {
  if (!artifactsLoaded) loadArtifacts();
}

export function getLoadedArtifacts(): Artifact[] {
  ensureArtifactsLoaded();
  return artifacts;
}

export function getLoadedArtifact(patternKey: string): Artifact | undefined {
  ensureArtifactsLoaded();
  return artifacts.find((artifact) => artifact.patternKey === patternKey);
}

export function getLoadedArtifactTools(): ArtifactTool[] {
  ensureArtifactsLoaded();
  return artifacts.filter((artifact): artifact is ArtifactTool => 'skillBonuses' in artifact);
}
