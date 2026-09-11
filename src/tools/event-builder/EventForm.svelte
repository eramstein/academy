<script lang="ts">
  import {
    ActivityType,
    DayPeriod,
    EventTriggerType,
    type ActionTemplate,
    type EventEffectsTemplate,
    type EventOptionTemplate,
    type EventTemplate,
    type EventTrigger,
  } from '@/lib/_model';
  import { SceneActionTemplates } from '@/lib/sim/actions/_templates';
  import EffectsTemplatesEditor from './EffectsTemplatesEditor.svelte';
  import { saveEventTemplate } from './save-event';

  let {
    event = null,
    existingKeys,
    onSaved,
    onCancel,
  }: {
    event?: EventTemplate | null;
    existingKeys: string[];
    onSaved: (event: EventTemplate) => void;
    onCancel: () => void;
  } = $props();

  const isEdit = $derived(event != null);
  const originalKey = $derived(event?.key ?? null);

  let key = $state('');
  let text = $state('');
  let triggersOnce = $state(true);
  let characterArc = $state('');
  let triggers = $state<EventTrigger[]>([]);
  let options = $state<EventOptionTemplate[]>([]);
  let effectsTemplates = $state<EventEffectsTemplate[]>([]);
  let error = $state('');
  let saving = $state(false);

  const triggerTypes = Object.values(EventTriggerType);
  const periods = Object.values(DayPeriod);
  const activityTypes = Object.values(ActivityType);
  const actionNames = Object.keys(SceneActionTemplates);

  function cloneEventFields(source: EventTemplate | null | undefined) {
    if (!source) {
      key = '';
      text = '';
      triggersOnce = true;
      characterArc = '';
      triggers = [
        { triggerType: EventTriggerType.Day, parameters: { day: 1 } },
        { triggerType: EventTriggerType.Period, parameters: { period: DayPeriod.Morning } },
      ];
      options = [];
      effectsTemplates = [];
      return;
    }

    const cloned = JSON.parse(JSON.stringify(source)) as EventTemplate;
    key = cloned.key;
    text = cloned.text;
    triggersOnce = cloned.triggersOnce ?? false;
    characterArc = cloned.characterArc ?? '';
    triggers = cloned.triggers ?? [];
    options = cloned.optionTemplates ?? [];
    effectsTemplates = cloned.effectsTemplates ?? [];
  }

  cloneEventFields(event);

  function defaultParams(triggerType: EventTriggerType): Record<string, any> {
    switch (triggerType) {
      case EventTriggerType.Day:
        return { day: 1 };
      case EventTriggerType.Period:
        return { period: DayPeriod.Morning };
      case EventTriggerType.ActivityType:
        return { activityType: ActivityType.Class };
      case EventTriggerType.Place:
        return { placeKey: '' };
      case EventTriggerType.CharacterPresent:
        return { characterKey: '' };
      default:
        return {};
    }
  }

  function setTriggerType(index: number, triggerType: EventTriggerType) {
    triggers[index] = { triggerType, parameters: defaultParams(triggerType) };
  }

  function addTrigger() {
    triggers = [
      ...triggers,
      { triggerType: EventTriggerType.Day, parameters: defaultParams(EventTriggerType.Day) },
    ];
  }

  function removeTrigger(index: number) {
    triggers = triggers.filter((_, i) => i !== index);
  }

  function defaultActionTemplate(): ActionTemplate {
    return {
      actionTemplate: actionNames[0] ?? '',
      args: {},
    };
  }

  function addOption() {
    options = [...options, { text: '', effectsTemplates: [] }];
  }

  function removeOption(index: number) {
    options = options.filter((_, i) => i !== index);
  }

  function setActionTemplateName(index: number, actionTemplate: string) {
    const option = options[index];
    options[index] = {
      ...option,
      actionTemplate: {
        actionTemplate,
        args: option.actionTemplate?.args ?? {},
      },
    };
  }

  function clearActionTemplate(index: number) {
    const { actionTemplate: _removed, ...rest } = options[index];
    options[index] = rest;
  }

  function enableActionTemplate(index: number) {
    options[index] = {
      ...options[index],
      actionTemplate: defaultActionTemplate(),
    };
  }

  function setOptionEffects(index: number, next: EventEffectsTemplate[]) {
    options[index] = {
      ...options[index],
      effectsTemplates: next,
    };
  }

  function buildEvent(): EventTemplate {
    const built: EventTemplate = {
      key: key.trim(),
      text: text.trim(),
      triggers: triggers.map((trigger) => ({
        triggerType: trigger.triggerType,
        parameters: { ...trigger.parameters },
      })),
      optionTemplates: options
        .map((option) => {
          const next: EventOptionTemplate = {
            text: option.text.trim(),
          };

          if (option.actionTemplate?.actionTemplate) {
            next.actionTemplate = {
              actionTemplate: option.actionTemplate.actionTemplate,
              args: { ...(option.actionTemplate.args ?? {}) },
            };
          }

          if (option.effectsTemplates && option.effectsTemplates.length > 0) {
            next.effectsTemplates = option.effectsTemplates.map((effect) => ({
              effectTemplate: effect.effectTemplate,
              args: { ...effect.args },
            }));
          }

          return next;
        })
        .filter((option) => option.text.length > 0),
      triggersOnce,
    };

    const arc = characterArc.trim();
    if (arc) {
      built.characterArc = arc;
    }

    if (effectsTemplates.length > 0) {
      built.effectsTemplates = effectsTemplates.map((effect) => ({
        effectTemplate: effect.effectTemplate,
        args: { ...effect.args },
      }));
    }

    return built;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';

    const trimmedKey = key.trim();
    if (!trimmedKey) {
      error = 'Key is required.';
      return;
    }

    const keyTaken = existingKeys.some(
      (existing) => existing === trimmedKey && existing !== originalKey
    );
    if (keyTaken) {
      error = `An event with key "${trimmedKey}" already exists.`;
      return;
    }
    if (!text.trim()) {
      error = 'Text is required.';
      return;
    }
    if (triggers.length === 0) {
      error = 'Add at least one trigger.';
      return;
    }

    saving = true;
    try {
      const saved = await saveEventTemplate(buildEvent());
      onSaved(saved);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save event.';
    } finally {
      saving = false;
    }
  }
