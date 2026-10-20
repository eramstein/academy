<script lang="ts">
  import { DayPeriod, type EventTemplate } from '@/lib/_model';
  import {
    applyPacingChoice,
    buildPacingChoices,
    cellContents,
    createPacingWorld,
    finishPacingEvent,
    type PacingChoice,
  } from './pacing';

  let { events, onShowCatalog }: { events: EventTemplate[]; onShowCatalog: () => void } = $props();

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = [DayPeriod.Morning, DayPeriod.Afternoon, DayPeriod.Evening];

  let world = $state(createPacingWorld());
  let weekOffset = $state(0);
  let activeKey = $state<string | undefined>(undefined);
  let beatKey = $state<string | undefined>(undefined);

  function mondayOfWeek(day: number): number {
    const dow = ((day % 7) + 7) % 7;
    return dow === 0 ? day - 6 : day - (dow - 1);
  }

  const weekStart = $derived(mondayOfWeek(world.day) + weekOffset * 7);
  const weekEnd = $derived(weekStart + 6);
  const weekDays = $derived(Array.from({ length: 7 }, (_, i) => weekStart + i));
  const canGoPrev = $derived(weekStart > 1);

  const grid = $derived(
    periods.map((period) => weekDays.map((day) => cellContents(world, events, day, period)))
  );

  const readyNow = $derived(
    cellContents(world, events, world.day, world.period).events.filter((chip) => chip.status === 'ready')
      .length
  );

  const active = $derived(events.find((event) => event.key === activeKey));
  const beat = $derived.by(() => {
    if (!active) return undefined;
    if (!beatKey) return { title: active.title?.trim() || active.key, text: active.text };
    const node = active.nodes?.[beatKey];
    return {
      title: node?.title?.trim() || beatKey,
      text: node?.text ?? active.text,
    };
  });
  const choices = $derived(active ? buildPacingChoices(active, world, beatKey) : []);

  function restart() {
    world = createPacingWorld();
    weekOffset = 0;
    activeKey = undefined;
    beatKey = undefined;
  }

  function moveTo(day: number, period: DayPeriod) {
    if (world.openKey) return;
    if (day < 1) return;
    world.day = day;
    world.period = period;
    activeKey = undefined;
    beatKey = undefined;
  }

  function openChip(key: string, day: number, period: DayPeriod, status: string) {
    if (status === 'done') return;
    if (world.openKey && world.openKey !== key) return;
    if (world.day !== day || world.period !== period) {
      if (world.openKey) return;
      world.day = day;
      world.period = period;
    }
    const chip = cellContents(world, events, day, period).events.find((item) => item.key === key);
    if (!chip || chip.status !== 'ready') return;
    activeKey = key;
    beatKey = undefined;
  }

  function choose(choice: PacingChoice) {
    if (!active) return;
    const next = applyPacingChoice(world, active, choice);
    beatKey = next;
    if (!next) activeKey = undefined;
  }

  function finish() {
    if (!active) return;
    finishPacingEvent(world, active);
    activeKey = undefined;
    beatKey = undefined;
  }
</script>

