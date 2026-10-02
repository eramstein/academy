<script lang="ts">
  import type { Action, Character as CharacterModel, Npc } from '@/lib/_model';
  import { ActionType, SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import { performAction, SocializeType } from '@/lib/sim/actions';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import Attributes from './Attributes.svelte';
  import CardCrafting from './characters/CardCrafting.svelte';
  import CharacterIdentity from './characters/CharacterIdentity.svelte';

  let { character }: { character: CharacterModel } = $props();

  const SUB_ICONS: Record<SubscriptionType, string> = {
    [SubscriptionType.Academy]: 'sun',
    [SubscriptionType.Library]: 'book',
    [SubscriptionType.Inn]: 'mug',
  };

  const RELATION_ORDER = ['friendship', 'respect', 'love', 'rivalry'] as const;
  const RELATION_ICONS: Record<(typeof RELATION_ORDER)[number], string> = {
    friendship: 'people',
    respect: 'trophy',
    love: 'heart',
    rivalry: 'boot',
  };

  const SOCIALIZE_ICONS: Record<SocializeType, string> = {
    [SocializeType.Befriend]: 'handshake',
    [SocializeType.Taunt]: 'finger_pointing',
    [SocializeType.Impress]: 'crown',
    [SocializeType.Flirt]: 'heart',
  };

  const traits = $derived(
    'traits' in character
      ? Object.entries((character as Npc).traits)
          .filter(([, active]) => active)
          .map(([trait]) => trait)
      : []
  );

  const relations = $derived(
    'relationProgress' in character
      ? RELATION_ORDER.map((key) => ({
          key,
          value: (character as Npc).relationProgress[key],
          icon: RELATION_ICONS[key],
        }))
      : []
  );

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      days: character.subscriptions[type] ?? 0,
      icon: SUB_ICONS[type],
    }))
  );

  const socializeAction = $derived(
    gs.scene.event?.options.length
      ? undefined
      : gs.scene.actions.find((action) => action.actionType === ActionType.Socialize)
  );

  const socializeTypes = $derived.by(() => {
    if (!socializeAction) return [];
    const characterOptions = socializeAction.missingParameters?.characterKey;
    if (!Array.isArray(characterOptions)) return [];
    const isPresent = characterOptions.some(
      (option) => (Array.isArray(option) ? option[0] : option) === character.key
    );
    if (!isPresent) return [];
    const types = socializeAction.missingParameters?.socializeType;
    if (!Array.isArray(types)) return [];
    return types.map((type) => (Array.isArray(type) ? type[0] : type) as SocializeType);
  });

  const matchAction = $derived(
    gs.scene.event?.options.length
      ? undefined
      : gs.scene.actions.find((action) => action.actionType === ActionType.StartMatch)
  );

  const canStartMatch = $derived.by(() => {
    if (!matchAction) return false;
    const opponents = matchAction.missingParameters?.opponentKey;
    if (!Array.isArray(opponents)) return false;
    return opponents.some(
      (option) => (Array.isArray(option) ? option[0] : option) === character.key
    );
  });

  const matchDecks = $derived.by(() => {
    if (!canStartMatch || !matchAction) return [];
    const decks = matchAction.missingParameters?.playerDeckKey;
    if (!Array.isArray(decks)) return [];
    return decks.map((deck) =>
      Array.isArray(deck)
        ? { key: deck[0], label: deck[1] }
        : { key: deck, label: deck }
    );
  });

  let pickingMatchDeck = $state(false);

  const showCharacterActions = $derived(
    socializeTypes.length > 0 || canStartMatch || pickingMatchDeck
  );

  $effect(() => {
    character.key;
    canStartMatch;
    pickingMatchDeck = false;
  });

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }

  function socializeLabel(type: SocializeType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  function onSocialize(type: SocializeType) {
    if (!socializeAction) return;
    pickingMatchDeck = false;
    const action: Action = {
      ...socializeAction,
      actionParameters: {
        ...socializeAction.actionParameters,
        characterKey: character.key,
        socializeType: type,
      },
      missingParameters: {},
    };
    performAction(action);
  }

  function startMatchWithDeck(deckKey: string) {
    if (!matchAction) return;
    pickingMatchDeck = false;
    const action: Action = {
      ...matchAction,
      actionParameters: {
        ...matchAction.actionParameters,
        opponentKey: character.key,
        playerDeckKey: deckKey,
      },
      missingParameters: {},
    };
    performAction(action);
  }

  function onStartMatch() {
    if (!canStartMatch || matchDecks.length === 0) return;
    if (matchDecks.length === 1) {
      startMatchWithDeck(matchDecks[0].key);
      return;
    }
    pickingMatchDeck = true;
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

    {#if showCharacterActions}
      <div class="character-actions">
        {#if pickingMatchDeck}
          {#each matchDecks as deck (deck.key)}
            <OrnateButton onclick={() => startMatchWithDeck(deck.key)}>
              {deck.label}
            </OrnateButton>
          {/each}
          <button type="button" class="cancel-btn" onclick={() => (pickingMatchDeck = false)}>
            Cancel
          </button>
        {:else}
          {#each socializeTypes as type (type)}
            <OrnateButton icon={SOCIALIZE_ICONS[type]} onclick={() => onSocialize(type)}>
              {socializeLabel(type)}
            </OrnateButton>
          {/each}
          {#if canStartMatch}
            <OrnateButton icon="trophy" onclick={onStartMatch}>Play League Match</OrnateButton>
          {/if}
        {/if}
      </div>
    {/if}

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

      <div class="two-col" class:single={relations.length === 0}>
        {#if relations.length > 0}
          <section class="section">
            <h3 class="section-title">
              {@render icon('people')}
              Relations
            </h3>
            {@render divider()}
            <ul class="relation-list">
              {#each relations as rel (rel.key)}
                <li class="relation-row">
                  {@render icon(rel.icon)}
                  <span class="relation-name">{rel.key}</span>
                  <span class="relation-value">{rel.value}</span>
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

      <CardCrafting {character} />
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
    width: 1.35rem;
    height: 1.35rem;
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

  .character-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    padding: 0.75rem 1.2rem 0;
    box-sizing: border-box;
  }

  .character-actions :global(.ornate-button) {
    flex: 0 0 auto;
  }

  .character-actions :global(.ornate-button .icon) {
    width: 1.35rem;
    height: 1.35rem;
  }

  .cancel-btn {
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    color: var(--color-muted-label);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
    border-radius: 4px;
    padding: 8px 14px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    color: var(--color-cream);
    border-color: var(--color-brass);
    background: var(--color-data-hover);
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
    width: 1.2rem;
    height: 1.2rem;
  }

  .sheet-body .divider {
    color: var(--brass);
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.15rem;
    min-width: 0;
  }

  .two-col.single {
    grid-template-columns: 1fr;
  }

  .two-col .section {
    min-width: 0;
  }

  .sub-list,
  .relation-list {
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

  .relation-row {
    display: grid;
    grid-template-columns: 1.4rem 1fr auto;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.95rem;
  }

  .relation-name {
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .relation-value {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .sub-row {
    display: grid;
    grid-template-columns: 1.4rem 1fr auto;
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
