<script lang="ts">
  import {
    CardColor,
    isLandCard,
    type Attributes,
    type CardCraftingSkills,
    type UnitKeywords,
  } from '@/lib/_model';
  import { ResourceType, SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath, getCharacterImagePath } from '@/lib/_utils/asset-paths';

  const ATTR_MAX = 20;
  const ATTR_ORDER: (keyof Attributes)[] = [
    'dexterity',
    'intelligence',
    'vitality',
    'charisma',
    'aura',
  ];
  const CRAFTING_SKILL_ORDER: (keyof CardCraftingSkills)[] = [
    'mastery',
    'efficiency',
    'inspiration',
  ];

  let portraitFailed = $state(false);

  const player = $derived(gs.player);
  const place = $derived(gs.places[player.placeKey]);
  const region = $derived(place ? gs.regions[place.regionKey] : undefined);
  const portraitPath = $derived(getCharacterImagePath(player.key));

  $effect(() => {
    portraitPath;
    portraitFailed = false;
  });

  const attributeRows = $derived(
    ATTR_ORDER.map((key) => ({
      key,
      value: player.attributes[key],
      pct: Math.min(100, Math.max(0, (player.attributes[key] / ATTR_MAX) * 100)),
    }))
  );

  const focusPct = $derived(
    player.maxFocus > 0 ? Math.min(100, Math.max(0, (player.focus / player.maxFocus) * 100)) : 0
  );

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: player.subscriptions[type] ?? 0,
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
</script>

<div class="player">
  <header class="sheet-header">
    <div class="portrait-frame">
      {#if !portraitFailed}
        <img
          class="portrait"
          src={portraitPath}
          alt={player.name}
          onerror={() => (portraitFailed = true)}
        />
      {:else}
        <div class="portrait-fallback" aria-hidden="true">{player.name.charAt(0)}</div>
      {/if}
    </div>
    <div class="identity">
      <h2 class="name">{player.name}</h2>
      <dl class="meta">
        <div class="meta-row">
          <dt>Location</dt>
          <dd>{place?.name ?? player.placeKey}</dd>
        </div>
        {#if region}
          <div class="meta-row">
            <dt>Region</dt>
            <dd>{region.name}</dd>
          </div>
        {/if}
        <div class="meta-row">
          <dt>Gold</dt>
          <dd class="gold">{player.gold}</dd>
        </div>
        <div class="meta-row">
          <dt>Focus</dt>
          <dd class="focus-meta">
            <div class="focus-bar" aria-hidden="true">
              <div class="focus-fill" style="width: {focusPct}%"></div>
            </div>
            <span>{player.focus} / {player.maxFocus}</span>
          </dd>
        </div>
      </dl>
    </div>
  </header>

  <section class="section">
    <h3 class="section-title">Attributes</h3>
    <ul class="attr-list">
      {#each attributeRows as attr (attr.key)}
        <li class="attr-row">
          <span class="attr-name">{attr.key}</span>
          <div class="attr-bar" aria-hidden="true">
            <div class="attr-fill" style="width: {attr.pct}%"></div>
          </div>
          <span class="attr-value">{attr.value}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="section">
    <h3 class="section-title">Inventory</h3>
    <ul class="kv-list">
      {#each resources as resource (resource.type)}
        <li class="kv-row">
          <span class="kv-name">{formatResource(resource.type)}</span>
          <span class="kv-value">{resource.amount}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="section">
    <h3 class="section-title">Subscriptions</h3>
    <ul class="kv-list">
      {#each subscriptions as sub (sub.type)}
        <li class="kv-row">
          <span class="kv-name">{sub.type}</span>
          <span class="kv-value">{sub.days} days</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="section">
    <h3 class="section-title">Card Crafting</h3>
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
          <li class="chip">
            <div
              class="color-indicator"
              style="background-image: url('{colorPath(color)}')"
              title={color}
            ></div>
            <span class="chip-name">{color}</span>
            <span class="chip-level">{level}</span>
          </li>
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
    <h3 class="section-title">Collection</h3>
    {#if collectionCount === 0}
      <p class="empty">Empty.</p>
    {:else}
      <p class="summary">{cardCount} cards · {landCount} lands</p>
    {/if}
  </section>

  <section class="section">
    <h3 class="section-title">Decks</h3>
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

<style>
  .player {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: var(--color-cream);
    font-family: var(--font-narrative);
  }

  .sheet-header {
    display: flex;
    gap: 1rem;
    align-items: stretch;
    min-width: 0;
  }

  .portrait-frame {
    flex: 0 0 144px;
    width: 144px;
    height: 144px;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--color-golden);
    background: var(--color-deep-brown);
  }

  .portrait {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .portrait-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 600;
    color: var(--color-muted-label);
    background: rgba(255, 255, 255, 0.06);
  }

  .identity {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .name {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-cream);
  }

  .meta {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .meta-row {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.9rem;
  }

  .meta-row dt {
    margin: 0;
    color: var(--color-muted-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.75rem;
  }

  .meta-row dd {
    margin: 0;
    color: var(--color-cream);
  }

  .gold {
    color: var(--color-golden);
    font-variant-numeric: tabular-nums;
  }

  .focus-meta {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-variant-numeric: tabular-nums;
  }

  .focus-bar,
  .attr-bar {
    height: 0.45rem;
    border-radius: 2px;
    background: #0c1016;
    overflow: hidden;
  }

  .focus-bar {
    flex: 1 1 auto;
    min-width: 0;
  }

  .focus-fill,
  .attr-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--color-golden);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(191, 161, 74, 0.35);
  }

  .subsection-title {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .empty,
  .summary {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .empty {
    font-size: 0.95rem;
  }

  .attr-list,
  .kv-list,
  .chip-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .attr-list,
  .kv-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .attr-row {
    display: grid;
    grid-template-columns: 6.5rem 1fr 2rem;
    gap: 0.55rem;
    align-items: center;
  }

  .attr-name,
  .kv-name {
    font-size: 0.85rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .attr-value {
    text-align: right;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-cream);
  }

  .kv-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.9rem;
  }

  .kv-value {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .keyword {
    text-transform: none;
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--color-golden);
    border-radius: 3px;
    background: rgba(191, 161, 74, 0.08);
  }

  .chip-name {
    font-size: 0.85rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .chip-level {
    font-size: 0.8rem;
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .color-indicator {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid var(--color-golden);
  }
</style>
