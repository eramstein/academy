<script lang="ts">
  import { npcs } from '@/data/npcs';
  import { EventTriggerType, type EventTemplate, type EventTrigger } from '@/lib/_model';
  import CharacterArcGraph from './CharacterArcGraph.svelte';

  let {
    events,
    selectedArc = $bindable<string | null>(null),
    onCreate,
    onCreateFollowUp,
    onEdit,
    onShowPacing,
  }: {
    events: EventTemplate[];
    selectedArc?: string | null;
    onCreate: () => void;
    onCreateFollowUp: (fromEvent: EventTemplate) => void;
    onEdit: (event: EventTemplate) => void;
    onShowPacing: () => void;
  } = $props();

  let search = $state('');

  const arcCharacters = $derived.by(() => {
    const keys = new Set<string>();
    for (const event of events) {
      if (event.characterArc) keys.add(event.characterArc);
    }
    return [...keys].sort((a, b) => displayName(a).localeCompare(displayName(b)));
  });

  const scopedEvents = $derived(
    selectedArc ? events.filter((event) => event.characterArc === selectedArc) : events
  );

  const filteredEvents = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scopedEvents;
    return scopedEvents.filter((event) => matchesSearch(event, q));
  });

  const arcEvents = $derived(selectedArc ? filteredEvents : []);

  function displayName(key: string): string {
    return npcs[key]?.name ?? key;
  }

  function matchesSearch(event: EventTemplate, q: string): boolean {
    const haystack = [
      event.key,
      event.text,
      event.characterArc ?? '',
      event.characterArc ? displayName(event.characterArc) : '',
      triggerSummary(event),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function formatTrigger(trigger: EventTrigger): string {
    if (trigger.triggerType === EventTriggerType.ActivityHistory) {
      const { characterKey, activityType, value } = trigger.parameters;
      return `${trigger.triggerType}: ${characterKey} ${activityType} ≥${value}`;
    }
    if (trigger.triggerType === EventTriggerType.MatchesWon) {
      const { characterKey, count } = trigger.parameters;
      return `${trigger.triggerType}: ${characterKey} ≥${count}`;
    }
    if (trigger.triggerType === EventTriggerType.MatchesLost) {
      const { characterKey, count } = trigger.parameters;
      return `${trigger.triggerType}: ${characterKey} ≥${count}`;
    }
    if (trigger.triggerType === EventTriggerType.LeaguesWon) {
      const { characterKey, count } = trigger.parameters;
      return `${trigger.triggerType}: ${characterKey} ≥${count}`;
    }
    if (trigger.triggerType === EventTriggerType.StoryTag) {
      const { tag, value } = trigger.parameters;
      return `${trigger.triggerType}: ${tag} ≥${value}`;
    }
    if (trigger.triggerType === EventTriggerType.RelationTag) {
      const { characterKey, relationTag, value } = trigger.parameters;
      const op = value === -1 ? 'absent' : 'has';
      return `${trigger.triggerType}: ${characterKey} ${op} ${relationTag}`;
    }
    if (trigger.triggerType === EventTriggerType.KnownTraits) {
      const { characterKey, count } = trigger.parameters;
      return `${trigger.triggerType}: ${characterKey} ≥${count}`;
    }
    if (trigger.triggerType === EventTriggerType.DayOfWeek) {
      return `${trigger.triggerType}: ${trigger.parameters.daysOfWeek.join(',')}`;
    }
    if (trigger.triggerType === EventTriggerType.Period) {
      const list = trigger.parameters.periods?.length
        ? trigger.parameters.periods
        : trigger.parameters.period
          ? [trigger.parameters.period]
          : [];
      return list.length ? `${trigger.triggerType}: ${list.join(',')}` : trigger.triggerType;
    }
    if (trigger.triggerType === EventTriggerType.Day) {
      const parts: string[] = [];
      if (trigger.parameters.minDay != null) parts.push(`≥${trigger.parameters.minDay}`);
      if (trigger.parameters.day != null) parts.push(`=${trigger.parameters.day}`);
      return parts.length ? `${trigger.triggerType}: ${parts.join(' ')}` : trigger.triggerType;
    }
    const value = Object.values(trigger.parameters)[0];
    return value !== undefined ? `${trigger.triggerType}: ${value}` : trigger.triggerType;
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
          {filteredEvents.length} arc event{filteredEvents.length === 1 ? '' : 's'} · {displayName(
            selectedArc
          )}
        {:else}
          {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
        {/if}
        {#if search.trim()}
          <span class="search-hint"> · filtered</span>
        {/if}
      </p>
    </div>
    <div class="header-actions">
      <button type="button" class="ghost-btn" onclick={onShowPacing}>Pacing</button>
      <button type="button" class="create-btn" onclick={onCreate}>New event</button>
    </div>
  </header>

  <label class="search">
    <span class="sr">Search events</span>
    <input
      type="search"
      placeholder="Search key, text, arc, or triggers…"
      bind:value={search}
    />
  </label>

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
    {#if filteredEvents.length === 0}
      <p class="empty">{search.trim() ? 'No events match your search.' : 'No events.'}</p>
    {:else}
      <CharacterArcGraph events={arcEvents} allEvents={events} {onEdit} {onCreateFollowUp} />
    {/if}
  {:else if filteredEvents.length === 0}
    <p class="empty">{search.trim() ? 'No events match your search.' : 'No events.'}</p>
  {:else}
    <ul class="list">
      {#each filteredEvents as event (event.key)}
        <li>
          <button type="button" class="item" onclick={() => onEdit(event)}>
            <div class="item-top">
              <span class="key">{event.key}</span>
              <span class="meta">
                {optionCount(event)} option{optionCount(event) === 1 ? '' : 's'}
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

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .ghost-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid rgba(175, 142, 103, 0.45);
    color: var(--color-cream);
  }

  .ghost-btn:hover {
    background: var(--color-data-hover);
    border-color: var(--color-brass);
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

  .search {
    display: block;
  }

  .search .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font: inherit;
    font-size: 0.95rem;
    color: var(--color-cream);
    background: var(--color-data);
    border: 1px solid rgba(175, 142, 103, 0.35);
  }

  .search input::placeholder {
    color: var(--color-muted-label);
  }

  .search input:focus {
    outline: none;
    border-color: var(--color-brass);
  }

  .search-hint {
    color: var(--color-brass);
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
