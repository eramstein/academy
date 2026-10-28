<script lang="ts">
  import { ResourceType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();

  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: 'magic_dust',
    [ResourceType.Mithril]: 'metal_bar',
    [ResourceType.Moxes]: 'gem',
    [ResourceType.MollysBeads]: 'leaf',
    [ResourceType.SchlupakMushrooms]: 'feather',
    [ResourceType.SchlupakDreamspheres]: 'feather',
    [ResourceType.SchlupakSpores]: 'feather',
  };

  const resources = $derived(
    Object.values(ResourceType).map((type) => ({
      type,
      amount: gs.player.resources?.[type] ?? 0,
      icon: RESOURCE_ICONS[type],
      label: resourceLabel(type),
    }))
  );

  function resourceLabel(type: ResourceType): string {
    if (type === ResourceType.MollysBeads) return "Molly's Beads";
    return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }
</script>

{#snippet icon(name: string)}
  <span
    class="icon"
    class:painted={isPaintedUiIcon(name)}
    style="--icon: url('{iconUrl(name)}')"
    aria-hidden="true"
  ></span>
{/snippet}

<PlayerDetail title="Resources" {onBack}>
  <ul class="list">
    {#each resources as resource (resource.type)}
      <li class="row" class:empty={resource.amount === 0}>
        {@render icon(resource.icon)}
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
    color: var(--color-brass);
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .icon.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
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
