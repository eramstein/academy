<script lang="ts">
  import { UnitType } from '@/lib/_model';
  import type { Snippet } from 'svelte';
  import { formatKeywordLabel } from '@/lib/sim/cards/keywords';
  import type { UnitDraft } from './model';
  import AbilityList from './AbilityList.svelte';
  import CardBasics from './CardBasics.svelte';
  import KeywordEditor from './KeywordEditor.svelte';

  let {
    unit,
    unitEditor,
    showBasics = false,
  }: {
    unit: UnitDraft;
    unitEditor: Snippet<[UnitDraft]>;
    showBasics?: boolean;
  } = $props();

  const unitTypes = Object.values(UnitType);

  function toggleUnitType(unitType: UnitType) {
    const index = unit.unitTypes.indexOf(unitType);
    if (index === -1) unit.unitTypes.push(unitType);
    else unit.unitTypes.splice(index, 1);
  }
</script>

{#if showBasics}
  <CardBasics card={unit} />
{/if}

<section class="cb-section">
  <div class="cb-stats">
    <label class="cb-stat">
      <span class="cb-stat-label">P</span>
      <input class="cb-input cb-stat-input" type="number" min="0" max="10" bind:value={unit.power} />
    </label>
    <label class="cb-stat">
      <span class="cb-stat-label">R</span>
      <input
        class="cb-input cb-stat-input"
        type="number"
        min="0"
        max="10"
        bind:value={unit.retaliate}
      />
    </label>
    <label class="cb-stat">
      <span class="cb-stat-label">H</span>
      <input
        class="cb-input cb-stat-input"
        type="number"
        min="0"
        max="10"
        bind:value={unit.maxHealth}
      />
    </label>
  </div>
  <KeywordEditor keywords={unit.keywords} />
  <hr class="cb-divider" />
  <div class="cb-checks">
    {#each unitTypes as unitType (unitType)}
      <label class="cb-check">
        <input
          type="checkbox"
          checked={unit.unitTypes.includes(unitType)}
          onchange={() => toggleUnitType(unitType)}
        />
        {formatKeywordLabel(unitType)}
      </label>
    {/each}
  </div>
</section>

<section class="cb-section">
  <AbilityList abilities={unit.abilities} title="Abilities" {unitEditor} />
</section>
