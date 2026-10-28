<script lang="ts">
  import { PossessionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();

  const groups = $derived(
    Object.values(PossessionType)
      .map((type) => ({
        type,
        label: titleWord(type),
        items: (gs.player.possessions ?? []).filter((item) => item.type === type),
      }))
      .filter((group) => group.items.length > 0)
  );

  const total = $derived((gs.player.possessions ?? []).length);

  function titleWord(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
</script>

<PlayerDetail title="Possessions" {onBack}>
  {#if total === 0}
    <p class="pending">None yet.</p>
  {:else}
    <div class="groups">
      {#each groups as group (group.type)}
        <section class="group">
          <h3>{group.label}</h3>
          <ul class="list">
            {#each group.items as item, index (`${item.type}-${item.name}-${index}`)}
              <li class="item">
                <div class="line">
                  <span class="name">{item.name}</span>
                  {#if (item.count ?? 1) > 1}
                    <span class="count">×{item.count}</span>
                  {/if}
                </div>
                {#if item.description}
                  <p class="desc">{item.description}</p>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</PlayerDetail>

<style>
  .groups {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  h3 {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .line {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
  }

  .name {
    color: var(--color-cream);
    font-size: 0.98rem;
  }

  .count {
    color: var(--color-muted-label);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .desc {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.45;
    color: var(--color-muted-label);
  }
</style>
