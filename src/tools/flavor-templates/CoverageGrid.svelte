<script lang="ts">
  import {
    coverageCellIsActive,
    POWER_LEVELS,
    type CoverageFacet,
    type CoverageSection,
    type FlavorQuery,
    type PowerLevel,
  } from './query';

  let {
    sections,
    query,
    onSelect,
  }: {
    sections: CoverageSection[];
    query: FlavorQuery;
    onSelect: (
      cardType: string,
      size: PowerLevel,
      facet: CoverageFacet | null,
      key: string | null
    ) => void;
  } = $props();

  function formatScore(score: number): string {
    return score > 0 ? `+${score}` : `${score}`;
  }
</script>

<div class="sections">
  {#each sections as section (section.id)}
    <section class="section">
      <h3>{section.title}</h3>
      <table class="grid">
        <thead>
          <tr>
            <th class="trait" scope="col">Trait</th>
            <th
              class="pref"
              scope="col"
              title="Color-pie preference. Higher scores should be covered first."
            >
              Pref
            </th>
            {#each POWER_LEVELS as size (size)}
              <th class="num" scope="col">{size}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          <tr class="any">
            <th scope="row">All</th>
            <td></td>
            {#each section.anyCells as cell (cell.size)}
              <td>
                <button
                  type="button"
                  class:gap={cell.count === 0}
                  class:active={coverageCellIsActive(
                    query,
                    section.cardType,
                    cell.size,
                    section.facet,
                    null
                  )}
                  title="{cell.count} {section.cardType} {cell.size}"
                  onclick={() => onSelect(section.cardType, cell.size, null, null)}
                >
                  {cell.count}
                </button>
              </td>
            {/each}
          </tr>
          {#each section.rows as row (row.key)}
            <tr class={row.tier}>
              <th scope="row">{row.label}</th>
              <td class="pref" title={row.hint}>{formatScore(row.score)}</td>
              {#each row.cells as cell (cell.size)}
                <td>
                  <button
                    type="button"
                    class:gap={cell.count === 0}
                    class:active={coverageCellIsActive(
                      query,
                      section.cardType,
                      cell.size,
                      section.facet,
                      row.key
                    )}
                    title="{cell.count} {section.cardType} {cell.size} {row.label}"
                    onclick={() => onSelect(section.cardType, cell.size, section.facet, row.key)}
                  >
                    {cell.count}
                  </button>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      {#if section.rows.length === 0}
        <p class="none">No preferred traits in this group. Show rare traits to see the rest.</p>
      {/if}
    </section>
  {/each}
</div>

<style>
  .sections {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section h3 {
    margin: 0 0 0.4rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-brass);
  }

  .grid {
    width: max-content;
    max-width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  th,
  td {
    padding: 0.15rem 0.2rem;
    text-align: right;
    vertical-align: middle;
  }

  th.trait,
  th[scope='row'] {
    text-align: left;
    font-weight: 500;
    color: var(--color-cream);
    padding-right: 1.25rem;
  }

  thead th {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: lowercase;
    color: var(--color-muted-label);
    padding-bottom: 0.35rem;
  }

  .pref {
    width: 2.6rem;
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .num,
  td {
    width: 4.2rem;
  }

  .any th,
  .any td {
    border-bottom: 1px solid rgba(175, 142, 103, 0.35);
    padding-bottom: 0.35rem;
  }

  tr.rare th {
    color: var(--color-muted-label);
    font-style: italic;
  }

  button {
    min-width: 2.4rem;
    padding: 0.2rem 0.35rem;
    border-radius: 4px;
    border: 1px solid rgba(175, 142, 103, 0.35);
    background: transparent;
    color: var(--color-cream);
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
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
    color: var(--color-muted-label);
    border-style: dashed;
  }

  button.active {
    background: var(--color-golden);
    border: 1px solid var(--color-golden);
    color: var(--color-ink);
    font-weight: 700;
  }

  .none {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    color: var(--color-muted-label);
  }
</style>
