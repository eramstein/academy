<script lang="ts">
  import type { UnitDraft } from './model';
  import ColorPips from './ColorPips.svelte';

  let { card }: { card: UnitDraft } = $props();
</script>

<div class="cb-basics">
  <div class="cb-basics-row">
    <label class="cb-field-inline cb-name-field">
      <span class="cb-label">Name</span>
      <input class="cb-input" bind:value={card.name} autocomplete="off" />
    </label>
    <label class="cb-field-inline cb-cost-field">
      <span class="cb-label">Cost</span>
      <input class="cb-input" type="number" bind:value={card.cost} />
    </label>
  </div>
  <div class="cb-basics-row cb-basics-meta">
    <ColorPips colors={card.colors} />
    <label class="cb-field-inline cb-pool-field">
      <span class="cb-label">Pool keys</span>
      <input
        class="cb-input"
        bind:value={card.poolKeysText}
        placeholder="emma, base"
        autocomplete="off"
      />
    </label>
  </div>
</div>
