<script lang="ts">
  import {
    EventEffectType,
    type EventEffect,
    type EventTemplateEffect,
    type EventTrigger,
  } from '@/lib/_model';
  import EffectsTemplatesEditor from './EffectsTemplatesEditor.svelte';
  import TriggersEditor from './TriggersEditor.svelte';

  let {
    effects,
    onChange,
    title = 'Effects',
    description = 'Applied when the event fires, before options. Optional per-effect triggers gate that effect only.',
  }: {
    effects: EventTemplateEffect[];
    onChange: (effects: EventTemplateEffect[]) => void;
    title?: string;
    description?: string;
  } = $props();

  function update(next: EventTemplateEffect[]) {
    onChange(next);
  }

  function addEntry() {
    update([
      ...effects,
      {
        effect: {
          type: EventEffectType.AddStoryTag,
          parameters: { tag: '', amount: 1 },
        },
      },
    ]);
  }

  function removeEntry(index: number) {
    update(effects.filter((_, i) => i !== index));
  }

  function setEffect(index: number, nextEffects: EventEffect[]) {
    const effect = nextEffects[0];
    if (!effect) {
      removeEntry(index);
      return;
    }
    update(effects.map((entry, i) => (i === index ? { ...entry, effect } : entry)));
  }

  function setTriggers(index: number, triggers: EventTrigger[]) {
    update(
      effects.map((entry, i) => {
        if (i !== index) return entry;
        if (triggers.length === 0) {
          const { triggers: _removed, ...rest } = entry;
          return rest;
        }
        return { ...entry, triggers };
      })
    );
  }
</script>

<div class="template-effects-editor">
  <div class="section-header">
    <div class="title-block">
      <h3 class="panel-title">{title}</h3>
      {#if description}
        <p class="desc">{description}</p>
      {/if}
    </div>
    <button type="button" class="btn ghost" onclick={addEntry}>Add</button>
  </div>

  {#if effects.length === 0}
    <p class="hint">None</p>
  {:else}
    <ul class="stack">
      {#each effects as entry, i (i)}
        <li class="entry">
          <div class="entry-header">
            <span class="entry-label">Effect {i + 1}</span>
            <button
              type="button"
              class="btn icon danger"
              onclick={() => removeEntry(i)}
              aria-label="Remove effect">×</button
            >
          </div>
          <EffectsTemplatesEditor
            effects={[entry.effect]}
            onChange={(next) => setEffect(i, next)}
            title="Effect"
            nested
            allowAdd={false}
          />
          <TriggersEditor
            triggers={entry.triggers ?? []}
            onChange={(next) => setTriggers(i, next)}
            title="Only if"
            description="Optional. Every trigger must match or this effect is skipped. Leave empty to always apply."
            emptyHint="No extra conditions — always apply when the event fires."
            nested
          />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .template-effects-editor {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  h3 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h3.panel-title {
    font-size: 0.85rem;
    color: var(--color-brass);
  }

  .desc {
    margin: 0;
    color: var(--color-muted-label);
    font-size: 0.75rem;
  }

  .stack {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.5rem;
    border: 1px solid rgba(175, 142, 103, 0.25);
    border-radius: 3px;
    background: rgba(175, 142, 103, 0.04);
  }

  .entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .entry-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .hint {
    margin: 0;
    color: var(--color-muted-label);
    font-size: 0.8rem;
  }

  .btn {
    padding: 0.3rem 0.55rem;
    border-radius: 3px;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn.ghost {
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.35);
  }

  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .btn.icon {
    padding: 0.2rem 0.45rem;
    line-height: 1;
    font-size: 1.1rem;
    background: transparent;
    color: var(--color-cream);
    border-color: rgba(175, 142, 103, 0.25);
  }

  .btn.danger {
    color: #fca5a5;
    border-color: rgba(220, 38, 38, 0.35);
  }

  .btn.icon:hover {
    background: rgba(255, 255, 255, 0.06);
  }
</style>
