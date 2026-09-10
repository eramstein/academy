<script lang="ts">
  import { ResourceType, type Action } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import {
    performAction,
    TransactionType,
    type TransactionParameters,
  } from '@/lib/sim/actions';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const woodPath = getAssetPath('images/wood_chip_base.png');
  const tablePath = getAssetPath('images/table.jpg');
  const parchmentPath = getAssetPath('images/parchment.png');

  const place = $derived(gs.places[gs.player.placeKey]);
  const stock = $derived(place?.itemsOnSale?.resources ?? {});

  let selected = $state<Partial<Record<ResourceType, number>>>({});

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const shopRows = $derived(
    (Object.entries(stock) as [ResourceType, { price: number; count: number }][])
      .filter(([, item]) => item.count > 0)
      .map(([type, item]) => ({
        type,
        price: item.price,
        available: item.count,
        quantity: selected[type] ?? 0,
      }))
  );

  const totalCost = $derived(
    shopRows.reduce((sum, row) => sum + row.price * row.quantity, 0)
  );

  const gold = $derived(gs.player.gold);
  const canAfford = $derived(totalCost <= gold);
  const hasSelection = $derived(shopRows.some((row) => row.quantity > 0));
  const canConfirm = $derived(hasSelection && canAfford);

  function formatResource(type: ResourceType): string {
    return type.replace(/_/g, ' ');
  }

  function clamp(value: number | undefined, min: number, max: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function setQuantity(type: ResourceType, value: number, max: number) {
    selected = { ...selected, [type]: clamp(value, 0, max) };
  }

  function onNumberInput(event: Event, type: ResourceType, max: number) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    if (raw === '') return;
    setQuantity(type, Number.parseInt(raw, 10), max);
  }

  function onRowClick(event: MouseEvent, type: ResourceType, quantity: number, max: number) {
    if (event.type === 'contextmenu') event.preventDefault();
    setQuantity(type, quantity + (event.type === 'contextmenu' ? -1 : 1), max);
  }

  function buildParameters(): TransactionParameters {
    const resources: Partial<Record<ResourceType, number>> = {};
    for (const row of shopRows) {
      if (row.quantity > 0) {
        resources[row.type] = row.quantity;
      }
    }
    return {
      cost: totalCost,
      transactionType: TransactionType.Purchase,
      items: { resources },
    };
  }

  function confirm() {
    if (!canConfirm) return;
    performAction({
      ...action,
      actionParameters: buildParameters(),
      missingParameters: {},
    });
    onDone();
  }
</script>

{#snippet stepper(type: ResourceType, value: number, max: number, label: string)}
  <div
    class="num-control"
    onclick={(event) => event.stopPropagation()}
    oncontextmenu={(event) => event.stopPropagation()}
  >
    <input
      type="number"
      min="0"
      {max}
      {value}
      aria-label={label}
      oninput={(event) => onNumberInput(event, type, max)}
      onblur={() => setQuantity(type, value, max)}
    />
    <div class="step-arrows">
      <button
        type="button"
        class="step-arrow"
        disabled={value >= max}
        aria-label="Increase {label}"
        onclick={() => setQuantity(type, value + 1, max)}
      >
        ▲
      </button>
      <button
        type="button"
        class="step-arrow"
        disabled={value <= 0}
        aria-label="Decrease {label}"
        onclick={() => setQuantity(type, value - 1, max)}
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
    aria-labelledby="shop-title"
    style="--wood: url('{woodPath}'); --table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="shop-title" class="title">
        <span class="star" aria-hidden="true"></span>
        {place?.name ?? 'Shop'}
        <span class="star" aria-hidden="true"></span>
      </h2>

      <section class="section" aria-label="Items for sale">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          For sale
        </h3>
        {#if shopRows.length === 0}
          <p class="empty">Nothing left in stock.</p>
        {:else}
          <div class="item-list">
            {#each shopRows as row (row.type)}
              {@const label = formatResource(row.type)}
              <div
                class="item-row"
                class:on={row.quantity > 0}
                onclick={(event) => onRowClick(event, row.type, row.quantity, row.available)}
                oncontextmenu={(event) => onRowClick(event, row.type, row.quantity, row.available)}
              >
                <span class="item-name">{label}</span>
                <span class="item-price">{row.price}g</span>
                {@render stepper(row.type, row.quantity, row.available, label)}
                <span class="stock">{row.available} in stock</span>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="section" aria-label="Total">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Total
        </h3>
        <div class="totals">
          <div class="total">
            <div class="total-label">Cost</div>
            <div class="total-well">{totalCost}g</div>
          </div>
          <div class="total">
            <div class="total-label">Your gold</div>
            <div class="total-well" class:short={!canAfford && hasSelection}>{gold}g</div>
          </div>
        </div>
        {#if hasSelection && !canAfford}
          <p class="warning">Not enough gold.</p>
        {/if}
      </section>

      <footer class="actions">
        <button type="button" class="action-btn cancel" onclick={onDone}>Cancel</button>
        <button type="button" class="action-btn confirm" disabled={!canConfirm} onclick={confirm}>
          Buy
        </button>
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
    width: min(560px, 100%);
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

  .empty {
    margin: 0;
    color: #6a5c4c;
    font-size: 0.95rem;
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    cursor: pointer;
    user-select: none;
  }

  .item-name {
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

  .item-row.on .item-name {
    border-color: var(--color-golden);
  }

  .item-price {
    flex-shrink: 0;
    width: 3.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
    color: #3a3228;
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

  .stock {
    width: 5.5rem;
    flex-shrink: 0;
    text-align: right;
    font-size: 0.8rem;
    color: #6a5c4c;
    font-variant-numeric: tabular-nums;
  }

  .totals {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .total {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 10px;
  }

  .total + .total {
    border-left: 1px solid rgba(90, 75, 60, 0.35);
  }

  .total-label {
    font-size: 0.92rem;
    color: #2c251d;
    text-align: center;
  }

  .total-well {
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

  .total-well.short {
    border-color: #8b3a2a;
    color: #f0b8a8;
  }

  .warning {
    margin: 10px 0 0;
    text-align: center;
    font-size: 0.9rem;
    color: #8b3a2a;
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

  .action-btn:disabled {
    opacity: 0.45;
    cursor: default;
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
