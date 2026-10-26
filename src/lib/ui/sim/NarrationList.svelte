<script lang="ts">
  import type { CardTemplate, Character, Narration } from '@/lib/_model';
  import { DayPeriod, Emotion, NarrationType, ResourceType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import { addCardToDeck } from '@/lib/sim/deck';
  import { acceptGiftCard } from '@/lib/sim/effects/gifts';
  import { cacheNarrationSceneImage } from '@/lib/sim/narration';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import { untrack } from 'svelte';
  import AttributeCheckEntry from './AttributeCheckEntry.svelte';
  import CharacterPortrait from './characters/CharacterPortrait.svelte';
  import CraftingKnowledgeNarration from './CraftingKnowledgeNarration.svelte';
  import type { InkBeat } from './ink-beat';
  import NarrationText from './NarrationText.svelte';

  let {
    done = $bindable(false),
    onProgress,
  }: {
    done?: boolean;
    onProgress?: (beat?: InkBeat) => void | Promise<void>;
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
    [ResourceType.MollysBeads]: 'leaf',
    [ResourceType.SchlupakMushrooms]: 'feather',
    [ResourceType.SchlupakDreamspheres]: 'feather',
    [ResourceType.SchlupakSpores]: 'feather',
  };

  const narration = $derived(gs.scene.narration);

  let completedIds = $state<string[]>([]);
  let cacheAskId = $state<string | null>(null);
  let checkDoneIds = $state<string[]>([]);
  let textDoneIds = $state<string[]>([]);
  /** Manually expanded small event images. */
  let expandedImageId = $state<string | null>(null);
  /** Medium images start expanded; track which the player collapsed. */
  let collapsedImageIds = $state<string[]>([]);

  const completedSet = $derived(new Set(completedIds));
  const checkDoneSet = $derived(new Set(checkDoneIds));
  const textDoneSet = $derived(new Set(textDoneIds));
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
    const nextCompleted = completedIds.filter((id) => ids.has(id));
    if (nextCompleted.length !== completedIds.length) {
      completedIds = nextCompleted;
    }
    const nextCheckDone = checkDoneIds.filter((id) => ids.has(id));
    if (nextCheckDone.length !== checkDoneIds.length) {
      checkDoneIds = nextCheckDone;
    }
    const nextTextDone = textDoneIds.filter((id) => ids.has(id));
    if (nextTextDone.length !== textDoneIds.length) {
      textDoneIds = nextTextDone;
    }
    const nextCollapsed = collapsedImageIds.filter((id) => ids.has(id));
    if (nextCollapsed.length !== collapsedImageIds.length) {
      collapsedImageIds = nextCollapsed;
    }
    if (expandedImageId && !ids.has(expandedImageId)) {
      expandedImageId = null;
    }
  });

  // Period separators don't type out — complete as soon as they become active.
  $effect(() => {
    if (activeEntry?.type === NarrationType.NewPeriod) {
      completeEntry(activeEntry.id);
    }
  });

  // Empty text means an LLM fill is in flight — keep the page scrolled to the caret.
  $effect(() => {
    if (activeEntry && !activeEntry.text && !activeEntry.skipCheckText) {
      onProgress?.({ kind: 'layout' });
    }
  });

  function completeEntry(id: string) {
    if (completedSet.has(id)) return;
    completedIds = [...completedIds, id];
    onProgress?.({ kind: 'layout' });
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
    return cards.every((card) => deck.cards.includes(card.id));
  }

  function addConjuredCardsToDeck(entry: Narration) {
    const deck = firstDeck();
    if (!deck || cardsInFirstDeck(entry)) return;
    for (const card of cardsForEntry(entry)) {
      if (!deck.cards.includes(card.id)) {
        addCardToDeck(deck, card);
      }
    }
  }

  function giftAwaitingPick(entry: Narration): boolean {
    return entry.type === NarrationType.GiftCardChoice && !entry.cardIds?.length;
  }

  function pickGiftCard(entry: Narration, card: CardTemplate) {
    if (!giftAwaitingPick(entry)) return;
    const gifted = acceptGiftCard(card);
    entry.cardTemplates = [gifted];
    entry.cardIds = [gifted.id];
    const deck = firstDeck();
    if (deck) {
      addCardToDeck(deck, gifted);
    }
    completeEntry(entry.id);
  }

  function onTextDone(entry: Narration) {
    if (!textDoneSet.has(entry.id)) {
      textDoneIds = [...textDoneIds, entry.id];
    }
    if (entry.attributeCheck) {
      maybeCompleteAttributeCheck(entry, { textDone: true });
      return;
    }
    if (giftAwaitingPick(entry)) {
      return;
    }
    completeEntry(entry.id);
  }

  function onCheckDone(entry: Narration) {
    if (!checkDoneSet.has(entry.id)) {
      checkDoneIds = [...checkDoneIds, entry.id];
    }
    maybeCompleteAttributeCheck(entry, { checkDone: true });
  }

  function maybeCompleteAttributeCheck(
    entry: Narration,
    ready: { checkDone?: boolean; textDone?: boolean } = {}
  ) {
    if (!entry.attributeCheck) return;
    const checkDone = ready.checkDone || checkDoneSet.has(entry.id);
    if (!checkDone) return;
    if (entry.skipCheckText) {
      completeEntry(entry.id);
      return;
    }
    if (!entry.text) return;
    const textDone = ready.textDone || textDoneSet.has(entry.id);
    if (!textDone) return;
    completeEntry(entry.id);
  }

  function askCacheScene(entry: Narration) {
    if (!entry.imageUrl || !entry.imagePrompt) return;
    cacheAskId = entry.id;
  }

  async function confirmCacheScene(entry: Narration) {
    cacheAskId = null;
    try {
      await cacheNarrationSceneImage(entry.id);
    } catch (error) {
      console.error('Failed to cache scene image', error);
    }
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

  function purchasedResources(
    entry: Narration
  ): { type: ResourceType; count: number; label: string }[] {
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

  function purchasedPossessions(entry: Narration): string[] {
    const possessions = entry.transaction?.items?.possessions;
    if (!possessions) return [];
    return Object.values(possessions).filter(
      (name): name is string => typeof name === 'string' && name.trim().length > 0
    );
  }

  /**
   * Static event art for the book portrait slot.
   * `large` replaces the Location panel instead and is omitted here.
   */
  function entryEventImage(entry: Narration): string | undefined {
    if (!entry.imageUrl || entry.imagePrompt) return undefined;
    if ((entry.imageSize ?? 'small') === 'large') return undefined;
    return entry.imageUrl;
  }

  function isEventImageExpanded(entry: Narration): boolean {
    if ((entry.imageSize ?? 'small') === 'medium') {
      return !collapsedImageIds.includes(entry.id);
    }
    return expandedImageId === entry.id;
  }

  function toggleEventImage(entry: Narration) {
    if ((entry.imageSize ?? 'small') === 'medium') {
      collapsedImageIds = collapsedImageIds.includes(entry.id)
        ? collapsedImageIds.filter((id) => id !== entry.id)
        : [...collapsedImageIds, entry.id];
    } else {
      expandedImageId = expandedImageId === entry.id ? null : entry.id;
    }
    onProgress?.({ kind: 'layout' });
  }
</script>

<div class="narration-list">
  {#each narration as entry (entry.id)}
    {#if completedSet.has(entry.id) || activeEntry?.id === entry.id}
      <!-- One branch so finishing the line does not remount the paragraph and collapse it. -->
      {@render narrationEntry(entry, activeEntry?.id === entry.id)}
    {/if}
  {/each}
</div>

{#snippet narrationEntry(entry: Narration, animate: boolean)}
  {#if entry.type === NarrationType.NewPeriod}
    {@render periodSeparator(entry)}
  {:else if entry.type === NarrationType.MatchResult}
    {@render matchResult(entry, animate)}
  {:else if entry.type === NarrationType.CraftingKnowledge}
    {@render craftingKnowledge(entry, animate)}
  {:else if entry.type === NarrationType.Transaction}
    {@render transaction(entry, animate)}
  {:else if entry.type === NarrationType.RelationUpdate}
    {@render relationUpdate(entry, animate)}
  {:else}
    {@const cards = cardsForEntry(entry)}
    {@const inDeck = cardsInFirstDeck(entry)}
    {@const isGiftChoice = entry.type === NarrationType.GiftCardChoice}
    {@const awaitingGiftPick = giftAwaitingPick(entry)}
    {@const canAddToDeck =
      entry.type === NarrationType.ConjuredCard && !!firstDeck() && cards.length > 0 && !inDeck}
    {#if entry.attributeCheck}
      <AttributeCheckEntry
        check={entry.attributeCheck}
        narrationId={entry.id}
        {animate}
        onProgress={(beat) => onProgress?.(beat)}
        onDone={() => onCheckDone(entry)}
      />
    {/if}
    {#if entry.imagePrompt}
      {@render narrationImage(entry)}
    {/if}
    {#if entry.text}
      {@const portraitChar = characterForKey(entry.characters?.[0])}
      {@const eventImage = entryEventImage(entry)}
      {#if eventImage || portraitChar}
        {@const imageExpanded = eventImage ? isEventImageExpanded(entry) : false}
        <div class="event-with-portrait" class:image-expanded={imageExpanded}>
          {#if eventImage}
            <button
              type="button"
              class="event-portrait event-portrait-btn"
              class:expanded={imageExpanded}
              aria-expanded={imageExpanded}
              aria-label={imageExpanded ? 'Shrink event image' : 'Expand event image'}
              onclick={() => toggleEventImage(entry)}
            >
              <img src={eventImage} alt="" class="event-scene-image" />
            </button>
          {:else if portraitChar}
            <span class="event-portrait" aria-hidden="true">
              <CharacterPortrait
                character={portraitChar}
                emotion={entry.emotion ?? Emotion.Neutral}
              />
            </span>
          {/if}
          <div class="narration-body">
            {#if entry.title}
              <h3 class="narration-title">{entry.title}</h3>
            {/if}
            <NarrationText
              class="narration"
              text={entry.text}
              mentions={entry.mentions}
              {animate}
              onBeat={(beat) => onProgress?.(beat)}
              onDone={() => onTextDone(entry)}
            />
          </div>
        </div>
      {:else}
        <div class="narration-body">
          {#if entry.title}
            <h3 class="narration-title">{entry.title}</h3>
          {/if}
          <NarrationText
            class="narration"
            text={entry.text}
            mentions={entry.mentions}
            {animate}
            onBeat={(beat) => onProgress?.(beat)}
            onDone={() => onTextDone(entry)}
          />
        </div>
      {/if}
    {:else if animate && !entry.attributeCheck?.pending && !entry.skipCheckText}
      <div class="narration narration-pending" role="status" aria-label="Writing">
        <span aria-hidden="true">Writing…</span>
        <span class="caret" aria-hidden="true"></span>
      </div>
    {/if}
    {#if entry.gold}
      {@render goldEarned(entry.gold)}
    {/if}
    {#if isGiftChoice && entry.cardTemplates?.length}
      <div class="narration-cards" class:gift-choices={awaitingGiftPick}>
        {#each entry.cardTemplates as card (card.id)}
          {#if awaitingGiftPick}
            <button
              type="button"
              class="gift-card-btn"
              aria-label={`Choose ${card.name} and add to deck`}
              onclick={() => pickGiftCard(entry, card)}
            >
              <CardCompact {card} />
            </button>
          {:else}
            <CardCompact {card} />
          {/if}
        {/each}
      </div>
    {:else if entry.cardTemplates?.length}
      <div class="narration-cards">
        {#each entry.cardTemplates as card, i (`${card.id}-${i}`)}
          {#if i > 0}
            <span class="card-arrow" aria-hidden="true">→</span>
          {/if}
          <CardCompact {card} />
        {/each}
      </div>
    {/if}
    {#if !isGiftChoice && cards.length > 0}
      <div class="narration-cards">
        {#each cards as card (card.id)}
          <CardCompact {card} />
        {/each}
      </div>
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

{#snippet narrationImage(entry: Narration)}
  {@const canCache = !!(entry.imageUrl && entry.imagePrompt)}
  <figure class="narration-image" title={entry.imagePrompt}>
    {#if entry.imageUrl}
      <div class="scene-frame">
        <img
          src={entry.imageUrl}
          alt=""
          title={entry.imagePrompt}
          class:cacheable={canCache}
          onload={() => onProgress?.({ kind: 'layout' })}
          onclick={() => askCacheScene(entry)}
        />
        {#if cacheAskId === entry.id}
          <div class="cache-ask">
            <p>Cache?</p>
            <div class="cache-ask-actions">
              <button type="button" onclick={() => confirmCacheScene(entry)}>Yes</button>
              <button type="button" onclick={() => (cacheAskId = null)}>No</button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="narration-image-pending" title={entry.imagePrompt}>
        <span>Illustrating…</span>
      </div>
    {/if}
  </figure>
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
        <CharacterPortrait character={opponent} emotion={Emotion.Neutral} zoom={1.15} />
      </span>
    {/if}
    <NarrationText
      class="narration match-result-text"
      text={entry.text}
      mentions={entry.mentions}
      {animate}
      onBeat={(beat) => onProgress?.(beat)}
      onDone={() => onTextDone(entry)}
    />
  </div>
{/snippet}

{#snippet craftingKnowledge(entry: Narration, animate: boolean)}
  {#if entry.craftingKnowledgeGain}
    <CraftingKnowledgeNarration
      gain={entry.craftingKnowledgeGain}
      text={entry.text}
      {animate}
      onProgress={(beat) => onProgress?.(beat)}
      onDone={() => onTextDone(entry)}
    />
  {/if}
{/snippet}

{#snippet relationUpdate(entry: Narration, animate: boolean)}
  <aside class="relation-update" aria-label={entry.title ?? 'Relation update'}>
    {#if entry.title}
      <span class="relation-update-label">{entry.title}</span>
    {/if}
    <NarrationText
      class="relation-update-text"
      text={entry.text}
      mentions={entry.mentions}
      {animate}
      onBeat={(beat) => onProgress?.(beat)}
      onDone={() => onTextDone(entry)}
    />
  </aside>
{/snippet}

{#snippet goldEarned(gold: number)}
  {@const coinPath = uiIconPath('coin')}
  <div class="gold-earned" aria-label={`Earned ${gold} gold`}>
    <span class="tx-chip tx-gain">
      <span class="tx-icon painted" style="--icon: url('{coinPath}')"></span>
      <span class="tx-label">+{gold}</span>
    </span>
  </div>
{/snippet}

{#snippet transaction(entry: Narration, animate: boolean)}
  {@const cost = entry.transaction?.cost ?? 0}
  {@const items = purchasedResources(entry)}
  {@const possessionNames = purchasedPossessions(entry)}
  {@const coinPath = uiIconPath('coin')}
  <div class="transaction">
    <NarrationText
      class="narration"
      text={entry.text}
      mentions={entry.mentions}
      {animate}
      onBeat={(beat) => onProgress?.(beat)}
      onDone={() => onTextDone(entry)}
    />
    <div class="transaction-summary" aria-hidden="true">
      <span class="tx-chip tx-cost">
        <span class="tx-icon" style="--icon: url('{coinPath}')"></span>
        <span class="tx-label">−{cost}</span>
      </span>
      {#if items.length > 0 || possessionNames.length > 0}
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
        {#each possessionNames as name (name)}
          <span class="tx-chip tx-item">
            <span class="tx-label">{name}</span>
          </span>
        {/each}
      {/if}
    </div>
  </div>
{/snippet}

<style>
  .narration-list :global(.narration) {
    margin: 0 0 1.25em;
    white-space: pre-line;
  }

  .narration-body {
    margin: 0 0 1.25em;
  }

  .narration-body :global(.narration) {
    margin: 0;
  }

  .narration-title {
    margin: 0 0 0.35em;
    font-family: var(--font-narrative);
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--color-ink);
  }

  .event-with-portrait {
    margin: 0 0 1.25em;
    /* flow-root clears the float without overflow:auto, which flashed a
       horizontal scrollbar when the typing caret peeked past the line edge. */
    display: flow-root;
  }

  .event-with-portrait .narration-body {
    margin: 0;
  }

  .event-with-portrait :global(.narration) {
    margin: 0;
  }

  .event-portrait {
    float: left;
    display: block;
    width: 240px;
    height: 240px;
    margin: 0.2em 0.9em 0.55em 0;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--color-brown-border);
    box-shadow:
      inset 0 1px 0 rgba(255, 248, 230, 0.2),
      0 2px 6px rgba(42, 24, 16, 0.16);
    background: var(--color-deep-brown);
  }

  .event-portrait-btn {
    padding: 0;
    cursor: zoom-in;
    font: inherit;
    color: inherit;
  }

  .event-portrait-btn.expanded {
    float: none;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    margin: 0 0 0.75em;
    cursor: zoom-out;
  }

  .event-with-portrait.image-expanded :global(.narration) {
    clear: both;
  }

  .event-portrait :global(.character-portrait) {
    border-radius: 0;
  }

  .event-scene-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .narration-image {
    margin: 0 0 1.25em;
    padding: 0;
    display: flex;
    justify-content: center;
  }

  .scene-frame {
    position: relative;
    width: min(100%, 280px);
  }

  .narration-image img,
  .narration-image-pending {
    display: block;
    width: min(100%, 280px);
    aspect-ratio: 1;
    object-fit: cover;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    box-shadow:
      inset 0 1px 0 rgba(255, 248, 230, 0.2),
      0 2px 8px rgba(42, 24, 16, 0.18);
  }

  .narration-image img {
    width: 100%;
  }

  .narration-image img.cacheable {
    cursor: pointer;
  }

  .cache-ask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(232, 220, 196, 0.92);
    color: var(--color-ink);
    font-family: var(--font-narrative);
    border-radius: 4px;
  }

  .cache-ask p {
    margin: 0;
    font-style: italic;
  }

  .cache-ask-actions {
    display: flex;
    gap: 8px;
  }

  .cache-ask button {
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    color: var(--color-ink);
    background: transparent;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    padding: 4px 14px;
    cursor: pointer;
  }

  .cache-ask button:hover {
    background: rgba(90, 75, 60, 0.12);
  }

  .narration-image-pending {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(90, 75, 60, 0.08);
    color: var(--color-ink-muted);
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    font-style: italic;
  }

  .narration-pending {
    min-height: 1.7em;
    color: var(--color-ink-muted);
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    font-style: italic;
  }

  .narration-pending .caret {
    display: inline-block;
    width: 0;
    height: 1.05em;
    margin-left: 0.2ch;
    vertical-align: text-bottom;
    position: relative;
  }

  .narration-pending .caret::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 2px;
    height: 100%;
    background: currentColor;
    opacity: 0.55;
    animation: blink 0.85s step-end infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .narration-pending .caret,
    .narration-pending .caret::after {
      display: none;
    }
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

  .relation-update {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0.25em 0 1.35em;
    padding: 0.55em 0.85em;
    border: 1px solid color-mix(in srgb, var(--color-brown-border) 75%, transparent);
    border-radius: 4px;
    background: rgba(90, 75, 60, 0.06);
    box-shadow: inset 0 1px 0 rgba(255, 248, 230, 0.35);
  }

  .relation-update-label {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-ink-muted);
  }

  .relation-update :global(.relation-update-text) {
    margin: 0;
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--color-ink);
    font-style: italic;
    white-space: pre-line;
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

  .gold-earned {
    display: flex;
    align-items: center;
    margin: -0.5em 0 1.25em;
    font-family: var(--font-narrative);
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

  .tx-gain {
    color: var(--color-ink);
    font-weight: 700;
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

  .narration-cards.gift-choices {
    gap: 16px;
  }

  .gift-card-btn {
    margin: 0;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    line-height: 0;
  }

  .gift-card-btn:hover {
    border-color: var(--color-golden);
  }

  .gift-card-btn:focus-visible {
    outline: 2px solid var(--color-golden);
    outline-offset: 2px;
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
