<script lang="ts">
  import { CardType } from '@/lib/_model';
  import { suggestedManaCost, type CardDraft, type UnitDraft } from './model';

  let { card }: { card: CardDraft | UnitDraft } = $props();

  const canAuto = $derived(!('type' in card) || card.type !== CardType.Land);
  let overBudget = $state(0);

  function setCostFromBudget() {
    const suggestion = suggestedManaCost(card);
    if (suggestion === null) return;
    card.cost = suggestion.cost;
    overBudget = suggestion.overBudget;
  }
</script>

<div class="cb-cost-field">
  <label class="cb-field-inline">
    <span class="cb-label">Cost</span>
    <input class="cb-input" type="number" bind:value={card.cost} />
  </label>
  {#if canAuto}
    <button type="button" class="cb-btn cb-btn-ghost cb-cost-auto" onclick={setCostFromBudget}>
      Auto
    </button>
  {/if}
  {#if overBudget > 0}
    <p class="cb-cost-over">Over budget by {overBudget} points</p>
  {/if}
</div>
