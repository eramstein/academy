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
                {@const alternative = piece.alternatives[index]}
                {@const label = getPieceDisplayName(piece.name)}
                <li class="piece">
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
                          onclick={() => onCycle(pieceIndex, -1)}
                        >
                          ‹
                        </button>
                        <span class="pager-count">{index + 1} / {count}</span>
                        <button
                          type="button"
                          aria-label={`Next recipe for ${label}`}
                          disabled={leaving || count < 2}
                          onclick={() => onCycle(pieceIndex, 1)}
                        >
                          ›
                        </button>
                      </div>
                      {#if alternative && alternative.lines.length > 0}
                        <ul class="chips">
                          {#each alternative.lines as line (line.key)}
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
            {#if pieces.length > 0 && !affordable}
              <p class="short-note">Your stores are short for this recipe.</p>
            {/if}
          </div>
        </div>
      </section>
    </div>

    <footer class="actions">
      <OrnateButton variant="muted" onclick={onBack}>Back</OrnateButton>
      <div class="actions-center">
        <OrnateButton disabled={leaving} onclick={onAssemble}>
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
    font-size: 1.15cqw;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
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
    font-size: 1.45cqw;
    font-weight: 600;
    line-height: 1.15;
    text-align: left;
    color: var(--color-ink);
  }

  .pager {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.2cqw;
    margin: 0.1cqw 0 0.4cqw;
  }

  .pager button {
    width: 1.7cqw;
    height: 1.7cqw;
    padding: 0;
    font-family: var(--font-narrative);
    font-size: 1.45cqw;
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
    min-width: 3cqw;
    font-size: 1.05cqw;
    letter-spacing: 0.04em;
    text-align: center;
    color: var(--color-ink-muted);
  }

  .chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.45cqw;
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
    margin-top: 0.2cqw;
    font-size: 1.05cqw;
    line-height: 1.15;
    color: var(--color-ink);
  }

  .chip-need,
  .inv-count {
    font-size: 1.2cqw;
    line-height: 1.15;
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
    width: 1.05cqw;
    height: 1.05cqw;
    margin-top: 0.2cqw;
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
    position: absolute;
    left: 28%;
    top: 14%;
    width: 22%;
    height: 42%;
    border: solid #f4efe2;
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
  }

  .total.short .seal {
    border-color: var(--color-red);
  }

  .muted {
    margin: 0.6cqw 0 0;
    font-size: 0.9cqw;
    line-height: 1.35;
    color: var(--color-ink-muted);
  }

  .muted.center,
  .short-note {
    text-align: center;
  }

  .short-note {
    margin: 0.45cqw 0 0;
    font-size: 0.85cqw;
    color: var(--color-red);
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
    gap: 0.8cqw;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .diamond {
    width: 0.48cqw;
    height: 0.48cqw;
    flex-shrink: 0;
    background: var(--color-golden);
    transform: rotate(45deg);
  }
</style>
