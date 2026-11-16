<script lang="ts">
  import { CardType } from '@/lib/_model';
  import { suggestedManaCost, type CardDraft, type UnitDraft } from './model';

  let { card }: { card: CardDraft | UnitDraft } = $props();

  const canAuto = $derived(!('type' in card) || card.type !== CardType.Land);
  const budget = $derived(canAuto ? suggestedManaCost(card) : null);
  const spareBudget = $derived(budget?.spareBudget ?? null);
  const overBudget = $derived(budget?.overBudget ?? 0);

  function setCostFromBudget() {
    const suggestion = suggestedManaCost(card);
    if (suggestion === null) return;
    card.cost = suggestion.cost;
  }
</script>

<div class="cb-cost-field">
  <div class="cb-cost-row">
    <label class="cb-field-inline">
      <span class="cb-label">Cost</span>
      <input class="cb-input" type="number" bind:value={card.cost} />
    </label>
    {#if canAuto}
      <button type="button" class="cb-btn cb-btn-ghost cb-cost-auto" onclick={setCostFromBudget}>
        Auto
      </button>
    {/if}
    {#if spareBudget !== null}
      <span
        class="cb-cost-spare"
        class:cb-cost-spare-over={spareBudget < 0}
        title="Budget points left for this mana cost"
      >
        {spareBudget >= 0 ? `${spareBudget} spare` : `${Math.abs(spareBudget)} over`}
      </span>
    {/if}
  </div>
  {#if overBudget > 0}
    <p class="cb-cost-over">Over max by {overBudget} points</p>
  {/if}
</div>
