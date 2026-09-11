<script lang="ts">
  import type { EventTemplate, EventTrigger } from '@/lib/_model';

  let {
    events,
    onCreate,
    onEdit,
  }: {
    events: EventTemplate[];
    onCreate: () => void;
    onEdit: (event: EventTemplate) => void;
  } = $props();

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
</script>

<div class="event-list">
  <header class="header">
    <div class="title-block">
      <h1>Event templates</h1>
      <p class="subtitle">{events.length} event{events.length === 1 ? '' : 's'}</p>
    </div>
    <button type="button" class="create-btn" onclick={onCreate}>New event</button>
  </header>

  {#if events.length === 0}
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
