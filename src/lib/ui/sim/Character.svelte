<script lang="ts">
  import type { Character as CharacterModel, Npc } from '@/lib/_model';
  import { SubscriptionType } from '@/lib/_model/enums-sim';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import Attributes from './Attributes.svelte';
  import CharacterIdentity from './characters/CharacterIdentity.svelte';

  let { character }: { character: CharacterModel } = $props();

  const SUB_ICONS: Record<SubscriptionType, string> = {
    [SubscriptionType.Academy]: 'sun',
    [SubscriptionType.Library]: 'book',
    [SubscriptionType.Inn]: 'mug',
  };

  const traits = $derived(
    'traits' in character
      ? Object.entries((character as Npc).traits)
          .filter(([, active]) => active)
          .map(([trait]) => trait)
      : []
  );

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: character.subscriptions[type] ?? 0,
      icon: SUB_ICONS[type],
    }))
  );

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

<div class="character">
  <div class="sheet">
    <CharacterIdentity {character} />

    <div class="sheet-body">
      <section class="section">
        <h3 class="section-title">
          {@render icon('compass')}
          Attributes
        </h3>
        {@render divider()}
        <Attributes attributes={character.attributes} />
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
              <li
                class="trait-item"
                class:friendly={trait === 'friendly'}
                class:grumpy={trait === 'grumpy'}
              >
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
    width: 1.05rem;
    height: 1.05rem;
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
    width: 0.95rem;
    height: 0.95rem;
  }

  .sheet-body .divider {
    color: var(--brass);
  }

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
    border: 1px solid rgba(175, 142, 103, 0.55);
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
