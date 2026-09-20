<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import RitualStage from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  type ResourceAmount = { type: ResourceType; count: number };

  let {
    title = 'Invocation',
    confirmLabel = 'Begin',
    initialResources = [],
    onConfirm,
    onDone,
  }: {
    title?: string;
    confirmLabel?: string;
    initialResources?: ResourceAmount[];
    onConfirm: (resources: ResourceAmount[]) => void;
    onDone: () => void;
  } = $props();

  let selected = $state<Record<ResourceType, number>>(countsFrom(initialResources));

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function countsFrom(list: ResourceAmount[]): Record<ResourceType, number> {
    const counts = Object.fromEntries(Object.values(ResourceType).map((type) => [type, 0])) as Record<
      ResourceType,
      number
    >;
    for (const resource of list) {
      counts[resource.type] = resource.count;
    }
    return counts;
  }

  function confirm() {
    onConfirm(
      Object.values(ResourceType)
        .map((type) => ({ type, count: selected[type] ?? 0 }))
        .filter((row) => row.count > 0)
    );
  }
</script>

<WorkbenchShell {title}>
  <RitualStage bind:selected />

  {#snippet footer()}
    <button type="button" class="abandon" onclick={onDone}>Abandon ritual</button>
    <OrnateButton icon="spiral" onclick={confirm}>{confirmLabel}</OrnateButton>
  {/snippet}
</WorkbenchShell>

<style>
  .abandon {
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    color: var(--color-muted-label);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .abandon:hover {
    color: var(--color-cream);
    border-color: var(--color-brass);
    background: color-mix(in srgb, var(--color-data) 55%, transparent);
  }
</style>
