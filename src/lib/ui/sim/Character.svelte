<script lang="ts">
  import type { Attributes, Character as CharacterModel, Npc } from '@/lib/_model';
  import { SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
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
  const ATTR_META: Record<keyof Attributes, { icon: string; color: string }> = {
    dexterity: { icon: 'boot', color: '#c68642' },
    intelligence: { icon: 'book', color: '#5b8ac8' },
    vitality: { icon: 'heart', color: '#789b5b' },
    charisma: { icon: 'sun', color: '#8a6da8' },
    aura: { icon: 'spiral', color: '#64999b' },
  };
  const SUB_ICONS: Record<SubscriptionType, string> = {
    [SubscriptionType.Academy]: 'sun',
    [SubscriptionType.Library]: 'book',
    [SubscriptionType.Inn]: 'mug',
  };

  const place = $derived(gs.places[character.placeKey]);
  const region = $derived(place ? gs.regions[place.regionKey] : undefined);

  const attributeRows = $derived(
    ATTR_ORDER.map((key) => ({
      key,
      value: character.attributes[key],
      pct: Math.min(100, Math.max(0, (character.attributes[key] / ATTR_MAX) * 100)),
      ...ATTR_META[key],
    })),
  );

  const traits = $derived(
    'traits' in character
      ? Object.entries((character as Npc).traits)
          .filter(([, active]) => active)
          .map(([trait]) => trait)
      : [],
  );

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: character.subscriptions[type] ?? 0,
      icon: SUB_ICONS[type],
    })),
  );

  function iconUrl(name: string) {
    return getAssetPath(`images/ui/${name}.svg`);
  }
</script>

