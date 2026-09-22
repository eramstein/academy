import { getRandomFromArray } from '@/lib/_utils/random';
import { loadFlavorTemplates, registerFlavorTemplate } from '../flavor-templates';
import { MATCH_SCORE_THRESHOLD, findBestFlavor, rankBestFlavor } from './match';
import { generateCheapCardImage } from './generate-image';
import { flavorFromGeneratedText, generateFlavorText } from './generate-text';
import { persistCardImage, persistFlavorTemplate } from './persist';
import type { FlavorTemplate, GameplayTemplate } from './types';
import { getUsedFlavorImageNames, markFlavorUsed } from './used-flavors';

export interface UsedFlavorsBatch {
  names: Set<string>;
  images: Set<string>;
}

/** Progressive hooks while resolving / generating flavor. */
export type FlavorResolveProgress =
  | { stage: 'reuse'; flavor: FlavorTemplate }
  | { stage: 'generate_text' }
  | { stage: 'name_ready'; name: string; imageName: string; unitTypes?: FlavorTemplate['unitTypes'] }
  | { stage: 'generate_image' }
  | { stage: 'image_ready'; flavor: FlavorTemplate }
  | { stage: 'fallback'; flavor: FlavorTemplate };

export interface ResolveFlavorOptions {
  batch?: UsedFlavorsBatch;
  onProgress?: (event: FlavorResolveProgress) => void;
  /** When set, guides AI name/art and skips catalog reuse so the vision is honored. */
  flavorText?: string;
  /** When false, never call AI — reuse or catalog fallback only. Default true. */
  allowAiGenerate?: boolean;
}

const LOG_PREFIX = '[flavor-resolve]';

function excludeUsed(
  templates: FlavorTemplate[],
  usedImageNames: Set<string>,
  batch?: UsedFlavorsBatch
): FlavorTemplate[] {
  return templates.filter((template) => {
    if (usedImageNames.has(template.imageName)) return false;
    if (batch?.images.has(template.imageName)) return false;
    if (batch?.names.has(template.name)) return false;
    return true;
  });
}

function catalogFallback(
  unused: FlavorTemplate[],
  all: FlavorTemplate[],
  gameplay: GameplayTemplate
): FlavorTemplate {
  const bestUnused = findBestFlavor(unused, gameplay);
  if (bestUnused) return bestUnused;

  const typedUnused = unused.filter((t) => t.cardType === gameplay.cardType);
  if (typedUnused.length) return getRandomFromArray(typedUnused);

  const typedAll = all.filter((t) => t.cardType === gameplay.cardType);
  if (typedAll.length) return getRandomFromArray(typedAll);

  if (all.length) return getRandomFromArray(all);
  throw new Error('No flavor templates available');
}

async function generateAndPersist(
  gameplay: GameplayTemplate,
  onProgress?: (event: FlavorResolveProgress) => void,
  flavorText?: string
): Promise<FlavorTemplate> {
  console.log(LOG_PREFIX, 'AI generation starting…');
  onProgress?.({ stage: 'generate_text' });
  const text = await generateFlavorText(gameplay, flavorText);
  console.log(LOG_PREFIX, 'LLM text ready', {
    name: text.name,
    imageName: text.imageName,
    unitType: text.unitType,
  });
  const flavor = flavorFromGeneratedText(gameplay, text);
  onProgress?.({
    stage: 'name_ready',
    name: flavor.name,
    imageName: flavor.imageName,
    unitTypes: flavor.unitTypes,
  });

  onProgress?.({ stage: 'generate_image' });
  const imageBlob = await generateCheapCardImage(flavor.imagePrompt);
  console.log(LOG_PREFIX, 'Comfy image ready', {
    imageName: flavor.imageName,
    bytes: imageBlob.size,
  });
  await persistCardImage(flavor.imageName, imageBlob);
  await persistFlavorTemplate(flavor);
  registerFlavorTemplate(flavor);
  console.log(LOG_PREFIX, 'Persisted new flavor template', flavor.name);
  onProgress?.({ stage: 'image_ready', flavor });
  return flavor;
}

/**
 * Match an unused catalog flavor, or (DEV) generate + persist a new one.
 * Always marks the returned flavor as used in IndexedDB.
 */
