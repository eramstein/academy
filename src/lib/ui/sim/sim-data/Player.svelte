<script lang="ts">
  import {
    CardColor,
    isLandCard,
    type CardCraftingSkills,
    type UnitKeywords,
  } from '@/lib/_model';
  import { ResourceType, SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath, getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import Attributes from '../Attributes.svelte';
  import CharacterIdentity from '../characters/CharacterIdentity.svelte';

  const CRAFTING_SKILL_ORDER: (keyof CardCraftingSkills)[] = [
    'mastery',
    'efficiency',
    'inspiration',
  ];
  const SUB_ICONS: Record<SubscriptionType, string> = {
    [SubscriptionType.Academy]: 'sun',
    [SubscriptionType.Library]: 'book',
    [SubscriptionType.Inn]: 'mug',
  };
  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: 'magic_dust',
    [ResourceType.Mithril]: 'metal_bar',
    [ResourceType.Moxes]: 'gem',
  };

  const player = $derived(gs.player);

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: player.subscriptions[type] ?? 0,
      icon: SUB_ICONS[type],
    }))
  );

  const resources = $derived(
    Object.values(ResourceType).map((type) => ({
      type,
      amount: player.resources[type] ?? 0,
    }))
  );

  const craftingSkills = $derived(
    CRAFTING_SKILL_ORDER.map((key) => ({
      key,
      value: player.craftingSkills?.[key] ?? 0,
    }))
  );

  const craftingColors = $derived(
    Object.entries(player.craftingKnowledge.colors ?? {}).map(([color, level]) => ({
      color: color as CardColor,
      level,
    }))
  );

  const craftingKeywords = $derived(
    Object.entries(player.craftingKnowledge.keywords ?? {}).map(([keyword, level]) => ({
      keyword: keyword as keyof UnitKeywords,
      level,
    }))
  );

  const collectionCount = $derived(player.collection.length);
  const landCount = $derived(player.collection.filter(isLandCard).length);
  const cardCount = $derived(collectionCount - landCount);

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  function formatKeyword(keyword: string): string {
    return keyword.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  function formatResource(type: ResourceType): string {
    return type.replace(/_/g, ' ');
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

<div class="player">
  <div class="sheet">
    <CharacterIdentity character={player} />

    <div class="sheet-body">
      <section class="section">
        <h3 class="section-title">
          {@render icon('compass')}
          Attributes
        </h3>
        {@render divider()}
        <Attributes attributes={player.attributes} />
      </section>

      <section class="section">
        <h3 class="section-title">
          {@render icon('coin')}
          Inventory
        </h3>
        {@render divider()}
        <ul class="kv-list">
          {#each resources as resource (resource.type)}
            <li class="sub-row">
              {@render icon(RESOURCE_ICONS[resource.type])}
              <span class="kv-name">{formatResource(resource.type)}</span>
              <span class="kv-value">{resource.amount}</span>
            </li>
          {/each}
        </ul>
      </section>

      <section class="section">
        <h3 class="section-title">
          {@render icon('book')}
          Subscriptions
        </h3>
        {@render divider()}
        <ul class="sub-list">
          {#each subscriptions as sub (sub.type)}
            <li class="sub-row">
              {@render icon(sub.icon)}
              <span class="sub-name">{sub.type}</span>
              <span class="sub-days">{sub.days} days</span>
            </li>
          {/each}
        </ul>
      </section>

      <section class="section">
        <h3 class="section-title">
          {@render icon('spiral')}
          Card Crafting
        </h3>
        {@render divider()}
        <ul class="kv-list">
          {#each craftingSkills as skill (skill.key)}
            <li class="kv-row">
              <span class="kv-name">{skill.key}</span>
              <span class="kv-value">{skill.value}</span>
            </li>
          {/each}
        </ul>
        {#if craftingColors.length > 0}
          <h4 class="subsection-title">Colors</h4>
          <ul class="chip-list">
            {#each craftingColors as { color, level } (color)}
              <li
                class="color-indicator"
                style="background-image: url('{colorPath(color)}')"
                title="{color} · {level}"
              ></li>
            {/each}
          </ul>
        {/if}
        {#if craftingKeywords.length > 0}
          <h4 class="subsection-title">Keywords</h4>
          <ul class="kv-list">
            {#each craftingKeywords as { keyword, level } (keyword)}
              <li class="kv-row">
                <span class="kv-name keyword">{formatKeyword(keyword)}</span>
                <span class="kv-value">{level}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="section">
        <h3 class="section-title">
          {@render icon('book')}
          Collection
        </h3>
        {@render divider()}
        {#if collectionCount === 0}
          <p class="empty">Empty.</p>
        {:else}
          <p class="summary">{cardCount} cards · {landCount} lands</p>
        {/if}
      </section>

      <section class="section">
        <h3 class="section-title">
          {@render icon('cards')}
          Decks
        </h3>
        {@render divider()}
        {#if player.decks.length === 0}
          <p class="empty">None yet.</p>
        {:else}
          <ul class="kv-list">
            {#each player.decks as deck (deck.key)}
              <li class="kv-row">
                <span class="kv-name">{deck.name}</span>
                <span class="kv-value">{deck.cards.length} cards · {deck.lands.length} lands</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .player {
    --brass: var(--color-brass);
    --brass-text: var(--color-cream);
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    color: var(--brass-text);
    font-family: var(--font-narrative);
    background: transparent;
  }

  .sheet {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 142, 103, 0.35) transparent;
  }

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

  .sheet-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    min-width: 0;
    padding: 1.05rem 1.2rem 1.2rem;
    box-sizing: border-box;
    color: var(--brass-text);
    background: transparent;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
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

  .sheet-body .divider {
    color: var(--brass);
  }

  .subsection-title {
    margin: 0.35rem 0 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .empty,
  .summary {
    margin: 0;
    font-size: 0.95rem;
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .kv-list,
  .sub-list,
  .chip-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .kv-list,
  .sub-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .kv-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    font-size: 0.95rem;
  }

  .kv-name {
    font-size: 0.9rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .kv-value {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .keyword {
    text-transform: none;
  }

  .sub-row {
    display: grid;
    grid-template-columns: 1.4rem 1fr auto;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.95rem;
  }

  .sub-name {
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .sub-days {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
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
