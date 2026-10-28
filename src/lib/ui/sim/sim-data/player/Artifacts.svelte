<script lang="ts">
  import type {
    Artifact,
    ArtifactTool,
    ArtifactTrinket,
    Attributes,
    CardCraftingSkills,
  } from '@/lib/_model';
  import { CardColor, ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath, getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import { getArtifactCostLines, type ArtifactCostLine } from '@/lib/sim/actions';
  import { getLoadedArtifact } from '@/lib/sim/artifacts';
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();

  type OwnedEntry = {
    artifact: ArtifactTool | ArtifactTrinket;
    kind: 'Tool' | 'Trinket';
  };

  type PatternEntry = {
    artifact: Artifact;
    kind: 'Tool' | 'Trinket';
    costs: ArtifactCostLine[];
    filled: number[];
    requiredNames: string[];
  };

  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: 'magic_dust',
    [ResourceType.Mithril]: 'metal_bar',
    [ResourceType.Moxes]: 'gem',
    [ResourceType.MollysBeads]: 'leaf',
    [ResourceType.SchlupakMushrooms]: 'feather',
    [ResourceType.SchlupakDreamspheres]: 'feather',
    [ResourceType.SchlupakSpores]: 'feather',
  };

  const owned = $derived.by((): OwnedEntry[] => {
    const tools = (gs.player.artifacts?.tools ?? []).map((artifact) => ({
      artifact,
      kind: 'Tool' as const,
    }));
    const trinkets = (gs.player.artifacts?.trinkets ?? []).map((artifact) => ({
      artifact,
      kind: 'Trinket' as const,
    }));
    return [...tools, ...trinkets].sort((a, b) =>
      a.artifact.name.localeCompare(b.artifact.name)
    );
  });

  const ownedKeys = $derived(new Set(owned.map((entry) => entry.artifact.patternKey)));

  const patterns = $derived.by((): PatternEntry[] => {
    const known = [...new Set(gs.player.artifacts?.patterns ?? [])];
    return known
      .filter((key) => key && !ownedKeys.has(key))
      .flatMap((patternKey) => {
        const artifact = getLoadedArtifact(patternKey);
        if (!artifact) return [];
        return [
          {
            artifact,
            kind: artifactKind(artifact),
            costs: getArtifactCostLines(artifact),
            filled: filledCounts(artifact),
            requiredNames: (artifact.requiredPatterns ?? []).map(
              (key) => getLoadedArtifact(key)?.name ?? key
            ),
          },
        ];
      })
      .sort((a, b) => a.artifact.name.localeCompare(b.artifact.name));
  });

  function artifactKind(artifact: Artifact): 'Tool' | 'Trinket' {
    return 'attributeBonuses' in artifact ? 'Trinket' : 'Tool';
  }

  function filledCounts(artifact: Artifact): number[] {
    const saved = gs.player.artifactProgress?.find((entry) => entry.key === artifact.patternKey);
    return artifact.colorCost.map((entry, index) => {
      const cell = saved?.colorCost[index];
      if (!cell || cell.color !== entry.color) return 0;
      return Math.max(0, Math.min(entry.cost, cell.cost));
    });
  }

  function titleWord(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function effectLines(artifact: Artifact): string[] {
    if ('skillBonuses' in artifact) {
      return Object.entries((artifact as ArtifactTool).skillBonuses ?? {})
        .filter((entry): entry is [keyof CardCraftingSkills, number] => typeof entry[1] === 'number')
        .filter(([, value]) => value !== 0)
        .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${titleWord(key)}`);
    }
    if ('attributeBonuses' in artifact) {
      return Object.entries((artifact as ArtifactTrinket).attributeBonuses ?? {})
        .filter((entry): entry is [keyof Attributes, number] => typeof entry[1] === 'number')
        .filter(([, value]) => value !== 0)
        .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${titleWord(key)}`);
    }
    return [];
  }

  function progressLabel(filled: number[], artifact: Artifact): string {
    const need = artifact.colorCost.reduce((sum, bar) => sum + bar.cost, 0);
    const have = filled.reduce((sum, count) => sum + count, 0);
    if (need === 0 || have === 0) return '';
    return `${have}/${need} cells`;
  }

  function costIcon(key: ArtifactCostLine['key']): string {
    if (key === 'gold') return getUiIconPath('coin');
    return getUiIconPath(RESOURCE_ICONS[key]);
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function artifactImage(patternKey: string): string {
    return getAssetPath(`images/artifacts/${patternKey}.jpg`);
  }

  function hideBrokenImage(event: Event) {
    const target = event.currentTarget;
    if (target instanceof HTMLImageElement) target.hidden = true;
  }

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }
</script>

