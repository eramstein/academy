<script lang="ts">
  import type {
    Artifact,
    ArtifactTool,
    ArtifactTrinket,
    CardColor,
    CardCraftingSkills,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import type { ArtifactCostLine, ArtifactCraftView } from '@/lib/sim/actions';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import ResourceIcon from '@/lib/ui/sim/ResourceIcon.svelte';
  import ArtifactThumb from '@/lib/ui/sim/sim-data/player/ArtifactThumb.svelte';

  const PER_PAGE = 3;
  const PAGE_SIZE = PER_PAGE * 2;

  let {
    patterns,
    onConfirm,
    onBack,
    page = $bindable(0),
  }: {
    patterns: ArtifactCraftView[];
    onConfirm: (patternKey: string) => void;
    onBack: () => void;
    page?: number;
  } = $props();

  const bookPath = getAssetPath('images/ui/backgrounds/book.png');
  const framePath = getAssetPath('images/ui/backgrounds/blue-support.png');

  const pageCount = $derived(Math.max(1, Math.ceil(patterns.length / PAGE_SIZE)));
  const pagePatterns = $derived(patterns.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
  const leftPage = $derived(pagePatterns.slice(0, PER_PAGE));
  const rightPage = $derived(pagePatterns.slice(PER_PAGE, PAGE_SIZE));

  $effect(() => {
    const count = Math.max(1, Math.ceil(patterns.length / PAGE_SIZE));
    if (page > count - 1) page = count - 1;
    if (page < 0) page = 0;
  });

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (page < pageCount - 1) page += 1;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (page > 0) page -= 1;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function choosePattern(patternKey: string) {
    const view = patterns.find((pattern) => pattern.artifact.patternKey === patternKey);
    if (!view || view.missingPatternNames.length > 0) return;
    onConfirm(patternKey);
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function masteryHave(color: CardColor): number {
    return gs.player.colorMasteryPoints?.[color] ?? 0;
  }

  function colorShort(pattern: ArtifactCraftView, index: number): boolean {
    const bar = pattern.artifact.colorCost[index];
    if (!bar) return false;
    const remaining = Math.max(0, bar.cost - (pattern.filled[index] ?? 0));
    return masteryHave(bar.color) < remaining;
  }

  function effectLine(artifact: Artifact): string {
    const lines: string[] = [];
    if ('skillBonuses' in artifact) {
      const bonuses = (artifact as ArtifactTool).skillBonuses ?? ({} as CardCraftingSkills);
      for (const key of ['mastery', 'erudition', 'inspiration'] as const) {
        const value = bonuses[key];
        if (typeof value === 'number' && value !== 0) lines.push(skillPhrase(key, value));
      }
    }
    if ('attributeBonuses' in artifact) {
      const bonuses = (artifact as ArtifactTrinket).attributeBonuses ?? {};
      for (const key of ['vitality', 'dexterity', 'intelligence', 'charisma', 'aura'] as const) {
        const value = bonuses[key];
        if (typeof value === 'number' && value !== 0) lines.push(attributePhrase(key, value));
      }
    }
    return lines.join(' ');
  }

  function skillPhrase(key: keyof CardCraftingSkills, value: number): string {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    const verb = key === 'erudition' ? 'Deepens' : key === 'inspiration' ? 'Sharpens' : 'Improves';
    if (value === 1) return `${verb} your crafting ${name}.`;
    if (value > 1) return `${verb} your crafting ${name} by ${value}.`;
    return `Lowers your crafting ${name}.`;
  }

  function attributePhrase(key: string, value: number): string {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    if (value === 1) return `Increases your ${name}.`;
    if (value > 1) return `Increases your ${name} by ${value}.`;
    return `Lowers your ${name}.`;
  }

  function previewCosts(pattern: ArtifactCraftView): ArtifactCostLine[] {
    const choices = pattern.affordableChoices ?? closestChoices(pattern);
    const merged = new Map<ArtifactCostLine['key'], ArtifactCostLine>();
    pattern.pieces.forEach((piece, index) => {
      const alternative = piece.alternatives[choices[index] ?? 0];
      if (!alternative) return;
      for (const line of alternative.lines) {
        const existing = merged.get(line.key);
        if (!existing) {
          merged.set(line.key, { ...line });
          continue;
        }
        existing.need += line.need;
        existing.enough = existing.have >= existing.need;
      }
    });
    return [...merged.values()];
  }

  function closestChoices(pattern: ArtifactCraftView): number[] {
    return pattern.pieces.map((piece) => {
      let best = piece.suggestedIndex;
      let bestScore = -1;
      piece.alternatives.forEach((alternative, index) => {
        const score = alternative.lines.reduce((sum, line) => sum + (line.enough ? 1 : 0), 0);
        if (score > bestScore) {
          bestScore = score;
          best = index;
        }
      });
      return best;
    });
  }

  function progressLabel(pattern: ArtifactCraftView): string {
    const need = pattern.artifact.colorCost.reduce((sum, bar) => sum + bar.cost, 0);
    const filled = pattern.filled.reduce((sum, count) => sum + count, 0);
    if (need === 0 || filled === 0 || filled >= need) return '';
    return `${filled}/${need}`;
  }

  function colorWorkDone(pattern: ArtifactCraftView): boolean {
    return pattern.artifact.colorCost.every(
      (bar, index) => (pattern.filled[index] ?? 0) >= bar.cost
    );
  }
</script>

{#snippet patternCard(pattern: ArtifactCraftView)}
  {@const locked = pattern.missingPatternNames.length > 0}
  {@const effect = effectLine(pattern.artifact)}
  {@const costs = previewCosts(pattern)}
  {@const progress = progressLabel(pattern)}
  {@const ready = !locked && colorWorkDone(pattern) && pattern.affordable}
  {@const missing = !locked && pattern.pieces.length > 0 && !pattern.affordable}
  <button
    type="button"
    class="card"
    disabled={locked}
    onclick={() => choosePattern(pattern.artifact.patternKey)}
  >
    <span class="plate">
      <ArtifactThumb
        patternKey={pattern.artifact.patternKey}
        image={pattern.artifact.image}
        size="fill"
        muted={locked}
      />
    </span>
    <span class="copy">
      <span class="name">
        {pattern.artifact.name}
        {#if progress}
          <span class="tag">{progress}</span>
        {:else if ready}
          <span class="tag">Ready</span>
        {/if}
      </span>
      {#if effect}
        <span class="effect">{effect}</span>
      {/if}
      {#if pattern.artifact.description}
        <span class="flavor-slot">
          <span class="flavor" title={pattern.artifact.description}
            >{pattern.artifact.description}</span
          >
        </span>
      {/if}
      <span class="foot">
        {#if locked}
          <span class="warn locked">Requires {pattern.missingPatternNames.join(', ')}</span>
        {:else if missing}
          <span class="warn">Missing materials</span>
        {/if}
        {#if pattern.artifact.colorCost.length > 0}
          <span class="cost-group" aria-label="Color requirements">
            {#each pattern.artifact.colorCost as bar, index (`${bar.color}-${index}`)}
              <span
                class="cost"
                title={`${masteryHave(bar.color)} ${bar.color} mastery, ${bar.cost} cells`}
              >
                <img class="cost-icon" src={colorPath(bar.color)} alt="" />
                <span class="num" class:short={colorShort(pattern, index)}>
                  {masteryHave(bar.color)}/{bar.cost}
                </span>
              </span>
            {/each}
          </span>
        {/if}
        {#if costs.length > 0}
          <span class="cost-group" aria-label="Material requirements">
            {#each costs as line (line.key)}
              <span class="cost" title={`${line.have} of ${line.need} ${line.label}`}>
                <span class="cost-icon mat">
                  {#if line.key === 'gold'}
                    <img src={getUiIconPath('coin')} alt="" />
                  {:else}
                    <ResourceIcon type={line.key} />
                  {/if}
                </span>
                <span class="num" class:short={!line.enough}>{line.have}/{line.need}</span>
              </span>
            {/each}
          </span>
        {/if}
      </span>
    </span>
    <span class="go" aria-hidden="true">›</span>
  </button>
{/snippet}

{#snippet pager()}
  <div class="pager" aria-label={`Page ${page + 1} of ${pageCount}`}>
    <button
      type="button"
      class="page-btn"
      aria-label="Previous page"
      disabled={page <= 0}
      onclick={() => (page = Math.max(0, page - 1))}
    >
      <span class="chevron left" aria-hidden="true"></span>
    </button>
    <span class="pager-label">{page + 1} / {pageCount}</span>
    <button
      type="button"
      class="page-btn"
      aria-label="Next page"
      disabled={page >= pageCount - 1}
      onclick={() => (page = Math.min(pageCount - 1, page + 1))}
    >
      <span class="chevron" aria-hidden="true"></span>
    </button>
  </div>
{/snippet}

<div class="overlay" role="presentation" use:portal>
  <div
    class="stage"
    role="dialog"
    aria-modal="true"
    aria-label="Choose a pattern"
    style="--frame: url('{framePath}'); --book: url('{bookPath}')"
  >
    <div class="book">
      {#if patterns.length === 0}
        <p class="empty">No patterns yet.</p>
      {:else}
        <div class="spread">
          <div class="page">
            {#each leftPage as pattern (pattern.artifact.patternKey)}
              {@render patternCard(pattern)}
            {/each}
          </div>
          <div class="page">
            {#each rightPage as pattern (pattern.artifact.patternKey)}
              {@render patternCard(pattern)}
            {/each}
          </div>
        </div>
      {/if}
    </div>
    <footer class="actions">
      <OrnateButton variant="muted" onclick={onBack}>Back</OrnateButton>
      {#if patterns.length > 0}
        {@render pager()}
      {/if}
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .stage {
    position: relative;
    width: min(1680px, calc(100vw - 12px), calc((100vh - 12px) * 1536 / 1024));
    aspect-ratio: 1536 / 1024;
    box-sizing: border-box;
    background: var(--frame) center / 100% 100% no-repeat;
    box-shadow: 0 22px 52px rgba(0, 0, 0, 0.62);
    container-type: inline-size;
  }

  .book {
    position: absolute;
    top: 11.2%;
    left: 50%;
    height: 75%;
    width: auto;
    aspect-ratio: 1613 / 975;
    transform: translateX(-50%);
    container-type: inline-size;
    background: var(--book) center / contain no-repeat;
    filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.45));
  }

  .empty {
    position: absolute;
    inset: 20% 18% 24%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 1.15rem;
    color: var(--color-ink-muted);
  }

  .spread {
    position: absolute;
    top: 11%;
    bottom: 17.5%;
    left: 9.6%;
    right: 9.6%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 7.8%;
  }

  .page {
    display: grid;
    grid-template-rows: repeat(3, minmax(0, 1fr));
    min-width: 0;
    min-height: 0;
  }

  .card {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 0.55em;
    min-width: 0;
    min-height: 0;
    height: 100%;
    margin: 0;
    padding: 1.32em 1.28em 1.28em 1.2em;
    box-sizing: border-box;
    overflow: hidden;
    text-align: left;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    container-type: size;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.12s ease;
  }

  .card:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: 0;
    height: 1px;
    background: color-mix(in srgb, var(--color-brown-border) 36%, transparent);
    pointer-events: none;
  }

  .card:hover:not(:disabled),
  .card:focus-visible:not(:disabled) {
    background: color-mix(in srgb, white 34%, transparent);
    border-color: var(--color-golden);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-golden) 65%, transparent);
  }

  .card:hover:not(:disabled)::after,
  .card:focus-visible:not(:disabled)::after {
    opacity: 0;
  }

  .card:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .card:focus-visible:not(:disabled) {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .plate {
    position: relative;
    align-self: center;
    width: clamp(3.6rem, 72cqb, 6.1rem);
    height: clamp(3.6rem, 72cqb, 6.1rem);
    max-height: 100%;
    aspect-ratio: 1;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .go {
    align-self: center;
    margin-right: 0.2em;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.5rem, 20cqb, 2.2rem);
    font-weight: 600;
    line-height: 1;
    color: color-mix(in srgb, var(--color-ink) 58%, transparent);
  }

  .card:hover:not(:disabled) .go,
  .card:focus-visible:not(:disabled) .go {
    color: var(--color-brass);
  }

  .copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    padding: 0.05em 0.15em 0.05em 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .name {
    flex: 0 0 auto;
    font-size: clamp(1.18rem, 15.5cqb, 1.78rem);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  .tag {
    margin-left: 0.35em;
    font-size: 0.72em;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--color-brass);
    white-space: nowrap;
  }

  .effect {
    flex: 0 0 auto;
    margin-top: 0.16em;
    overflow: hidden;
    font-size: clamp(0.98rem, 11cqb, 1.34rem);
    line-height: 1.26;
    color: var(--color-ink);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .flavor-slot {
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 0.16em;
    overflow: hidden;
    container-type: size;
    font-size: clamp(0.9rem, 9cqb, 1.18rem);
  }

  .flavor {
    display: block;
    overflow: hidden;
    font-style: italic;
    line-height: 1.35;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--color-ink-muted);
  }

  @container (max-height: 1.15em) {
    .flavor {
      display: none;
    }
  }

  .foot {
    flex: 0 0 auto;
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.32em 0.65em;
    margin-top: auto;
    padding-top: 0.22em;
  }

  .warn {
    flex: 1 0 100%;
    font-size: clamp(0.95rem, 8.6cqb, 1.2rem);
    line-height: 1.15;
    color: var(--color-red);
  }

  .warn.locked {
    color: var(--color-ink-muted);
  }

  .cost-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.18em 0.7em;
  }

  .cost {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    white-space: nowrap;
  }

  .cost-icon {
    display: block;
    width: clamp(18px, 20cqb, 28px);
    height: clamp(18px, 20cqb, 28px);
    flex-shrink: 0;
  }

  .cost-icon.mat {
    width: clamp(26px, 30cqb, 38px);
    height: clamp(26px, 30cqb, 38px);
  }

  .cost-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .num {
    font-size: clamp(0.92rem, 9.2cqb, 1.22rem);
    line-height: 1;
    color: var(--color-ink);
    font-variant-numeric: tabular-nums;
  }

  .num.short {
    color: var(--color-red);
  }

  .actions {
    position: absolute;
    top: 78%;
    right: 6%;
    bottom: 5.5%;
    left: 6%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    padding: 0;
  }

  .pager {
    position: absolute;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65em;
    transform: translateX(-50%);
  }

  .page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: clamp(26px, 2.7cqi, 34px);
    height: clamp(26px, 2.7cqi, 34px);
    padding: 0;
    border: 1px solid var(--color-brass);
    border-radius: 50%;
    background: var(--color-ink);
    cursor: pointer;
  }

  .page-btn:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .page-btn:hover:not(:disabled) {
    border-color: var(--color-golden);
  }

  .chevron {
    display: block;
    width: 0.38em;
    height: 0.38em;
    margin-left: -0.1em;
    border-right: 2px solid var(--color-cream);
    border-bottom: 2px solid var(--color-cream);
    transform: rotate(-45deg);
  }

  .chevron.left {
    margin-left: 0.1em;
    transform: rotate(135deg);
  }

  .pager-label {
    min-width: 3.2em;
    text-align: center;
    font-family: var(--font-narrative);
    font-size: clamp(0.9rem, 1.7cqi, 1.15rem);
    color: var(--color-cream);
  }
</style>
