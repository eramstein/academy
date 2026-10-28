<script lang="ts">
  import { ResourceType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import ResourceIcon from '@/lib/ui/sim/ResourceIcon.svelte';
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();

  const resources = $derived(
    Object.values(ResourceType).map((type) => ({
      type,
      amount: gs.player.resources?.[type] ?? 0,
      label: resourceLabel(type),
    }))
  );

  function resourceLabel(type: ResourceType): string {
    if (type === ResourceType.MollysBeads) return "Molly's Beads";
    return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
</script>

<PlayerDetail title="Resources" {onBack}>
  <ul class="list">
    {#each resources as resource (resource.type)}
      <li class="row" class:empty={resource.amount === 0}>
        <span class="icon">
          <ResourceIcon type={resource.type} />
        </span>
        <span class="name">{resource.label}</span>
        <span class="amount">{resource.amount}</span>
      </li>
    {/each}
  </ul>
</PlayerDetail>

<style>
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .row {
    display: grid;
    grid-template-columns: 2.2rem minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: center;
  }

  .row.empty {
    opacity: 0.45;
  }

  .icon {
    display: block;
    width: 2.2rem;
    height: 2.2rem;
    flex-shrink: 0;
  }

  .name {
    color: var(--color-cream);
    font-size: 1rem;
  }

  .amount {
    color: var(--color-cream);
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
  }
</style>
