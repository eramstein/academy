<script lang="ts">
  import type { CardTemplate } from '@/lib/_model';
  import { ResourceType } from '@/lib/_model';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import {
    getConjurationOptionCount,
    type CardCreationResult,
    type CardSummonProgress,
    type SummonRevealStage,
  } from '@/lib/sim/actions';
  import { playSimSound } from '@/lib/sim/sound';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import RitualStage from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  const flourishPath = getAssetPath('images/ui/decorations/page-flourish.svg');

  type ResourceAmount = { type: ResourceType; count: number };
  type Phase = 'idle' | 'conjuring' | 'revealed';

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
      flavorText?: string
    ) => CardCreationResult[] | Promise<CardCreationResult[]>;
    onPick: (result: CardCreationResult) => void;
    onDone: () => void;
  } = $props();

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = $state<Record<ResourceType, number>>(countsFrom(initialResources));
  let flavorText = $state('');
  let phase = $state<Phase>('idle');
  let summonSlots = $state<SummonSlot[]>([]);
  let statusLine = $state('The materials take form…');
  let pickedId = $state<string | null>(null);
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let pickTimer: ReturnType<typeof setTimeout> | undefined;

  const title = $derived(
    phase === 'idle' ? 'Conjuration' : phase === 'conjuring' ? 'Conjuring' : 'Choose your creation'
  );
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
    const counts = Object.fromEntries(Object.values(ResourceType).map((type) => [type, 0])) as Record<
      ResourceType,
      number
    >;
    for (const resource of list) {
      counts[resource.type] = resource.count;
    }
    return counts;
  }

  function committedResources(): ResourceAmount[] {
    return Object.values(ResourceType)
      .map((type) => ({ type, count: selected[type] ?? 0 }))
      .filter((row) => row.count > 0);
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

  async function begin() {
    if (phase !== 'idle') return;
    phase = 'conjuring';
    playSimSound('big-swoosh');
    pickedId = null;
    const expected = getConjurationOptionCount();
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
      flavorText.trim() || undefined
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

    const delay = reduceMotion ? 0 : 600;
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

<WorkbenchShell {title} ignite={phase === 'conjuring'}>
  {#if phase === 'idle'}
    <label
      class="incantation"
      class:spoken={flavorText.trim().length > 0}
      style="--page-flourish: url('{flourishPath}')"
    >
      <span class="incantation-mark" aria-hidden="true">
        <span class="flourish"></span>
        <span class="rule"></span>
        <span class="word">Incantation</span>
        <span class="rule"></span>
        <span class="flourish mirror"></span>
      </span>
      <span class="incantation-field">
        <span class="quote open" aria-hidden="true">“</span>
        <input
          type="text"
          class="incantation-input"
          bind:value={flavorText}
          placeholder="Whisper a form into being…"
          maxlength="120"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="quote close" aria-hidden="true">”</span>
      </span>
      <span class="incantation-hint">Optional — shapes its name and nature</span>
    </label>
  {/if}
  <RitualStage
    bind:selected
    disabled={phase !== 'idle'}
    ignite={phase === 'conjuring'}
    dim={phase === 'revealed' || phase === 'conjuring'}
    consume={phase !== 'idle'}
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
              class:picking={pickedId !== null && !!slot.result && pickedId !== slot.result.template.id}
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
      <button type="button" class="abandon" onclick={onDone}>Abandon ritual</button>
      <OrnateButton icon="spiral" onclick={begin}>Conjure</OrnateButton>
    {:else if phase === 'conjuring'}
      <p class="status">{statusLine}</p>
    {:else if !hasAnyOption}
      <button type="button" class="abandon" onclick={onDone}>Leave</button>
    {:else}
      <p class="status">Select a creation</p>
    {/if}
  {/snippet}
</WorkbenchShell>

<style>
  .incantation {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    margin: 2px 0 14px;
    cursor: text;
  }

  .incantation-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 2px;
  }

  .incantation-mark .word {
    flex: 0 0 auto;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #4a3f32;
  }

  .incantation-mark .rule {
    flex: 1 1 auto;
    max-width: 72px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--color-brown-border) 70%, transparent),
      transparent
    );
  }

  .incantation-mark .flourish {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    opacity: 0.42;
    background: var(--color-ink-muted);
    mask: var(--page-flourish) center / contain no-repeat;
    -webkit-mask: var(--page-flourish) center / contain no-repeat;
  }

  .incantation-mark .flourish.mirror {
    transform: scaleX(-1);
  }

  .incantation-field {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 2px;
    padding: 6px 4px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--color-brown-border) 55%, transparent);
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  .incantation-field::after {
    content: '';
    position: absolute;
    left: 12%;
    right: 12%;
    bottom: -1px;
    height: 1px;
    background: color-mix(in srgb, var(--color-golden) 75%, transparent);
    opacity: 0;
    transform: scaleX(0.4);
    transition:
      opacity 0.28s ease,
      transform 0.28s ease;
  }

  .incantation:focus-within .incantation-field,
  .incantation.spoken .incantation-field {
    border-color: color-mix(in srgb, var(--color-golden) 55%, var(--color-brown-border));
    box-shadow: 0 8px 18px -14px color-mix(in srgb, var(--color-golden) 70%, transparent);
  }

  .incantation:focus-within .incantation-field::after,
  .incantation.spoken .incantation-field::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .incantation .quote {
    flex: 0 0 auto;
    font-family: var(--font-narrative);
    font-size: 1.55rem;
    line-height: 1;
    color: color-mix(in srgb, var(--color-ink-muted) 70%, transparent);
    user-select: none;
    transition: color 0.25s ease;
  }

  .incantation:focus-within .quote,
  .incantation.spoken .quote {
    color: color-mix(in srgb, var(--color-golden) 65%, var(--color-ink-muted));
  }

  .incantation-input {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 2px 4px;
    border: none;
    outline: none;
    background: transparent;
    font-family: var(--font-narrative);
    font-size: 1.12rem;
    font-style: italic;
    letter-spacing: 0.02em;
    line-height: 1.45;
    text-align: center;
    color: var(--color-ink);
    caret-color: var(--color-golden);
    user-select: text;
    -webkit-user-select: text;
  }

  .incantation-input::placeholder {
    color: color-mix(in srgb, var(--color-ink-muted) 78%, transparent);
    font-style: italic;
    letter-spacing: 0.01em;
    opacity: 1;
  }

  .incantation:focus-within .incantation-input {
    text-shadow: 0 0 18px color-mix(in srgb, var(--color-golden) 28%, transparent);
  }

  .incantation-hint {
    margin-top: 2px;
    text-align: center;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    color: color-mix(in srgb, var(--color-ink-muted) 85%, transparent);
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

  .abandon {
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    color: var(--color-muted-label);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .abandon:hover {
    color: var(--color-cream);
    border-color: var(--color-brass);
    background: color-mix(in srgb, var(--color-data) 55%, transparent);
  }

  .status {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted-label);
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
    .incantation-field,
    .incantation-field::after,
    .incantation .quote {
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
