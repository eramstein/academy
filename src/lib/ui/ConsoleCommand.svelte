<script lang="ts">
  import { uiState } from '../_state';
  import { executeCommand } from './_keybinds/commands';

  let inputValue = $state('');
  let resultMessage = $state('');
  let resultOk = $state(true);
  let inputEl = $state<HTMLInputElement>();

  $effect(() => {
    if (uiState.consoleCommand.visible) {
      inputValue = '/';
      resultMessage = '';
      // Focus after the DOM updates
      setTimeout(() => inputEl?.focus(), 0);
    }
  });

  function close() {
    uiState.consoleCommand.visible = false;
  }

  async function submit(keepOpen = false) {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === '/') {
      close();
      return;
    }
    const result = await executeCommand(inputValue);
    resultOk = result.ok;
    resultMessage = result.message;
    if (result.ok && !keepOpen) {
      setTimeout(close, 800);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      submit(e.shiftKey);
    } else if (e.key === 'Escape') {
      close();
    }
    e.stopPropagation();
  }
</script>

{#if uiState.consoleCommand.visible}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="console-backdrop" onclick={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="console-panel" onclick={(e) => e.stopPropagation()}>
      <input
        bind:this={inputEl}
        bind:value={inputValue}
        class="console-input"
        type="text"
        placeholder="/command args..."
        onkeydown={handleKeydown}
        spellcheck={false}
        autocomplete="off"
      />
      {#if resultMessage}
        <div class="console-result" class:ok={resultOk} class:error={!resultOk}>
          {resultMessage}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .console-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: transparent;
  }

  .console-panel {
    position: absolute;
    top: 48px;
    left: 50%;
    transform: translateX(-50%);
    width: 480px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .console-input {
    width: 100%;
    box-sizing: border-box;
    background: #1a1a1a;
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    font-family: monospace;
    font-size: 0.95rem;
    padding: 8px 12px;
    outline: none;
  }

  .console-input:focus {
    border-color: #888;
  }

  .console-result {
    font-family: monospace;
    font-size: 0.85rem;
    padding: 4px 12px;
    border-radius: 4px;
  }

  .console-result.ok {
    color: #6fcf97;
    background: rgba(111, 207, 151, 0.1);
  }

  .console-result.error {
    color: #eb5757;
    background: rgba(235, 87, 87, 0.1);
  }
</style>
