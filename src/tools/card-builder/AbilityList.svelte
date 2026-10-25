<script lang="ts">
  import { TriggerType } from '@/lib/_model';
  import type { Snippet } from 'svelte';
  import { blankAbility, moveItem, type AbilityDraft, type UnitDraft } from './model';
  import ActionList from './ActionList.svelte';
  import RangeEditor from './RangeEditor.svelte';

  let {
    abilities,
    title,
    unitEditor,
  }: {
    abilities: AbilityDraft[];
    title: string;
    unitEditor: Snippet<[UnitDraft]>;
  } = $props();

  const triggerTypes = Object.values(TriggerType);

  function toggleRecompute(ability: AbilityDraft, trigger: TriggerType) {
    const index = ability.staticRecompute.indexOf(trigger);
    if (index === -1) ability.staticRecompute.push(trigger);
    else ability.staticRecompute.splice(index, 1);
  }
</script>

<div class="cb-section-head">
  <h2>{title}</h2>
  <button type="button" class="cb-btn cb-btn-ghost" onclick={() => abilities.push(blankAbility())}>
    Add ability
  </button>
</div>
{#each abilities as ability, index (ability.id)}
  <div class="cb-card">
    <div class="cb-section-head">
      <h3>Ability {index + 1}</h3>
      <div class="cb-row">
        <button
          type="button"
          class="cb-btn cb-btn-ghost"
          disabled={index === 0}
          onclick={() => moveItem(abilities, index, -1)}>Up</button
        >
        <button
          type="button"
          class="cb-btn cb-btn-ghost"
          disabled={index === abilities.length - 1}
          onclick={() => moveItem(abilities, index, 1)}>Down</button
        >
        <button
          type="button"
          class="cb-btn cb-btn-danger"
          onclick={() => abilities.splice(index, 1)}>Remove</button
        >
      </div>
    </div>

    <label class="cb-field-inline">
      <span class="cb-label">Trigger</span>
      <select class="cb-input" bind:value={ability.triggerType}>
        {#each triggerTypes as trigger (trigger)}
          <option value={trigger}>{trigger}</option>
        {/each}
      </select>
    </label>

    <label class="cb-check">
      <input type="checkbox" bind:checked={ability.useRange} />
      Trigger range
    </label>
    {#if ability.useRange}
      <RangeEditor range={ability.range} />
    {/if}

    {#if ability.triggerType === TriggerType.Static}
      <p class="cb-label">Recompute when</p>
      <div class="cb-checks">
        {#each triggerTypes as trigger (trigger)}
          <label class="cb-check">
            <input
              type="checkbox"
              checked={ability.staticRecompute.includes(trigger)}
              onchange={() => toggleRecompute(ability, trigger)}
            />
            {trigger}
          </label>
        {/each}
      </div>
    {/if}

    <div class="cb-row">
      <label class="cb-check">
        <input type="checkbox" bind:checked={ability.useCost} />
        Activation cost
      </label>
      {#if ability.useCost}
        <input class="cb-input cb-short" type="number" min="0" bind:value={ability.cost} />
      {/if}
      <label class="cb-check">
        <input type="checkbox" bind:checked={ability.exhausts} />
        Exhausts
      </label>
    </div>

    <ActionList actions={ability.actions} {unitEditor} />
  </div>
{/each}
