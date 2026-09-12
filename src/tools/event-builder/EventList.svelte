<script lang="ts">
  import { npcs } from '@/data/npcs';
  import type { EventTemplate, EventTrigger } from '@/lib/_model';
  import CharacterArcGraph from './CharacterArcGraph.svelte';

  let {
    events,
    selectedArc = $bindable<string | null>(null),
    onCreate,
    onCreateFollowUp,
    onEdit,
  }: {
    events: EventTemplate[];
    selectedArc?: string | null;
    onCreate: () => void;
    onCreateFollowUp: (fromEvent: EventTemplate) => void;
    onEdit: (event: EventTemplate) => void;
  } = $props();

  const arcCharacters = $derived.by(() => {
    const keys = new Set<string>();
    for (const event of events) {
      if (event.characterArc) keys.add(event.characterArc);
    }
    return [...keys].sort((a, b) => displayName(a).localeCompare(displayName(b)));
  });

  const arcEvents = $derived(
    selectedArc ? events.filter((event) => event.characterArc === selectedArc) : []
  );

  function displayName(key: string): string {
    return npcs[key]?.name ?? key;
  }

  function formatTrigger(trigger: EventTrigger): string {
    const { triggerType, parameters } = trigger;
    const value = Object.values(parameters)[0];
    return value !== undefined ? `${triggerType}: ${value}` : triggerType;
  }

  function triggerSummary(event: EventTemplate): string {
    return event.triggers.map(formatTrigger).join(' · ');
  }

  function optionCount(event: EventTemplate): number {
    return event.optionTemplates?.length ?? 0;
  }

  function selectArc(key: string | null) {
    selectedArc = selectedArc === key ? null : key;
  }
</script>

<div class="event-list">
  <header class="header">
    <div class="title-block">
      <h1>Event templates</h1>
      <p class="subtitle">
        {#if selectedArc}
          {arcEvents.length} arc event{arcEvents.length === 1 ? '' : 's'} · {displayName(selectedArc)}
        {:else}
          {events.length} event{events.length === 1 ? '' : 's'}
        {/if}
      </p>
    </div>
    <button type="button" class="create-btn" onclick={onCreate}>New event</button>
  </header>

  {#if arcCharacters.length > 0}
    <div class="arc-filters" role="toolbar" aria-label="Character arcs">
      <button
        type="button"
        class="arc-btn"
        class:active={selectedArc === null}
        onclick={() => (selectedArc = null)}
      >
        All events
      </button>
      {#each arcCharacters as key (key)}
        <button
          type="button"
          class="arc-btn"
          class:active={selectedArc === key}
          onclick={() => selectArc(key)}
          title={key}
        >
          {displayName(key)}
        </button>
      {/each}
    </div>
  {/if}

  {#if selectedArc}
    <CharacterArcGraph events={arcEvents} {onEdit} {onCreateFollowUp} />
  {:else if events.length === 0}
    <p class="empty">No events in events.json.</p>
  {:else}
    <ul class="list">
      {#each events as event (event.key)}
        <li>
          <button type="button" class="item" onclick={() => onEdit(event)}>
            <div class="item-top">
              <span class="key">{event.key}</span>
              <span class="meta">
                {optionCount(event)} option{optionCount(event) === 1 ? '' : 's'}
                {#if event.triggersOnce}
                  · once
                {/if}
                {#if event.characterArc}
                  · {displayName(event.characterArc)}
                {/if}
              </span>
            </div>
            <p class="text">{event.text}</p>
            <p class="triggers">{triggerSummary(event)}</p>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .event-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    min-height: 0;
    padding: 1.5rem 2rem;
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
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(175, 142, 103, 0.35);
  }

  .title-block {
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--color-cream);
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-label);
  }

  .create-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
    background: var(--color-brass);
    border: 1px solid var(--color-brass);
    color: var(--color-deep-brown);
    font-weight: 600;
  }

  .create-btn:hover {
    filter: brightness(1.08);
  }

  .arc-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .arc-btn {
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    background: transparent;
    border: 1px solid rgba(175, 142, 103, 0.35);
    color: var(--color-muted-label);
  }

  .arc-btn:hover {
    border-color: rgba(175, 142, 103, 0.6);
    color: var(--color-cream);
  }

  .arc-btn.active {
    background: rgba(175, 142, 103, 0.2);
    border-color: var(--color-brass);
    color: var(--color-cream);
  }

  .empty {
    margin: 0;
    color: var(--color-muted-label);
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    width: 100%;
    padding: 0.85rem 1rem;
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.25);
    border-radius: 4px;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .item:hover {
    background: var(--color-data-hover);
    border-color: rgba(175, 142, 103, 0.45);
  }

  .item-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .key {
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-brass);
  }

  .meta {
    font-size: 0.8rem;
    color: var(--color-muted-label);
    white-space: nowrap;
  }

  .text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--color-cream);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .triggers {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-muted-label);
  }
</style>
