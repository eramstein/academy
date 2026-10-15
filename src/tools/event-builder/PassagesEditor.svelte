<script lang="ts" module>
  import { EventTriggerType, type EventPassage, type EventTemplate, type EventTrigger } from '@/lib/_model';

  export interface PassageVariantDraft {
    id: number;
    triggers: EventTrigger[];
    text: string;
  }

  export interface PassageDraft {
    id: number;
    key: string;
    variants: PassageVariantDraft[];
    fallback: string;
  }

  let nextDraftId = 1;

  function nextId(): number {
    nextDraftId += 1;
    return nextDraftId;
  }

  function defaultVariant(): PassageVariantDraft {
    return {
      id: nextId(),
      triggers: [
        {
          triggerType: EventTriggerType.StoryTag,
          parameters: { tag: '', value: 1 },
        },
      ],
      text: '',
    };
  }

  export function passageDraftsFrom(
    passages: EventTemplate['passages'] | undefined
  ): PassageDraft[] {
    return Object.entries(passages ?? {}).map(([passageKey, passage]) => ({
      id: nextId(),
      key: passageKey,
      variants: (passage.variants ?? []).map((variant) => ({
        id: nextId(),
        triggers: JSON.parse(JSON.stringify(variant.triggers ?? [])) as EventTrigger[],
        text: variant.text ?? '',
      })),
      fallback: passage.fallback ?? '',
    }));
  }

  export function passagesFromDrafts(drafts: PassageDraft[]): EventTemplate['passages'] {
    const record: NonNullable<EventTemplate['passages']> = {};
    for (const draft of drafts) {
      const passageKey = draft.key.trim();
      if (!passageKey || record[passageKey]) continue;
      const passage: EventPassage = {
        variants: draft.variants.map((variant) => ({
          triggers: variant.triggers.map((trigger) => ({
            triggerType: trigger.triggerType,
            parameters: { ...trigger.parameters },
          })) as EventTrigger[],
          text: variant.text,
        })),
      };
      if (draft.fallback !== '') {
        passage.fallback = draft.fallback;
      }
      record[passageKey] = passage;
    }
    return Object.keys(record).length > 0 ? record : undefined;
  }
</script>

<script lang="ts">
  import TriggersEditor from './TriggersEditor.svelte';

  let {
    drafts,
    onChange,
    onInsert,
  }: {
    drafts: PassageDraft[];
    onChange: (drafts: PassageDraft[]) => void;
    onInsert: (passageKey: string) => void;
  } = $props();

  const duplicateKeys = $derived.by(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const draft of drafts) {
      const passageKey = draft.key.trim();
      if (!passageKey) continue;
      if (seen.has(passageKey)) dupes.add(passageKey);
      else seen.add(passageKey);
    }
    return dupes;
  });

  function addPassage() {
    const used = new Set(drafts.map((draft) => draft.key.trim()));
    let passageKey = 'passage';
    let n = 2;
    while (used.has(passageKey)) {
      passageKey = `passage${n}`;
      n += 1;
    }
    onChange([
      ...drafts,
      {
        id: nextId(),
        key: passageKey,
        variants: [defaultVariant()],
        fallback: '',
      },
    ]);
  }

  function removePassage(index: number) {
    onChange(drafts.filter((_, i) => i !== index));
  }

  function addVariant(index: number) {
    const draft = drafts[index];
    draft.variants = [...draft.variants, defaultVariant()];
  }

  function removeVariant(passageIndex: number, variantIndex: number) {
    const draft = drafts[passageIndex];
    draft.variants = draft.variants.filter((_, i) => i !== variantIndex);
  }

  function moveVariant(passageIndex: number, variantIndex: number, direction: -1 | 1) {
    const draft = drafts[passageIndex];
    const target = variantIndex + direction;
    if (target < 0 || target >= draft.variants.length) return;
    const next = [...draft.variants];
    const [item] = next.splice(variantIndex, 1);
    next.splice(target, 0, item);
    draft.variants = next;
  }
</script>