</script>

<form class="event-form" onsubmit={handleSubmit}>
  <header class="header">
    <h1>{isEdit ? 'Edit event' : 'New event'}</h1>
    <div class="header-actions">
      <button type="button" class="btn ghost" onclick={onCancel} disabled={saving}>Cancel</button>
      <button type="submit" class="btn primary" disabled={saving}>
        {saving ? 'Saving…' : isEdit ? 'Update event' : 'Save event'}
      </button>
    </div>
  </header>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="form-body">
    <section class="panel basics">
      <h2>Basics</h2>
      <div class="basics-meta">
        <label class="field key-field">
          <span class="label">Key</span>
          <input
            class="input"
            bind:value={key}
            placeholder="event-4"
            autocomplete="off"
            readonly={isEdit}
          />
        </label>

        <label class="field arc-field">
          <span class="label">Character arc</span>
          <input
            class="input"
            bind:value={characterArc}
            placeholder="npc key (optional)"
            autocomplete="off"
          />
        </label>

        <label class="check">
          <input type="checkbox" bind:checked={triggersOnce} />
          <span>Triggers once</span>
        </label>
      </div>

      <label class="field text-field">
        <span class="label">Text</span>
        <textarea class="input textarea" bind:value={text} rows="3" placeholder="Event narration…"
        ></textarea>
      </label>
    </section>

    <div class="mid-row">
      <section class="panel triggers">
        <div class="section-header">
          <h2>Triggers</h2>
          <button type="button" class="btn ghost" onclick={addTrigger}>Add</button>
        </div>

        {#if triggers.length === 0}
          <p class="hint">No triggers yet.</p>
        {:else}
          <ul class="stack">
            {#each triggers as trigger, i (i)}
              <li class="inline-row">
                <select
                  class="input type-select"
                  value={trigger.triggerType}
                  aria-label="Trigger type"
                  onchange={(e) =>
                    setTriggerType(
                      i,
                      (e.currentTarget as HTMLSelectElement).value as EventTriggerType
                    )}
                >
                  {#each triggerTypes as type (type)}
                    <option value={type}>{type}</option>
                  {/each}
                </select>

                {#if trigger.triggerType === EventTriggerType.Day}
                  <input
                    class="input narrow"
                    type="number"
                    min="0"
                    bind:value={trigger.parameters.day}
                    aria-label="Day"
                  />
                {:else if trigger.triggerType === EventTriggerType.Period}
                  <select class="input param-select" bind:value={trigger.parameters.period} aria-label="Period">
                    {#each periods as period (period)}
                      <option value={period}>{period}</option>
                    {/each}
                  </select>
                {:else if trigger.triggerType === EventTriggerType.ActivityType}
                  <select
                    class="input param-select"
                    bind:value={trigger.parameters.activityType}
                    aria-label="Activity"
                  >
                    {#each activityTypes as activity (activity)}
                      <option value={activity}>{activity}</option>
                    {/each}
                  </select>
                {:else if trigger.triggerType === EventTriggerType.Place}
                  <input
                    class="input param-input"
                    bind:value={trigger.parameters.placeKey}
                    placeholder="place key"
                    aria-label="Place key"
                  />
                {:else if trigger.triggerType === EventTriggerType.CharacterPresent}
                  <input
                    class="input param-input"
                    bind:value={trigger.parameters.characterKey}
                    placeholder="character key"
                    aria-label="Character key"
                  />
                {/if}

                <button
                  type="button"
                  class="btn icon danger"
                  onclick={() => removeTrigger(i)}
                  aria-label="Remove trigger">×</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="panel effects">
        <EffectsTemplatesEditor
          effects={effectsTemplates}
          onChange={(next) => (effectsTemplates = next)}
          title="Effects"
          description="Applied when the event triggers, before options."
        />
      </section>
    </div>

    <section class="panel options">
      <div class="section-header">
        <h2>Options</h2>
        <button type="button" class="btn ghost" onclick={addOption}>Add option</button>
      </div>

      {#if options.length === 0}
        <p class="hint">No player options.</p>
      {:else}
        <ul class="options-grid">
          {#each options as option, i (i)}
            <li class="option-card">
              <div class="option-header">
                <span class="option-index">Option {i + 1}</span>
                <button
                  type="button"
                  class="btn icon danger"
                  onclick={() => removeOption(i)}
                  aria-label="Remove option">×</button
                >
              </div>

              <label class="field">
                <span class="label">Choice text</span>
                <input class="input" bind:value={option.text} placeholder="Choice label" />
              </label>

              <div class="option-action">
                <div class="section-header tight">
                  <h3>Action</h3>
                  {#if option.actionTemplate}
                    <button
                      type="button"
                      class="btn ghost danger compact"
                      onclick={() => clearActionTemplate(i)}>Clear</button
                    >
                  {:else}
                    <button
                      type="button"
                      class="btn ghost compact"
                      onclick={() => enableActionTemplate(i)}>Add</button
                    >
                  {/if}
                </div>

                {#if option.actionTemplate}
                  <select
                    class="input"
                    value={option.actionTemplate.actionTemplate}
                    aria-label="Action template"
                    onchange={(e) =>
                      setActionTemplateName(i, (e.currentTarget as HTMLSelectElement).value)}
                  >
                    {#each actionNames as name (name)}
                      <option value={name}>{name}</option>
                    {/each}
                  </select>
                {:else}
                  <p class="hint">No action</p>
                {/if}
              </div>

              <EffectsTemplatesEditor
                effects={option.effectsTemplates ?? []}
                onChange={(next) => setOptionEffects(i, next)}
                title="Option effects"
                nested
              />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</form>

<style>
  .event-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    height: 100%;
    min-height: 0;
    padding: 1rem 1.25rem 1.25rem;
    box-sizing: border-box;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    overflow: auto;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-shrink: 0;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid rgba(175, 142, 103, 0.35);
  }

  h1 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  h2 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-brass);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h3 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .header-actions {
    display: flex;
    gap: 0.45rem;
  }

  .form-body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-width: 0;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.75rem 0.85rem;
    background: rgba(18, 24, 32, 0.55);
    border: 1px solid rgba(175, 142, 103, 0.22);
    border-radius: 4px;
    min-width: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .section-header.tight {
    margin-bottom: 0.25rem;
  }

  .basics-meta {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .key-field {
    width: 11rem;
    flex-shrink: 0;
  }

  .arc-field {
    width: 12rem;
    flex-shrink: 0;
  }

  .text-field {
    max-width: 52rem;
  }

  .mid-row {
    display: grid;
    grid-template-columns: minmax(18rem, 0.9fr) minmax(18rem, 1.1fr);
    gap: 0.85rem;
    align-items: start;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .label {
    font-size: 0.72rem;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .input {
    padding: 0.4rem 0.55rem;
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.35);
    border-radius: 3px;
    color: var(--color-cream);
    font: inherit;
    font-size: 0.9rem;
  }

  .input:focus {
    outline: 1px solid var(--color-brass);
    border-color: var(--color-brass);
  }

  .input:read-only {
    opacity: 0.75;
    cursor: default;
  }

  .textarea {
    resize: vertical;
    min-height: 4.5rem;
    line-height: 1.4;
  }

  .narrow {
    width: 4.5rem;
  }

  .type-select {
    width: 10.5rem;
    flex-shrink: 0;
  }

  .param-select {
    width: 9rem;
  }

  .param-input {
    width: 10rem;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding-bottom: 0.4rem;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .stack {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .inline-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .options-grid {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .option-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.7rem 0.75rem;
    background: rgba(10, 14, 20, 0.55);
    border: 1px solid rgba(175, 142, 103, 0.35);
    border-left: 3px solid var(--color-brass);
    border-radius: 4px;
    min-width: 0;
  }

  .option-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .option-index {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-brass);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .option-action {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hint {
    margin: 0;
    color: var(--color-muted-label);
    font-size: 0.8rem;
  }

  .error {
    margin: 0;
    padding: 0.5rem 0.7rem;
    background: rgba(220, 38, 38, 0.15);
    border: 1px solid rgba(220, 38, 38, 0.4);
    border-radius: 3px;
    color: #fca5a5;
    font-size: 0.9rem;
  }

  .btn {
    padding: 0.4rem 0.75rem;
    border-radius: 3px;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn.compact {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.primary {
    background: var(--color-brass);
    color: var(--color-deep-brown);
    border-color: var(--color-brass);
    font-weight: 600;
  }

  .btn.primary:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  .btn.ghost {
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.35);
  }

  .btn.ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
  }

  .btn.icon {
    padding: 0.15rem 0.4rem;
    line-height: 1;
    font-size: 1.1rem;
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.25);
  }

  .btn.icon:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
  }

  .btn.danger {
    color: #fca5a5;
    border-color: rgba(220, 38, 38, 0.35);
  }

  @media (max-width: 1100px) {
    .mid-row {
      grid-template-columns: 1fr;
    }

    .options-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
