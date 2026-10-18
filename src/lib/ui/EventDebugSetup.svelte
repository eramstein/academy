<script lang="ts">
  import { confirmEventDebug, eventDebugSession } from './event-debug-session.svelte';

  let {
    onresult,
    oncancel,
  }: {
    onresult: (result: { ok: boolean; message: string }) => void;
    oncancel: () => void;
  } = $props();

  const plan = $derived(eventDebugSession.plan);
  const groups = $derived.by(() => {
    const current = eventDebugSession.plan;
    if (!current) return [];
    const titles = {
      prerequisite: 'Prior story',
      scene: 'This scene',
      branch: 'Branches in this event',
    } as const;
    return (['prerequisite', 'scene', 'branch'] as const)
      .map((group) => ({
        group,
        title: titles[group],
        toggles: current.toggles.filter((toggle) => toggle.group === group),
      }))
      .filter((group) => group.toggles.length > 0);
  });
  const clearsStoryTags = $derived(
    eventDebugSession.plan?.toggles.some(
      (toggle) => toggle.group === 'branch' && toggle.action.kind === 'story_tag'
    ) ?? false
  );

  function toggleId(id: string) {
    eventDebugSession.enabled[id] = !eventDebugSession.enabled[id];
  }
</script>

{#if plan}
  <div class="debug-setup">
    <div class="debug-title">{plan.title}</div>
    <div class="debug-key">{plan.eventKey}</div>
    {#each plan.notices as notice (notice)}
      <p class="debug-notice">{notice}</p>
    {/each}
    {#each groups as group (group.group)}
      <div class="debug-group">{group.title}</div>
      {#if group.group === 'prerequisite'}
        <p class="debug-hint">Marks earlier beats as done. Does not replay their rewards.</p>
      {/if}
      {#if group.group === 'branch' && (clearsStoryTags || plan.passageChoice)}
        <p class="debug-hint">
          {#if clearsStoryTags}Unchecked story tags here are cleared.{/if}
          {#if plan.passageChoice}Passage text uses the first match.{/if}
        </p>
      {/if}
      {#each group.toggles as toggle (toggle.id)}
        <label class="debug-row">
          <input
            type="checkbox"
            checked={!!eventDebugSession.enabled[toggle.id]}
            onchange={() => toggleId(toggle.id)}
          />
          <span class="debug-copy">
            <span class="debug-label">{toggle.label}</span>
            {#if toggle.detail}
              <span class="debug-detail">{toggle.detail}</span>
            {/if}
          </span>
        </label>
      {/each}
    {/each}
    <div class="debug-actions">
      <button type="button" class="primary" onclick={() => onresult(confirmEventDebug(true))}>
        Start
      </button>
      <button type="button" onclick={() => onresult(confirmEventDebug(false))}>Unchanged</button>
      <button type="button" onclick={oncancel}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .debug-setup {
    background: #1a1a1a;
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    font-family: monospace;
    font-size: 0.8rem;
    max-height: min(70vh, 520px);
    overflow: auto;
    padding: 10px 12px 12px;
  }

  .debug-title {
    font-size: 0.95rem;
    color: #f0e6c8;
  }

  .debug-key,
  .debug-detail,
  .debug-hint,
  .debug-notice {
    color: #a89880;
  }

  .debug-key {
    margin-bottom: 6px;
  }

  .debug-notice,
  .debug-hint {
    margin: 0 0 6px;
    line-height: 1.4;
  }

  .debug-group {
    margin: 10px 0 4px;
    color: #af8e67;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .debug-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 6px;
    cursor: pointer;
  }

  .debug-copy {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .debug-label {
    color: #e0e0e0;
  }

  .debug-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  .debug-actions button {
    font-family: monospace;
    font-size: 0.8rem;
    background: #2a2a2a;
    color: #e0e0e0;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
  }

  .debug-actions button.primary {
    border-color: #6fcf97;
    color: #6fcf97;
  }
</style>