{#snippet icon(name: string)}
  <span
    class="icon"
    class:painted={isPaintedUiIcon(name)}
    style="--icon: url('{iconUrl(name)}')"
    aria-hidden="true"
  ></span>
{/snippet}

{#snippet artifactCard(
  artifact: Artifact,
  kind: 'Tool' | 'Trinket',
  opts?: { costs?: ArtifactCostLine[]; filled?: number[]; requiredNames?: string[]; pattern?: boolean }
)}
  {@const effects = effectLines(artifact)}
  {@const progress = opts?.filled ? progressLabel(opts.filled, artifact) : ''}
  <li class="card" class:pattern={opts?.pattern}>
    <span class="thumb">
      <img src={artifactImage(artifact.patternKey)} alt="" onerror={hideBrokenImage} />
    </span>
    <div class="copy">
      <div class="headline">
        <span class="name">{artifact.name}</span>
        <span class="kind">{opts?.pattern ? 'Pattern' : kind}</span>
      </div>
      {#if artifact.description}
        <p class="desc">{artifact.description}</p>
      {/if}
      {#if effects.length > 0}
        <p class="effects">{effects.join(' · ')}</p>
      {/if}
      {#if opts?.pattern && artifact.colorCost.length > 0}
        <ul class="colors">
          {#each artifact.colorCost as bar, index (`${bar.color}-${index}`)}
            {@const filled = opts?.filled?.[index] ?? 0}
            <li class="color">
              <img src={colorPath(bar.color)} alt="" />
              <span>{filled}/{bar.cost}</span>
            </li>
          {/each}
        </ul>
      {/if}
      {#if opts?.costs && opts.costs.length > 0}
        <ul class="costs">
          {#each opts.costs as line (line.key)}
            <li class="cost" class:short={!line.enough}>
              <img src={costIcon(line.key)} alt="" />
              <span>{line.label}</span>
              <span class="cost-amount">{line.need}</span>
            </li>
          {/each}
        </ul>
      {/if}
      {#if opts?.requiredNames && opts.requiredNames.length > 0}
        <p class="meta">Requires {opts.requiredNames.join(', ')}</p>
      {/if}
      {#if progress}
        <p class="meta">In progress · {progress}</p>
      {/if}
    </div>
  </li>
{/snippet}

<PlayerDetail title="Artifacts" {onBack}>
  <section class="section">
    <h3>
      {@render icon('spiral')}
      Owned
    </h3>
    {#if owned.length === 0}
      <p class="empty">None yet.</p>
    {:else}
      <ul class="cards">
        {#each owned as entry, index (`owned-${entry.artifact.patternKey}-${index}`)}
          {@render artifactCard(entry.artifact, entry.kind)}
        {/each}
      </ul>
    {/if}
  </section>

  <section class="section">
    <h3>
      {@render icon('book')}
      Patterns
    </h3>
    {#if patterns.length === 0}
      <p class="empty">No uncrafted patterns.</p>
    {:else}
      <ul class="cards">
        {#each patterns as entry (entry.artifact.patternKey)}
          {@render artifactCard(entry.artifact, entry.kind, {
            costs: entry.costs,
            filled: entry.filled,
            requiredNames: entry.requiredNames,
            pattern: true,
          })}
        {/each}
      </ul>
    {/if}
  </section>
</PlayerDetail>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .section + .section {
    margin-top: 1.25rem;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .icon {
    display: block;
    width: 1.15rem;
    height: 1.15rem;
    flex-shrink: 0;
    color: var(--color-brass);
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .icon.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .empty {
    margin: 0;
    font-size: 0.92rem;
    color: var(--color-muted-label);
  }

  .cards {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
  }

  .card {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr);
    gap: 0.75rem;
    align-items: start;
  }

  .thumb {
    width: 4.5rem;
    height: 4.5rem;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.35);
  }

  .thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
    min-width: 0;
  }

  .headline {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.45rem 0.65rem;
  }

  .name {
    color: var(--color-cream);
    font-size: 1.02rem;
  }

  .kind {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .desc,
  .meta {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.45;
    color: var(--color-muted-label);
  }

  .effects {
    margin: 0;
    font-size: 0.92rem;
    color: var(--color-golden);
  }

  .colors,
  .costs {
    margin: 0.1rem 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.85rem;
  }

  .color,
  .cost {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.88rem;
    color: var(--color-cream);
  }

  .color img,
  .cost img {
    width: 1.15rem;
    height: 1.15rem;
    object-fit: contain;
  }

  .cost-amount {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .cost.short {
    color: #c9897a;
  }

  .cost.short .cost-amount {
    color: inherit;
  }

  .card.pattern .thumb {
    opacity: 0.88;
  }
</style>
