<script lang="ts">
  import type { CardTemplate, Character, Narration } from '@/lib/_model';
  import { DayPeriod, NarrationType, ResourceType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import { addCardToDeck } from '@/lib/sim/deck';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import { untrack } from 'svelte';
  import AttributeCheckEntry from './AttributeCheckEntry.svelte';
  import CharacterPortrait from './characters/CharacterPortrait.svelte';
  import NarrationText from './NarrationText.svelte';

  let {
    done = $bindable(false),
    onProgress,
  }: {
    done?: boolean;
    onProgress?: (behavior?: 'auto' | 'smooth') => void;
  } = $props();

  const periodIcon: Record<DayPeriod, string> = {
    [DayPeriod.Morning]: 'sunrise',
    [DayPeriod.Afternoon]: 'sun',
    [DayPeriod.Evening]: 'moon',
  };

  const resourceIcon: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: 'magic_dust',
    [ResourceType.Mithril]: 'metal_bar',
    [ResourceType.Moxes]: 'gem',
  };

  const narration = $derived(gs.scene.narration);

  let completedIds = $state<string[]>([]);

  const completedSet = $derived(new Set(completedIds));
  const activeEntry = $derived(narration.find((entry) => !completedSet.has(entry.id)));
  const narrationDone = $derived(narration.length > 0 && completedIds.length >= narration.length);

  $effect(() => {
    done = narrationDone;
  });

  // When scene is replaced (save load / init), show existing narration instantly.
  // Live pushes keep the same scene object, so new entries still animate.
  $effect.pre(() => {
    const scene = gs.scene;
    untrack(() => {
      completedIds = scene.narration.map((entry) => entry.id);
    });
  });

  $effect(() => {
    const ids = new Set(narration.map((entry) => entry.id));
    const next = completedIds.filter((id) => ids.has(id));
    if (next.length !== completedIds.length) {
      completedIds = next;
    }
  });

  // Period separators don't type out — complete as soon as they become active.
  $effect(() => {
    if (activeEntry?.type === NarrationType.NewPeriod) {
      completeEntry(activeEntry.id);
    }
  });

  function completeEntry(id: string) {
    if (completedSet.has(id)) return;
    completedIds = [...completedIds, id];
    onProgress?.('smooth');
  }

  function cardsForEntry(entry: Narration): CardTemplate[] {
    if (!entry.cardIds?.length) return [];
    return entry.cardIds
      .map((id) => gs.player.collection.find((card) => card.id === id))
      .filter((card): card is CardTemplate => card !== undefined);
  }

  function characterForKey(key?: string): Character | undefined {
    if (!key) return undefined;
    if (key === gs.player.key) return gs.player;
    return gs.characters[key];
  }

  function firstDeck() {
    return gs.player.decks[0];
  }

  function cardsInFirstDeck(entry: Narration): boolean {
    const deck = firstDeck();
    const cards = cardsForEntry(entry);
    if (!deck || cards.length === 0) return false;
    return cards.every((card) => deck.cards.some((c) => c.id === card.id));
  }

  function addConjuredCardsToDeck(entry: Narration) {
    const deck = firstDeck();
    if (!deck || cardsInFirstDeck(entry)) return;
    for (const card of cardsForEntry(entry)) {
      if (!deck.cards.some((c) => c.id === card.id)) {
        addCardToDeck(deck, card);
      }
    }
  }

  function onTextDone(entry: Narration) {
    if (entry.attributeCheck) return;
    completeEntry(entry.id);
  }

  function periodIconPath(period?: DayPeriod) {
    const key = period ?? gs.time.period;
    return getUiIconPath(periodIcon[key]);
  }

  function uiIconPath(name: string) {
    return getUiIconPath(name);
  }

  function formatResource(type: string): string {
    return type.replace(/_/g, ' ');
  }

  function purchasedResources(entry: Narration): { type: ResourceType; count: number; label: string }[] {
    const resources = entry.transaction?.items?.resources;
    if (!resources) return [];
    return (Object.entries(resources) as [ResourceType, number][])
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([type, count]) => ({
        type,
        count,
        label: formatResource(type),
      }));
  }
</script>

