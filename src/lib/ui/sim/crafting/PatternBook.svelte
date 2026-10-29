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
  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');

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
    const verb =
      key === 'erudition' ? 'Deepens' : key === 'inspiration' ? 'Sharpens' : 'Improves';
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
        <span class="flavor" title={pattern.artifact.description}>{pattern.artifact.description}</span>
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
                <span class="cost-icon">
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
    style="--table: url('{tablePath}'); --book: url('{bookPath}')"
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
    padding: 16px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .stage {
    width: min(1480px, calc(100vw - 16px), calc((100vh - 8.5rem) * 806 / 487));
    max-height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    padding: 0.45rem 0.55rem 0.9rem;
    box-sizing: border-box;
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
  }

  .book {
    position: relative;
    width: 100%;
    aspect-ratio: 806 / 487;
    container-type: inline-size;
    background: var(--book) center / contain no-repeat;
    filter: drop-shadow(0 12px 14px rgba(0, 0, 0, 0.4));
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
    top: 17.5%;
    bottom: 27%;
    left: 13.5%;
    right: 13.5%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 8.5%;
  }

  .page {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 0;
    min-width: 0;
    min-height: 0;
  }

  .card {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: stretch;
    gap: 0.55em;
    min-width: 0;
    min-height: 0;
    height: 100%;
    margin: 0;
    padding: 0.55em 0;
    box-sizing: border-box;
    overflow: hidden;
    text-align: left;
    font-family: var(--font-narrative);
    color: var(--color-ink);
    background: transparent;
    border: none;
    border-radius: 0;
    cursor: pointer;
    container-type: size;
  }

  .card:not(:first-child) {
    border-top: 1px solid color-mix(in srgb, var(--color-brown-border) 42%, transparent);
  }

  .card:disabled {
    cursor: default;
    opacity: 0.72;
  }

  .card:focus-visible .plate {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .plate {
    position: relative;
    width: auto;
    height: 100%;
    aspect-ratio: 1;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    padding: 0.1em 0.2em 0.1em 0;
    box-sizing: border-box;
  }

  .name {
    flex: 0 0 auto;
    font-size: clamp(1.05rem, 11cqb, 1.35rem);
    font-weight: 700;
    line-height: 1.12;
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
    margin-top: 0.1em;
    font-size: clamp(0.92rem, 8.4cqb, 1.14rem);
    line-height: 1.25;
    color: var(--color-ink);
  }

  .flavor {
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 0.14em;
    overflow: hidden;
    font-size: clamp(0.84rem, 7.2cqb, 1.05rem);
    line-height: 1.3;
    color: var(--color-ink-muted);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .foot {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.16em;
    margin-top: auto;
    padding-top: 0.14em;
  }

  .warn {
    font-size: clamp(0.82rem, 6.8cqb, 1.02rem);
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
    gap: 0.22em 0.55em;
  }

  .cost {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    white-space: nowrap;
  }

  .cost-icon {
    display: block;
    width: clamp(20px, 28cqb, 28px);
    height: clamp(20px, 28cqb, 28px);
    flex-shrink: 0;
  }

  .cost-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .num {
    font-size: clamp(0.88rem, 7.8cqb, 1.12rem);
    line-height: 1;
    color: var(--color-ink);
    font-variant-numeric: tabular-nums;
  }

  .num.short {
    color: var(--color-red);
  }

  .actions {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    padding: 0.85rem 5% 0.35rem;
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
