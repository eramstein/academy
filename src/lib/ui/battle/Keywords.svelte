<script lang="ts">
  import type { UnitKeywords } from '@lib/_model';
  import Tooltip from '../Tooltip.svelte';
  import { KEYWORD_TOOLTIPS } from '../_helpers/keywordTooltips';

  let { keywords, pulse = [] }: { keywords: UnitKeywords; pulse?: string[] } = $props();

  // Tooltip state
  let hoveredKeyword = $state<string | null>(null);

  function handleMouseEnter(keyword: string) {
    hoveredKeyword = keyword;
  }

  function handleMouseLeave() {
    hoveredKeyword = null;
  }

  // Get all active keywords with their values
  let activeKeywords = $derived(() => {
    const result: Array<{ key: string; value?: number; icon: string }> = [];

    Object.entries(keywords).forEach(([key, value]) => {
      if (value) {
        const icon = `/assets/images/keywords/${key}.png`;
        if (typeof value === 'number') {
          result.push({ key, value, icon });
        } else if (value === true) {
          result.push({ key, icon });
        }
      }
    });

    return result;
  });
</script>

<div class="keywords">
  {#each activeKeywords() as { key, value, icon }}
    <Tooltip
      content={typeof KEYWORD_TOOLTIPS[key as keyof typeof KEYWORD_TOOLTIPS] === 'function'
        ? (KEYWORD_TOOLTIPS[key as keyof typeof KEYWORD_TOOLTIPS] as Function)(value)
        : KEYWORD_TOOLTIPS[key as keyof typeof KEYWORD_TOOLTIPS]}
      show={hoveredKeyword === key}
    >
      <div
        class="keyword"
        class:enchant-pulse={pulse.includes(key)}
        onmouseenter={() => handleMouseEnter(key)}
        onmouseleave={handleMouseLeave}
      >
        <img src={icon} alt={key} class="keyword-icon" />
        {#if value !== undefined}
          <span class="keyword-value">{value}</span>
        {/if}
      </div>
    </Tooltip>
  {/each}
</div>

<style>
  .keywords {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .keyword {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 2px;
    border: 1px solid var(--color-golden);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    position: relative;
  }

  .keyword-icon {
    font-size: 0.9rem;
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .keyword-value {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--color-golden);
    color: black;
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