<div class="pacing">
  <header class="header">
    <div class="title-block">
      <h1>Pacing</h1>
      <p class="subtitle">
        Day {world.day} · <span class="period">{world.period}</span>
        {#if readyNow > 1}
          <span class="warn"> · {readyNow} events ready</span>
        {:else if readyNow === 1}
          <span> · 1 event ready</span>
        {:else}
          <span> · nothing ready</span>
        {/if}
      </p>
    </div>
    <div class="header-actions">
      <button type="button" class="ghost" onclick={restart}>Restart</button>
      <button type="button" class="ghost" onclick={onShowCatalog}>Catalog</button>
    </div>
  </header>

  <p class="hint">
    Click a period to move time. Click a ready event to choose an outcome. Planned events sit on the
    period they were scheduled for.
  </p>

  <div class="body">
    <div class="calendar">
      <div class="week-nav">
        {#if canGoPrev}
          <button type="button" class="nav-btn" onclick={() => weekOffset--}>← Prev</button>
        {:else}
          <span class="nav-spacer"></span>
        {/if}
        <span class="week-label">Days {weekStart}–{weekEnd}</span>
        <button type="button" class="nav-btn" onclick={() => weekOffset++}>Next →</button>
      </div>

      <div class="week-grid">
        <div class="corner"></div>
        {#each weekDays as day, i (day)}
          <div class="day-header" class:today={day === world.day}>
            <span class="day-label">{dayLabels[i]}</span>
            <span class="day-number">Day {day}</span>
          </div>
        {/each}

        {#each periods as period, pi (period)}
          <div class="period-header">{period}</div>
          {#each weekDays as day, di (day)}
            {@const cell = grid[pi][di]}
            {@const readyCount = cell.events.filter((chip) => chip.status === 'ready').length}
            <div
              class="cell"
              class:today={day === world.day}
              class:current={day === world.day && period === world.period}
              class:pile={readyCount > 1}
              onclick={() => moveTo(day, period)}
            >
              {#each cell.activities as label, ai (label + ai)}
                <span class="activity-label">{label}</span>
              {/each}
              {#each cell.events as chip (chip.status + chip.key)}
                <button
                  type="button"
                  class="chip"
                  class:ready={chip.status === 'ready'}
                  class:planned={chip.status === 'planned'}
                  class:done={chip.status === 'done'}
                  class:open={chip.open}
                  title={chip.manual ? `${chip.label} (manual)` : chip.label}
                  onclick={(event) => {
                    event.stopPropagation();
                    openChip(chip.key, day, period, chip.status);
                  }}
                >
                  {#if chip.manual}<span class="manual-tag">m</span>{/if}{chip.label}
                </button>
              {/each}
              {#if cell.activities.length === 0 && cell.events.length === 0}
                <span class="empty">—</span>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>

    {#if active && beat}
      <aside class="panel">
        <p class="panel-key">{active.key}{beatKey ? ` · ${beatKey}` : ''}</p>
        <h2>{beat.title}</h2>
        <div class="prose">{beat.text}</div>
        {#if choices.length > 0}
          <div class="choices">
            {#each choices as choice, index (choice.label + index)}
              <button type="button" class="choice" onclick={() => choose(choice)}>
                <span class="choice-label">{choice.label}</span>
                {#if choice.notes.length > 0}
                  <span class="choice-notes">{choice.notes.join(' · ')}</span>
                {/if}
              </button>
            {/each}
          </div>
        {:else}
          <button type="button" class="choice" onclick={finish}>
            <span class="choice-label">Mark done</span>
          </button>
        {/if}
      </aside>
    {/if}
  </div>
</div>

<style>
  .pacing {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: 100%;
    min-height: 0;
    padding: 1.25rem 1.5rem 1.5rem;
    box-sizing: border-box;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    overflow: hidden;
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
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-label);
  }

  .period {
    text-transform: capitalize;
  }

  .warn {
    color: var(--color-golden);
    text-transform: none;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .ghost {
    padding: 0.45rem 0.8rem;
    border-radius: 4px;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    background: transparent;
    border: 1px solid rgba(175, 142, 103, 0.45);
    color: var(--color-cream);
  }

  .ghost:hover {
    background: var(--color-data-hover);
    border-color: var(--color-brass);
  }

  .hint {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-muted-label);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    min-height: 0;
  }

  .calendar {
    flex: 1;
    min-width: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .week-nav {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-btn {
    padding: 0.35rem 0.65rem;
    background: var(--color-data);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    width: fit-content;
  }

  .week-nav > :first-child {
    justify-self: start;
  }

  .week-nav > :last-child {
    justify-self: end;
  }

  .nav-btn:hover {
    background: var(--color-data-hover);
  }

  .nav-spacer {
    min-height: 1px;
  }

  .week-label {
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .week-grid {
    display: grid;
    grid-template-columns: auto repeat(7, minmax(0, 1fr));
    gap: 0.35rem;
    min-height: 0;
  }

  .corner {
    min-width: 0;
  }

  .day-header {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.4rem;
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    background: rgba(175, 142, 103, 0.08);
    text-align: center;
  }

  .day-header.today {
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.14);
  }

  .day-label {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .day-header.today .day-label {
    color: var(--color-golden);
  }

  .day-number {
    font-size: 0.75rem;
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .period-header {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.6rem 0.4rem 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: capitalize;
    color: var(--color-muted-label);
    white-space: nowrap;
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    min-height: 4.5rem;
    padding: 0.4rem;
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    background: rgba(175, 142, 103, 0.06);
    cursor: pointer;
    text-align: left;
  }

  .cell:hover {
    background: rgba(175, 142, 103, 0.12);
  }

  .cell.today {
    border-color: rgba(191, 161, 74, 0.45);
    background: rgba(191, 161, 74, 0.08);
  }

  .cell.current {
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.16);
  }

  .cell.pile {
    box-shadow: inset 0 0 0 1px var(--color-golden);
  }

  .activity-label {
    color: var(--color-muted-label);
    font-size: 0.72rem;
    text-transform: capitalize;
  }

  .chip {
    display: block;
    width: 100%;
    padding: 0.25rem 0.35rem;
    border-radius: 3px;
    border: 1px solid transparent;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.75rem;
    line-height: 1.25;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip.ready {
    border-color: var(--color-brass);
    background: rgba(175, 142, 103, 0.18);
    color: var(--color-cream);
  }

  .chip.ready:hover,
  .chip.open {
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.22);
  }

  .chip.planned {
    border-style: dashed;
    border-color: rgba(175, 142, 103, 0.55);
    color: var(--color-muted-label);
  }

  .chip.done {
    color: var(--color-muted-label);
    text-decoration: line-through;
    cursor: default;
    opacity: 0.7;
  }

  .manual-tag {
    display: inline-block;
    margin-right: 0.25rem;
    padding: 0 0.2rem;
    border: 1px solid var(--color-brass);
    border-radius: 2px;
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.02em;
    text-transform: lowercase;
    color: var(--color-brass);
    text-decoration: none;
  }

  .empty {
    color: var(--color-muted-label);
    font-size: 0.8rem;
  }

  .panel {
    flex: none;
    max-height: 42%;
    min-height: 0;
    overflow: auto;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(175, 142, 103, 0.35);
  }

  .panel-key {
    margin: 0 0 0.35rem;
    font-size: 0.75rem;
    color: var(--color-brass);
  }

  h2 {
    margin: 0 0 0.6rem;
    font-size: 1.15rem;
    font-weight: 600;
  }

  .prose {
    max-height: 6.5rem;
    overflow: auto;
    margin-bottom: 0.75rem;
    font-size: 0.92rem;
    line-height: 1.45;
    white-space: pre-wrap;
    color: var(--color-cream);
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .choice {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    width: auto;
    min-width: 12rem;
    max-width: 24rem;
    flex: 1;
    padding: 0.55rem 0.7rem;
    border-radius: 4px;
    border: 1px solid var(--color-brass);
    background: var(--color-data);
    color: var(--color-cream);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .choice:hover {
    background: var(--color-data-hover);
  }

  .choice-label {
    font-size: 0.95rem;
  }

  .choice-notes {
    font-size: 0.75rem;
    color: var(--color-muted-label);
  }
</style>
