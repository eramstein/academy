<script lang="ts">
  import type { UnitStatuses } from '@lib/_model';
  import Tooltip from '../Tooltip.svelte';

  let { statuses }: { statuses: UnitStatuses } = $props();

  // Tooltip state
  let hoveredStatus = $state<string | null>(null);

  // Icon lookup object for status effects
  const statusIcons = {
    poison: '☠️',
    mezz: '💤',
    root: '🌱',
    stun: '💫',
    daze: '😵',
    vulnerable: '💀',
  };

  // Tooltip content for each status
  const tooltipContent = {
    poison: (value: number) =>
      `Poisoned (${value}): This unit takes ${value} damage at the start of each turn.`,
    mezz: (value: number) =>
      `Mezzed (${value}): This unit cannot attack or move for ${value} more turns. Any damage breaks the effect.`,
    root: (value: number) => `Rooted (${value}): This unit cannot move for ${value} more turns.`,
    stun: (value: number) =>
      `Stunned (${value}): This unit cannot do anything for ${value} more turns.`,
    daze: (value: number) => `Dazed (${value}): This unit cannot attack for ${value} more turns.`,
    vulnerable: (value: number) =>
      `Vulnerable (${value}): This unit takes double damage from attacks.`,
  };

  function handleMouseEnter(status: string) {
    hoveredStatus = status;
  }

  function handleMouseLeave() {
    hoveredStatus = null;
  }

  // Get all active statuses with their values
  let activeStatuses = $derived(() => {
    const result: Array<{ key: string; value: number; icon: string }> = [];

    Object.entries(statuses).forEach(([key, value]) => {
      if (value && value > 0 && key in statusIcons) {
        result.push({ key, value, icon: statusIcons[key as keyof typeof statusIcons] });
      }
    });

    return result;
  });
</script>

<div class="statuses">
  {#each activeStatuses() as { key, value, icon }}
    <Tooltip
      content={tooltipContent[key as keyof typeof tooltipContent](value)}
      show={hoveredStatus === key}
    >
      <div
        class="status"
        onmouseenter={() => handleMouseEnter(key)}
        onmouseleave={handleMouseLeave}
      >
        <span class="status-icon">{icon}</span>
        <span class="status-value">{value}</span>
      </div>
    </Tooltip>
  {/each}
</div>

<style>
  .statuses {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .status {
    background: rgba(139, 0, 0, 0.8);
    color: white;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 2px;
    border: 1px solid #ff4444;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    position: relative;
  }

  .status-icon {
    font-size: 0.9rem;
  }

  .status-value {
    position: absolute;
    top: -4px;
    left: -4px;
    background: rgba(255, 255, 255, 0.9);
    color: #ff0000;
    font-weight: bold;
    font-size: 0.6rem;
    min-width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.8);
    z-index: 0;
  }
</style>