<div class="passages-editor">
  <div class="section-header">
    <div>
      <h2>Passages</h2>
      <p class="desc">
        Insert <code>{'{{ key }}'}</code> in the event text. The first variant whose triggers all match
        is used; otherwise the fallback.
      </p>
    </div>
    <button type="button" class="btn ghost" onclick={addPassage}>Add passage</button>
  </div>

  {#if drafts.length === 0}
    <p class="hint">No passages. Event text is shown as written.</p>
  {:else}
    <ul class="passages">
      {#each drafts as draft, i (draft.id)}
        <li class="passage-card">
          <div class="passage-header">
            <label class="field key-field">
              <span class="label">Key</span>
              <input class="input" bind:value={draft.key} placeholder="intro" autocomplete="off" />
            </label>
            <button
              type="button"
              class="btn ghost compact"
              onclick={() => onInsert(draft.key)}
              disabled={!draft.key.trim()}
            >
              Insert in text
            </button>
            <button
              type="button"
              class="btn icon danger"
              onclick={() => removePassage(i)}
              aria-label="Remove passage">×</button
            >
          </div>
          {#if !draft.key.trim()}
            <p class="warn">Key is required. This passage is omitted on save.</p>
          {:else if duplicateKeys.has(draft.key.trim())}
            <p class="warn">Duplicate key. Only the first passage with this key is saved.</p>
          {/if}

          <div class="variants-header">
            <h3>Variants</h3>
            <button type="button" class="btn ghost compact" onclick={() => addVariant(i)}>
              Add variant
            </button>
          </div>

          {#if draft.variants.length === 0}
            <p class="hint">No variants. The fallback is always used.</p>
          {:else}
            <ul class="variants">
              {#each draft.variants as variant, j (variant.id)}
                <li class="variant-card">
                  <div class="variant-header">
                    <span class="variant-index">Variant {j + 1}</span>
                    <div class="variant-actions">
                      <button
                        type="button"
                        class="btn ghost compact"
                        onclick={() => moveVariant(i, j, -1)}
                        disabled={j === 0}
                        aria-label="Move variant up">Up</button
                      >
                      <button
                        type="button"
                        class="btn ghost compact"
                        onclick={() => moveVariant(i, j, 1)}
                        disabled={j === draft.variants.length - 1}
                        aria-label="Move variant down">Down</button
                      >
                      <button
                        type="button"
                        class="btn icon danger"
                        onclick={() => removeVariant(i, j)}
                        aria-label="Remove variant">×</button
                      >
                    </div>
                  </div>
                  <TriggersEditor
                    triggers={variant.triggers}
                    onChange={(next) => (variant.triggers = next)}
                    title="When"
                    description="All of these must match. First matching variant wins."
                    emptyHint="No triggers — this variant always matches and hides the ones below. Prefer Fallback for that."
                    nested
                  />
                  <label class="field">
                    <span class="label">Text</span>
                    <textarea
                      class="input textarea"
                      bind:value={variant.text}
                      rows="3"
                      placeholder="Prose used when this variant matches"
                    ></textarea>
                  </label>
                </li>
              {/each}
            </ul>
          {/if}

          <label class="field">
            <span class="label">Fallback</span>
            <textarea
              class="input textarea"
              bind:value={draft.fallback}
              rows="2"
              placeholder="Otherwise… (optional)"
            ></textarea>
          </label>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .passages-editor {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .section-header,
  .passage-header,
  .variants-header,
  .variant-header,
  .variant-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .passage-header {
    align-items: flex-end;
  }

  .variant-header {
    margin-bottom: 0.15rem;
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

  .desc,
  .hint,
  .warn {
    margin: 0.2rem 0 0;
    color: var(--color-muted-label);
    font-size: 0.8rem;
  }

  .warn {
    color: #fca5a5;
  }

  code {
    font-family: monospace;
    font-size: 0.85em;
    color: var(--color-cream);
  }

  .passages,
  .variants {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .passage-card,
  .variant-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.7rem 0.75rem;
    background: rgba(10, 14, 20, 0.55);
    border: 1px solid rgba(175, 142, 103, 0.35);
    border-radius: 4px;
    min-width: 0;
  }

  .passage-card {
    border-left: 3px solid var(--color-brass);
  }

  .key-field {
    flex: 1;
    min-width: 8rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .label,
  .variant-index {
    font-size: 0.72rem;
    color: var(--color-muted-label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .variant-index {
    color: var(--color-brass);
    font-weight: 600;
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

  .textarea {
    resize: vertical;
    min-height: 3.5rem;
    line-height: 1.4;
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
    opacity: 0.45;
    cursor: not-allowed;
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

  .btn.danger {
    color: #fca5a5;
    border-color: rgba(220, 38, 38, 0.35);
  }
</style>
