<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getPieceDisplayName, getUiIconPath } from '@/lib/_utils/asset-paths';
  import type { ArtifactPieceCostView } from '@/lib/sim/actions';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import ResourceIcon from '@/lib/ui/sim/ResourceIcon.svelte';
  import PieceIcon from './PieceIcon.svelte';

  let {
    pieces,
    pieceChoices,
    leaving = false,
    affordable = true,
    onCycle,
    onBack,
    onAssemble,
  }: {
    pieces: ArtifactPieceCostView[];
    pieceChoices: number[];
    leaving?: boolean;
    affordable?: boolean;
    onCycle: (pieceIndex: number, delta: number) => void;
    onBack: () => void;
    onAssemble: () => void;
  } = $props();

  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const scenePath = getAssetPath('images/ui/backgrounds/artifact-workshop-background.jpg');
  const pagePath = getAssetPath('images/ui/backgrounds/book-page-2.png');
  const starPath = getAssetPath('images/ui/decorations/page-star.svg');
  const coinPath = getUiIconPath('coin');

  function choiceIndex(pieceIndex: number, count: number): number {
    if (count <= 0) return 0;
    const raw = pieceChoices[pieceIndex] ?? 0;
    return ((raw % count) + count) % count;
  }

  /**
   * Strip offsets per piece. Moves by ±1 on each pager step (including wrap) so
   * transform always animates one pane sideways instead of jumping the long way.
   */
  let stripAt = $state<number[]>([]);

  $effect(() => {
    const synced = pieces.map((piece, i) => {
      const count = piece.alternatives.length;
      if (count <= 0) return 0;
      const choice = choiceIndex(i, count);
      const current = stripAt[i];
      if (current === undefined) return choice;
      const mod = ((current % count) + count) % count;
      return mod === choice ? current : choice;
    });
    if (
      synced.length !== stripAt.length ||
      synced.some((value, i) => value !== stripAt[i])
    ) {
      stripAt = synced;
    }
  });

  function cycle(pieceIndex: number, delta: number) {
    if (leaving) return;
    const count = pieces[pieceIndex]?.alternatives.length ?? 0;
    if (count < 2) return;
    const d = delta > 0 ? 1 : -1;
    const next = stripAt.slice();
    while (next.length <= pieceIndex) next.push(0);
    next[pieceIndex] = (next[pieceIndex] ?? 0) + d;
    stripAt = next;
    onCycle(pieceIndex, d);
  }

  /** Map a strip slot to an alternative; strip can extend past [0, count). */
  function altAt(piece: ArtifactPieceCostView, slot: number) {
    const count = piece.alternatives.length;
    if (count <= 0) return undefined;
    return piece.alternatives[((slot % count) + count) % count];
  }

  const totals = $derived.by(() => {
    const map = new Map<
      string,
      { key: 'gold' | ResourceType; label: string; need: number; have: number }
    >();
    pieces.forEach((piece, pieceIndex) => {
      const alternative = piece.alternatives[choiceIndex(pieceIndex, piece.alternatives.length)];
      if (!alternative) return;
      for (const line of alternative.lines) {
        const existing = map.get(line.key);
        if (existing) existing.need += line.need;
        else {
          map.set(line.key, {
            key: line.key,
            label: line.label,
            need: line.need,
            have: line.have,
          });
        }
      }
    });
    return [...map.values()].sort((a, b) => {
      if (a.key === 'gold') return -1;
      if (b.key === 'gold') return 1;
      return a.label.localeCompare(b.label);
    });
  });

  const inventory = $derived.by(() => {
    const needed = new Set<ResourceType>();
    for (const piece of pieces) {
      for (const alternative of piece.alternatives) {
        for (const line of alternative.lines) {
          if (line.key !== 'gold') needed.add(line.key);
        }
      }
    }
    return Object.values(ResourceType)
      .filter((type) => (gs.player.resources?.[type] ?? 0) > 0 || needed.has(type))
      .map((type) => ({
        type,
        amount: gs.player.resources?.[type] ?? 0,
        label: resourceLabel(type),
        needed: needed.has(type),
      }))
      .sort((a, b) => {
        if (a.needed !== b.needed) return a.needed ? -1 : 1;
        return a.label.localeCompare(b.label);
      });
  });

  const gold = $derived(gs.player.gold ?? 0);

  function resourceLabel(type: ResourceType): string {
    if (type === ResourceType.MollysBeads) return "Molly's Beads";
    return type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function wheelCycle(node: HTMLElement, opts: { pieceIndex: number; count: number }) {
    const onWheel = (e: WheelEvent) => {
      if (leaving || opts.count < 2) return;
      e.preventDefault();
      cycle(opts.pieceIndex, e.deltaY > 0 ? 1 : -1);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return {
      update(next: { pieceIndex: number; count: number }) {
        opts = next;
      },
      destroy() {
        node.removeEventListener('wheel', onWheel);
      },
    };
  }
</script>

{#snippet star()}
  <img class="star" src={starPath} alt="" />
{/snippet}

{#snippet glyph(key: 'gold' | ResourceType)}
  <span class="glyph">
    {#if key === 'gold'}
      <img src={coinPath} alt="" />
    {:else}
      <ResourceIcon type={key} />
    {/if}
  </span>
{/snippet}

<div class="overlay" role="presentation" use:portal>
  <div
    class="stage"
    role="dialog"
    aria-modal="true"
    aria-label="Artifact materials"
    style="--table: url('{tablePath}'); --scene: url('{scenePath}'); --page: url('{pagePath}')"
  >
    <div class="scene">
      <section class="sheet components" aria-label="Components">
        <div class="sheet-body">
          <h3>
            {@render star()}
            Components
            {@render star()}
          </h3>
          {#if pieces.length === 0}
            <p class="muted">This pattern asks for nothing.</p>
          {:else}
            <ul class="pieces">
              {#each pieces as piece, pieceIndex (piece.name)}
                {@const count = piece.alternatives.length}
                {@const index = choiceIndex(pieceIndex, count)}
                {@const label = getPieceDisplayName(piece.name)}
                <li class="piece" use:wheelCycle={{ pieceIndex, count }}>
                  <span class="piece-art">
                    <PieceIcon name={piece.name} />
                  </span>
                  <div class="piece-copy">
                    <h4 class="piece-name">{label}</h4>
                    {#if count > 0}
                      <div class="pager">
                        <button
                          type="button"
                          aria-label={`Previous recipe for ${label}`}
                          disabled={leaving || count < 2}
                          onclick={() => cycle(pieceIndex, -1)}
                        >
                          ‹
                        </button>
                        <span class="pager-count">{index + 1} / {count}</span>
                        <button
                          type="button"
                          aria-label={`Next recipe for ${label}`}
                          disabled={leaving || count < 2}
                          onclick={() => cycle(pieceIndex, 1)}
                        >
                          ›
                        </button>
                      </div>
                      {@const at = stripAt[pieceIndex] ?? index}
                      {@const currentAlt = altAt(piece, at)}
                      <div class="chips-slide">
                        <div class="chips-sizer" aria-hidden="true">
                          {#if currentAlt && currentAlt.lines.length > 0}
                            <ul class="chips" class:single={currentAlt.lines.length === 1}>
                              {#each currentAlt.lines as line (line.key)}
                                <li class="chip">
                                  {@render glyph(line.key)}
                                  <span class="chip-label">{line.label}</span>
                                  <span class="chip-need">{line.need}</span>
                                </li>
                              {/each}
                            </ul>
                          {:else}
                            <p class="muted">No materials.</p>
                          {/if}
                        </div>
                        <div class="chips-track" style="transform: translateX({-at * 100}%)">
                          {#each [at - 1, at, at + 1] as slot (slot)}
                            {@const alt = altAt(piece, slot)}
                            <div class="chips-pane" style="left: {slot * 100}%">
                              {#if alt && alt.lines.length > 0}
                                <ul class="chips" class:single={alt.lines.length === 1}>
                                  {#each alt.lines as line (line.key)}
                                    <li class="chip" class:short={!line.enough}>
                                      {@render glyph(line.key)}
                                      <span class="chip-label">{line.label}</span>
                                      <span class="chip-need">{line.need}</span>
                                    </li>
                                  {/each}
                                </ul>
                              {:else}
                                <p class="muted">No materials.</p>
                              {/if}
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </section>

      <section class="sheet materials" aria-label="Your materials">
        <div class="sheet-body">
          <h3>
            {@render star()}
            Your materials
            {@render star()}
          </h3>
          <ul class="inventory">
            <li class="inv" class:empty={gold <= 0}>
              {@render glyph('gold')}
              <span class="inv-label">Gold</span>
              <span class="inv-count">{gold}</span>
            </li>
            {#each inventory as item (item.type)}
              <li class="inv" class:empty={item.amount <= 0}>
                {@render glyph(item.type)}
                <span class="inv-label">{item.label}</span>
                <span class="inv-count">{item.amount}</span>
              </li>
            {/each}
          </ul>
        </div>
      </section>

      <section class="dock" aria-label="Total materials">
        <div class="total-card">
          <div class="total-body">
            <h3>
              {@render star()}
              Total materials
              {@render star()}
            </h3>
            {#if totals.length === 0}
              <p class="muted center">This pattern asks for nothing.</p>
            {:else}
              <ul class="totals">
                {#each totals as line (line.key)}
                  {@const met = line.have >= line.need}
                  <li class="total" class:short={!met}>
                    {@render glyph(line.key)}
                    <span class="chip-label">{line.label}</span>
                    <span class="chip-need">{line.need}</span>
                    <span class="seal" class:met aria-hidden="true"></span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </section>
    </div>

    <footer class="actions">
      <OrnateButton variant="muted" onclick={onBack}>Back</OrnateButton>
      <div class="actions-center">
        <OrnateButton disabled={leaving || !affordable} onclick={onAssemble}>
          <span class="assemble-label">
            <span class="diamond" aria-hidden="true"></span>
            Assemble components
            <span class="diamond" aria-hidden="true"></span>
          </span>
        </OrnateButton>
      </div>
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
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.72);
  }

  .stage {
    --scene-ratio: calc(1672 / 941);
    width: min(1600px, calc(100vw - 16px), calc((100vh - 8.5rem) * var(--scene-ratio)));
    max-height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    padding: 0.45rem 0.55rem 0.9rem;
    box-sizing: border-box;
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  /* Workshop plate is 1672×941. Keep that ratio so the scene is never cropped or stretched. */
  .scene {
    position: relative;
    container-type: size;
    width: 100%;
    aspect-ratio: 1672 / 941;
    background: var(--scene) center / 100% 100% no-repeat;
  }

  .sheet {
    position: absolute;
    top: 3%;
    bottom: 3.5%;
    width: 23.2%;
    background: var(--page) center / 100% 100% no-repeat;
    filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.38));
  }

  .components {
    left: 1.7%;
  }

  .materials {
    right: 1.7%;
  }

  .sheet-body {
    height: 100%;
    box-sizing: border-box;
    overflow: auto;
    padding: calc(7% + 20px) 8% 6% 7%;
    scrollbar-color: rgba(90, 75, 60, 0.5) transparent;
  }

  h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55cqw;
    margin: 0 0 1.2cqw;
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-muted);
  }

  .star {
    width: 1.15cqw;
    height: 1.15cqw;
    flex-shrink: 0;
  }

  .pieces,
  .chips,
  .inventory,
  .totals {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .pieces {
    display: flex;
    flex-direction: column;
    gap: 1.1cqw;
  }

  .piece {
    display: grid;
    grid-template-columns: 7.2cqw minmax(0, 1fr);
    gap: 0.7cqw;
    align-items: center;
    padding-bottom: 1.1cqw;
    border-bottom: 1px solid rgba(90, 75, 60, 0.28);
  }

  .piece:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .piece-art {
    display: block;
    width: 7.2cqw;
    height: 7.2cqw;
  }

  .piece-name {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    color: var(--color-ink);
  }

  .pager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2cqw;
    margin: 0.1cqw 0 0.4cqw;
  }

  .pager button {
    width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    font-family: var(--font-narrative);
    font-size: 1.2rem;
    line-height: 1;
    color: var(--color-ink);
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .pager button:disabled {
    cursor: default;
    opacity: 0.35;
  }

  .pager-count {
    min-width: 2.8rem;
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    letter-spacing: 0.04em;
    text-align: center;
    color: var(--color-ink-muted);
  }

  .chips-slide {
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .chips-sizer {
    visibility: hidden;
    pointer-events: none;
  }

  .chips-track {
    position: absolute;
    inset: 0;
    transition: transform 240ms ease;
    will-change: transform;
  }

  .chips-pane {
    position: absolute;
    top: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.45cqw;
  }

  .chips.single {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
  }

  .chips.single .chip {
    width: 100%;
    max-width: 50%;
  }

  .chip,
  .total,
  .inv {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .chip {
    min-width: 0;
    padding: 0.3cqw 0.25cqw 0.35cqw;
    border: 1px solid rgba(90, 75, 60, 0.4);
    border-radius: 2px;
    background: rgba(255, 248, 235, 0.35);
  }

  .glyph {
    display: block;
    overflow: hidden;
    flex-shrink: 0;
  }

  .chip .glyph {
    width: 3.1cqw;
    height: 3.1cqw;
  }

  .inv .glyph,
  .total .glyph {
    width: 3.8cqw;
    height: 3.8cqw;
  }

  .glyph img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .chip-label,
  .inv-label {
    margin-top: 0.15rem;
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    line-height: 1.2;
    color: var(--color-ink);
  }

  .chip-need,
  .inv-count {
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
  }

  .chip.short .chip-need,
  .total.short .chip-need {
    color: var(--color-red);
  }

  .inventory {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5cqw 0.6cqw;
  }

  .inv.empty {
    opacity: 0.55;
  }

  .dock {
    position: absolute;
    left: 50%;
    bottom: 2.6%;
    z-index: 2;
    width: 38%;
    transform: translateX(-50%);
  }

  .total-card {
    background: var(--page) center / 100% 100% no-repeat;
    filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.35));
  }

  .total-body {
    padding: 1.15cqw 1.4cqw 1cqw;
    text-align: center;
  }

  .totals {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4cqw 1.3cqw;
  }

  .total {
    min-width: 4.8cqw;
  }

  .seal {
    display: grid;
    place-items: center;
    width: 1.35rem;
    height: 1.35rem;
    margin-top: 0.25rem;
    border: 1.5px solid var(--color-brown-border);
    border-radius: 50%;
    box-sizing: border-box;
  }

  .seal.met {
    position: relative;
    border-color: #3c6b48;
    background: #3c6b48;
  }

  .seal.met::after {
    content: '';
    width: 0.38rem;
    height: 0.68rem;
    margin-top: -0.1rem;
    border: solid #f4efe2;
    border-width: 0 2px 2px 0;
    box-sizing: border-box;
    transform: rotate(45deg);
  }

  .total.short .seal {
    border-color: var(--color-red);
  }

  .muted {
    margin: 0.5rem 0 0;
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    line-height: 1.4;
    color: var(--color-ink-muted);
  }

  .muted.center {
    text-align: center;
  }

  .actions {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    padding: 0.85rem 1.5% 0.35rem;
  }

  .actions-center {
    position: absolute;
    left: 50%;
    display: flex;
    justify-content: center;
    transform: translateX(-50%);
  }

  .actions-center :global(.ornate-button) {
    justify-content: center;
  }

  .actions-center :global(.ornate-button .content),
  .actions-center :global(.ornate-button .label) {
    justify-content: center;
  }

  .assemble-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    font-family: var(--font-narrative);
  }

  .diamond {
    width: 0.48cqw;
    height: 0.48cqw;
    flex-shrink: 0;
    background: var(--color-golden);
    transform: rotate(45deg);
  }
</style>
