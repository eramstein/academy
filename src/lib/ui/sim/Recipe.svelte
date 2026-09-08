<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
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

  const woodPath = getAssetPath('images/wood_chip_base.png');
  const tablePath = getAssetPath('images/table.jpg');
  const parchmentPath = getAssetPath('images/parchment.png');

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

  function clamp(value: number | undefined, min: number, max: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function setCount(type: ResourceType, value: number) {
    const owned = gs.player.resources[type] ?? 0;
    selected = { ...selected, [type]: clamp(value, 0, owned) };
  }

  function onNumberInput(event: Event, type: ResourceType) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    if (raw === '') return;
    setCount(type, Number.parseInt(raw, 10));
  }

  function onResourceRowClick(event: MouseEvent, type: ResourceType, value: number) {
    if (event.type === 'contextmenu') event.preventDefault();
    setCount(type, value + (event.type === 'contextmenu' ? -1 : 1));
  }

  function confirm() {
    onConfirm(resources);
  }
</script>

{#snippet stepper(type: ResourceType, value: number, owned: number, label: string)}
  <div
    class="num-control"
    onclick={(event) => event.stopPropagation()}
    oncontextmenu={(event) => event.stopPropagation()}
  >
    <input
      type="number"
      min="0"
      max={owned}
      {value}
      aria-label={label}
      oninput={(event) => onNumberInput(event, type)}
      onblur={() => setCount(type, value)}
    />
    <div class="step-arrows">
      <button
        type="button"
        class="step-arrow"
        disabled={value >= owned}
        aria-label="Increase {label}"
        onclick={() => setCount(type, value + 1)}
      >
        ▲
      </button>
      <button
        type="button"
        class="step-arrow"
        disabled={value <= 0}
        aria-label="Decrease {label}"
        onclick={() => setCount(type, value - 1)}
      >
        ▼
      </button>
    </div>
  </div>
{/snippet}

<div class="overlay" role="presentation">
  <div
    class="frame"
    role="dialog"
    aria-labelledby="recipe-title"
    style="--wood: url('{woodPath}'); --table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="recipe-title" class="title">
        <span class="star" aria-hidden="true"></span>
        {title}
        <span class="star" aria-hidden="true"></span>
      </h2>

      <section class="section" aria-label="Resources">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Resources
        </h3>
        <div class="resource-list">
          {#each resourceRows as row (row.type)}
            {@const label = formatResource(row.type)}
            <div
              class="resource-row"
              class:on={row.selected > 0}
              onclick={(event) => onResourceRowClick(event, row.type, row.selected)}
              oncontextmenu={(event) => onResourceRowClick(event, row.type, row.selected)}
            >
              <span class="resource-name">{label}</span>
              {@render stepper(row.type, row.selected, row.owned, label)}
              <span class="owned">{row.owned} owned</span>
            </div>
          {/each}
        </div>
      </section>

      <section class="section" aria-label="Outcome">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Outcome
        </h3>
        <div class="bonuses">
          <div class="bonus">
            <div class="bonus-label">Learning chance</div>
            <div class="bonus-well">{formatChance(bonuses.learningChance)}</div>
          </div>
          <div class="bonus">
            <div class="bonus-label">Extra budget chance</div>
            <div class="bonus-well">{formatChance(bonuses.extraBudgetChance)}</div>
          </div>
        </div>
      </section>

      <footer class="actions">
        <button type="button" class="action-btn cancel" onclick={onDone}>Cancel</button>
        <button type="button" class="action-btn confirm" onclick={confirm}>{confirmLabel}</button>
      </footer>
    </div>
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

  .frame {
    position: relative;
    width: min(520px, 100%);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: #4a2a18 var(--table) center / cover;
    border: 2px solid #2a1810;
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
  }

  .panel {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    background: #e8dcc4 var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 16px 16px 12px;
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    box-shadow: inset 0 0 28px rgba(90, 75, 60, 0.12);
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 0 10px;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #2c251d;
    text-align: center;
  }

  .star,
  .star-icon {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    background: #4a3f32;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .section {
    padding: 10px 12px 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(44, 37, 29, 0.45);
    border-radius: 4px;
    background: rgba(255, 248, 230, 0.18);
    box-sizing: border-box;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #3a3228;
  }

  .star-icon {
    width: 12px;
    height: 12px;
  }

  .resource-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .resource-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    cursor: pointer;
    user-select: none;
  }

  .resource-name {
    flex: 1 1 auto;
    min-width: 0;
    padding: 6px 10px;
    font-size: calc(0.78rem + 2px);
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #efe4c8;
    border: 1px solid rgba(90, 75, 60, 0.28);
    border-radius: 6px;
  }

  .resource-row.on .resource-name {
    border-color: var(--color-golden);
  }

  .num-control {
    display: flex;
    align-items: stretch;
    gap: 4px;
    flex-shrink: 0;
  }

  .num-control input {
    width: 2.6rem;
    height: 34px;
    padding: 0 4px;
    color: #f0e6c8;
    background: #2c251d;
    border: 1px solid #3a3228;
    border-radius: 3px;
    font-family: inherit;
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: none;
    box-sizing: border-box;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
    -moz-appearance: textfield;
  }

  .num-control input:focus {
    border-color: var(--color-golden);
  }

  .num-control input::-webkit-inner-spin-button,
  .num-control input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .step-arrows {
    display: flex;
    flex-direction: column;
    width: 18px;
    border-radius: 3px;
    overflow: hidden;
    background: #d8c9ad;
    border: 1px solid rgba(90, 75, 60, 0.35);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }

  .step-arrow {
    flex: 1;
    padding: 0;
    color: #3a3228;
    background: transparent;
    border: none;
    font-size: 0.5rem;
    line-height: 1;
    cursor: pointer;
  }

  .step-arrow + .step-arrow {
    border-top: 1px solid rgba(90, 75, 60, 0.25);
  }

  .step-arrow:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.28);
  }

  .step-arrow:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .owned {
    width: 5.5rem;
    flex-shrink: 0;
    text-align: right;
    font-size: 0.8rem;
    color: #6a5c4c;
    font-variant-numeric: tabular-nums;
  }

  .bonuses {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .bonus {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 10px;
  }

  .bonus + .bonus {
    border-left: 1px solid rgba(90, 75, 60, 0.35);
  }

  .bonus-label {
    font-size: 0.92rem;
    color: #2c251d;
    text-align: center;
  }

  .bonus-well {
    min-width: 4.5rem;
    padding: 8px 12px;
    color: #f0e6c8;
    background: #2c251d;
    border: 1px solid #3a3228;
    border-radius: 3px;
    font-variant-numeric: tabular-nums;
    text-align: center;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 14px;
  }

  .action-btn {
    min-width: 7.5rem;
    font-family: inherit;
    font-size: 1rem;
    color: #f0e6c8;
    background: #3a221f var(--wood) center / cover;
    border: 1px solid #2a110a;
    border-radius: 4px;
    padding: 8px 20px;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .action-btn:hover:not(:disabled) {
    filter: brightness(1.12);
  }

  .action-btn.confirm {
    color: #f0e6c8;
    border: 2px solid #000;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .action-btn.cancel {
    color: #ececec;
    background: #6e6e6e;
    border: 1px solid #4a4a4a;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 2px 4px rgba(0, 0, 0, 0.25);
  }
</style>
