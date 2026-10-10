<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import colorIdentity from '@/data/color-pie.json';
  import { assembleCardImagePrompt, generateImage, initImageGen } from '@/lib/image_gen';
  import {
    persistCardImage,
    persistFlavorCheapImage,
  } from '@/lib/sim/cards/flavor-generation-pipeline/persist';
  import { formatKeywordLabel } from '@/lib/sim/cards/keywords';
  import CoverageGrid from './CoverageGrid.svelte';
  import TraitCoverageMatrix from './TraitCoverageMatrix.svelte';
  import {
    actionOptions,
    CARD_TYPES,
    coverageSections,
    createEmptyQuery,
    filterFlavorTemplates,
    flavorCatalog,
    FLAVOR_COLORS,
    isQueryEmpty,
    keywordOptions,
    normalizeFlavorTemplates,
    POWER_LEVELS,
    queryLabel,
    summarizeByColor,
    traitCoverageMatrix,
    traitLabel,
    unitTypeOptions,
    type CoverageFacet,
    type FlavorQuery,
    type FlavorRecord,
    type MissingCardImage,
    type PowerLevel,
  } from './query';
  import type { CardColor } from '@/lib/_model';

  let records = $state<FlavorRecord[]>(flavorCatalog);
  let query = $state<FlavorQuery>(createEmptyQuery());
  let includeRare = $state(false);
  let showMissingImages = $state(false);
  let missingImages = $state<MissingCardImage[] | null>(null);
  let missingImagesError = $state('');
  let missingImagesLoading = $state(false);
  let generatingImageName = $state<string | null>(null);
  let generateErrors = $state<Record<string, string>>({});
  /** Object URLs for images generated this session (keyed by imageName). */
  let generatedPreviews = $state<Record<string, string>>({});

  const stillMissingCount = $derived(
    (missingImages ?? []).filter((row) => !generatedPreviews[row.imageName]).length
  );

  const summary = $derived(summarizeByColor(records));
  const matches = $derived(filterFlavorTemplates(records, query));
  const sections = $derived(
    coverageSections(records, query.colors, query.cardType, includeRare, query)
  );
  const unitKeywordMatrix = $derived(traitCoverageMatrix(records, 'keyword', 'unit'));
  const unitActionMatrix = $derived(traitCoverageMatrix(records, 'action', 'unit'));
  const spellActionMatrix = $derived(traitCoverageMatrix(records, 'action', 'spell'));
  const keywords = $derived(keywordOptions(records));
  const unitTypes = $derived(unitTypeOptions(records));
  const actions = $derived(actionOptions(records));
  const identity = $derived(
    query.colors.length === 1 ? colorIdentity[query.colors[0]].description : ''
  );

  onMount(async () => {
    try {
      const response = await fetch('/api/flavor-templates', { cache: 'no-store' });
      if (response.ok) {
        records = normalizeFlavorTemplates(await response.json());
      }
    } catch {
      // Keep the bundled catalog.
    }
  });

  onDestroy(() => {
    for (const url of Object.values(generatedPreviews)) {
      URL.revokeObjectURL(url);
    }
  });

  function setPreview(imageName: string, blob: Blob) {
    const previous = generatedPreviews[imageName];
    if (previous) URL.revokeObjectURL(previous);
    generatedPreviews = { ...generatedPreviews, [imageName]: URL.createObjectURL(blob) };
  }

  function clearPreviews() {
    for (const url of Object.values(generatedPreviews)) {
      URL.revokeObjectURL(url);
    }
    generatedPreviews = {};
  }

  function toggleColor(color: CardColor) {
    const colors = query.colors.includes(color)
      ? query.colors.filter((item) => item !== color)
      : [...query.colors, color];
    query = { ...query, colors };
  }

  function toggleValue(kind: 'keywords' | 'unitTypes' | 'actions', key: string) {
    const current = query[kind];
    const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    query = { ...query, [kind]: next };
  }

  function setCardType(cardType: string | null) {
    query = { ...query, cardType: query.cardType === cardType ? null : cardType };
  }

  function setSize(unitSize: PowerLevel | null) {
    query = { ...query, unitSize: query.unitSize === unitSize ? null : unitSize };
  }

  function selectSummary(color: CardColor, cardType: string) {
    const same =
      query.colors.length === 1 && query.colors[0] === color && query.cardType === cardType;
    query = {
      ...query,
      colors: [color],
      cardType: same ? null : cardType,
    };
  }

  function selectCell(
    cardType: string,
    unitSize: PowerLevel,
    facet: CoverageFacet | null,
    key: string | null
  ) {
    query = {
      colors: query.colors,
      cardType,
      unitSize,
      keywords: facet === 'keyword' && key ? [key] : [],
      unitTypes: facet === 'unitType' && key ? [key] : [],
      actions: facet === 'action' && key ? [key] : [],
      text: '',
    };
  }

  function selectColorTrait(
    color: CardColor,
    cardType: 'unit' | 'spell',
    facet: 'keyword' | 'action',
    key: string
  ) {
    query = {
      colors: [color],
      cardType,
      unitSize: null,
      keywords: facet === 'keyword' ? [key] : [],
      unitTypes: [],
      actions: facet === 'action' ? [key] : [],
      text: '',
    };
  }

  function traitSummary(template: FlavorRecord): string {
    const parts = [
      ...template.keywords.map((key) => traitLabel('keyword', key)),
      ...template.unitTypes.map((key) => traitLabel('unitType', key)),
      ...template.actions.map((key) => traitLabel('action', key)),
    ];
    return parts.join(' · ');
  }

  function colorSummary(template: FlavorRecord): string {
    const rank = new Map(FLAVOR_COLORS.map((color, index) => [color, index]));
    return [...template.colors]
      .sort(
        (a, b) =>
          (rank.get(a as CardColor) ?? 9) - (rank.get(b as CardColor) ?? 9) || a.localeCompare(b)
      )
      .map((color) => formatKeywordLabel(color))
      .join(', ');
  }

  async function loadMissingImages() {
    missingImagesLoading = true;
    missingImagesError = '';
    clearPreviews();
    generateErrors = {};
    try {
      const response = await fetch('/api/missing-card-images', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { missing?: MissingCardImage[] };
      missingImages = Array.isArray(payload.missing) ? payload.missing : [];
    } catch {
      missingImagesError = 'Could not scan card images. Is the Vite dev server running?';
      missingImages = null;
    } finally {
      missingImagesLoading = false;
    }
  }

  async function toggleMissingImages() {
    showMissingImages = !showMissingImages;
    if (showMissingImages && missingImages === null && !missingImagesLoading) {
      await loadMissingImages();
    }
  }

  async function generateMissingImage(row: MissingCardImage) {
    if (generatingImageName) return;
    generatingImageName = row.imageName;
    const cleared = { ...generateErrors };
    delete cleared[row.imageName];
    generateErrors = cleared;

    try {
      if (!(await initImageGen())) {
        throw new Error('ComfyUI is not reachable. Start Comfy and try again.');
      }
      const { blob } = await generateImage(
        assembleCardImagePrompt(row.imagePrompt, { colors: row.colors }),
        {
          filenamePrefix: `academy_card_${row.imageName}`,
        }
      );
      await persistCardImage(row.imageName, blob);
      await persistFlavorCheapImage(row.imageName, true);
      setPreview(row.imageName, blob);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image generation failed';
      generateErrors = { ...generateErrors, [row.imageName]: message };
    } finally {
      generatingImageName = null;
    }
  }
</script>

<div class="browser">
  <header class="toolbar">
    <div class="title-row">
      <div>
        <h1>Flavor templates</h1>
        <p class="query" aria-live="polite">{queryLabel(query)}</p>
      </div>
      <div class="title-actions">
        <button
          type="button"
          class="chip"
          class:active={showMissingImages}
          aria-pressed={showMissingImages}
          onclick={() => toggleMissingImages()}
        >
          Missing images{missingImages ? ` · ${stillMissingCount}` : ''}
        </button>
        <p class="count" aria-live="polite">
          <span class="count-num">{matches.length}</span>
          <span class="count-of">of {records.length}</span>
        </p>
      </div>
    </div>

    <div class="filter-row">
      <div class="chips" role="group" aria-label="Colors">
        {#each FLAVOR_COLORS as color (color)}
          <button
            type="button"
            class="chip color-{color}"
            class:active={query.colors.includes(color)}
            aria-pressed={query.colors.includes(color)}
            title={colorIdentity[color].description}
            onclick={() => toggleColor(color)}
          >
            {formatKeywordLabel(color)}
          </button>
        {/each}
      </div>
      <div class="chips" role="group" aria-label="Card type">
        {#each CARD_TYPES as cardType (cardType)}
          <button
            type="button"
            class="chip"
            class:active={query.cardType === cardType}
            aria-pressed={query.cardType === cardType}
            onclick={() => setCardType(cardType)}
          >
            {formatKeywordLabel(cardType)}
          </button>
        {/each}
      </div>
      <div class="chips" role="group" aria-label="Size">
        {#each POWER_LEVELS as size (size)}
          <button
            type="button"
            class="chip"
            class:active={query.unitSize === size}
            aria-pressed={query.unitSize === size}
            onclick={() => setSize(size)}
          >
            {formatKeywordLabel(size)}
          </button>
        {/each}
      </div>
      <button
        type="button"
        class="chip clear"
        onclick={() => (query = createEmptyQuery())}
        disabled={isQueryEmpty(query)}
      >
        Clear
      </button>
    </div>

    {#if query.keywords.length || query.unitTypes.length || query.actions.length}
      <div class="tags" aria-label="Selected traits">
        {#each query.keywords as key (key)}
          <button type="button" class="tag" onclick={() => toggleValue('keywords', key)}>
            {traitLabel('keyword', key)} ×
          </button>
        {/each}
        {#each query.unitTypes as key (key)}
          <button type="button" class="tag" onclick={() => toggleValue('unitTypes', key)}>
            {traitLabel('unitType', key)} ×
          </button>
        {/each}
        {#each query.actions as key (key)}
          <button type="button" class="tag" onclick={() => toggleValue('actions', key)}>
            {traitLabel('action', key)} ×
          </button>
        {/each}
      </div>
    {/if}

    <div class="facets">
      <details>
        <summary>Keywords{query.keywords.length ? ` · ${query.keywords.length}` : ''}</summary>
        <div class="chips">
          {#each keywords as key (key)}
            <button
              type="button"
              class="chip"
              class:active={query.keywords.includes(key)}
              aria-pressed={query.keywords.includes(key)}
              onclick={() => toggleValue('keywords', key)}
            >
              {traitLabel('keyword', key)}
            </button>
          {/each}
        </div>
      </details>
      <details>
        <summary>Unit types{query.unitTypes.length ? ` · ${query.unitTypes.length}` : ''}</summary>
        <div class="chips">
          {#each unitTypes as key (key)}
            <button
              type="button"
              class="chip"
              class:active={query.unitTypes.includes(key)}
              aria-pressed={query.unitTypes.includes(key)}
              onclick={() => toggleValue('unitTypes', key)}
            >
              {traitLabel('unitType', key)}
            </button>
          {/each}
        </div>
      </details>
      <details>
        <summary>Actions{query.actions.length ? ` · ${query.actions.length}` : ''}</summary>
        <div class="chips">
          {#each actions as key (key)}
            <button
              type="button"
              class="chip"
              class:active={query.actions.includes(key)}
              aria-pressed={query.actions.includes(key)}
              onclick={() => toggleValue('actions', key)}
            >
              {traitLabel('action', key)}
            </button>
          {/each}
        </div>
      </details>
      <label class="search">
        <span class="sr">Search names</span>
        <input
          type="search"
          placeholder="Search name or prompt"
          value={query.text}
          oninput={(event) => (query = { ...query, text: event.currentTarget.value })}
        />
      </label>
    </div>
  </header>

  <div class="body">
    {#if showMissingImages}
      <div class="pane missing-pane">
        <div class="coverage-head">
          <h2>Missing card images</h2>
          <button
            type="button"
            class="chip"
            disabled={missingImagesLoading}
            onclick={() => loadMissingImages()}
          >
            {missingImagesLoading ? 'Scanning…' : 'Refresh'}
          </button>
        </div>
        <p class="hint">
          Templates whose <code>imageName</code> has no
          <code>.jpg</code>/<code>.png</code>/<code>.webp</code> under
          <code>public/assets/images/cards</code>. Generate uses Comfy
          (<code>flux2-klein-text-to-image</code>) with the shared card art prompt and saves
          <code>imageName.jpg</code>.
        </p>
        {#if missingImagesError}
          <p class="empty">{missingImagesError}</p>
        {:else if missingImagesLoading && missingImages === null}
          <p class="empty">Scanning disk…</p>
        {:else if missingImages && missingImages.length === 0}
          <p class="empty">All templates have a card image on disk.</p>
        {:else if missingImages}
          <p class="hint">
            {stillMissingCount} missing{#if stillMissingCount !== missingImages.length}
              · {missingImages.length - stillMissingCount} generated this session{/if}
          </p>
          <ul class="list missing-list">
            {#each missingImages as row (row.imageName)}
              {@const previewUrl = generatedPreviews[row.imageName]}
              <li class:generated={!!previewUrl}>
                <div class="missing-row">
                  {#if previewUrl || generatingImageName === row.imageName}
                    <div class="thumb-slot">
                      {#if previewUrl}
                        <img class="thumb" src={previewUrl} alt="{row.name} preview" />
                      {:else}
                        <span class="thumb-placeholder">…</span>
                      {/if}
                    </div>
                  {/if}
                  <div class="missing-body">
                    <div class="item-top">
                      <div class="item-labels">
                        <span class="name" title={row.name}>{row.fileName}</span>
                        <span class="meta">{row.name}</span>
                      </div>
                      <button
                        type="button"
                        class="chip generate-btn"
                        disabled={generatingImageName !== null}
                        onclick={() => generateMissingImage(row)}
                      >
                        {#if generatingImageName === row.imageName}
                          Generating…
                        {:else if previewUrl}
                          Regenerate
                        {:else}
                          Generate
                        {/if}
                      </button>
                    </div>
                    <p class="prompt">{row.imagePrompt}</p>
                    {#if generateErrors[row.imageName]}
                      <p class="generate-error">{generateErrors[row.imageName]}</p>
                    {/if}
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
    <div class="pane coverage">
      <h2>Catalog</h2>
      <p class="hint">
        A template with several colors is counted in each. Select a color to open its coverage.
      </p>
      <table class="summary">
        <thead>
          <tr>
            <th scope="col">Color</th>
            {#each CARD_TYPES as cardType (cardType)}
              <th scope="col">{cardType}</th>
            {/each}
            <th scope="col">All</th>
          </tr>
        </thead>
        <tbody>
          {#each summary as row (row.color)}
            <tr>
              <th scope="row">
                <button
                  type="button"
                  class="summary-btn color-{row.color}"
                  class:active={query.colors.includes(row.color)}
                  onclick={() => toggleColor(row.color)}
                >
                  {formatKeywordLabel(row.color)}
                </button>
              </th>
              {#each CARD_TYPES as cardType (cardType)}
                <td>
                  <button
                    type="button"
                    class="summary-btn"
                    class:active={query.colors.length === 1 &&
                      query.colors[0] === row.color &&
                      query.cardType === cardType}
                    onclick={() => selectSummary(row.color, cardType)}
                  >
                    {row.counts[cardType] ?? 0}
                  </button>
                </td>
              {/each}
              <td class="total">{row.total}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="coverage-head">
        <h2>
          {#if query.colors.length === 0}
            Keywords & actions by color
          {:else}
            {query.colors.map((color) => formatKeywordLabel(color)).join(' + ')}
          {/if}
        </h2>
        <button
          type="button"
          class="chip"
          class:active={includeRare}
          aria-pressed={includeRare}
          onclick={() => (includeRare = !includeRare)}
        >
          Show rare traits
        </button>
      </div>

      {#if query.colors.length === 0}
        <p class="hint">
          Each cell is the template count and color-pie preference for that color, card type, and
          trait. Click a cell to filter the list. Select a color for the size breakdown.
        </p>
        <TraitCoverageMatrix
          title="Unit keywords"
          rows={unitKeywordMatrix}
          {includeRare}
          onSelect={(color, key) => selectColorTrait(color, 'unit', 'keyword', key)}
        />
        <TraitCoverageMatrix
          title="Unit actions"
          rows={unitActionMatrix}
          {includeRare}
          onSelect={(color, key) => selectColorTrait(color, 'unit', 'action', key)}
        />
        <TraitCoverageMatrix
          title="Spell actions"
          rows={spellActionMatrix}
          {includeRare}
          onSelect={(color, key) => selectColorTrait(color, 'spell', 'action', key)}
        />
      {:else}
        {#if identity}
          <p class="identity">{identity}</p>
        {/if}
        <p class="hint">
          Each number counts templates that include the selected colors and that one trait. The
          count above applies every filter together. Preferred scores come first. Dashed zeros are
          gaps.
        </p>
        <CoverageGrid {sections} {query} onSelect={selectCell} />
      {/if}
    </div>

    <div class="pane list-pane">
      {#if matches.length === 0}
        <p class="empty">No templates match this combination.</p>
      {:else}
        <ul class="list">
          {#each matches as template, index (`${template.imageName}:${index}`)}
            <li>
              <div class="item-top">
                <span class="name" title="{template.imagePrompt} ({template.imageName})">
                  {template.name}
                  {#if template.cheapImage}
                    <span class="cheap">cheap</span>
                  {/if}
                </span>
                <span class="meta">
                  {template.cardType} · {template.unitSize} · {colorSummary(template)}
                </span>
              </div>
              {#if traitSummary(template)}
                <p class="traits">{traitSummary(template)}</p>
              {/if}
              {#if template.imagePrompt !== template.name}
                <p class="prompt">{template.imagePrompt}</p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {/if}
  </div>
</div>

<style>
  .browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--color-navy);
    color: var(--color-cream);
    font-family: var(--font-narrative);
    user-select: text;
  }

  .toolbar {
    flex: none;
    padding: 1rem 1.25rem 0.85rem;
    border-bottom: 1px solid rgba(175, 142, 103, 0.35);
    background: var(--color-navy);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .title-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }

  .title-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: none;
  }

  .missing-pane {
    flex: 1;
    min-width: 0;
  }

  .missing-list .name {
    font-family: ui-monospace, monospace;
    font-size: 0.95rem;
  }

  .missing-list .missing-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .missing-list .thumb-slot {
    flex: none;
    width: 72px;
    height: 72px;
    border-radius: 4px;
    border: 1px solid rgba(175, 142, 103, 0.35);
    background: rgba(0, 0, 0, 0.25);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .missing-list .thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .missing-list .thumb-placeholder {
    color: var(--color-muted-label);
    font-size: 1.1rem;
  }

  .missing-list .missing-body {
    flex: 1;
    min-width: 0;
  }

  .missing-list .item-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: baseline;
    min-width: 0;
  }

  .missing-list .generate-btn {
    flex: none;
  }

  .missing-list .item-top {
    align-items: center;
  }

  .missing-list li.generated {
    border-color: rgba(175, 142, 103, 0.55);
  }

  .missing-pane .generate-error {
    margin: 0.35rem 0 0;
    color: #e8a0a0;
    font-size: 0.85rem;
  }

  .missing-pane code {
    font-size: 0.9em;
    color: var(--color-brass);
  }

  h1,
  h2 {
    margin: 0;
    font-weight: 600;
    color: var(--color-cream);
  }

  h1 {
    font-size: 1.35rem;
  }

  h2 {
    font-size: 1.05rem;
  }

  .query {
    margin: 0.2rem 0 0;
    color: var(--color-muted-label);
    font-size: 0.9rem;
  }

  .count {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  .count-num {
    font-size: 1.8rem;
    line-height: 1;
    color: var(--color-brass);
  }

  .count-of {
    color: var(--color-muted-label);
    font-size: 0.85rem;
  }

  .filter-row,
  .chips,
  .tags,
  .facets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }

  .facets {
    align-items: flex-start;
  }

  .chip,
  .tag,
  .summary-btn {
    padding: 0.3rem 0.65rem;
    border-radius: 4px;
    border: 1px solid rgba(175, 142, 103, 0.35);
    background: transparent;
    color: var(--color-muted-label);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .chip:hover,
  .tag:hover,
  .summary-btn:hover {
    border-color: rgba(175, 142, 103, 0.7);
    color: var(--color-cream);
  }

  .chip:focus-visible,
  .tag:focus-visible,
  .summary-btn:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }

  .chip.active,
  .summary-btn.active {
    background: rgba(175, 142, 103, 0.2);
    border-color: var(--color-brass);
    color: var(--color-cream);
  }

  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .color-red.active {
    box-shadow: inset 3px 0 var(--color-red);
  }
  .color-green.active {
    box-shadow: inset 3px 0 var(--color-green);
  }
  .color-blue.active {
    box-shadow: inset 3px 0 var(--color-blue);
  }
  .color-black.active {
    box-shadow: inset 3px 0 var(--color-black);
  }

  .tag {
    color: var(--color-cream);
    border-color: var(--color-brass);
  }

  details {
    min-width: 8rem;
  }

  summary {
    cursor: pointer;
    color: var(--color-muted-label);
    font-size: 0.85rem;
    margin-bottom: 0.35rem;
  }

  details .chips {
    max-height: 8.5rem;
    overflow: auto;
    max-width: 36rem;
  }

  .search input {
    padding: 0.35rem 0.6rem;
    border-radius: 4px;
    border: 1px solid rgba(175, 142, 103, 0.35);
    background: var(--color-data);
    color: var(--color-cream);
    font: inherit;
    font-size: 0.9rem;
    min-width: 14rem;
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(320px, 42%) minmax(0, 1fr);
  }

  .pane {
    min-height: 0;
    overflow: auto;
    padding: 1rem 1.25rem 2rem;
  }

  .coverage {
    border-right: 1px solid rgba(175, 142, 103, 0.25);
  }

  .hint,
  .identity,
  .empty {
    margin: 0.4rem 0 0.8rem;
    color: var(--color-muted-label);
    font-size: 0.85rem;
    line-height: 1.45;
  }

  .identity {
    color: var(--color-cream);
    font-size: 0.95rem;
  }

  .coverage-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .summary {
    width: max-content;
    max-width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .summary th,
  .summary td {
    padding: 0.2rem;
    text-align: right;
  }

  .summary th[scope='row'],
  .summary thead th:first-child {
    text-align: left;
  }

  .summary thead th {
    font-weight: 500;
    color: var(--color-muted-label);
    font-size: 0.75rem;
  }

  .summary .total {
    color: var(--color-brass);
    font-variant-numeric: tabular-nums;
    padding-right: 0.45rem;
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  li {
    padding: 0.7rem 0.85rem;
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.25);
    border-radius: 4px;
  }

  .item-top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: baseline;
  }

  .name {
    font-weight: 600;
    color: var(--color-brass);
  }

  .cheap {
    margin-left: 0.4rem;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .meta,
  .traits,
  .prompt {
    margin: 0;
    font-size: 0.82rem;
    color: var(--color-muted-label);
  }

  .traits {
    margin-top: 0.25rem;
    color: var(--color-cream);
  }

  .prompt {
    margin-top: 0.2rem;
  }

  @media (max-width: 900px) {
    .browser {
      display: block;
      overflow: auto;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .body {
      display: block;
    }

    .pane {
      overflow: visible;
    }

    .coverage {
      border-right: 0;
      border-bottom: 1px solid rgba(175, 142, 103, 0.25);
    }
  }
</style>
