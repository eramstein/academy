<script lang="ts">
  import { ActionType, type Action, type ResourceType } from '@/lib/_model';
  import { selectOption } from '@/lib/sim/scene';
  import { gs } from '@/lib/_state';
  import {
    getConjurationOtions,
    performAction,
    TransactionType,
    type CardCreationResult,
  } from '@/lib/sim/actions';
  import { getCardImagePath, getCharacterImagePath } from '@/lib/_utils/asset-paths';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import Conjure from './Conjure.svelte';
  import Enchantment from './Enchantment.svelte';
  import Invoke from './Invoke.svelte';
  import Recipe from './Recipe.svelte';
  import Shop from './Shop.svelte';

  const event = $derived(gs.scene.event);
  const actions = $derived(gs.scene.actions);

  const actionIcons: Partial<Record<ActionType, string>> = {
    [ActionType.Socialize]: 'people',
    [ActionType.Conjure]: 'page-star',
    [ActionType.Invoke]: 'spiral',
    [ActionType.Wait]: 'hourglass',
    [ActionType.Augment]: 'leaf',
    [ActionType.Distill]: 'moon',
    [ActionType.StartMatch]: 'trophy',
    [ActionType.Move]: 'boot',
    [ActionType.Transaction]: 'coin',
    [ActionType.Negotiate]: 'mug',
  };

  let pendingAction = $state<Action | null>(null);
  let enchantAction = $state<Action | null>(null);
  let shopAction = $state<Action | null>(null);
  let cardCraftAction = $state<Action | null>(null);
  let cardCraftStep = $state<'recipe' | 'invoke' | 'conjure'>('recipe');
  let recipeResources = $state<{ type: ResourceType; count: number }[]>([]);
  let conjureOptions = $state<CardCreationResult[]>([]);

  const parameterPrompts: Record<string, string> = {
    characterKey: 'Who?',
    placeKey: 'Where?',
    socializeType: 'How?',
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
    const value = pendingAction.missingParameters?.[currentParameterKey];
    return Array.isArray(value) ? value : [];
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
    return option.charAt(0).toUpperCase() + option.slice(1);
  }

  function optionThumb(option: string | [string, string]): { path: string; portrait: boolean } | undefined {
    const value = optionValue(option);
    const card = gs.player.collection.find((c) => c.id === value);
    if (card) return { path: getCardImagePath(card.imageFileName), portrait: false };
    const character = gs.characters[value];
    if (character) return { path: getCharacterImagePath(character.key), portrait: true };
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
    if (next.actionType === ActionType.Conjure || next.actionType === ActionType.Invoke) {
      cardCraftAction = next;
      cardCraftStep = 'recipe';
      recipeResources = Array.isArray(next.actionParameters.resources)
        ? next.actionParameters.resources
        : [];
      return;
    }
    commitAction(next);
  }

  function closeCardCraft() {
    cardCraftAction = null;
    cardCraftStep = 'recipe';
    recipeResources = [];
    conjureOptions = [];
  }

  function onRecipeConfirm(resources: { type: ResourceType; count: number }[]) {
    if (!cardCraftAction) return;
    recipeResources = resources;
    if (cardCraftAction.actionType === ActionType.Conjure) {
      conjureOptions = getConjurationOtions({
        ...cardCraftAction.actionParameters,
        resources,
      });
      cardCraftStep = 'conjure';
      return;
    }
    cardCraftStep = 'invoke';
  }

  function onConjurePick(result: CardCreationResult) {
    if (!cardCraftAction) return;
    performAction({
      ...cardCraftAction,
      actionParameters: result,
      missingParameters: {},
    });
    closeCardCraft();
  }

  function pickParameter(value: string) {
    if (!pendingAction || !currentParameterKey) return;
    commitAction(applyParameter(pendingAction, currentParameterKey, value));
  }

  function cancelParameterPick() {
    pendingAction = null;
  }
</script>

{#if enchantAction}
  <Enchantment action={enchantAction} onDone={() => (enchantAction = null)} />
{/if}
{#if shopAction}
  <Shop action={shopAction} onDone={() => (shopAction = null)} />
{/if}
{#if cardCraftAction && cardCraftStep === 'recipe'}
  <Recipe
    title={cardCraftAction.actionType === ActionType.Conjure ? 'Conjure' : 'Recipe'}
    confirmLabel="Next"
    initialResources={recipeResources}
    onConfirm={onRecipeConfirm}
    onDone={closeCardCraft}
  />
{/if}
{#if cardCraftAction && cardCraftStep === 'conjure'}
  <Conjure options={conjureOptions} onPick={onConjurePick} onDone={closeCardCraft} />
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
    onBack={() => (cardCraftStep = 'recipe')}
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
          <OrnateButton onclick={() => selectOption(option)}>{option.text}</OrnateButton>
        {/each}
      {:else if pendingAction && currentParameterKey}
        {#each currentOptions as option (optionValue(option))}
          {@const thumb = optionThumb(option)}
          {#if thumb}
            <OrnateButton
              variant={pendingAction.isLongAction ? 'long' : 'default'}
              onclick={() => pickParameter(optionValue(option))}
            >
              {#snippet lead()}
                <span
                  class="option-thumb"
                  class:portrait={thumb.portrait}
                  style="background-image: url('{thumb.path}')"
                  aria-hidden="true"
                ></span>
              {/snippet}
              {optionLabel(option)}
            </OrnateButton>
          {:else}
            <OrnateButton
              variant={pendingAction.isLongAction ? 'long' : 'default'}
              onclick={() => pickParameter(optionValue(option))}
            >
              {optionLabel(option)}
            </OrnateButton>
          {/if}
        {/each}
        <button type="button" class="cancel-btn" onclick={cancelParameterPick}>Cancel</button>
      {:else}
        {#each actions as action (action.label)}
          <OrnateButton
            icon={actionIcons[action.actionType]}
            variant={action.isLongAction ? 'long' : 'default'}
            onclick={() => onActionClick(action)}
          >
            {action.label}
          </OrnateButton>
        {/each}
      {/if}
    </div>
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

  .option-thumb {
    flex: 0 0 52px;
    align-self: stretch;
    width: 52px;
    border-right: 1px solid color-mix(in srgb, var(--color-brass) 70%, transparent);
    background-color: rgba(0, 0, 0, 0.35);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .option-thumb.portrait {
    background-position: center 18%;
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
</style>
