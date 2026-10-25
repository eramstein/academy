<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    blankEffectArgs,
    blankRange,
    EFFECT_NOTES,
    effectNames,
    fieldsFor,
    moveItem,
    numericArgKeys,
    TRIGGER_PARAMS,
    uid,
    type EffectField,
    type UnitDraft,
  } from './model';
  import KeywordEditor from './KeywordEditor.svelte';
  import RangeEditor from './RangeEditor.svelte';

  let {
    effectName,
    args,
    depth = 0,
    hideKey = '',
    unitEditor,
  }: {
    effectName: string;
    args: Record<string, any>;
    depth?: number;
    hideKey?: string;
    unitEditor: Snippet<[UnitDraft]>;
  } = $props();

  const listId = `cb-args-${uid()}`;

  function setNumber(effectArgs: Record<string, any>, field: EffectField, raw: string) {
    if (raw === '') {
      effectArgs[field.key] = field.optional ? undefined : 0;
      return;
    }
    const value = Number(raw);
    effectArgs[field.key] = Number.isFinite(value) ? value : field.optional ? undefined : 0;
  }

  function toggleRange(effectArgs: Record<string, any>, key: string, enabled: boolean) {
    effectArgs[key] = enabled ? blankRange() : undefined;
  }

  function setStepEffect(step: { effectName: string; args: Record<string, any> }, name: string) {
    step.effectName = name;
    step.args = blankEffectArgs(name);
  }

  function addStep(effectArgs: Record<string, any>) {
    if (!Array.isArray(effectArgs.effectTemplates)) effectArgs.effectTemplates = [];
    const name = 'damageUnit';
    effectArgs.effectTemplates.push({ id: uid(), effectName: name, args: blankEffectArgs(name) });
  }

  function setEnergyEffect(effectArgs: Record<string, any>, name: string) {
    effectArgs.effectTemplate = name;
    effectArgs.energyUsedForArgs = numericArgKeys(name)[0] ?? '';
    effectArgs.otherArgs = blankEffectArgs(name);
  }
</script>