export async function resolveFlavorTemplate(
  gameplay: GameplayTemplate,
  batchOrOptions?: UsedFlavorsBatch | ResolveFlavorOptions
): Promise<FlavorTemplate> {
  const options = normalizeResolveOptions(batchOrOptions);
  const { batch, onProgress, flavorText } = options;
  const allowAiGenerate = options.allowAiGenerate !== false;
  const trimmedFlavor = flavorText?.trim() || undefined;
  const forceGenerate = allowAiGenerate && !!trimmedFlavor;

  const all = loadFlavorTemplates();
  const usedImageNames = await getUsedFlavorImageNames();
  const unused = excludeUsed(all, usedImageNames, batch);
  const ranked = forceGenerate ? null : rankBestFlavor(unused, gameplay);
  const passesThreshold = !!ranked && ranked.score >= MATCH_SCORE_THRESHOLD;

  console.log(LOG_PREFIX, 'Gameplay query', {
    cardType: gameplay.cardType,
    colors: gameplay.colors,
    powerLevel: gameplay.powerLevel,
    keywords: gameplay.keywords ?? [],
    unitTypes: gameplay.unitTypes ?? [],
    actions: gameplay.actions ?? [],
    flavorText: trimmedFlavor ?? null,
  });
  console.log(LOG_PREFIX, 'Catalog pool', {
    total: all.length,
    unused: unused.length,
    usedInDb: usedImageNames.size,
    batchBlocked: (batch?.images.size ?? 0) + (batch?.names.size ?? 0),
    threshold: MATCH_SCORE_THRESHOLD,
    forceGenerate,
    allowAiGenerate,
  });

  if (ranked) {
    console.log(LOG_PREFIX, 'Best unused candidate', {
      name: ranked.template.name,
      imageName: ranked.template.imageName,
      score: ranked.score,
      threshold: MATCH_SCORE_THRESHOLD,
      passesThreshold,
      breakdown: ranked.breakdown,
      candidate: {
        colors: ranked.template.colors,
        unitSize: ranked.template.unitSize,
        keywords: ranked.template.keywords,
        unitTypes: ranked.template.unitTypes ?? [],
        actions: ranked.template.actions ?? [],
      },
    });
  } else if (!forceGenerate) {
    console.log(LOG_PREFIX, 'No unused candidates in pool');
  }

  let flavor: FlavorTemplate | null = passesThreshold && ranked ? ranked.template : null;
  let decision: 'reuse' | 'generate' | 'fallback' = flavor ? 'reuse' : 'generate';

  if (flavor) {
    console.log(LOG_PREFIX, 'Decision: REUSE existing template (score >= threshold)', {
      name: flavor.name,
      score: ranked!.score,
      threshold: MATCH_SCORE_THRESHOLD,
    });
    onProgress?.({ stage: 'reuse', flavor });
  } else if (allowAiGenerate && import.meta.env.DEV) {
    console.log(LOG_PREFIX, 'Decision: GENERATE via AI (no candidate above threshold)', {
      bestScore: ranked?.score ?? null,
      threshold: MATCH_SCORE_THRESHOLD,
      gap: ranked ? MATCH_SCORE_THRESHOLD - ranked.score : null,
      playerVision: !!trimmedFlavor,
    });
    try {
      flavor = await generateAndPersist(gameplay, onProgress, trimmedFlavor);
      decision = 'generate';
    } catch (error) {
      console.warn(LOG_PREFIX, 'AI generation failed, falling back to catalog', error);
      flavor = null;
      decision = 'fallback';
    }
  } else {
    console.log(LOG_PREFIX, 'Decision: FALLBACK (catalog only)', {
      bestScore: ranked?.score ?? null,
      threshold: MATCH_SCORE_THRESHOLD,
      allowAiGenerate,
    });
    decision = 'fallback';
  }

  if (!flavor) {
    flavor = catalogFallback(unused, all, gameplay);
    decision = 'fallback';
    console.log(LOG_PREFIX, 'Using catalog fallback', {
      name: flavor.name,
      imageName: flavor.imageName,
    });
    onProgress?.({ stage: 'fallback', flavor });
  }

  console.log(LOG_PREFIX, 'Resolved', {
    decision,
    name: flavor.name,
    imageName: flavor.imageName,
  });

  await markFlavorUsed(flavor.imageName, flavor.name);
  return flavor;
}

function normalizeResolveOptions(
  batchOrOptions?: UsedFlavorsBatch | ResolveFlavorOptions
): ResolveFlavorOptions {
  if (!batchOrOptions) return {};
  if ('names' in batchOrOptions && 'images' in batchOrOptions) {
    return { batch: batchOrOptions };
  }
  return batchOrOptions;
}
