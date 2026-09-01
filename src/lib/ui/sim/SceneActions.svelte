<script lang="ts">
  import type { Action } from '@/lib/_model';
  import { selectOption } from '@/lib/sim/scene';
  import { gs } from '@/lib/_state';
  import { performAction } from '@/lib/sim/actions';
  import { getCardImagePath, getCharacterImagePath } from '@/lib/_utils/asset-paths';

  const event = $derived(gs.scene.event);
  const actions = $derived(gs.scene.actions);

  let pendingAction = $state<Action | null>(null);

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
    commitAction({
      ...action,
      actionParameters: { ...action.actionParameters },
      missingParameters: { ...action.missingParameters },
    });
  }

  function pickParameter(value: string) {
    if (!pendingAction || !currentParameterKey) return;
    commitAction(applyParameter(pendingAction, currentParameterKey, value));
  }

  function cancelParameterPick() {
    pendingAction = null;
  }
</script>

<div class="actions">
  <div class="action-buttons-wrap">
    {#if pendingAction && currentParameterKey}
      <p class="parameter-prompt">{parameterPrompt}</p>
    {/if}
    <div class="action-buttons">
      {#if event}
        {#each event.options as option, i (i)}
          <button type="button" class="action-btn" onclick={() => selectOption(option)}
            >{option.text}</button
          >
        {/each}
      {:else if pendingAction && currentParameterKey}
        {#each currentOptions as option (optionValue(option))}
          {@const thumb = optionThumb(option)}
          <button
            type="button"
            class="action-btn"
            class:long={pendingAction.isLongAction}
            class:has-thumb={!!thumb}
            onclick={() => pickParameter(optionValue(option))}
          >
            {#if thumb}
              <span
                class="option-thumb"
                class:portrait={thumb.portrait}
                style="background-image: url('{thumb.path}')"
                aria-hidden="true"
              ></span>
            {/if}
            <span class="option-label">{optionLabel(option)}</span>
          </button>
        {/each}
        <button type="button" class="action-btn cancel" onclick={cancelParameterPick}>Cancel</button
        >
      {:else}
        {#each actions as action (action.label)}
          <button
            type="button"
            class="action-btn"
            class:long={action.isLongAction}
            onclick={() => onActionClick(action)}>{action.label}</button
          >
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
    max-width: 640px;
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
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #a89880;
    text-align: center;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    padding: 10px 24px;
    cursor: pointer;
  }

  .action-btn.has-thumb {
    padding: 0;
    overflow: hidden;
  }

  .option-thumb {
    flex: 0 0 52px;
    align-self: stretch;
    width: 52px;
    border-right: 1px solid #5a4b3c;
    background-color: rgba(0, 0, 0, 0.35);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .option-thumb.portrait {
    background-position: center 18%;
  }

  .action-btn.has-thumb .option-label {
    padding: 10px 24px 10px 16px;
  }

  .action-btn:hover {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .action-btn.has-thumb:hover .option-thumb {
    border-right-color: #7a6b5c;
  }

  .action-btn:active {
    background: #2c251d;
  }

  .action-btn.long {
    color: #f0e6c8;
    border-color: var(--color-golden);
  }

  .action-btn.long.has-thumb .option-thumb {
    border-right-color: var(--color-golden);
  }

  .action-btn.long:hover {
    background: #4a3f32;
    border-color: #d4b85c;
  }

  .action-btn.cancel {
    color: #a89880;
    background: transparent;
    border-color: #5a4b3c;
  }

  .action-btn.cancel:hover {
    color: #e8dcc4;
    background: #3d3429;
  }
</style>
