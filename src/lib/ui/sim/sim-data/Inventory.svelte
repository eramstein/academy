<script lang="ts">
  import { SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';

  const gold = $derived(gs.player.gold);
  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: gs.player.subscriptions[type] ?? 0,
    })),
  );
</script>

<div class="inventory">
  <p class="gold">Gold: {gold}</p>

  <div class="subscriptions">
    <h3 class="section-title">Subscriptions</h3>
    <ul class="subscription-list">
      {#each subscriptions as sub (sub.type)}
        <li class="subscription-item">
          <span class="sub-name">{sub.type}</span>
          <span class="sub-days">{sub.days} days</span>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .inventory {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .gold {
    margin: 0;
    font-size: 1.1rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-golden);
  }

  .section-title {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #cccccc;
  }

  .subscription-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .subscription-item {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.95rem;
    text-transform: capitalize;
  }

  .sub-name {
    color: #e8e8e8;
  }

  .sub-days {
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }
</style>