<div class="narration-list">
  {#each narration as entry (entry.id)}
    {#if completedSet.has(entry.id)}
      {@render narrationEntry(entry, false)}
    {:else if activeEntry?.id === entry.id}
      {@render narrationEntry(entry, true)}
    {/if}
  {/each}
</div>

{#snippet narrationEntry(entry: Narration, animate: boolean)}
  {#if entry.type === NarrationType.NewPeriod}
    {@render periodSeparator(entry)}
  {:else if entry.type === NarrationType.MatchResult}
    {@render matchResult(entry, animate)}
  {:else if entry.type === NarrationType.Transaction}
    {@render transaction(entry, animate)}
  {:else}
    {@const cards = cardsForEntry(entry)}
    {@const inDeck = cardsInFirstDeck(entry)}
    {@const canAddToDeck =
      entry.type === NarrationType.ConjuredCard && !!firstDeck() && cards.length > 0 && !inDeck}
    <NarrationText
      class="narration"
      text={entry.text}
      mentions={entry.mentions}
      {animate}
      onProgress={() => onProgress?.('auto')}
      onDone={() => onTextDone(entry)}
    />
    {#if entry.cardTemplates?.length}
      <div class="narration-cards">
        {#each entry.cardTemplates as card, i (`${card.id}-${i}`)}
          {#if i > 0}
            <span class="card-arrow" aria-hidden="true">→</span>
          {/if}
          <CardCompact {card} />
        {/each}
      </div>
    {/if}
    {#if cards.length > 0}
      <div class="narration-cards">
        {#each cards as card (card.id)}
          <CardCompact {card} />
        {/each}
      </div>
    {/if}
    {#if entry.attributeCheck}
      <AttributeCheckEntry
        check={entry.attributeCheck}
        {animate}
        onProgress={() => onProgress?.('auto')}
        onDone={() => completeEntry(entry.id)}
      />
    {/if}
    {#if entry.type === NarrationType.ConjuredCard && cards.length > 0}
      <div class="narration-actions">
        <button
          type="button"
          class="action-btn add-to-deck"
          disabled={!canAddToDeck}
          onclick={() => addConjuredCardsToDeck(entry)}
        >
          {inDeck ? 'Added to deck' : 'Add to deck'}
        </button>
      </div>
    {/if}
  {/if}
{/snippet}

{#snippet periodSeparator(entry: Narration)}
  {@const iconPath = periodIconPath(entry.period)}
  <div class="period-separator" role="separator" aria-label={entry.text}>
    <span class="period-rule" aria-hidden="true"></span>
    <span class="period-badge">
      <span class="period-icon" style="--icon: url('{iconPath}')" aria-hidden="true"></span>
      <span class="period-label">{entry.text}</span>
    </span>
    <span class="period-rule" aria-hidden="true"></span>
  </div>
{/snippet}

{#snippet matchResult(entry: Narration, animate: boolean)}
  {@const opponent = characterForKey(entry.characters?.[0])}
  <div class="match-result" class:won={entry.won === true} class:lost={entry.won === false}>
    {#if opponent}
      <span class="match-portrait">
        <CharacterPortrait character={opponent} zoom={1.15} />
      </span>
    {/if}
    <NarrationText
      class="narration match-result-text"
      text={entry.text}
      mentions={entry.mentions}
      {animate}
      onProgress={() => onProgress?.('auto')}
      onDone={() => onTextDone(entry)}
    />
  </div>
{/snippet}

{#snippet transaction(entry: Narration, animate: boolean)}
  {@const cost = entry.transaction?.cost ?? 0}
  {@const items = purchasedResources(entry)}
  {@const coinPath = uiIconPath('coin')}
  <div class="transaction">
    <NarrationText
      class="narration"
      text={entry.text}
      mentions={entry.mentions}
      {animate}
      onProgress={() => onProgress?.('auto')}
      onDone={() => onTextDone(entry)}
    />
    <div class="transaction-summary" aria-hidden="true">
      <span class="tx-chip tx-cost">
        <span class="tx-icon" style="--icon: url('{coinPath}')"></span>
        <span class="tx-label">−{cost}</span>
      </span>
      {#if items.length > 0}
        <span class="tx-arrow">→</span>
        {#each items as item (item.type)}
          {@const iconPath = uiIconPath(resourceIcon[item.type])}
          <span class="tx-chip tx-item">
            <span
              class="tx-icon"
              class:painted={isPaintedUiIcon(resourceIcon[item.type])}
              style="--icon: url('{iconPath}')"
            ></span>
            <span class="tx-label">{item.count} {item.label}</span>
          </span>
        {/each}
      {/if}
    </div>
  </div>
{/snippet}

<style>
  .narration-list :global(.narration) {
    margin: 0 0 1.25em;
  }

  .period-separator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.5em 0 1.5em;
  }

  .period-rule {
    flex: 1;
    height: 1.5px;
    background: var(--color-ink);
    opacity: 0.55;
  }

  .period-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .period-icon {
    display: block;
    width: 1.45rem;
    height: 1.45rem;
    flex-shrink: 0;
    background: var(--icon) center / contain no-repeat;
  }

  .period-label {
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-ink);
    text-transform: capitalize;
    white-space: nowrap;
  }

  .match-result {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.25em;
  }

  .match-result :global(.narration) {
    margin: 0;
    font-weight: 700;
  }

  .match-result.won :global(.narration) {
    color: #2f6b45;
  }

  .match-result.lost :global(.narration) {
    color: #8f3d36;
  }

  .match-portrait {
    display: block;
    width: 2.75rem;
    height: 2.75rem;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--color-brown-border);
    background: var(--color-deep-brown);
  }

  .match-portrait :global(.character-portrait) {
    border-radius: 0;
  }

  .transaction {
    margin: 0 0 1.25em;
  }

  .transaction :global(.narration) {
    margin: 0 0 0.65em;
  }

  .transaction-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.65rem;
    font-family: var(--font-narrative);
    color: var(--color-ink);
  }

  .tx-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .tx-cost {
    color: #8f3d36;
    font-weight: 700;
  }

  .tx-item {
    color: #2f6b45;
    font-weight: 600;
  }

  .tx-icon {
    display: block;
    width: 1.1rem;
    height: 1.1rem;
    flex-shrink: 0;
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .tx-icon.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .tx-label {
    text-transform: capitalize;
    white-space: nowrap;
  }

  .tx-arrow {
    color: var(--color-ink-muted);
    font-size: 1.1rem;
    line-height: 1;
  }

  .narration-cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin: 0 0 1.25em;
  }

  .card-arrow {
    flex-shrink: 0;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-ink-muted);
  }

  .narration-actions {
    display: flex;
    justify-content: center;
    margin: 0 0 1.25em;
  }

  .add-to-deck:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .add-to-deck:disabled:hover,
  .add-to-deck:disabled:active {
    background: var(--color-data);
    border-color: var(--color-brass);
  }

  .action-btn {
    font-family: var(--font-narrative);
    font-size: 1rem;
    color: var(--color-cream);
    background: var(--color-data);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    padding: 10px 24px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: var(--color-data-hover);
    border-color: var(--color-brass);
  }

  .action-btn:active {
    background: var(--color-data-active);
  }
</style>
