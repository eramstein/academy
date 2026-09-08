<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getCardCreationBonuses } from '@/lib/sim/actions';

  type ResourceAmount = { type: ResourceType; count: number };

  let {
    title = 'Recipe',
    confirmLabel = 'Confirm',
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

  const resourceRows = $derived(
    Object.values(ResourceType).map((type) => ({
      type,
      selected: selected[type] ?? 0,
      owned: gs.player.resources[type] ?? 0,
    }))
  );

  const resources = $derived(
    resourceRows
      .filter((row) => row.selected > 0)
      .map((row) => ({ type: row.type, count: row.selected }))
  );

  const bonuses = $derived(getCardCreationBonuses(resources));

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

  function formatResource(type: ResourceType): string {
    return type.replace(/_/g, ' ');
  }

  function formatChance(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function setCount(type: ResourceType, value: number) {
    const owned = gs.player.resources[type] ?? 0;
    selected = { ...selected, [type]: Math.min(owned, Math.max(0, value)) };
  }

  function confirm() {
    onConfirm(resources);
  }
</script>

<div class="overlay" role="presentation">
  <div class="panel" role="dialog" aria-labelledby="recipe-title">
    <h2 id="recipe-title" class="title">{title}</h2>

    <ul class="resource-list">
      {#each resourceRows as row (row.type)}
        <li class="resource-row">
          <span class="kv-name">{formatResource(row.type)}</span>
          <div class="stepper">
            <button
              type="button"
              class="step-btn"
              disabled={row.selected <= 0}
              aria-label="Remove {formatResource(row.type)}"
              onclick={() => setCount(row.type, row.selected - 1)}
            >
              −
            </button>
            <span class="step-value">{row.selected}</span>
            <button
              type="button"
              class="step-btn"
              disabled={row.selected >= row.owned}
              aria-label="Add {formatResource(row.type)}"
              onclick={() => setCount(row.type, row.selected + 1)}
            >
              +
            </button>
          </div>
          <span class="owned">{row.owned} owned</span>
        </li>
      {/each}
    </ul>

    <span class="arrow" aria-hidden="true">↓</span>

    <ul class="kv-list">
      <li class="kv-row">
        <span class="kv-name">Learning chance</span>
        <span class="kv-value">{formatChance(bonuses.learningChance)}</span>
      </li>
      <li class="kv-row">
        <span class="kv-name">Extra budget chance</span>
        <span class="kv-value">{formatChance(bonuses.extraBudgetChance)}</span>
      </li>
    </ul>

    <footer class="actions">
      <button type="button" class="action-btn cancel" onclick={onDone}>Cancel</button>
      <button type="button" class="action-btn confirm" onclick={confirm}>{confirmLabel}</button>
    </footer>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .panel {
    width: min(380px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: #2c251d;
    border: 1px solid #5a4b3c;
    border-radius: 6px;
    color: #e8dcc4;
    padding: 16px 18px 12px;
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
  }

  .title {
    margin: 0 0 14px;
    font-size: 1.15rem;
    font-weight: 600;
    color: #f0e6c8;
    text-align: center;
  }

  .kv-list,
  .resource-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .kv-list {
    margin-bottom: 14px;
  }

  .arrow {
    display: block;
    padding: 12px 0;
    font-size: 1.4rem;
    line-height: 1;
    color: #a89880;
    text-align: left;
  }

  .kv-row,
  .resource-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
  }

  .kv-name {
    flex: 1 1 auto;
    text-transform: capitalize;
    color: #e8dcc4;
  }

  .kv-value {
    color: #f0e6c8;
    font-variant-numeric: tabular-nums;
  }

  .resource-row .kv-name {
    flex: 1 1 0;
    min-width: 0;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .step-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 1rem;
    line-height: 1;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    cursor: pointer;
  }

  .step-btn:hover:not(:disabled) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .step-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .step-value {
    min-width: 1.25rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .owned {
    width: 5.5rem;
    text-align: right;
    font-size: 0.8rem;
    color: #a89880;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 4px;
  }

  .action-btn {
    font-family: inherit;
    font-size: 1rem;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    padding: 8px 20px;
    cursor: pointer;
  }

  .action-btn:hover:not(:disabled) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .action-btn.confirm {
    color: #f0e6c8;
    border-color: var(--color-golden);
  }

  .action-btn.cancel {
    color: #a89880;
    background: transparent;
  }

  .action-btn.cancel:hover {
    color: #e8dcc4;
    background: #3d3429;
  }
</style>
