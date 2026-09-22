<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import type { CardCreationResult } from '@/lib/sim/actions';
  import { playSimSound } from '@/lib/sim/sound';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import RitualStage from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  type ResourceAmount = { type: ResourceType; count: number };
  type Phase = 'idle' | 'conjuring' | 'revealed';

  let {
    initialResources = [],
    onConjure,
    onPick,
    onDone,
  }: {
    initialResources?: ResourceAmount[];
    onConjure: (resources: ResourceAmount[]) => CardCreationResult[] | Promise<CardCreationResult[]>;
    onPick: (result: CardCreationResult) => void;
    onDone: () => void;
  } = $props();

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = $state<Record<ResourceType, number>>(countsFrom(initialResources));
  let phase = $state<Phase>('idle');
  let options = $state<CardCreationResult[]>([]);
  let pickedId = $state<string | null>(null);
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let pickTimer: ReturnType<typeof setTimeout> | undefined;

  const title = $derived(
    phase === 'idle' ? 'Conjuration' : phase === 'conjuring' ? 'Conjuring' : 'Choose your creation'
  );

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (phase === 'idle' || (phase === 'revealed' && options.length === 0 && !pickedId)) {
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

  async function begin() {
    if (phase !== 'idle') return;
    phase = 'conjuring';
    playSimSound('big-swoosh');
    options = await onConjure(committedResources());
    const delay = reduceMotion ? 0 : 1500;
    revealTimer = setTimeout(() => {
      phase = 'revealed';
      playSimSound('glinggling');
    }, delay);
  }

  function pick(option: CardCreationResult) {
    if (pickedId || phase !== 'revealed') return;
    pickedId = option.template.id;
    const delay = reduceMotion ? 0 : 380;
    pickTimer = setTimeout(() => onPick(option), delay);
  }

  const tilts = [-2.4, 0.7, 2.2];
  const lifts = [0, -8, 0];
</script>

<WorkbenchShell {title} ignite={phase === 'conjuring'}>
  <RitualStage
    bind:selected
    disabled={phase !== 'idle'}
    ignite={phase === 'conjuring'}
    dim={phase === 'revealed'}
    consume={phase !== 'idle'}
  >
    {#if phase === 'revealed'}
      <div class="creations">
        {#if options.length === 0}
          <p class="empty">Nothing took form.</p>
        {:else}
          {#each options as option, i (option.template.id)}
            <button
              type="button"
              class="card-pick"
              class:chosen={pickedId === option.template.id}
              class:picking={pickedId !== null && pickedId !== option.template.id}
              style="--i: {i}; --tilt: {tilts[i % 3]}deg; --lift: {lifts[i % 3]}px"
              disabled={pickedId !== null}
              onclick={() => pick(option)}
            >
              <CardCompact card={option.template} />
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
      <p class="status">The materials take form…</p>
    {:else if options.length === 0}
      <button type="button" class="abandon" onclick={onDone}>Leave</button>
    {:else}
      <p class="status">Select a creation</p>
    {/if}
  {/snippet}
</WorkbenchShell>

<style>
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
    animation: materialize 0.55s ease-out backwards;
    animation-delay: calc(var(--i) * 0.2s);
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      opacity 0.28s ease,
      filter 0.28s ease;
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

  @media (prefers-reduced-motion: reduce) {
    .card-pick {
      animation: none;
      transition: none;
    }
  }
</style>
