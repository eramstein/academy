<script lang="ts">
  import {
    Emotion,
    type EventImageSize,
    type EventNode,
    type EventOptionTemplate,
    type EventTemplate,
    type EventTemplateEffect,
    type EventTrigger,
  } from '@/lib/_model';
  import EventOptionsEditor, { normalizeOptionTemplates } from './EventOptionsEditor.svelte';
  import EventTemplateEffectsEditor from './EventTemplateEffectsEditor.svelte';
  import PassagesEditor, {
    passageDraftsFrom,
    passagesFromDrafts,
    type PassageDraft,
  } from './PassagesEditor.svelte';
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
  let effects = $state<EventTemplateEffect[]>([]);
  let passageDrafts = $state<PassageDraft[]>([]);
  let nodeDrafts = $state<NodeDraft[]>([]);
  let error = $state('');
  let saving = $state(false);

  const emotions = Object.values(Emotion);
  const nodeKeys = $derived(
    nodeDrafts.map((draft) => draft.key.trim()).filter((nodeKey) => nodeKey.length > 0)
  );

  interface NodeDraft {
    id: number;
    key: string;
    title: string;
    text: string;
    emotion: string;
    image: string;
    imageSize: EventImageSize;
    triggers: EventTrigger[];
    effects: EventTemplateEffect[];
    options: EventOptionTemplate[];
    passageDrafts: PassageDraft[];
  }

  let nextNodeDraftId = 1;

  function nodeDraftFrom(nodeKey: string, node: EventNode): NodeDraft {
    nextNodeDraftId += 1;
    return {
      id: nextNodeDraftId,
      key: nodeKey,
      title: node.title ?? '',
      text: node.text ?? '',
      emotion: node.emotion ?? '',
      image: node.image ?? '',
      imageSize: node.imageSize ?? 'small',
      triggers: node.triggers ?? [],
      effects: node.effects ?? [],
      options: node.optionTemplates ?? [],
      passageDrafts: passageDraftsFrom(node.passages),
    };
  }

  function blankNodeDraft(): NodeDraft {
    nextNodeDraftId += 1;
    return {
      id: nextNodeDraftId,
      key: '',
      title: '',
      text: '',
      emotion: '',
      image: '',
      imageSize: 'small',
      triggers: [],
      effects: [],
      options: [],
      passageDrafts: [],
    };
  }

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
      passageDrafts = [];
      nodeDrafts = [];
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
    passageDrafts = passageDraftsFrom(cloned.passages);
    nodeDrafts = Object.entries(cloned.nodes ?? {}).map(([nodeKey, node]) =>
      nodeDraftFrom(nodeKey, node)
    );
  }

  function patchNode(id: number, patch: Partial<NodeDraft>) {
    nodeDrafts = nodeDrafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft));
  }

  function addNode() {
    nodeDrafts = [...nodeDrafts, blankNodeDraft()];
  }

  function removeNode(id: number) {
    nodeDrafts = nodeDrafts.filter((draft) => draft.id !== id);
  }

  function insertNodePassageToken(id: number, passageKey: string) {
    const draft = nodeDrafts.find((item) => item.id === id);
    if (!draft) return;
    const trimmed = passageKey.trim();
    if (!trimmed) return;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`).test(draft.text)) return;
    const token = `{{ ${trimmed} }}`;
    const text = draft.text.trim() ? `${draft.text.replace(/\s*$/, '')}\n\n${token}` : token;
    patchNode(id, { text });
  }

  function insertPassageToken(passageKey: string) {
    const trimmed = passageKey.trim();
    if (!trimmed) return;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`).test(text)) return;
    const token = `{{ ${trimmed} }}`;
    text = text.trim() ? `${text.replace(/\s*$/, '')}\n\n${token}` : token;
  }

  function defaultImageFromKey() {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    image = `${trimmedKey}.jpg`;
  }

  cloneEventFields(event);

  function buildNodes(): Record<string, EventNode> | undefined {
    const record: Record<string, EventNode> = {};
    for (const draft of nodeDrafts) {
      const nodeKey = draft.key.trim();
      if (!nodeKey || record[nodeKey]) continue;
      const node: EventNode = {
        text: draft.text.trim(),
        optionTemplates: normalizeOptionTemplates(draft.options),
      };
      if (draft.triggers.length > 0) {
        node.triggers = draft.triggers.map((trigger) => ({
          triggerType: trigger.triggerType,
          parameters: { ...trigger.parameters },
        })) as EventTrigger[];
      }
      if (draft.effects.length > 0) {
        node.effects = draft.effects.map((entry) => {
          const next: EventTemplateEffect = {
            effect: {
              type: entry.effect.type,
              parameters: { ...entry.effect.parameters },
            },
          };
          if (entry.triggers && entry.triggers.length > 0) {
            next.triggers = entry.triggers.map((trigger) => ({
              triggerType: trigger.triggerType,
              parameters: { ...trigger.parameters },
            })) as EventTrigger[];
          }
          return next;
        });
      }
      const nodeTitle = draft.title.trim();
      if (nodeTitle) node.title = nodeTitle;
      if (draft.emotion) node.emotion = draft.emotion as Emotion;
      const nodeImage = draft.image.trim();
      if (nodeImage) {
        node.image = nodeImage;
        if (draft.imageSize !== 'small') node.imageSize = draft.imageSize;
      }
      const passages = passagesFromDrafts(draft.passageDrafts);
      if (passages) node.passages = passages;
      record[nodeKey] = node;
    }
    return Object.keys(record).length > 0 ? record : undefined;
  }

  function buildEvent(): EventTemplate {
    const built: EventTemplate = {
      key: key.trim(),
      text: text.trim(),
      triggers: triggers.map((trigger) => ({
        triggerType: trigger.triggerType,
        parameters: { ...trigger.parameters },
      })) as EventTrigger[],
      optionTemplates: normalizeOptionTemplates(options),
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
      built.effects = effects.map((entry) => {
        const next: EventTemplateEffect = {
          effect: {
            type: entry.effect.type,
            parameters: { ...entry.effect.parameters },
          },
        };
        if (entry.triggers && entry.triggers.length > 0) {
          next.triggers = entry.triggers.map((trigger) => ({
            triggerType: trigger.triggerType,
            parameters: { ...trigger.parameters },
          })) as EventTrigger[];
        }
        return next;
      });
    }

    const triggerLabel = manualTrigger.trim();
    if (triggerLabel) {
      built.manualTrigger = triggerLabel;
    }

    const builtPassages = passagesFromDrafts(passageDrafts);
    if (builtPassages) {
      built.passages = builtPassages;
    }

    const builtNodes = buildNodes();
    if (builtNodes) {
      built.nodes = builtNodes;
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

    const seenNodeKeys = new Set<string>();
    for (const draft of nodeDrafts) {
      const nodeKey = draft.key.trim();
      if (!nodeKey) {
        error = 'Every node needs a key.';
        return;
      }
      if (seenNodeKeys.has(nodeKey)) {
        error = `Node key "${nodeKey}" is used more than once.`;
        return;
      }
      seenNodeKeys.add(nodeKey);
      if (!draft.text.trim()) {
        error = `Node "${nodeKey}" needs text.`;
        return;
      }
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
        <textarea
          class="input textarea"
          bind:value={text}
          rows="3"
          placeholder={'Event narration… Use {{ passageKey }} for a conditional passage.'}
        ></textarea>
      </label>
    </section>

    <section class="panel">
      <PassagesEditor
        drafts={passageDrafts}
        onChange={(next) => (passageDrafts = next)}
        onInsert={insertPassageToken}
      />
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
        <EventTemplateEffectsEditor
          {effects}
          onChange={(next) => (effects = next)}
          title="Effects"
          description="Applied when the event fires, before options. Optional per-effect triggers gate that effect only."
        />
      </section>
    </div>

    <section class="panel options">
      <EventOptionsEditor
        {options}
        {nodeKeys}
        listId="root-node-keys"
        onChange={(next) => (options = next)}
      />
    </section>

    <section class="panel nodes">
      <div class="section-header">
        <h2>Nodes</h2>
        <button type="button" class="btn ghost" onclick={addNode}>Add node</button>
      </div>
      <p class="hint">
        Later beats in this event. An option's next node opens one instead of ending the event.
      </p>

      {#if nodeDrafts.length === 0}
        <p class="hint">No nodes. Every option ends the event.</p>
      {:else}
        <ul class="node-list">
          {#each nodeDrafts as draft (draft.id)}
            <li class="node-card">
              <div class="section-header">
                <h3>Node</h3>
                <button
                  type="button"
                  class="btn icon danger"
                  onclick={() => removeNode(draft.id)}
                  aria-label="Remove node">×</button
                >
              </div>
              <div class="basics-meta">
                <label class="field key-field">
                  <span class="label">Key</span>
                  <input class="input" bind:value={draft.key} placeholder="tuition_talk" />
                </label>
                <label class="field title-field">
                  <span class="label">Title</span>
                  <input class="input" bind:value={draft.title} placeholder="Optional heading" />
                </label>
                <label class="field emotion-field">
                  <span class="label">Emotion</span>
                  <select class="input" bind:value={draft.emotion}>
                    <option value="">(none)</option>
                    {#each emotions as value (value)}
                      <option {value}>{value}</option>
                    {/each}
                  </select>
                </label>
                <div class="field image-field">
                  <span class="label">Image</span>
                  <input class="input" bind:value={draft.image} placeholder="optional.jpg" />
                  {#if draft.image.trim()}
                    <label class="image-size">
                      <span class="label">Image size</span>
                      <select class="select" bind:value={draft.imageSize}>
                        <option value="small">Small (portrait in book)</option>
                        <option value="medium">Medium (expanded in book)</option>
                        <option value="large">Large (replaces location art)</option>
                      </select>
                    </label>
                  {/if}
                </div>
              </div>
              <label class="field text-field">
                <span class="label">Text</span>
                <textarea class="input textarea" rows="3" bind:value={draft.text}></textarea>
              </label>
              <PassagesEditor
                drafts={draft.passageDrafts}
                onChange={(next) => patchNode(draft.id, { passageDrafts: next })}
                onInsert={(passageKey) => insertNodePassageToken(draft.id, passageKey)}
              />
              <TriggersEditor
                triggers={draft.triggers}
                onChange={(next) => patchNode(draft.id, { triggers: next })}
                title="Entry triggers"
                description="Checked when the previous beat's options are built. Empty means always enterable."
                emptyHint="Always enterable."
                nested
              />
              <EventTemplateEffectsEditor
                effects={draft.effects}
                onChange={(next) => patchNode(draft.id, { effects: next })}
                title="On enter"
                description="Applied when this node opens, before its passages and options. Optional per-effect triggers gate that effect only."
              />
              <EventOptionsEditor
                options={draft.options}
                {nodeKeys}
                listId={`node-keys-${draft.id}`}
                onChange={(next) => patchNode(draft.id, { options: next })}
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

  .node-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .node-card {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.75rem;
    background: rgba(10, 14, 20, 0.45);
    border: 1px solid rgba(175, 142, 103, 0.35);
    border-left: 3px solid var(--color-brass);
    border-radius: 4px;
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
  }
</style>
