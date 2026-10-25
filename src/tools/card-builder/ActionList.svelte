<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    blankAction,
    blankEffectArgs,
    blankTarget,
    effectNames,
    moveItem,
    TARGET_OPTIONS,
    type ActionDraft,
    type UnitDraft,
  } from './model';
  import EffectArgsEditor from './EffectArgsEditor.svelte';

  let {
    actions,
    unitEditor,
  }: {
    actions: ActionDraft[];
    unitEditor: Snippet<[UnitDraft]>;
  } = $props();

  const names = effectNames(0);

  function setEffect(action: ActionDraft, name: string) {
    action.effectName = name;
    action.args = blankEffectArgs(name);
  }
</script>

<div class="cb-section-head">
  <h2>Actions</h2>
  <button type="button" class="cb-btn cb-btn-ghost" onclick={() => actions.push(blankAction())}>
    Add action
  </button>
</div>
{#each actions as action, index (action.id)}
  <div class="cb-card">
    <div class="cb-section-head">
      <label class="cb-field">
        <span class="cb-label">Effect</span>
        <select
          class="cb-input"
          value={action.effectName}
          onchange={(event) => setEffect(action, event.currentTarget.value)}
        >
          {#each names as name (name)}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>
      <div class="cb-row">
        <button
          type="button"
          class="cb-btn cb-btn-ghost"
          disabled={index === 0}
          onclick={() => moveItem(actions, index, -1)}>Up</button
        >
        <button
          type="button"
          class="cb-btn cb-btn-ghost"
          disabled={index === actions.length - 1}
          onclick={() => moveItem(actions, index, 1)}>Down</button
        >
        <button type="button" class="cb-btn cb-btn-danger" onclick={() => actions.splice(index, 1)}>
          Remove
        </button>
      </div>
    </div>

    <EffectArgsEditor effectName={action.effectName} args={action.args} {unitEditor} />

    <div class="cb-section-head">
      <h3>Targets</h3>
      <button
        type="button"
        class="cb-btn cb-btn-ghost"
        onclick={() => action.targets.push(blankTarget())}
      >
        Add target
      </button>
    </div>
    {#if action.targets.length === 0}
      <p class="cb-hint">
        No targets. The effect uses its range, or itself, when nothing is chosen.
      </p>
    {/if}
    {#each action.targets as target, targetIndex (target.id)}
      <div class="cb-color-row">
        <label class="cb-field">
          <span class="cb-label">Target</span>
          <select class="cb-input" bind:value={target.type}>
            {#each TARGET_OPTIONS as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>
        <label class="cb-field">
          <span class="cb-label">Count</span>
          <input class="cb-input" type="number" min="1" bind:value={target.count} />
        </label>
        <button
          type="button"
          class="cb-btn cb-btn-danger"
          onclick={() => action.targets.splice(targetIndex, 1)}
        >
          Remove
        </button>
      </div>
    {/each}
  </div>
{/each}
