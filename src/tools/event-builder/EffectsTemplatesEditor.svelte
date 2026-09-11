<script lang="ts">
  import { ResourceType, type EventEffectsTemplate } from '@/lib/_model';
  import { SceneEffectTemplates } from '@/lib/sim/effects/_templates';

  let {
    effects,
    onChange,
    title = 'Effects',
    description = '',
    nested = false,
  }: {
    effects: EventEffectsTemplate[];
    onChange: (effects: EventEffectsTemplate[]) => void;
    title?: string;
    description?: string;
    nested?: boolean;
  } = $props();

  const effectNames = Object.keys(SceneEffectTemplates);
  const resourceTypes = Object.values(ResourceType);

  function defaultArgs(effectTemplate: string): Record<string, any> {
    switch (effectTemplate) {
      case 'getDeck':
        return { deckKey: 'base_red' };
      case 'addResource':
        return { resourceType: ResourceType.MagicDust, amount: 1 };
      default:
        return {};
    }
  }

  function update(next: EventEffectsTemplate[]) {
    onChange(next);
  }

  function addEffect() {
    const effectTemplate = effectNames[0] ?? 'getDeck';
    update([...effects, { effectTemplate, args: defaultArgs(effectTemplate) }]);
  }

  function removeEffect(index: number) {
    update(effects.filter((_, i) => i !== index));
  }

  function setEffectTemplate(index: number, effectTemplate: string) {
    update(
      effects.map((effect, i) =>
        i === index ? { effectTemplate, args: defaultArgs(effectTemplate) } : effect
      )
    );
  }

  function setArg(index: number, key: string, value: unknown) {
    update(
      effects.map((effect, i) =>
        i === index ? { ...effect, args: { ...effect.args, [key]: value } } : effect
      )
    );
  }
</script>

<div class="effects-editor" class:nested>
  <div class="section-header">
    <div class="title-block">
      <h3 class:panel-title={!nested}>{title}</h3>
      {#if description}
        <p class="desc">{description}</p>
      {/if}
    </div>
    <button type="button" class="btn ghost" onclick={addEffect}>Add</button>
  </div>

  {#if effects.length === 0}
    <p class="hint">None</p>
  {:else}
    <ul class="stack">
      {#each effects as effect, i (i)}
        <li class="effect-row">
          <select
            class="input template"
            value={effect.effectTemplate}
            aria-label="Effect template"
            onchange={(e) =>
              setEffectTemplate(i, (e.currentTarget as HTMLSelectElement).value)}
          >
            {#each effectNames as name (name)}
              <option value={name}>{name}</option>
            {/each}
          </select>

          {#if effect.effectTemplate === 'getDeck'}
            <input
              class="input arg"
              value={effect.args.deckKey ?? ''}
              placeholder="deck key"
              aria-label="Deck key"
              oninput={(e) =>
                setArg(i, 'deckKey', (e.currentTarget as HTMLInputElement).value)}
            />
          {:else if effect.effectTemplate === 'addResource'}
            <select
              class="input arg"
              value={effect.args.resourceType ?? ResourceType.MagicDust}
              aria-label="Resource type"
              onchange={(e) =>
                setArg(i, 'resourceType', (e.currentTarget as HTMLSelectElement).value)}
            >
              {#each resourceTypes as type (type)}
                <option value={type}>{type}</option>
              {/each}
            </select>
            <input
              class="input narrow"
              type="number"
              min="0"
              value={effect.args.amount ?? 0}
              aria-label="Amount"
              oninput={(e) =>
                setArg(i, 'amount', Number((e.currentTarget as HTMLInputElement).value))}
            />
          {/if}

          <button
            type="button"
            class="btn icon danger"
            onclick={() => removeEffect(i)}
            aria-label="Remove effect">×</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .effects-editor {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .effects-editor.nested {
    margin-top: 0.35rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(175, 142, 103, 0.2);
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
    gap: 0.35rem;
  }

  .effect-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .input {
    padding: 0.35rem 0.5rem;
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

  .template {
    width: 9.5rem;
    flex-shrink: 0;
  }

  .arg {
    width: 9rem;
    min-width: 0;
  }

  .narrow {
    width: 4.5rem;
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
