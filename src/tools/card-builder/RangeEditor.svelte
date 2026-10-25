<script lang="ts">
  import { UnitType } from '@/lib/_model';
  import { formatKeywordLabel, KEYWORD_KEYS } from '@/lib/sim/cards/keywords';
  import { RANGE_FLAGS, type RangeDraft } from './model';

  let { range }: { range: RangeDraft } = $props();

  const unitTypes = Object.values(UnitType);
</script>

<div class="cb-nested">
  <p class="cb-hint">
    Which units this reaches. The battle fills in the source when the effect resolves. An empty
    range is left out of the JSON.
  </p>
  <div class="cb-checks">
    {#each RANGE_FLAGS as flag (flag.key)}
      <label class="cb-check">
        <input type="checkbox" bind:checked={range[flag.key]} />
        {flag.label}
      </label>
    {/each}
  </div>
  <div class="cb-grid">
    <label class="cb-field">
      <span class="cb-label">Unit type</span>
      <select class="cb-input" bind:value={range.unitType}>
        <option value="">Any</option>
        {#each unitTypes as unitType (unitType)}
          <option value={unitType}>{formatKeywordLabel(unitType)}</option>
        {/each}
      </select>
    </label>
    <label class="cb-field">
      <span class="cb-label">Has keyword</span>
      <select class="cb-input" bind:value={range.hasKeyword}>
        <option value="">Any</option>
        {#each KEYWORD_KEYS as keyword (keyword)}
          <option value={keyword}>{formatKeywordLabel(keyword)}</option>
        {/each}
      </select>
    </label>
  </div>
</div>
