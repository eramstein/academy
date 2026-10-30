import type {
  Artifact,
  ArtifactTool,
  ArtifactTrinket,
  Attributes,
  CardCraftingSkills,
  Character,
} from '@/lib/_model';
import { gs } from '@/lib/_state/main.svelte';

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

function ensureEquippedSlots() {
  if (!gs.player.equippedArtifacts) {
    gs.player.equippedArtifacts = { tool: null, trinket: null };
  }
  return gs.player.equippedArtifacts;
}

export function isArtifactEquipped(
  artifact: ArtifactTool | ArtifactTrinket,
  kind: 'Tool' | 'Trinket'
): boolean {
  const slots = gs.player.equippedArtifacts;
  if (!slots) return false;
  return kind === 'Tool' ? slots.tool === artifact : slots.trinket === artifact;
}

function mutateAttributes(bonuses: Partial<Attributes> | undefined, sign: 1 | -1) {
  if (!bonuses) return;
  const attrs = gs.player.attributes;
  for (const key of Object.keys(bonuses) as (keyof Attributes)[]) {
    const delta = bonuses[key];
    if (typeof delta !== 'number' || delta === 0) continue;
    attrs[key] = (attrs[key] ?? 0) + sign * delta;
  }
}

/** Equip an owned artifact, or unequip it if already in that slot. One tool and one trinket. */
export function toggleEquippedArtifact(
  artifact: ArtifactTool | ArtifactTrinket,
  kind: 'Tool' | 'Trinket'
) {
  const slots = ensureEquippedSlots();
  if (kind === 'Tool') {
    slots.tool = slots.tool === artifact ? null : (artifact as ArtifactTool);
    return;
  }
  const next = artifact as ArtifactTrinket;
  if (slots.trinket === next) {
    mutateAttributes(next.attributeBonuses, -1);
    slots.trinket = null;
    return;
  }
  if (slots.trinket) {
    mutateAttributes(slots.trinket.attributeBonuses, -1);
  }
  slots.trinket = next;
  mutateAttributes(next.attributeBonuses, 1);
}

/** Clear the trinket slot and reverse its attribute bonuses (e.g. before gifting). */
export function unequipTrinketIfEquipped(trinket: ArtifactTrinket) {
  const slots = ensureEquippedSlots();
  if (slots.trinket !== trinket) return;
  mutateAttributes(trinket.attributeBonuses, -1);
  slots.trinket = null;
}

/** Base crafting skills plus equipped tool bonuses (player only). */
export function effectiveCraftingSkills(character: Character): CardCraftingSkills {
  const base = character.craftingSkills ?? { mastery: 0, erudition: 0, inspiration: 0 };
  const skills: CardCraftingSkills = {
    mastery: base.mastery ?? 0,
    erudition: base.erudition ?? 0,
    inspiration: base.inspiration ?? 0,
  };
  if (character.key !== gs.player.key) return skills;
  const bonuses = ensureEquippedSlots().tool?.skillBonuses;
  if (!bonuses) return skills;
  return {
    mastery: skills.mastery + (bonuses.mastery ?? 0),
    erudition: skills.erudition + (bonuses.erudition ?? 0),
    inspiration: skills.inspiration + (bonuses.inspiration ?? 0),
  };
}
