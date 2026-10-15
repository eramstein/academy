<script lang="ts">
  import { ActionType, type Action, type ResourceType } from '@/lib/_model';
  import { playManualTriggerEvent, selectOption } from '@/lib/sim/scene';
  import { gs } from '@/lib/_state';
  import {
    getConjurationOtions,
    performAction,
    RomanceType,
    SocializeType,
    TransactionType,
    type CardCreationResult,
    type CardSummonProgress,
    type ConjurationAugury,
  } from '@/lib/sim/actions';
  import { skillCheckDifficultyLabels } from '@/lib/sim/attribute-checks';
  import { getCardImagePath, getCharacterImagePath } from '@/lib/_utils/asset-paths';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import Conjure from './Conjure.svelte';
  import Enchantment from './Enchantment.svelte';
  import Invoke from './Invoke.svelte';
  import Shop from './Shop.svelte';

  const event = $derived(gs.scene.event);
  const actions = $derived(gs.scene.actions);
  const manualTriggers = $derived(gs.scene.manualTriggers ?? []);

  const actionIcons: Partial<Record<ActionType, string>> = {
    [ActionType.Socialize]: 'people',
    [ActionType.Romance]: 'heart',
    [ActionType.Invite]: 'calendar',
    [ActionType.Conjure]: 'page-star',
    [ActionType.Invoke]: 'spiral',
    [ActionType.Wait]: 'arrow-left',
    [ActionType.Augment]: 'leaf',
    [ActionType.Distill]: 'moon',
    [ActionType.StartMatch]: 'trophy',
    [ActionType.Move]: 'boot',
    [ActionType.Transaction]: 'coin',
    [ActionType.Negotiate]: 'mug',
    [ActionType.PerformJob]: 'coin',
    [ActionType.StudyColors]: 'book',
    [ActionType.StudyAbilities]: 'book',
  };

  function actionVariant(action: Action): 'default' | 'long' | 'muted' {
    return action.isLongAction ? 'long' : 'default';
  }

  const socializeIcons: Record<SocializeType, string> = {
    [SocializeType.Befriend]: 'handshake',
    [SocializeType.Taunt]: 'finger_pointing',
    [SocializeType.Impress]: 'crown',
    [SocializeType.Flirt]: 'heart',
  };

  const romanceIcons: Record<RomanceType, string> = {
    [RomanceType.DeepenRelationship]: 'heart',
    [RomanceType.Physical]: 'feather',
  };

  let pendingAction = $state<Action | null>(null);
  let playerIntent = $state('');
  let enchantAction = $state<Action | null>(null);

  const intentParameterKeys = new Set(['socializeType', 'romanceType']);
  let shopAction = $state<Action | null>(null);
  let cardCraftAction = $state<Action | null>(null);
  let cardCraftStep = $state<'invoke' | 'conjure'>('invoke');
  let recipeResources = $state<{ type: ResourceType; count: number }[]>([]);
  let conjureOptions = $state<CardCreationResult[]>([]);

  const parameterPrompts: Record<string, string> = {
    characterKey: 'Who?',
    placeKey: 'Where?',
    socializeType: 'How?',
    romanceType: 'How?',
    playerDeckKey: 'Choose your deck',
    opponentKey: 'Against who?',
    cardId: 'Which card?',
  };

  function formatParameterKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

  const currentParameterKey = $derived(
    pendingAction && pendingAction.missingParameters
      ? Object.keys(pendingAction.missingParameters)[0]
      : undefined
  );

  const currentOptions = $derived.by(() => {
    if (!pendingAction || !currentParameterKey) return [];
    // Resolve decks live so we always show current decks with unique option values
    // (saved games may still share key "base" across color decks).
    if (currentParameterKey === 'playerDeckKey') {
      return gs.player.decks.map((deck, index) => [String(index), deck.name] as [string, string]);
    }
    const value = pendingAction.missingParameters?.[currentParameterKey];
    if (!Array.isArray(value)) return [];
    if (currentParameterKey === 'placeKey') {
      return value.filter((option) => {
        const key = Array.isArray(option) ? option[0] : option;
        return !gs.places[key]?.locked;
      });
    }
    return value;
  });

  const parameterPrompt = $derived(
    currentParameterKey
      ? (parameterPrompts[currentParameterKey] ?? formatParameterKey(currentParameterKey))
      : ''
  );

  function optionValue(option: string | [string, string]): string {
    return Array.isArray(option) ? option[0] : option;
  }

  function optionLabel(option: string | [string, string]): string {
    if (Array.isArray(option)) return option[1];
    if (currentParameterKey === 'romanceType') {
      return option
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return option.charAt(0).toUpperCase() + option.slice(1);
  }

  function attributeCheckHint(attribute: string, difficulty: keyof typeof skillCheckDifficultyLabels): string {
    const attr = attribute.charAt(0).toUpperCase() + attribute.slice(1);
    return `${attr} · ${skillCheckDifficultyLabels[difficulty]}`;
  }

  function optionThumb(option: string | [string, string]): { path: string; portrait: boolean } | undefined {
    const value = optionValue(option);
    // Only attach thumbs for parameters that are actually cards/characters —
    // deck keys must not fall through to character portraits.
    if (currentParameterKey === 'cardId') {
      const card = gs.player.collection.find((c) => c.id === value);
      if (card) return { path: getCardImagePath(card.imageFileName), portrait: false };
      return undefined;
    }
    if (currentParameterKey === 'characterKey' || currentParameterKey === 'opponentKey') {
      const character = gs.characters[value];
      if (character) return { path: getCharacterImagePath(character.key), portrait: true };
    }
  }

  function optionIcon(option: string | [string, string]): string | undefined {
    const value = optionValue(option);
    if (currentParameterKey === 'socializeType') {
      return socializeIcons[value as SocializeType];
    }
    if (currentParameterKey === 'romanceType') {
      return romanceIcons[value as RomanceType];
    }
    return undefined;
  }

  function romanceActionIcon(action: Action): string | undefined {
    if (action.actionType !== ActionType.Romance) return undefined;
    const romanceType = action.actionParameters?.romanceType as RomanceType | undefined;
    return romanceType ? romanceIcons[romanceType] : actionIcons[ActionType.Romance];
  }

  function applyParameter(action: Action, key: string, value: string): Action {
    const next: Action = {
      ...action,
      actionParameters: {
        ...action.actionParameters,
        [key]: value,
      },
      missingParameters: { ...action.missingParameters },
    };
    delete next.missingParameters?.[key];
    return next;
  }

  function autoFillSingleOptions(action: Action): Action {
    let next = action;
    let filled = true;
    while (filled && next.missingParameters) {
      filled = false;
      for (const key of Object.keys(next.missingParameters)) {
        const value = next.missingParameters[key];
        if (Array.isArray(value) && value.length === 1) {
          next = applyParameter(next, key, optionValue(value[0]));
          filled = true;
          break;
        }
      }
    }
    return next;
  }

  function commitAction(action: Action) {
    const filled = autoFillSingleOptions(action);
    const remaining = filled.missingParameters ? Object.keys(filled.missingParameters) : [];
    if (remaining.length === 0) {
      pendingAction = null;
      performAction(filled);
      return;
    }
    pendingAction = filled;
  }

  function onActionClick(action: Action) {
    const next: Action = {
      ...action,
      actionParameters: { ...action.actionParameters },
      missingParameters: { ...action.missingParameters },
    };
    if (next.actionType === ActionType.Augment || next.actionType === ActionType.Distill) {
      enchantAction = next;
      return;
    }
    if (
      next.actionType === ActionType.Transaction &&
      next.actionParameters.transactionType === TransactionType.Purchase
    ) {
      shopAction = next;
      return;
    }
    if (next.actionType === ActionType.Conjure) {
      cardCraftAction = next;
      cardCraftStep = 'conjure';
      recipeResources = Array.isArray(next.actionParameters.resources)
        ? next.actionParameters.resources
        : [];
      conjureOptions = [];
      return;
    }
    if (next.actionType === ActionType.Invoke) {
      cardCraftAction = next;
      cardCraftStep = 'invoke';
      return;
    }
    commitAction(next);
  }

  function closeCardCraft() {
    cardCraftAction = null;
    cardCraftStep = 'invoke';
    recipeResources = [];
    conjureOptions = [];
  }

  async function generateConjureOptions(
    resources: { type: ResourceType; count: number }[],
    onProgress: (progress: CardSummonProgress) => void,
    flavorText?: string,
    augury?: ConjurationAugury
  ) {
    if (!cardCraftAction) return [];
    recipeResources = resources;
    conjureOptions = await getConjurationOtions(
      {
        ...cardCraftAction.actionParameters,
        source: 'conjure',
        resources,
      },
      'player',
      onProgress,
      flavorText,
      augury
    );
    return conjureOptions;
  }

  async function onConjurePick(result: CardCreationResult) {
    if (!cardCraftAction) return;
    const action = {
      ...cardCraftAction,
      actionParameters: result,
      missingParameters: {},
    };
    // Finish scene updates before unmounting the overlay so the book doesn't
    // remeasure against a half-updated page (actions gone, cards not in yet).
    await performAction(action);
    closeCardCraft();
  }

  function pickParameter(value: string) {
    if (!pendingAction || !currentParameterKey) return;
    let next = applyParameter(pendingAction, currentParameterKey, value);
    if (intentParameterKeys.has(currentParameterKey)) {
      const intent = playerIntent.trim();
      if (intent) {
        next = {
          ...next,
          actionParameters: { ...next.actionParameters, intent },
        };
      }
      playerIntent = '';
    }
    commitAction(next);
  }

  function cancelParameterPick() {
    pendingAction = null;
    playerIntent = '';
  }
</script>

{#if enchantAction}
  <Enchantment action={enchantAction} onDone={() => (enchantAction = null)} />
{/if}
{#if shopAction}
  <Shop action={shopAction} onDone={() => (shopAction = null)} />
{/if}
{#if cardCraftAction && cardCraftStep === 'conjure'}
  <Conjure
    initialResources={recipeResources}
    onConjure={generateConjureOptions}
    onPick={onConjurePick}
    onDone={closeCardCraft}
  />
{/if}
{#if cardCraftAction && cardCraftStep === 'invoke'}
  <Invoke
    action={{
      ...cardCraftAction,
      actionParameters: {
        ...cardCraftAction.actionParameters,
        resources: recipeResources,
      },
    }}
    onDone={closeCardCraft}
  />
{/if}

<div class="actions">
  <div class="action-buttons-wrap">
    {#if pendingAction && currentParameterKey}
      <p class="parameter-prompt">{parameterPrompt}</p>
    {/if}
    <div class="action-buttons">
      {#if event && event.options.length > 0}
        {#each event.options as option, i (i)}
          <OrnateButton onclick={() => selectOption(option)}>
            {option.text}
            {#if option.outcome.attributeCheck}
              <span class="skill-check-hint">
                {attributeCheckHint(
                  option.outcome.attributeCheck.attribute,
                  option.outcome.attributeCheck.difficulty
                )}
              </span>
            {/if}
          </OrnateButton>
        {/each}
      {:else if pendingAction && currentParameterKey}
        {#key currentParameterKey}
          {#each currentOptions as option, i (`${currentParameterKey}-${optionValue(option)}-${i}`)}
            {@const thumb = optionThumb(option)}
            {#if thumb}
              <OrnateButton
                variant={pendingAction.isLongAction ? 'long' : 'default'}
                onclick={() => pickParameter(optionValue(option))}
              >
                {#snippet lead()}
                  <span class="option-thumb" class:portrait={thumb.portrait} aria-hidden="true">
                    <img src={thumb.path} alt="" draggable="false" />
                  </span>
                {/snippet}
                {optionLabel(option)}
              </OrnateButton>
            {:else}
              <OrnateButton
                icon={optionIcon(option)}
                variant={pendingAction.isLongAction ? 'long' : 'default'}
                onclick={() => pickParameter(optionValue(option))}
              >
                {optionLabel(option)}
              </OrnateButton>
            {/if}
          {/each}
          <button type="button" class="cancel-btn" onclick={cancelParameterPick}>Cancel</button>
        {/key}
      {:else}
        {#each manualTriggers as offer (offer.eventKey)}
          <OrnateButton icon="book" onclick={() => playManualTriggerEvent(offer.eventKey)}>
            {offer.label}
          </OrnateButton>
        {/each}
        {#each actions as action (action.actionType + action.label)}
          <OrnateButton
            icon={romanceActionIcon(action) ?? actionIcons[action.actionType]}
            mirrorIcon={action.actionType === ActionType.Wait}
            variant={actionVariant(action)}
            onclick={() => onActionClick(action)}
          >
            {action.label}
          </OrnateButton>
        {/each}
      {/if}
    </div>
    {#if pendingAction && currentParameterKey && intentParameterKeys.has(currentParameterKey)}
      <label class="intent-field">
        <span class="intent-label">Intent (optional)</span>
        <input
          class="intent-input"
          type="text"
          maxlength="200"
          placeholder="What do you intend to say or do?"
          bind:value={playerIntent}
          autocomplete="off"
        />
      </label>
    {/if}
  </div>
</div>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-shrink: 0;
    width: 100%;
    margin-top: auto;
  }

  .action-buttons-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .parameter-prompt {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    text-align: center;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .action-buttons :global(.ornate-button .icon) {
    width: 1.65rem;
    height: 1.65rem;
  }

  .action-buttons :global(.ornate-button .label) {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15em;
    line-height: 1.2;
  }

  .skill-check-hint {
    font-size: 0.75em;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--color-cream) 65%, transparent);
  }

  .option-thumb {
    flex: 0 0 2.75rem;
    align-self: stretch;
    width: 2.75rem;
    margin: 5px 0 5px 5px;
    overflow: hidden;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.45);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-brass) 55%, transparent);
  }

  .option-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
  }

  /*
    Watercolor portraits have fine paper grain that aliases into white speckles
    when downscaled hard. Mild zoom + soft filter averages that grain out.
  */
  .option-thumb.portrait img {
    object-position: center 14%;
    transform: scale(1.28);
    transform-origin: center 16%;
    filter: contrast(0.9) saturate(1.05) brightness(0.96);
  }

  .cancel-btn {
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    color: var(--color-muted-label);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
    border-radius: 4px;
    padding: 8px 18px;
    cursor: pointer;
    align-self: center;
  }

  .cancel-btn:hover {
    color: var(--color-cream);
    border-color: var(--color-brass);
    background: color-mix(in srgb, var(--color-data) 55%, transparent);
  }

  .cancel-btn:active {
    background: var(--color-data-active);
  }

  .intent-field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
    width: min(28rem, 100%);
    box-sizing: border-box;
  }

  .intent-label {
    font-family: var(--font-narrative);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-label);
    text-align: center;
  }

  .intent-input {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.55rem 0.85rem;
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    line-height: 1.4;
    color: var(--color-cream);
    background: color-mix(in srgb, var(--color-data) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-brass) 50%, transparent);
    border-radius: 4px;
    outline: none;
    caret-color: var(--color-golden);
  }

  .intent-input::placeholder {
    color: color-mix(in srgb, var(--color-muted-label) 85%, transparent);
  }

  .intent-input:focus {
    border-color: var(--color-brass);
    background: color-mix(in srgb, var(--color-data-hover) 80%, transparent);
  }
</style>
