<script lang="ts" module>
  import type {
    EventEffect,
    EventOptionAttributeCheck,
    EventOptionTemplate,
    EventTrigger,
  } from '@/lib/_model';

  function cloneTriggers(optionTriggers: EventTrigger[] | undefined): EventTrigger[] | undefined {
    if (!optionTriggers || optionTriggers.length === 0) return undefined;
    return optionTriggers.map((trigger) => ({
      triggerType: trigger.triggerType,
      parameters: { ...trigger.parameters },
    })) as EventTrigger[];
  }

  function cloneEffects(effects: EventEffect[] | undefined): EventEffect[] | undefined {
    if (!effects || effects.length === 0) return undefined;
    return effects.map((effect) => ({
      type: effect.type,
      parameters: { ...effect.parameters },
    }));
  }

  function nodeKey(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  /** Drop empty labels and blank node keys. Keeps effect objects as authored. */
  export function normalizeOptionTemplates(options: EventOptionTemplate[]): EventOptionTemplate[] {
    return options
      .map((option) => {
        const next: EventOptionTemplate = {
          text: option.text.trim(),
        };

        const optionTriggers = cloneTriggers(option.triggers);
        if (optionTriggers) next.triggers = optionTriggers;

        if (option.actionTemplate?.actionTemplate) {
          const args = { ...(option.actionTemplate.args ?? {}) };
          if (option.actionTemplate.actionTemplate === 'purchase') {
            const items = { ...((args.items as Record<string, unknown> | undefined) ?? {}) };
            const rawPossessions =
              (items.possessions as Partial<Record<string, string>> | undefined) ?? {};
            const possessions: Record<string, string> = {};
            for (const [type, name] of Object.entries(rawPossessions)) {
              if (typeof name === 'string' && name.trim()) {
                possessions[type] = name.trim();
              }
            }
            args.items = {
              ...items,
              ...(Object.keys(possessions).length > 0 ? { possessions } : {}),
            };
            if (
              args.items &&
              typeof args.items === 'object' &&
              !('possessions' in (args.items as object)) &&
              !('resources' in (args.items as object))
            ) {
              delete args.items;
            }
          }
          next.actionTemplate = {
            actionTemplate: option.actionTemplate.actionTemplate,
            args,
          };
        }

        const nextNode = nodeKey(option.nextNode);
        if (nextNode) next.nextNode = nextNode;

        if (option.attributeCheck) {
          const check: EventOptionAttributeCheck = {
            attribute: option.attributeCheck.attribute,
            difficulty: option.attributeCheck.difficulty,
          };
          const successEffects = cloneEffects(option.attributeCheck.successEffects);
          const failureEffects = cloneEffects(option.attributeCheck.failureEffects);
          if (successEffects) check.successEffects = successEffects;
          if (failureEffects) check.failureEffects = failureEffects;
          const successNode = nodeKey(option.attributeCheck.successNode);
          const failureNode = nodeKey(option.attributeCheck.failureNode);
          if (successNode) check.successNode = successNode;
          if (failureNode) check.failureNode = failureNode;
          next.attributeCheck = check;
        } else if (option.effects && option.effects.length > 0) {
          next.effects = cloneEffects(option.effects);
        }

        return next;
      })
      .filter((option) => option.text.length > 0);
  }
</script>

<script lang="ts">
  import { PossessionType, type ActionTemplate } from '@/lib/_model';
  import { SceneActionTemplates } from '@/lib/sim/actions/_templates';
  import {
    skillCheckDifficultyKeys,
    skillCheckDifficultyLabels,
    type SkillCheckDifficultyName,
  } from '@/lib/sim/attribute-checks';
  import EffectsTemplatesEditor from './EffectsTemplatesEditor.svelte';
  import TriggersEditor from './TriggersEditor.svelte';

  let {
    options,
    nodeKeys = [],
    listId,
    onChange,
  }: {
    options: EventOptionTemplate[];
    nodeKeys?: string[];
    listId: string;
    onChange: (next: EventOptionTemplate[]) => void;
  } = $props();

  const actionNames = Object.keys(SceneActionTemplates);
  const possessionTypes = Object.values(PossessionType);
  const attributeKeys = ['dexterity', 'intelligence', 'vitality', 'charisma', 'aura'] as const;
  const difficultyKeys = skillCheckDifficultyKeys;

  function patch(index: number, option: EventOptionTemplate) {
    onChange(options.map((item, i) => (i === index ? option : item)));
  }

  function addOption() {
    onChange([...options, { text: '', effects: [] }]);
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function setNodeKey(
    index: number,
    field: 'nextNode' | 'successNode' | 'failureNode',
    value: string
  ) {
    const option = options[index];
    const trimmed = value.trim() ? value : undefined;
    if (field === 'nextNode') {
      const next = { ...option };
      if (trimmed) next.nextNode = trimmed;
      else delete next.nextNode;
      patch(index, next);
      return;
    }
    if (!option.attributeCheck) return;
    const check = { ...option.attributeCheck };
    if (trimmed) check[field] = trimmed;
    else delete check[field];
    patch(index, { ...option, attributeCheck: check });
  }

  function defaultPurchaseArgs(): Record<string, unknown> {
    return {
      cost: 0,
      items: {
        possessions: {},
      },
    };
  }

  function defaultArgsForAction(actionTemplate: string): Record<string, unknown> {
    if (actionTemplate === 'purchase') return defaultPurchaseArgs();
    return {};
  }

  function defaultActionTemplate(): ActionTemplate {
    const actionTemplate = actionNames.includes('purchase') ? 'purchase' : (actionNames[0] ?? '');
    return {
      actionTemplate,
      args: defaultArgsForAction(actionTemplate),
    };
  }

  function setActionTemplateName(index: number, actionTemplate: string) {
    const option = options[index];
    patch(index, {
      ...option,
      actionTemplate: {
        actionTemplate,
        args: defaultArgsForAction(actionTemplate),
      },
    });
  }

  function clearActionTemplate(index: number) {
    const { actionTemplate: _removed, ...rest } = options[index];
    patch(index, rest);
  }

  function enableActionTemplate(index: number) {
    patch(index, {
      ...options[index],
      actionTemplate: defaultActionTemplate(),
    });
  }

  function setActionArgs(index: number, args: Record<string, unknown>) {
    const option = options[index];
    if (!option.actionTemplate) return;
    patch(index, {
      ...option,
      actionTemplate: {
        ...option.actionTemplate,
        args,
      },
    });
  }

  function setPurchaseCost(index: number, cost: number) {
    const option = options[index];
    if (!option.actionTemplate) return;
    setActionArgs(index, {
      ...option.actionTemplate.args,
      cost,
    });
  }

  function setPurchasePossession(index: number, type: PossessionType, name: string) {
    const option = options[index];
    if (!option.actionTemplate) return;
    const items = {
      ...((option.actionTemplate.args?.items as Record<string, unknown> | undefined) ?? {}),
    };
    const possessions = {
      ...((items.possessions as Partial<Record<PossessionType, string>> | undefined) ?? {}),
    };
    if (name.trim()) {
      possessions[type] = name;
    } else {
      delete possessions[type];
    }
    setActionArgs(index, {
      ...option.actionTemplate.args,
      items: {
        ...items,
        possessions,
      },
    });
  }

  function setOptionEffects(index: number, next: EventEffect[]) {
    patch(index, { ...options[index], effects: next });
  }

  function setOptionTriggers(index: number, next: EventTrigger[]) {
    patch(index, { ...options[index], triggers: next });
  }

  function defaultAttributeCheck(): EventOptionAttributeCheck {
    return {
      attribute: 'charisma',
      difficulty: 'medium',
      successEffects: [],
      failureEffects: [],
    };
  }

  function enableAttributeCheck(index: number) {
    const option = options[index];
    const { effects: _removed, ...rest } = option;
    patch(index, {
      ...rest,
      attributeCheck: option.attributeCheck ?? defaultAttributeCheck(),
    });
  }

  function clearAttributeCheck(index: number) {
    const { attributeCheck: _removed, ...rest } = options[index];
    patch(index, { ...rest, effects: rest.effects ?? [] });
  }

  function setAttributeCheckField<K extends keyof EventOptionAttributeCheck>(
    index: number,
    field: K,
    value: EventOptionAttributeCheck[K]
  ) {
    const option = options[index];
    if (!option.attributeCheck) return;
    patch(index, {
      ...option,
      attributeCheck: {
        ...option.attributeCheck,
        [field]: value,
      },
    });
  }

  function setAttributeCheckEffects(
    index: number,
    branch: 'successEffects' | 'failureEffects',
    next: EventEffect[]
  ) {
    const option = options[index];
    if (!option.attributeCheck) return;
    patch(index, {
      ...option,
      attributeCheck: {
        ...option.attributeCheck,
        [branch]: next,
      },
    });
  }
</script>

<div class="options-editor">
  <div class="section-header">
    <h2>Options</h2>
    <button type="button" class="btn ghost" onclick={addOption}>Add option</button>
  </div>

  {#if nodeKeys.length > 0}
    <datalist id={listId}>
      {#each nodeKeys as nodeKey (nodeKey)}
        <option value={nodeKey}></option>
      {/each}
    </datalist>
  {/if}

  {#if options.length === 0}
    <p class="hint">No player options. The beat ends after its text.</p>
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

          <label class="field">
            <span class="label">Next node</span>
            <input
              class="input"
              list={listId}
              value={option.nextNode ?? ''}
              placeholder="Blank ends the event"
              oninput={(e) =>
                setNodeKey(i, 'nextNode', (e.currentTarget as HTMLInputElement).value)}
            />
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
              {#if option.actionTemplate.actionTemplate === 'purchase'}
                <div class="purchase-args">
                  <label class="field">
                    <span class="label">Cost (gold)</span>
                    <input
                      class="input"
                      type="number"
                      min="0"
                      value={(option.actionTemplate.args?.cost as number | undefined) ?? 0}
                      aria-label="Purchase cost"
                      oninput={(e) =>
                        setPurchaseCost(i, Number((e.currentTarget as HTMLInputElement).value))}
                    />
                  </label>
                  <div class="possessions-fields">
                    <span class="label">Possessions</span>
                    {#each possessionTypes as type (type)}
                      <label class="field tight">
                        <span class="label muted">{type}</span>
                        <input
                          class="input"
                          value={((
                            option.actionTemplate.args?.items as
                              | { possessions?: Partial<Record<PossessionType, string>> }
                              | undefined
                          )?.possessions?.[type] ?? '') as string}
                          placeholder="name"
                          aria-label={`Possession ${type} name`}
                          oninput={(e) =>
                            setPurchasePossession(
                              i,
                              type,
                              (e.currentTarget as HTMLInputElement).value
                            )}
                        />
                      </label>
                    {/each}
                  </div>
                </div>
              {:else}
                <p class="hint">Args default to empty for this template.</p>
              {/if}
            {:else}
              <p class="hint">No action. Leave empty when this choice opens a node.</p>
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
                <label class="field">
                  <span class="label">Success node</span>
                  <input
                    class="input"
                    list={listId}
                    value={option.attributeCheck.successNode ?? ''}
                    placeholder="Falls back to next node"
                    oninput={(e) =>
                      setNodeKey(i, 'successNode', (e.currentTarget as HTMLInputElement).value)}
                  />
                </label>
                <label class="field">
                  <span class="label">Failure node</span>
                  <input
                    class="input"
                    list={listId}
                    value={option.attributeCheck.failureNode ?? ''}
                    placeholder="Falls back to next node"
                    oninput={(e) =>
                      setNodeKey(i, 'failureNode', (e.currentTarget as HTMLInputElement).value)}
                  />
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
</div>

<style>
  .options-editor {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
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

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .section-header.tight {
    margin-bottom: 0.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .field.tight {
    gap: 0.15rem;
  }

  .purchase-args {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-top: 0.35rem;
  }

  .possessions-fields {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .label {
    font-size: 0.72rem;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .label.muted {
    text-transform: none;
    letter-spacing: 0;
    color: var(--color-cream);
    opacity: 0.75;
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
    .options-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
