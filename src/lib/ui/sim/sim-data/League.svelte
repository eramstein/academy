<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';

  function characterName(characterKey: string): string {
    if (characterKey === gs.player.key) {
      return gs.player.name;
    }
    return gs.characters[characterKey]?.name ?? characterKey;
  }

  const season = $derived(gs.league.season);
  const rankings = $derived(
    [...gs.league.rankings].sort((a, b) => b.points - a.points || a.characterKey.localeCompare(b.characterKey)),
  );
</script>

<div class="league">
  <h3 class="section-title">
    {#if season > 0}
      Season {season}
    {:else}
      League
    {/if}
  </h3>

  {#if rankings.length === 0}
    <p class="empty">No rankings yet.</p>
  {:else}
    <ol class="rankings">
      {#each rankings as entry, i (entry.characterKey)}
        <li class="ranking" class:player={entry.characterKey === gs.player.key}>
          <span class="rank">{i + 1}</span>
          <span class="name">{characterName(entry.characterKey)}</span>
          <span class="points">{entry.points}</span>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .league {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #cccccc;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .empty {
    margin: 0;
    font-size: 0.95rem;
    color: #888888;
  }

  .rankings {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .ranking {
    display: grid;
    grid-template-columns: 2rem 1fr auto;
    align-items: baseline;
    gap: 0.75rem;
    font-size: 0.95rem;
  }

  .rank {
    color: #888888;
    font-variant-numeric: tabular-nums;
  }

  .name {
    color: #e8e8e8;
    min-width: 0;
  }

  .points {
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }

  .ranking.player .rank,
  .ranking.player .name,
  .ranking.player .points {
    color: var(--color-golden);
  }
</style>
