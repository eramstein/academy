<script lang="ts">
  import type { Action } from '@/lib/_model/model-game';
  import { performAction } from '@/lib/sim/actions';
  import { selectOption } from '@/lib/sim/scene';
  import { gs } from '@/lib/_state';

  const event = $derived(gs.scene.event);
  const actions = $derived(gs.scene.actions);

  let pendingAction = $state<Action | null>(null);

  const parameterPrompts: Record<string, string> = {
    characterKey: 'Who?',
    placeKey: 'Where?',
    socializeType: 'How?',
    playerDeckKey: 'Choose your deck',
    opponentKey: 'Against who?',
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

  function onActionClick(action: Action) {
    const missingKeys = action.missingParameters ? Object.keys(action.missingParameters) : [];
    if (missingKeys.length === 0) {
      performAction(action);
      return;
    }
    pendingAction = {
      ...action,
      actionParameters: { ...action.actionParameters },
      missingParameters: { ...action.missingParameters },
    };
  }

  function pickParameter(value: string) {
    if (!pendingAction || !currentParameterKey) return;

    const next: Action = {
      ...pendingAction,
      actionParameters: {
        ...pendingAction.actionParameters,
        [currentParameterKey]: value,
      },
      missingParameters: { ...pendingAction.missingParameters },
    };
    delete next.missingParameters?.[currentParameterKey];

    if (next.missingParameters && Object.keys(next.missingParameters).length === 0) {
      pendingAction = null;
      performAction(next);
      return;
    }
    pendingAction = next;
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
          <button
            type="button"
            class="action-btn"
            class:long={pendingAction.isLongAction}
            onclick={() => pickParameter(optionValue(option))}>{optionLabel(option)}</button
          >
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
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    padding: 10px 24px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .action-btn:active {
    background: #2c251d;
  }

  .action-btn.long {
    color: #f0e6c8;
    border-color: var(--color-golden);
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