{#snippet effectBody(
  name: string,
  effectArgs: Record<string, any>,
  nestedDepth: number,
  skip: string,
  scope: string
)}
  {@const fields = fieldsFor(name)}
  {@const note = EFFECT_NOTES[name] ?? ''}
  <div class="cb-effect">
    {#if name === 'combine'}
      <div class="cb-section-head">
        <h3>Combined effects</h3>
        <button type="button" class="cb-btn cb-btn-ghost" onclick={() => addStep(effectArgs)}>
          Add effect
        </button>
      </div>
      {#if !effectArgs.effectTemplates?.length}
        <p class="cb-hint">No effects in this combination yet.</p>
      {/if}
      {#each effectArgs.effectTemplates ?? [] as step, index (step.id)}
        <div class="cb-card">
          <div class="cb-section-head">
            <label class="cb-field">
              <span class="cb-label">Effect</span>
              <select
                class="cb-input"
                value={step.effectName}
                onchange={(event) => setStepEffect(step, event.currentTarget.value)}
              >
                {#each effectNames(nestedDepth + 1) as choice (choice)}
                  <option value={choice}>{choice}</option>
                {/each}
              </select>
            </label>
            <div class="cb-row">
              <button
                type="button"
                class="cb-btn cb-btn-ghost"
                disabled={index === 0}
                onclick={() => moveItem(effectArgs.effectTemplates, index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                class="cb-btn cb-btn-ghost"
                disabled={index === effectArgs.effectTemplates.length - 1}
                onclick={() => moveItem(effectArgs.effectTemplates, index, 1)}
              >
                Down
              </button>
              <button
                type="button"
                class="cb-btn cb-btn-danger"
                onclick={() => effectArgs.effectTemplates.splice(index, 1)}
              >
                Remove
              </button>
            </div>
          </div>
          {@render effectBody(step.effectName, step.args, nestedDepth + 1, '', String(step.id))}
        </div>
      {/each}
    {:else if name === 'useEnergy'}
      <div class="cb-grid">
        <label class="cb-field">
          <span class="cb-label">Effect</span>
          <select
            class="cb-input"
            value={effectArgs.effectTemplate}
            onchange={(event) => setEnergyEffect(effectArgs, event.currentTarget.value)}
          >
            {#each effectNames(nestedDepth + 1).filter((choice) => choice !== 'useEnergy') as choice (choice)}
              <option value={choice}>{choice}</option>
            {/each}
          </select>
        </label>
        <label class="cb-field">
          <span class="cb-label">Energy fills</span>
          <input
            class="cb-input"
            list={`${listId}-${scope}-energy`}
            value={effectArgs.energyUsedForArgs ?? ''}
            placeholder="damage"
            autocomplete="off"
            oninput={(event) => (effectArgs.energyUsedForArgs = event.currentTarget.value)}
          />
          <datalist id={`${listId}-${scope}-energy`}>
            {#each numericArgKeys(effectArgs.effectTemplate) as key (key)}
              <option value={key}></option>
            {/each}
          </datalist>
        </label>
        <label class="cb-field">
          <span class="cb-label">Energy cost</span>
          <input
            class="cb-input"
            type="number"
            min="0"
            placeholder="All"
            value={effectArgs.energyCost ?? ''}
            oninput={(event) => {
              const raw = event.currentTarget.value;
              effectArgs.energyCost = raw === '' ? undefined : Number(raw);
            }}
          />
        </label>
      </div>
      <div class="cb-nested">
        <h3>Other arguments</h3>
        {#key effectArgs.effectTemplate}
          {@render effectBody(
            effectArgs.effectTemplate,
            effectArgs.otherArgs,
            nestedDepth + 1,
            String(effectArgs.energyUsedForArgs ?? ''),
            `${scope}-other`
          )}
        {/key}
      </div>
    {:else if fields.length === 0 && !note}
      <p class="cb-hint">This effect takes no arguments.</p>
    {:else}
      <div class="cb-grid">
        {#each fields as field (field.key)}
          {#if field.key !== skip}
            {#if field.kind === 'number'}
              <label class="cb-field">
                <span class="cb-label">{field.label}</span>
                <input
                  class="cb-input"
                  type="number"
                  placeholder={field.optional ? '—' : ''}
                  value={effectArgs[field.key] ?? ''}
                  oninput={(event) => setNumber(effectArgs, field, event.currentTarget.value)}
                />
              </label>
            {:else if field.kind === 'string' || field.kind === 'triggerParam'}
              <label class="cb-field">
                <span class="cb-label">{field.label}</span>
                <input
                  class="cb-input"
                  list={field.kind === 'triggerParam' ? `${listId}-${scope}-trigger` : undefined}
                  value={effectArgs[field.key] ?? ''}
                  placeholder={field.placeholder ??
                    (field.kind === 'triggerParam' ? 'attacker' : '')}
                  autocomplete="off"
                  oninput={(event) => (effectArgs[field.key] = event.currentTarget.value)}
                />
                {#if field.kind === 'triggerParam'}
                  <datalist id={`${listId}-${scope}-trigger`}>
                    {#each TRIGGER_PARAMS as param (param)}
                      <option value={param}></option>
                    {/each}
                  </datalist>
                {/if}
              </label>
            {:else if field.kind === 'enum'}
              <label class="cb-field">
                <span class="cb-label">{field.label}</span>
                <select
                  class="cb-input"
                  value={effectArgs[field.key] ?? ''}
                  onchange={(event) => (effectArgs[field.key] = event.currentTarget.value)}
                >
                  {#if field.optional}
                    <option value="">(none)</option>
                  {/if}
                  {#each field.options ?? [] as option (option)}
                    <option value={option}>{option}</option>
                  {/each}
                </select>
              </label>
            {:else if field.kind === 'boolean'}
              <label class="cb-check">
                <input
                  type="checkbox"
                  checked={Boolean(effectArgs[field.key])}
                  onchange={(event) => (effectArgs[field.key] = event.currentTarget.checked)}
                />
                {field.label}
              </label>
            {/if}
          {/if}
        {/each}
      </div>
      {#each fields as field (field.key)}
        {#if field.key !== skip && field.kind === 'range'}
          <label class="cb-check">
            <input
              type="checkbox"
              checked={effectArgs[field.key] != null}
              onchange={(event) => toggleRange(effectArgs, field.key, event.currentTarget.checked)}
            />
            {field.label}
          </label>
          {#if effectArgs[field.key]}
            <RangeEditor range={effectArgs[field.key]} />
          {/if}
        {:else if field.key !== skip && field.kind === 'temporary'}
          <div class="cb-nested">
            <h3>{field.label}</h3>
            <KeywordEditor keywords={effectArgs[field.key]} includeStats />
          </div>
        {:else if field.key !== skip && field.kind === 'unit' && effectArgs[field.key]}
          <div class="cb-summon">
            <h3>Summoned unit</h3>
            {@render unitEditor(effectArgs[field.key])}
          </div>
        {/if}
      {/each}
    {/if}

    {#if note}
      <p class="cb-hint">{note}</p>
    {/if}
  </div>
{/snippet}

{@render effectBody(effectName, args, depth, hideKey, 'root')}
