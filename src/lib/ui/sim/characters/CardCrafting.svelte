<script lang="ts">
  import {
    CardColor,
    type CardCraftingSkills,
    type Character,
    type UnitKeywords,
  } from '@/lib/_model';
  import { getAssetPath, getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import { getActionTemplateMeta } from '@/lib/sim/cards/action-templates';
  import Tooltip from '@/lib/ui/Tooltip.svelte';

  let { character }: { character: Character } = $props();
  let hoveredLabel = $state<string | null>(null);
  let labelTruncated = $state(false);

  function onLabelEnter(id: string, event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    hoveredLabel = id;
    labelTruncated = el.scrollWidth > el.clientWidth + 1;
  }

  function onLabelLeave() {
    hoveredLabel = null;
    labelTruncated = false;
  }

  function actionTooltip(label: string, description: string, truncated: boolean): string {
    if (truncated && description) return `${label} — ${description}`;
    if (truncated) return label;
    return description;
  }

  const CRAFTING_SKILL_ORDER: (keyof CardCraftingSkills)[] = [
    'mastery',
    'efficiency',
    'inspiration',
  ];

  const craftingSkills = $derived(
    CRAFTING_SKILL_ORDER.map((key) => ({
      key,
      value: character.craftingSkills?.[key] ?? 0,
    }))
  );

  const craftingColors = $derived(
    Object.entries(character.craftingKnowledge.colors ?? {}).map(([color, level]) => ({
      color: color as CardColor,
      level,
    }))
  );

  const craftingKeywords = $derived(
    Object.entries(character.craftingKnowledge.keywords ?? {}).map(([keyword, level]) => ({
      keyword: keyword as keyof UnitKeywords,
      level,
    }))
  );

  const craftingActions = $derived(
    Object.entries(character.craftingKnowledge.actions ?? {}).map(([name, level]) => {
      const meta = getActionTemplateMeta(name);
      return {
        name,
        level,
        label: meta?.label ?? formatKeyword(name),
        description: meta?.description ?? '',
      };
    })
  );

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function formatKeyword(keyword: string): string {
    return keyword.replace(/([a-z])([A-Z])/g, '$1 $2');
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

{#snippet divider()}
  <div class="divider" aria-hidden="true">
    <span class="rule"></span>
    <span class="diamond"></span>
    <span class="rule"></span>
  </div>
{/snippet}

<section class="section">
  <div class="header-row" class:single={craftingColors.length === 0}>
    <h3 class="section-title">
      {@render icon('spiral')}
      Card Crafting
    </h3>
    {#if craftingColors.length > 0}
      <h4 class="subsection-title">Colors</h4>
    {/if}
  </div>
  {@render divider()}
  <div class="two-col" class:single={craftingColors.length === 0}>
    <div class="col">
      <ul class="kv-list">
        {#each craftingSkills as skill (skill.key)}
          <li class="kv-row">
            <span class="kv-name">{skill.key}</span>
            <span class="kv-value">{skill.value}</span>
          </li>
        {/each}
      </ul>
    </div>
    {#if craftingColors.length > 0}
      <div class="col">
        <ul class="chip-list">
          {#each craftingColors as { color, level } (color)}
            <li
              class="color-indicator"
              style="background-image: url('{colorPath(color)}')"
              title="{color} · {level}"
            ></li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
  {#if craftingKeywords.length > 0}
    <h4 class="subsection-title">Keywords</h4>
    <ul class="kv-grid">
      {#each craftingKeywords as { keyword, level } (keyword)}
        {@const label = formatKeyword(keyword)}
        <li class="kv-pair">
          <Tooltip content={label} show={hoveredLabel === keyword && labelTruncated}>
            <span
              class="kv-name keyword"
              class:truncated={hoveredLabel === keyword && labelTruncated}
              onmouseenter={(e) => onLabelEnter(keyword, e)}
              onmouseleave={onLabelLeave}
            >
              {label}
            </span>
          </Tooltip>
          <span class="kv-value">{level}</span>
        </li>
      {/each}
    </ul>
  {/if}
  {#if craftingActions.length > 0}
    <h4 class="subsection-title">Actions</h4>
    <ul class="kv-grid">
      {#each craftingActions as { name, level, label, description } (name)}
        {@const tip = actionTooltip(label, description, labelTruncated && hoveredLabel === name)}
        <li class="kv-pair">
          <Tooltip content={tip} show={hoveredLabel === name && (!!tip)}>
            <span
              class="kv-name action"
              class:truncated={hoveredLabel === name && labelTruncated}
              onmouseenter={(e) => onLabelEnter(name, e)}
              onmouseleave={onLabelLeave}
            >
              {label}
            </span>
          </Tooltip>
          <span class="kv-value">{level}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .icon {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
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

  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.45rem;
    color: var(--color-brass);
  }

  .rule {
    height: 1px;
    background: currentColor;
    opacity: 0.38;
  }

  .diamond {
    width: 7px;
    height: 7px;
    background: currentColor;
    opacity: 0.55;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .header-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.15rem;
    align-items: center;
    min-width: 0;
  }

  .header-row.single {
    grid-template-columns: 1fr;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .section-title .icon {
    width: 1.2rem;
    height: 1.2rem;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.15rem;
    min-width: 0;
  }

  .two-col.single {
    grid-template-columns: 1fr;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-width: 0;
  }

  .subsection-title {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .kv-list,
  .kv-grid,
  .chip-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .kv-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .kv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    column-gap: 0.85rem;
    row-gap: 0.3rem;
  }

  .kv-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    font-size: 0.95rem;
  }

  .kv-pair {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
    min-width: 0;
    overflow: hidden;
    font-size: 0.85rem;
  }

  .kv-pair :global(.tooltip-reference) {
    flex: 1 1 0;
    min-width: 0;
    max-width: 100%;
    display: block;
    overflow: hidden;
  }

  .kv-name {
    font-size: 0.9rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .kv-pair .kv-name {
    display: block;
    font-size: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kv-value {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .kv-pair .kv-value {
    flex-shrink: 0;
  }

  .action {
    text-transform: none;
  }

  .action,
  .kv-name.truncated {
    cursor: help;
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .color-indicator {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid var(--color-brass);
  }
</style>
