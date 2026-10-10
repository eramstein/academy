<script lang="ts">
  import { formatKeywordLabel } from '@/lib/sim/cards/keywords';
  import { FLAVOR_COLORS, type TraitMatrixRow } from './query';
  import type { CardColor } from '@/lib/_model';

  let {
    title,
    rows,
    includeRare = false,
    onSelect,
  }: {
    title: string;
    rows: TraitMatrixRow[];
    includeRare?: boolean;
    onSelect: (color: CardColor, key: string) => void;
  } = $props();

  const visible = $derived(
    includeRare ? rows : rows.filter((row) => row.cells.some((cell) => cell.tier !== 'rare'))
  );

  function formatPref(score: number): string {
    return score > 0 ? `+${score}` : `${score}`;
  }
</script>

<section class="matrix">
  <h3>{title}</h3>
  <table>
    <thead>
      <tr>
        <th class="trait" scope="col">Trait</th>
        {#each FLAVOR_COLORS as color (color)}
          <th scope="col">{formatKeywordLabel(color)}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each visible as row (row.key)}
        <tr>
          <th scope="row">{row.label}</th>
          {#each row.cells as cell (cell.color)}
            <td>
              <button
                type="button"
                class={cell.tier}
                class:gap={cell.count === 0}
                title="{formatKeywordLabel(
                  cell.color
                )} {row.label}: {cell.count} templates, preference {formatPref(cell.preference)}"
                onclick={() => onSelect(cell.color, row.key)}
              >
                <span class="count">{cell.count}</span>
                <span class="pref">{formatPref(cell.preference)}</span>
              </button>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {#if visible.length === 0}
    <p class="none">No preferred or neutral traits. Show rare traits to see the rest.</p>
  {/if}
</section>

<style>
  .matrix {
    margin-top: 1rem;
  }

  h3 {
    margin: 0 0 0.4rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-brass);
  }

  table {
    width: max-content;
    max-width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  th,
  td {
    padding: 0.2rem 0.25rem;
    text-align: center;
    vertical-align: middle;
  }

  th.trait,
  th[scope='row'] {
    text-align: left;
    font-weight: 500;
    color: var(--color-cream);
    padding-right: 1rem;
  }

  thead th {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-muted-label);
    padding-bottom: 0.35rem;
  }

  button {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.05rem;
    min-width: 3.2rem;
    padding: 0.25rem 0.35rem;
    border-radius: 4px;
    border: 1px solid rgba(175, 142, 103, 0.35);
    background: transparent;
    color: var(--color-cream);
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    line-height: 1.15;
  }

  button:hover {
    border-color: var(--color-brass);
    background: rgba(175, 142, 103, 0.15);
  }

  button:focus-visible {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }

  button.gap {
    border-style: dashed;
    color: var(--color-muted-label);
  }

  button.rare {
    opacity: 0.75;
  }

  .count {
    font-weight: 600;
  }

  .pref {
    font-size: 0.7rem;
    color: var(--color-muted-label);
  }

  button.preferred .pref {
    color: var(--color-brass);
  }

  .none {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    color: var(--color-muted-label);
  }
</style>
