<script lang="ts">
  import type { Attributes, Character as CharacterModel, Player } from '@/lib/_model';
  import { SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import CharacterPortrait from './characters/CharacterPortrait.svelte';

  let { character }: { character: CharacterModel } = $props();

  const ATTR_MAX = 20;
  const ATTR_ORDER: (keyof Attributes)[] = [
    'dexterity',
    'intelligence',
    'vitality',
    'charisma',
    'aura',
  ];

  const place = $derived(gs.places[character.placeKey]);
  const region = $derived(place ? gs.regions[place.regionKey] : undefined);
  const focus = $derived('focus' in character ? (character as Player).focus : null);

  const attributeRows = $derived(
    ATTR_ORDER.map((key) => ({
      key,
      value: character.attributes[key],
      pct: Math.min(100, Math.max(0, (character.attributes[key] / ATTR_MAX) * 100)),
    })),
  );

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: character.subscriptions[type] ?? 0,
    })),
  );
</script>

<div class="character">
  <header class="sheet-header">
    <div class="portrait-frame">
      <CharacterPortrait {character} />
    </div>
    <div class="identity">
      <h2 class="name">{character.name}</h2>
      <dl class="meta">
        <div class="meta-row">
          <dt>Location</dt>
          <dd>{place?.name ?? character.placeKey}</dd>
        </div>
        {#if region}
          <div class="meta-row">
            <dt>Region</dt>
            <dd>{region.name}</dd>
          </div>
        {/if}
        <div class="meta-row">
          <dt>Gold</dt>
          <dd class="gold">{character.gold}</dd>
        </div>
        {#if focus !== null}
          <div class="meta-row">
            <dt>Focus</dt>
            <dd>{focus}</dd>
          </div>
        {/if}
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
    <h3 class="section-title">Subscriptions</h3>
    <ul class="sub-list">
      {#each subscriptions as sub (sub.type)}
        <li class="sub-row">
          <span class="sub-name">{sub.type}</span>
          <span class="sub-days">{sub.days} days</span>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .character {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 1rem 0.85rem;
    box-sizing: border-box;
    color: #e8e8e8;
  }

  .sheet-header {
    display: flex;
    gap: 1rem;
    align-items: stretch;
    min-width: 0;
  }

  .portrait-frame {
    flex: 0 0 320px;
    width: 320px;
    height: 320px;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.35);
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
    color: white;
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
    align-items: baseline;
    font-size: 0.9rem;
  }

  .meta-row dt {
    margin: 0;
    color: #aaaaaa;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.75rem;
  }

  .meta-row dd {
    margin: 0;
    color: #e8e8e8;
  }

  .gold {
    color: var(--color-golden);
    font-variant-numeric: tabular-nums;
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
    color: #cccccc;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .attr-list,
  .sub-list {
    margin: 0;
    padding: 0;
    list-style: none;
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

  .attr-name {
    font-size: 0.85rem;
    text-transform: capitalize;
    color: #dddddd;
  }

  .attr-bar {
    height: 0.45rem;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .attr-fill {
    height: 100%;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.45);
  }

  .attr-value {
    text-align: right;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    color: #f0f0f0;
  }

  .sub-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.9rem;
  }

  .sub-name {
    text-transform: capitalize;
    color: #e8e8e8;
  }

  .sub-days {
    color: #aaaaaa;
    font-variant-numeric: tabular-nums;
  }
</style>
