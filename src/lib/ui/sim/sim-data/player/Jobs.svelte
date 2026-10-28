<script lang="ts">
  import type { Job } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { quitJob } from '@/lib/sim/jobs';
  import { narrateText } from '@/lib/sim/narration';
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();

  const jobs = $derived(gs.player.jobs);

  function characterName(characterKey: string): string {
    if (characterKey === gs.player.key) return gs.player.name;
    return gs.characters[characterKey]?.name ?? characterKey;
  }

  function placeName(placeKey: string): string {
    return gs.places[placeKey]?.name ?? placeKey;
  }

  function handleQuitJob(job: Job) {
    narrateText(quitJob(job));
  }
</script>

<PlayerDetail title="Jobs" {onBack}>
  {#if jobs.length === 0}
    <p class="pending">None yet.</p>
  {:else}
    <ul class="job-list">
      {#each jobs as job (job.id)}
        <li class="job">
          <div class="job-line">
            <span class="job-name">{job.name}</span>
            <span class="job-pay">{job.payPerActivity}g / activity</span>
            <button type="button" class="quit" onclick={() => handleQuitJob(job)}>Quit</button>
          </div>
          <p class="job-meta">
            {job.jobType} · {characterName(job.employerKey)} · {placeName(job.placeKey)}
          </p>
          {#if job.description}
            <p class="job-desc">{job.description}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</PlayerDetail>

<style>
  .job-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .job {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .job-line {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .job-name {
    color: var(--color-cream);
    font-size: 0.95rem;
  }

  .job-pay {
    margin-left: auto;
    color: var(--color-muted-label);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .quit {
    flex-shrink: 0;
    padding: 0.2rem 0.5rem;
    background: var(--color-data);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: inherit;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .quit:hover {
    background: var(--color-data-hover);
  }

  .job-meta,
  .job-desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-muted-label);
  }

  .job-meta {
    text-transform: capitalize;
  }
</style>
