<script lang="ts">
  import { onMount } from 'svelte';
  import eventsData from '@/data/sim/events.json';
  import { EventTriggerType, type EventTemplate } from '@/lib/_model';
  import { syncEventTemplates } from '@/lib/sim/events';
  import EventForm from './EventForm.svelte';
  import EventList from './EventList.svelte';

  let events = $state<EventTemplate[]>([...(eventsData as EventTemplate[])]);
  let editingEvent = $state<EventTemplate | null>(null);
  let showForm = $state(false);
  let loading = $state(true);
  let selectedArc = $state<string | null>(null);

  const existingKeys = $derived(events.map((event) => event.key));

  onMount(async () => {
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (response.ok) {
        events = (await response.json()) as EventTemplate[];
      }
    } catch {
      // Keep bundled import fallback.
    } finally {
      loading = false;
    }
  });

  function openCreate() {
    editingEvent = null;
    showForm = true;
  }

  function openCreateFollowUp(fromEvent: EventTemplate) {
    const characterKey = fromEvent.characterArc ?? selectedArc ?? '';
    editingEvent = {
      key: `${characterKey}-${Math.floor(Math.random() * 1_000_000_000)}`,
      text: '',
      characterArc: characterKey,
      triggersOnce: true,
      optionTemplates: [],
      triggers: [
        {
          triggerType: EventTriggerType.CharacterPresent,
          parameters: { characterKey },
        },
        {
          triggerType: EventTriggerType.PreviousEvents,
          parameters: { [fromEvent.key]: true },
        },
      ],
    };
    showForm = true;
  }

  function openEdit(event: EventTemplate) {
    editingEvent = JSON.parse(JSON.stringify(event));
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingEvent = null;
  }

  async function handleSaved(event: EventTemplate) {
    const index = events.findIndex((item) => item.key === event.key);
    const nextEvents =
      index === -1
        ? [...events, event]
        : events.map((item, i) => (i === index ? event : item));
    events = nextEvents;
    await syncEventTemplates(nextEvents);
    closeForm();
  }
</script>

<div class="event-editor">
  {#if loading}
    <p class="loading">Loading events…</p>
  {:else if showForm}
    {#key editingEvent?.key ?? '__new__'}
      <EventForm
        event={editingEvent}
        {existingKeys}
        onSaved={handleSaved}
        onCancel={closeForm}
      />
    {/key}
  {:else}
    <EventList
      {events}
      bind:selectedArc
      onCreate={openCreate}
      onCreateFollowUp={openCreateFollowUp}
      onEdit={openEdit}
    />
  {/if}
</div>

<style>
  .event-editor {
    width: 100%;
    height: 100%;
    min-height: 0;
    background: var(--color-navy);
    overflow: hidden;
  }

  .loading {
    margin: 0;
    padding: 1.5rem 2rem;
    color: var(--color-muted-label);
    font-family: var(--font-narrative);
  }
</style>