{#snippet icon(name: string)}
  <span class="icon" style="--icon: url('{iconUrl(name)}')" aria-hidden="true"></span>
{/snippet}

{#snippet divider()}
  <div class="divider" aria-hidden="true">
    <span class="rule"></span>
    <span class="diamond"></span>
    <span class="rule"></span>
  </div>
{/snippet}

<div class="character">
  <div class="sheet">
    <header class="sheet-header">
      <div class="portrait-frame">
        <span class="frame-corner tl" aria-hidden="true"></span>
        <span class="frame-corner tr" aria-hidden="true"></span>
        <span class="frame-corner bl" aria-hidden="true"></span>
        <span class="frame-corner br" aria-hidden="true"></span>
        <CharacterPortrait {character} />
      </div>
      <div class="identity">
        <h2 class="name">{character.name}</h2>
        {@render divider()}
        <dl class="meta">
          <div class="meta-row">
            {@render icon('pin')}
            <dt>Location</dt>
            <dd>{place?.name ?? character.placeKey}</dd>
          </div>
          {#if region}
            <div class="meta-row">
              {@render icon('temple')}
              <dt>Region</dt>
              <dd>{region.name}</dd>
            </div>
          {/if}
          <div class="meta-row">
            {@render icon('coin')}
            <dt>Gold</dt>
            <dd class="gold">{character.gold}</dd>
          </div>
        </dl>
      </div>
    </header>

    <div class="sheet-body">
      <section class="section">
        <h3 class="section-title">
          {@render icon('compass')}
          Attributes
        </h3>
        {@render divider()}
        <ul class="attr-list">
          {#each attributeRows as attr (attr.key)}
            <li class="attr-row" style="--attr-color: {attr.color}">
              {@render icon(attr.icon)}
              <span class="attr-name">{attr.key}</span>
              <div class="attr-bar" aria-hidden="true">
                <div class="attr-fill" style="width: {attr.pct}%"></div>
              </div>
              <span class="attr-value">{attr.value}</span>
            </li>
          {/each}
        </ul>
      </section>

      {#if traits.length > 0}
        <section class="section">
          <h3 class="section-title">
            {@render icon('leaf')}
            Traits
          </h3>
          {@render divider()}
          <ul class="trait-list">
            {#each traits as trait (trait)}
              <li class="trait-item" class:friendly={trait === 'friendly'} class:grumpy={trait === 'grumpy'}>
                {trait}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

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
    </div>
  </div>
</div>

<style>
  .character {
    --gold: var(--color-golden);
    --gold-text: var(--color-cream);
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    color: var(--gold-text);
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
    scrollbar-color: rgba(196, 165, 116, 0.35) transparent;
  }

  .icon {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
    flex-shrink: 0;
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .sheet-header {
    display: flex;
    flex-shrink: 0;
    gap: 1.1rem;
    align-items: stretch;
    min-width: 0;
    padding: 1.15rem 1.25rem 1rem;
    box-sizing: border-box;
    color: var(--gold-text);
    background: transparent;
    box-shadow: inset 0 -1px 0 rgba(191, 161, 74, 0.35);
  }

  .portrait-frame {
    position: relative;
    flex: 0 0 auto;
    width: clamp(132px, 22vw, 210px);
    aspect-ratio: 1;
    overflow: hidden;
    border: 1px solid var(--color-golden);
    background: rgba(10, 16, 24, 0.45);
    box-shadow: inset 0 0 0 4px rgba(191, 161, 74, 0.18);
  }

  .frame-corner {
    position: absolute;
    z-index: 1;
    width: 12px;
    height: 12px;
    border-color: var(--color-golden);
    pointer-events: none;
  }

  .frame-corner.tl {
    top: 5px;
    left: 5px;
    border-top: 1px solid;
    border-left: 1px solid;
  }

  .frame-corner.tr {
    top: 5px;
    right: 5px;
    border-top: 1px solid;
    border-right: 1px solid;
  }

  .frame-corner.bl {
    bottom: 5px;
    left: 5px;
    border-bottom: 1px solid;
    border-left: 1px solid;
  }

  .frame-corner.br {
    bottom: 5px;
    right: 5px;
    border-bottom: 1px solid;
    border-right: 1px solid;
  }

  .portrait-frame :global(.character-portrait) {
    border-radius: 0;
  }

  .identity {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.55rem;
    padding-top: 0.15rem;
  }

  .name {
    margin: 0;
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--gold-text);
    letter-spacing: 0.01em;
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

  .meta {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
  }

  .meta-row {
    display: grid;
    grid-template-columns: 1.1rem 5.6rem 1fr;
    gap: 0.45rem;
    align-items: center;
    min-width: 0;
  }

  .meta-row dt {
    margin: 0;
    color: var(--color-muted-label);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.68rem;
    font-weight: 700;
  }

  .meta-row dd {
    margin: 0;
    min-width: 0;
    color: var(--gold-text);
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gold {
    color: var(--color-golden);
    font-variant-numeric: tabular-nums;
  }

  .sheet-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    min-width: 0;
    padding: 1.05rem 1.2rem 1.2rem;
    box-sizing: border-box;
    color: var(--gold-text);
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
    color: var(--color-golden);
  }

  .section-title .icon {
    width: 0.95rem;
    height: 0.95rem;
  }

  .sheet-body .divider {
    color: var(--gold);
  }

  .attr-list,
  .sub-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .trait-list {
    margin: 0;
    padding: 0.15rem 0 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .trait-item {
    font-size: 0.82rem;
    text-transform: capitalize;
    color: #d8c9a0;
    padding: 0.18rem 0.7rem;
    border: 1px solid rgba(196, 165, 116, 0.55);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.28);
  }

  .trait-item.friendly {
    color: #c5d4a8;
    border-color: #7d9260;
    background: #1c2a22;
  }

  .trait-item.grumpy {
    color: #d4b8a8;
    border-color: #a07050;
    background: #2a1c18;
  }

  .attr-row {
    display: grid;
    grid-template-columns: 1.1rem 6.4rem 1fr 1.7rem;
    gap: 0.5rem;
    align-items: center;
  }

  .attr-name {
    font-size: 0.9rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .attr-bar {
    height: 0.72rem;
    border-radius: 2px;
    background: #0c1016;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.7);
  }

  .attr-fill {
    height: 100%;
    border-radius: 2px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 48%, rgba(0, 0, 0, 0.28)),
      var(--attr-color);
    box-shadow: 0 0 8px color-mix(in srgb, var(--attr-color) 42%, transparent);
  }

  .attr-value {
    text-align: right;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-cream);
  }

  .sub-row {
    display: grid;
    grid-template-columns: 1.1rem 1fr auto;
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
</style>
