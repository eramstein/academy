<script lang="ts">
  import type { CardTemplate } from '@/lib/_model';
  import { CardColor, ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import {
    getConjurationOptionCount,
    type CardCreationResult,
    type CardSummonProgress,
    type ConjurationAugury,
    type SummonRevealStage,
  } from '@/lib/sim/actions';
  import { playAddResourceSound, playSimSound } from '@/lib/sim/sound';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import RitualStage, { type AuguryBeat as RitualAuguryBeat } from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  type ResourceAmount = { type: ResourceType; count: number };
  type Phase = 'idle' | 'augury' | 'conjuring' | 'revealed';

  type SummonSlot = {
    /** Stable for the whole summon; never change after create. */
    key: string;
    stage: SummonRevealStage;
    template: CardTemplate | null;
    result: CardCreationResult | null;
    /** True after the first template appears — drives one-shot enter animation. */
    entered: boolean;
  };

  let {
    initialResources = [],
    onConjure,
    onPick,
    onDone,
  }: {
    initialResources?: ResourceAmount[];
    onConjure: (
      resources: ResourceAmount[],
      onProgress: (progress: CardSummonProgress) => void,
      colors?: CardColor[],
      augury?: ConjurationAugury
    ) => CardCreationResult[] | Promise<CardCreationResult[]>;
    onPick: (result: CardCreationResult) => void;
    onDone: () => void;
  } = $props();

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = $state<Record<ResourceType, number>>(countsFrom(initialResources));
  let colors = $state<CardColor[]>(defaultColors());
  let phase = $state<Phase>('idle');
  let summonSlots = $state<SummonSlot[]>([]);
  let statusLine = $state('The materials take form…');
  let auguryBeat = $state<RitualAuguryBeat>({ stage: 'learning', learning: null, fortune: null });
  let pickedId = $state<string | null>(null);
  let absorbStartedAt = 0;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let pickTimer: ReturnType<typeof setTimeout> | undefined;

  /** Matches RitualStage SUCTION_START + SUCTION_MS. */
  const ABSORB_MS = 1500;

  const availableColors = $derived(
    Object.values(CardColor).filter(
      (color) => (gs.player.craftingKnowledge.colors?.[color] ?? 0) >= 1
    )
  );

  const title = $derived(
    phase === 'idle' ? 'Conjuration' : phase === 'revealed' ? 'Choose your creation' : 'Conjuring'
  );
  const auguryStatus = $derived.by(() => {
    if (auguryBeat.stage === 'learning') return 'Erudition stirs…';
    if (auguryBeat.stage === 'insight') {
      return auguryBeat.learning && auguryBeat.learning > 0
        ? 'Knowledge takes hold.'
        : 'The lore stays shut.';
    }
    if (auguryBeat.stage === 'inspiration') return 'Inspiration turns…';
    if (auguryBeat.stage === 'fortune') return 'Mastery turns…';
    return '';
  });
  const hasAnyOption = $derived(summonSlots.some((slot) => slot.result !== null));

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (phase === 'idle' || (phase === 'revealed' && !hasAnyOption && !pickedId)) {
        onDone();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (revealTimer) clearTimeout(revealTimer);
      if (pickTimer) clearTimeout(pickTimer);
    };
  });

  function countsFrom(list: ResourceAmount[]): Record<ResourceType, number> {
    const counts = Object.fromEntries(
      Object.values(ResourceType).map((type) => [type, 0])
    ) as Record<ResourceType, number>;
    for (const resource of list) {
      counts[resource.type] = resource.count;
    }
    return counts;
  }

  /** Most common color in the player's collection among known crafting colors. */
  function defaultColors(): CardColor[] {
    const known = new Set(
      Object.values(CardColor).filter(
        (color) => (gs.player.craftingKnowledge.colors?.[color] ?? 0) >= 1
      )
    );
    if (known.size === 0) return [];

    const tallies = Object.fromEntries([...known].map((color) => [color, 0])) as Record<
      CardColor,
      number
    >;
    for (const card of gs.player.collection) {
      const seen = new Set<CardColor>();
      for (const entry of card.colors ?? []) {
        if (!(entry.color in tallies) || seen.has(entry.color)) continue;
        seen.add(entry.color);
        tallies[entry.color] += 1;
      }
    }

    let best: CardColor | null = null;
    let bestCount = -1;
    for (const color of Object.values(CardColor)) {
      if (!(color in tallies)) continue;
      const count = tallies[color];
      if (count > bestCount) {
        best = color;
        bestCount = count;
      }
    }
    return best != null && bestCount > 0 ? [best] : [];
  }

  function committedResources(): ResourceAmount[] {
    return Object.values(ResourceType)
      .map((type) => ({ type, count: selected[type] ?? 0 }))
      .filter((row) => row.count > 0);
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function onPigment(color: CardColor, remove: boolean) {
    if (phase !== 'idle') return;
    if (remove) {
      if (!colors.includes(color)) return;
      colors = colors.filter((entry) => entry !== color);
      return;
    }
    if (colors.includes(color)) return;
    colors = [...colors, color];
    playAddResourceSound();
  }

  function togglePigment(color: CardColor) {
    if (colors.includes(color)) onPigment(color, true);
    else onPigment(color, false);
  }

  function statusForStage(stage: SummonRevealStage): string {
    switch (stage) {
      case 'frame':
        return 'A vessel takes shape…';
      case 'gameplay':
        return 'Power gathers in the frame…';
      case 'name':
        return 'Its true name is spoken…';
      case 'image':
        return 'The vision settles…';
    }
  }

  function displayReveal(slot: SummonSlot): 'frame' | 'gameplay' | 'name' | 'image' | 'full' {
    if (phase === 'revealed' || slot.stage === 'image') return 'full';
    return slot.stage;
  }

  function ensureSlot(index: number, total: number): SummonSlot[] {
    const next = [...summonSlots];
    while (next.length < total) {
      next.push({
        key: `slot-${next.length}`,
        stage: 'frame',
        template: null,
        result: null,
        entered: false,
      });
    }
    if (!next[index]) {
      next[index] = {
        key: `slot-${index}`,
        stage: 'frame',
        template: null,
        result: null,
        entered: false,
      };
    }
    return next;
  }

  function onSummonProgress(progress: CardSummonProgress) {
    const next = ensureSlot(progress.index, progress.total);
    const slot = next[progress.index];
    next[progress.index] = {
      ...slot,
      stage: progress.stage,
      // Shallow clone so Svelte sees a new card prop when draft fields mutate.
      template: { ...progress.template },
      entered: true,
    };
    summonSlots = next;
    statusLine = statusForStage(progress.stage);
  }

  function begin() {
    if (phase !== 'idle') return;
    phase = 'augury';
    absorbStartedAt = performance.now();
    auguryBeat = { stage: 'learning', learning: null, fortune: null };
    playSimSound('big-swoosh');
  }

  async function onAuguryComplete(augury: ConjurationAugury) {
    if (phase !== 'augury') return;
    phase = 'conjuring';
    pickedId = null;
    const expected = augury.optionCount ?? getConjurationOptionCount();
    summonSlots = Array.from({ length: expected }, (_, i) => ({
      key: `slot-${i}`,
      stage: 'frame' as SummonRevealStage,
      template: null,
      result: null,
      entered: false,
    }));
    statusLine = 'A vessel takes shape…';

    const results = await onConjure(
      committedResources(),
      onSummonProgress,
      colors.length ? colors : undefined,
      augury
    );
    const next = [...summonSlots];
    for (let i = 0; i < results.length; i++) {
      const slot = next[i] ?? {
        key: `slot-${i}`,
        stage: 'image' as SummonRevealStage,
        template: null,
        result: null,
        entered: false,
      };
      next[i] = {
        ...slot,
        stage: 'image',
        template: { ...results[i].template },
        result: results[i],
        entered: true,
      };
    }
    summonSlots = results.length === 0 ? [] : next.slice(0, results.length);

    // Absorb starts with Conjure; wait until beads are gone before the choice step.
    const remaining = ABSORB_MS - (performance.now() - absorbStartedAt);
    const delay = reduceMotion ? 0 : Math.max(420, remaining);
    revealTimer = setTimeout(() => {
      phase = 'revealed';
      playSimSound('glinggling');
    }, delay);
  }

  function pick(slot: SummonSlot) {
    if (!slot.result || pickedId || phase !== 'revealed') return;
    pickedId = slot.result.template.id;
    const result = slot.result;
    const delay = reduceMotion ? 0 : 380;
    pickTimer = setTimeout(() => onPick(result), delay);
  }

  const tilts = [-2.4, 0.7, 2.2];
  const lifts = [0, -8, 0];
</script>

{#snippet auguryMarks()}
  {#if auguryBeat.learning != null}
    <span class="insight-mark" class:hit={auguryBeat.learning > 0}>
      {auguryBeat.learning} knowledge
    </span>
  {/if}
  {#if auguryBeat.optionCount != null}
    <span class="insight-mark" class:hit={(auguryBeat.discoveryIndex ?? -1) >= 0}>
      {auguryBeat.optionCount} card choice{auguryBeat.optionCount === 1 ? '' : 's'}
      {(auguryBeat.discoveryIndex ?? -1) >= 0 ? '· new lore' : ''}
    </span>
  {/if}
  {#if auguryBeat.fortune != null}
    <span class="insight-mark" class:hit={auguryBeat.fortune > 0}>
      {auguryBeat.fortune > 0 ? `+${auguryBeat.fortune} budget` : 'No bonus budget'}
    </span>
  {/if}
{/snippet}

<WorkbenchShell {title} roomy ignite={phase === 'augury' || phase === 'conjuring'}>
  {#if phase === 'idle'}
    <section class="pigments" aria-label="Colors">
      {#if availableColors.length === 0}
        <p class="pigments-empty">No known colors yet.</p>
      {:else}
        <div class="pigment-cluster">
          {#each availableColors as color (color)}
            {@const inMix = colors.includes(color)}
            <button
              type="button"
              class="pigment"
              class:in-mix={inMix}
              aria-pressed={inMix}
              aria-label={capitalize(color)}
              title="{capitalize(color)} · Click to {inMix ? 'remove' : 'add'}"
              onclick={() => togglePigment(color)}
              oncontextmenu={(event) => {
                event.preventDefault();
                onPigment(color, true);
              }}
            >
              <img src={colorPath(color)} alt="" draggable="false" />
            </button>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
  <RitualStage
    bind:selected
    disabled={phase !== 'idle'}
    ignite={phase === 'augury' || phase === 'conjuring'}
    dim={phase === 'revealed' || phase === 'conjuring'}
    consume={phase !== 'idle'}
    craft="conjure"
    rollAugury={phase === 'augury'}
    onAuguryBeat={(beat) => (auguryBeat = beat)}
    {onAuguryComplete}
  >
    {#if phase === 'conjuring' || phase === 'revealed'}
      <div class="creations" class:summoning={phase === 'conjuring'}>
        {#if phase === 'revealed' && !hasAnyOption}
          <p class="empty">Nothing took form.</p>
        {:else}
          {#each summonSlots as slot, i (slot.key)}
            <button
              type="button"
              class="card-pick"
              class:summon-slot={phase === 'conjuring' || !slot.result}
              class:chosen={!!slot.result && pickedId === slot.result.template.id}
              class:picking={pickedId !== null &&
                !!slot.result &&
                pickedId !== slot.result.template.id}
              style="--i: {i}; --tilt: {tilts[i % 3]}deg; --lift: {lifts[i % 3]}px"
              disabled={phase !== 'revealed' || !slot.result || pickedId !== null}
              onclick={() => pick(slot)}
            >
              {#if slot.template}
                <div class="card-body" class:enter={slot.entered}>
                  <CardCompact card={slot.template} reveal={displayReveal(slot)} />
                </div>
              {:else}
                <div class="empty-frame" aria-hidden="true"></div>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </RitualStage>

  {#snippet footer()}
    {#if phase === 'idle'}
      <OrnateButton icon="arrow-left" onclick={onDone}>Abandon ritual</OrnateButton>
      <OrnateButton icon="spiral" onclick={begin}>Conjure</OrnateButton>
    {:else if phase === 'augury'}
      <p class="status">{auguryStatus}</p>
    {:else if phase === 'conjuring'}
      <p class="status">
        {statusLine}
        {#if auguryBeat.stage === 'shown'}
          {@render auguryMarks()}
        {/if}
      </p>
    {:else if !hasAnyOption}
      <OrnateButton icon="arrow-left" onclick={onDone}>Leave</OrnateButton>
    {:else}
      <p class="status">{@render auguryMarks()}</p>
    {/if}
  {/snippet}
</WorkbenchShell>

<style>
  .pigments {
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: center;
    margin: 0 0 12px;
  }

  .pigments-empty {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .pigment-cluster {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }

  .pigment {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    padding: 0;
    border: 2px solid rgba(44, 37, 29, 0.28);
    border-radius: 50%;
    background: transparent;
    box-shadow: none;
    cursor: pointer;
    opacity: 0.55;
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .pigment img {
    width: 94%;
    height: 94%;
    object-fit: contain;
    pointer-events: none;
    filter:
      grayscale(0.35)
      brightness(0.92)
      drop-shadow(0 1px 2px rgba(42, 24, 16, 0.35));
  }

  .pigment:hover,
  .pigment:focus-visible {
    opacity: 0.85;
    border-color: rgba(44, 37, 29, 0.55);
  }

  .pigment.in-mix {
    opacity: 1;
    transform: translateY(-1px);
    border-color: var(--color-ink);
    box-shadow:
      0 0 0 2px var(--color-golden),
      0 2px 6px rgba(42, 24, 16, 0.45);
  }

  .pigment.in-mix img {
    filter: drop-shadow(0 1px 2px rgba(42, 24, 16, 0.4));
  }

  .creations {
    position: absolute;
    inset: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 4;
    padding: 8px 4px 12px;
  }

  .card-pick {
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 0;
    cursor: pointer;
    transform: translateY(var(--lift, 0)) rotate(var(--tilt, 0deg));
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      opacity 0.28s ease,
      filter 0.28s ease;
  }

  .card-pick:disabled {
    cursor: default;
  }

  .summon-slot {
    pointer-events: none;
  }

  .card-body.enter {
    animation: materialize 0.55s ease-out backwards;
    animation-delay: calc(var(--i) * 0.12s);
  }

  .empty-frame {
    width: 200px;
    height: 240px;
    border-radius: 12px;
    border: 1px solid #1a1a1a;
    background: #444 url('/assets/images/ui/backgrounds/cardboard.png') center/cover;
    background-blend-mode: multiply;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.5),
      0 0 16px rgba(191, 161, 74, 0.25);
    animation: frame-pulse 2s ease-in-out infinite;
  }

  .card-pick:hover:not(:disabled),
  .card-pick:focus-visible:not(:disabled) {
    transform: translateY(-12px) rotate(var(--tilt, 0deg));
    box-shadow:
      0 4px 8px rgba(44, 37, 29, 0.22),
      0 16px 28px rgba(44, 37, 29, 0.38);
  }

  .card-pick.chosen {
    transform: translateY(-16px) scale(1.05) rotate(var(--tilt, 0deg));
    filter: brightness(1.08);
    z-index: 2;
  }

  .card-pick.picking {
    opacity: 0.32;
    transform: scale(0.92) rotate(var(--tilt, 0deg));
    pointer-events: none;
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.95rem;
    color: #6a5c4c;
  }

  .status {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .insight-mark:not(:first-child) {
    margin-left: 0.7em;
    padding-left: 0.7em;
    border-left: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
  }

  .insight-mark.hit {
    color: var(--color-golden);
  }

  @keyframes materialize {
    from {
      opacity: 0;
      transform: translateY(36px) scale(0.55) rotate(var(--tilt, 0deg));
      filter: brightness(1.8);
    }
  }

  @keyframes frame-pulse {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.15);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pigment {
      transition: none;
    }

    .card-body.enter,
    .empty-frame {
      animation: none;
    }

    .card-pick {
      transition: none;
    }
  }
</style>
