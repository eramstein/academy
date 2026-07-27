<script lang="ts">
  import Inventory from './sim-data/Inventory.svelte';

  type SimDataTab = 'inventory';

  const tabs: { id: SimDataTab; label: string }[] = [{ id: 'inventory', label: 'Inventory' }];

  let selected = $state<SimDataTab>('inventory');
</script>

<div class="sim-data">
  <nav class="menu">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class="menu-item"
        class:active={selected === tab.id}
        onclick={() => (selected = tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </nav>

  <div class="content">
    {#if selected === 'inventory'}
      <Inventory />
    {/if}
  </div>
</div>

<style>
  .sim-data {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #1a1a1a;
    color: white;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .menu {
    display: flex;
    flex-shrink: 0;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .menu-item {
    padding: 0.4rem 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #cccccc;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .menu-item.active {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 0.75rem;
  }
</style>
