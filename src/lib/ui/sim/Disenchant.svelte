<script lang="ts">
  import { CardColor, CardType, ResourceType, type Action, type CardTemplate } from '@/lib/_model';
  import { getDisenchantableCards, performAction, rollDisenchantReward } from '@/lib/sim/actions';
  import { playAddResourceSound, playSimSound } from '@/lib/sim/sound';
  import { hasActiveCardFilters, matchesCardFilters } from '@/lib/ui/cards/card-filters';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import CardFilters from '@/lib/ui/cards/CardFilters.svelte';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import ResourceIcon from './ResourceIcon.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  const DISSOLVE_MS = 900;

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const startHeld = initialHeld();
  let held = $state<CardTemplate | null>(startHeld);
  let colorFilter = $state<CardColor | null>(null);
  let costFilter = $state<number | null>(null);
  let typeFilter = $state<CardType | null>(null);
  let phase = $state<'pick' | 'ready' | 'dissolving' | 'reward'>(startHeld ? 'ready' : 'pick');
  let rewardType = $state<ResourceType | null>(null);
  let committed = false;
  let dissolveTimer = 0;

  const availableCards = $derived(getDisenchantableCards());
  const cardFilters = $derived({ color: colorFilter, cost: costFilter, type: typeFilter });
  const filteredCards = $derived(
    availableCards.filter((card) => matchesCardFilters(card, cardFilters))
  );
  const hasActiveFilters = $derived(hasActiveCardFilters(cardFilters));
  const canChangeCard = $derived(availableCards.length > 1);
  const rewardLabel = $derived(rewardType ? formatResource(rewardType) : '');

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (phase === 'dissolving') return;
      if (phase === 'reward') close();
      else back();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(dissolveTimer);
    };
  });

  function initialHeld(): CardTemplate | null {
    const cards = getDisenchantableCards();
    return cards.length === 1 ? cards[0] : null;
  }

  function formatResource(type: ResourceType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function selectCard(id: string) {
    held = availableCards.find((card) => card.id === id) ?? null;
    if (held) phase = 'ready';
  }

  function back() {
    if (phase === 'dissolving' || phase === 'reward') return;
    if (held && canChangeCard) {
      held = null;
      phase = 'pick';
      return;
    }
    onDone();
  }

  function begin() {
    if (!held || phase !== 'ready') return;
    rewardType = rollDisenchantReward();
    phase = 'dissolving';
    playSimSound('big-swoosh');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    dissolveTimer = window.setTimeout(finish, reduceMotion ? 0 : DISSOLVE_MS);
  }

  function finish() {
    if (phase !== 'dissolving' || !held || !rewardType) return;
    phase = 'reward';
    playAddResourceSound();
  }

  function close() {
    if (committed) return;
    committed = true;
    if (held && rewardType) {
      performAction({
        ...action,
        actionParameters: {
          ...action.actionParameters,
          cardId: held.id,
          resourceType: rewardType,
        },
        missingParameters: {},
      });
    }
    onDone();
  }
</script>

{#if phase === 'pick'}
  <WorkbenchShell title="Disenchant a Card" subtitle="Choose a card to unmake." wide scene="invocation">
    <section class="picker" aria-label="Cards">
      {#if availableCards.length === 0}
        <p class="empty">No cards available.</p>
      {:else}
        <CardFilters
          cards={availableCards}
          bind:colorFilter
          bind:costFilter
          bind:typeFilter
          tone="parchment"
        />
        {#if filteredCards.length === 0}
          <p class="empty">
            {hasActiveFilters ? 'No cards match these filters.' : 'No cards available.'}
          </p>
        {:else}
          <div class="card-grid">
            {#each filteredCards as option (option.id)}
              <button type="button" class="card-pick" onclick={() => selectCard(option.id)}>
                <CardCompact card={option} />
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </section>
    {#snippet footer()}
      <OrnateButton icon="arrow-left" onclick={back}>Cancel</OrnateButton>
    {/snippet}
  </WorkbenchShell>
{:else if held}
  <WorkbenchShell
    title={phase === 'reward' ? 'Recovered' : `Disenchant ${held.name}`}
    subtitle={phase === 'reward'
      ? `The card comes apart into ${rewardLabel.toLowerCase()}.`
      : 'The card will be unmade. What remains is uncertain.'}
    scene="invocation"
  >
    <div class="stage">
      {#if phase === 'reward' && rewardType}
        <div class="reward">
          <div class="reward-icon">
            <ResourceIcon type={rewardType} alt={rewardLabel} />
          </div>
          <p class="reward-label">+1 {rewardLabel}</p>
        </div>
      {:else}
        <div class="card-hold" class:dissolving={phase === 'dissolving'}>
          <CardCompact card={held} />
        </div>
      {/if}
    </div>
    {#snippet footer()}
      {#if phase === 'reward'}
        <OrnateButton icon="magic_dust" onclick={close}>Done</OrnateButton>
      {:else}
        <OrnateButton icon="arrow-left" disabled={phase === 'dissolving'} onclick={back}>
          {canChangeCard ? 'Back' : 'Cancel'}
        </OrnateButton>
        <OrnateButton icon="magic_dust" disabled={phase !== 'ready'} onclick={begin}>
          Disenchant
        </OrnateButton>
      {/if}
    {/snippet}
  </WorkbenchShell>
{/if}

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
  }

  .card-pick {
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 0;
    cursor: pointer;
  }

  .card-pick:hover {
    border-color: var(--color-golden);
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: #6a5c4c;
  }

  .stage {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }

  .card-hold.dissolving {
    animation: unravel 900ms ease-in forwards;
    pointer-events: none;
  }

  .reward {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    animation: emerge 0.45s ease;
  }

  .reward-icon {
    width: 96px;
    height: 96px;
    filter: drop-shadow(0 8px 16px rgba(44, 37, 29, 0.35));
  }

  .reward-label {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 1.15rem;
    color: var(--color-ink);
  }

  @keyframes unravel {
    0% {
      opacity: 1;
      filter: blur(0) brightness(1);
      transform: scale(1);
    }
    30% {
      opacity: 1;
      filter: blur(0) brightness(1.4);
      transform: scale(1.04);
    }
    100% {
      opacity: 0;
      filter: blur(16px) brightness(2.4);
      transform: scale(1.18);
    }
  }

  @keyframes emerge {
    from {
      opacity: 0;
      transform: scale(0.82);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-hold.dissolving,
    .reward {
      animation: none;
    }
  }
</style>
