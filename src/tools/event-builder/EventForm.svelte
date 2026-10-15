<script lang="ts">
  import {
    Emotion,
    type ActionTemplate,
    type EventEffect,
    type EventOptionAttributeCheck,
    type EventOptionTemplate,
    type EventTemplate,
    type EventTrigger,
    type SkillCheckDifficultyName,
  } from '@/lib/_model';
  import { SceneActionTemplates } from '@/lib/sim/actions/_templates';
  import { skillCheckDifficultyKeys, skillCheckDifficultyLabels } from '@/lib/sim/attribute-checks';
  import EffectsTemplatesEditor from './EffectsTemplatesEditor.svelte';
  import TriggersEditor from './TriggersEditor.svelte';
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

  const isEdit = $derived(event != null && existingKeys.includes(event.key));
  const originalKey = $derived(isEdit ? (event?.key ?? null) : null);

  let key = $state('');
  let title = $state('');
  let text = $state('');
  let characterArc = $state('');
  let emotion = $state('');
  let image = $state('');
  let imageSize = $state<'small' | 'medium' | 'large'>('small');
  let manualTrigger = $state('');
  let triggers = $state<EventTrigger[]>([]);
  let options = $state<EventOptionTemplate[]>([]);
  let effects = $state<EventEffect[]>([]);
  let error = $state('');
  let saving = $state(false);

  const emotions = Object.values(Emotion);
  const actionNames = Object.keys(SceneActionTemplates);
  const attributeKeys = ['dexterity', 'intelligence', 'vitality', 'charisma', 'aura'] as const;
  const difficultyKeys = skillCheckDifficultyKeys;

  function cloneEventFields(source: EventTemplate | null | undefined) {
    if (!source) {
      key = '';
      title = '';
      text = '';
      characterArc = '';
      emotion = '';
      image = '';
      imageSize = 'small';
      manualTrigger = '';
      triggers = [];
      options = [];
      effects = [];
      return;
    }

    const cloned = JSON.parse(JSON.stringify(source)) as EventTemplate;
    key = cloned.key;
    title = cloned.title ?? '';
    text = cloned.text;
    characterArc = cloned.characterArc ?? '';
    emotion = cloned.emotion ?? '';
    image = cloned.image ?? '';
    imageSize = cloned.imageSize ?? 'small';
    manualTrigger = cloned.manualTrigger ?? '';
    triggers = cloned.triggers ?? [];
    options = cloned.optionTemplates ?? [];
    effects = cloned.effects ?? [];
  }

  function defaultImageFromKey() {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    image = `${trimmedKey}.jpg`;
  }

  cloneEventFields(event);

  function defaultActionTemplate(): ActionTemplate {
    return {
      actionTemplate: actionNames[0] ?? '',
      args: {},
    };
  }

  function addOption() {
    options = [...options, { text: '', effects: [] }];
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

  function setOptionEffects(index: number, next: EventEffect[]) {
    options[index] = {
      ...options[index],
      effects: next,
    };
  }

  function setOptionTriggers(index: number, next: EventTrigger[]) {
    options[index] = {
      ...options[index],
      triggers: next,
    };
  }

  function cloneTriggers(optionTriggers: EventTrigger[] | undefined): EventTrigger[] | undefined {
    if (!optionTriggers || optionTriggers.length === 0) return undefined;
    return optionTriggers.map((trigger) => ({
      triggerType: trigger.triggerType,
      parameters: { ...trigger.parameters },
    })) as EventTrigger[];
  }

  function defaultAttributeCheck(): EventOptionAttributeCheck {
    return {
      attribute: 'charisma',
      difficulty: 'medium',
      successEffects: [],
      failureEffects: [],
    };
  }

  function cloneEffects(effects: EventEffect[] | undefined): EventEffect[] | undefined {
    if (!effects || effects.length === 0) return undefined;
    return effects.map((effect) => ({
      type: effect.type,
      parameters: { ...effect.parameters },
    }));
  }

  function enableAttributeCheck(index: number) {
    const option = options[index];
    const { effects: _removed, ...rest } = option;
    options[index] = {
      ...rest,
      attributeCheck: option.attributeCheck ?? defaultAttributeCheck(),
    };
  }

  function clearAttributeCheck(index: number) {
    const { attributeCheck: _removed, ...rest } = options[index];
    options[index] = { ...rest, effects: rest.effects ?? [] };
  }

  function setAttributeCheckField<K extends keyof EventOptionAttributeCheck>(
    index: number,
    field: K,
    value: EventOptionAttributeCheck[K]
  ) {
    const option = options[index];
    if (!option.attributeCheck) return;
    options[index] = {
      ...option,
      attributeCheck: {
        ...option.attributeCheck,
        [field]: value,
      },
    };
  }

  function setAttributeCheckEffects(
    index: number,
    branch: 'successEffects' | 'failureEffects',
    next: EventEffect[]
  ) {
    const option = options[index];
    if (!option.attributeCheck) return;
    options[index] = {
      ...option,
      attributeCheck: {
        ...option.attributeCheck,
        [branch]: next,
      },
    };
  }

  function buildEvent(): EventTemplate {
    const built: EventTemplate = {
      key: key.trim(),
      text: text.trim(),
      triggers: triggers.map((trigger) => ({
        triggerType: trigger.triggerType,
        parameters: { ...trigger.parameters },
      })) as EventTrigger[],
      optionTemplates: options
        .map((option) => {
          const next: EventOptionTemplate = {
            text: option.text.trim(),
          };

          const optionTriggers = cloneTriggers(option.triggers);
          if (optionTriggers) {
            next.triggers = optionTriggers;
          }

          if (option.actionTemplate?.actionTemplate) {
            next.actionTemplate = {
              actionTemplate: option.actionTemplate.actionTemplate,
              args: { ...(option.actionTemplate.args ?? {}) },
            };
          }

          if (option.attributeCheck) {
            const check: EventOptionAttributeCheck = {
              attribute: option.attributeCheck.attribute,
              difficulty: option.attributeCheck.difficulty,
            };
            const successEffects = cloneEffects(option.attributeCheck.successEffects);
            const failureEffects = cloneEffects(option.attributeCheck.failureEffects);
            if (successEffects) check.successEffects = successEffects;
            if (failureEffects) check.failureEffects = failureEffects;
            next.attributeCheck = check;
          } else if (option.effects && option.effects.length > 0) {
            next.effects = cloneEffects(option.effects);
          }

          return next;
        })
        .filter((option) => option.text.length > 0),
    };

    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      built.title = trimmedTitle;
    }

    const arc = characterArc.trim();
    if (arc) {
      built.characterArc = arc;
    }

    if (emotion) {
      built.emotion = emotion as Emotion;
    }

    const imageName = image.trim();
    if (imageName) {
      built.image = imageName;
      if (imageSize !== 'small') {
        built.imageSize = imageSize;
      }
    }

    if (effects.length > 0) {
      built.effects = effects.map((effect) => ({
        type: effect.type,
        parameters: { ...effect.parameters },
      }));
    }

    const triggerLabel = manualTrigger.trim();
    if (triggerLabel) {
      built.manualTrigger = triggerLabel;
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

        <label class="field title-field">
          <span class="label">Title</span>
          <input
            class="input"
            bind:value={title}
            placeholder="Short heading (optional)"
            autocomplete="off"
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

        <label class="field emotion-field">
          <span class="label">Emotion</span>
          <select class="input" bind:value={emotion} aria-label="Emotion">
            <option value="">(none)</option>
            {#each emotions as value (value)}
              <option {value}>{value}</option>
            {/each}
          </select>
        </label>

        <div class="field image-field">
          <span class="label">Image</span>
          <div class="image-row">
            <input
              class="input"
              bind:value={image}
              placeholder="molly-1.jpg (optional)"
              autocomplete="off"
              aria-label="Image"
            />
            <button
              type="button"
              class="btn ghost compact"
              onclick={defaultImageFromKey}
              disabled={!key.trim()}
              title="Set to key.jpg"
            >
              key.jpg
            </button>
          </div>
          {#if image.trim()}
            <label class="image-size">
              <span class="label">Image size</span>
              <select class="select" bind:value={imageSize}>
                <option value="small">Small (portrait in book)</option>
                <option value="medium">Medium (expanded in book)</option>
                <option value="large">Large (replaces location art)</option>
              </select>
            </label>
          {/if}
        </div>

        <label class="field manual-trigger-field">
          <span class="label">Manual trigger</span>
          <input
            class="input"
            bind:value={manualTrigger}
            placeholder="Button label (optional)"
            autocomplete="off"
            title="When set, the event waits for this scene action instead of firing on its own"
          />
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
        <TriggersEditor
          {triggers}
          onChange={(next) => (triggers = next)}
          title="Triggers"
          description="Every trigger must match. Leave empty for follow-up / debug-only events."
          emptyHint="No triggers — follow-up / debug-only events can stay empty."
        />
      </section>

      <section class="panel effects">
        <EffectsTemplatesEditor
          {effects}
          onChange={(next) => (effects = next)}
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

              <TriggersEditor
                triggers={option.triggers ?? []}
                onChange={(next) => setOptionTriggers(i, next)}
                title="Triggers"
                description="Hidden unless every trigger matches."
                emptyHint="Always available."
                nested
              />

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

              <div class="option-outcome">
                <div class="section-header tight">
                  <h3>Outcome</h3>
                  <div class="outcome-mode">
                    <button
                      type="button"
                      class="btn ghost compact"
                      class:active={!option.attributeCheck}
                      onclick={() => clearAttributeCheck(i)}>Direct effects</button
                    >
                    <button
                      type="button"
                      class="btn ghost compact"
                      class:active={!!option.attributeCheck}
                      onclick={() => enableAttributeCheck(i)}>Attribute check</button
                    >
                  </div>
                </div>

                {#if option.attributeCheck}
                  <div class="check-fields">
                    <label class="field">
                      <span class="label">Attribute</span>
                      <select
                        class="input"
                        value={option.attributeCheck.attribute}
                        onchange={(e) =>
                          setAttributeCheckField(
                            i,
                            'attribute',
                            (e.currentTarget as HTMLSelectElement)
                              .value as EventOptionAttributeCheck['attribute']
                          )}
                      >
                        {#each attributeKeys as attr (attr)}
                          <option value={attr}>{attr}</option>
                        {/each}
                      </select>
                    </label>
                    <label class="field">
                      <span class="label">Difficulty</span>
                      <select
                        class="input"
                        value={option.attributeCheck.difficulty}
                        onchange={(e) =>
                          setAttributeCheckField(
                            i,
                            'difficulty',
                            (e.currentTarget as HTMLSelectElement).value as SkillCheckDifficultyName
                          )}
                      >
                        {#each difficultyKeys as diff (diff)}
                          <option value={diff}>{skillCheckDifficultyLabels[diff]}</option>
                        {/each}
                      </select>
                    </label>
                  </div>

                  <EffectsTemplatesEditor
                    effects={option.attributeCheck.successEffects ?? []}
                    onChange={(next) => setAttributeCheckEffects(i, 'successEffects', next)}
                    title="On success"
                    nested
                  />
                  <EffectsTemplatesEditor
                    effects={option.attributeCheck.failureEffects ?? []}
                    onChange={(next) => setAttributeCheckEffects(i, 'failureEffects', next)}
                    title="On failure"
                    nested
                  />
                {:else}
                  <EffectsTemplatesEditor
                    effects={option.effects ?? []}
                    onChange={(next) => setOptionEffects(i, next)}
                    title="Option effects"
                    nested
                  />
                {/if}
              </div>
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

  .title-field {
    width: 16rem;
    flex-shrink: 0;
  }

  .arc-field {
    width: 12rem;
    flex-shrink: 0;
  }

  .emotion-field {
    width: 10rem;
    flex-shrink: 0;
  }

  .image-field {
    width: 16rem;
    flex-shrink: 0;
  }

  .manual-trigger-field {
    width: 16rem;
    flex-shrink: 0;
  }

  .image-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .image-row .input {
    flex: 1;
    min-width: 0;
  }

  .image-size {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.4rem;
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

  .option-action,
  .option-outcome {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .outcome-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .outcome-mode .btn.active {
    background: rgba(175, 142, 103, 0.22);
    border-color: var(--color-brass);
    color: var(--color-golden);
  }

  .check-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
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
