<script lang="ts">
  import { UiView } from '@/lib/_model';
  import { uiState } from '@/lib/_state';
  import {
    setInteractionLanguage,
    setLlmFeaturesEnabled,
    setTextSpeed,
    settings,
    TEXT_SPEED_OPTIONS,
    type TextSpeed,
  } from '@/lib/_state/settings.svelte';
  import {
    INTERACTION_LANGUAGE_OPTIONS,
    type InteractionLanguage,
  } from '@/lib/sim/interactions/language';
  import { getDataBackgroundPath, getTableImagePath } from '@/lib/_utils/asset-paths';

  function onTextSpeedChange(value: TextSpeed) {
    setTextSpeed(value);
  }

  function onLlmFeaturesChange(enabled: boolean) {
    setLlmFeaturesEnabled(enabled);
  }

  function onLanguageChange(language: InteractionLanguage) {
    setInteractionLanguage(language);
  }

  function goBack() {
    uiState.currentView = UiView.Scene;
  }
</script>

<div class="settings-screen" style="background-image: url('{getTableImagePath()}')">
  <div class="settings-panel" style="background-image: url('{getDataBackgroundPath()}')">
    <header class="header">
      <h1>Settings</h1>
      <button type="button" class="back" onclick={goBack}>Back to Game</button>
    </header>

    <section class="setting">
      <div class="setting-label">
        <h2>Text speed</h2>
        <p>How quickly narration and dialogue appear.</p>
      </div>
      <div class="speed-options" role="radiogroup" aria-label="Text speed">
        {#each TEXT_SPEED_OPTIONS as option (option.value)}
          <button
            type="button"
            class="speed-option"
            class:selected={settings.textSpeed === option.value}
            role="radio"
            aria-checked={settings.textSpeed === option.value}
            onclick={() => onTextSpeedChange(option.value)}
          >
            <span class="option-label">{option.label}</span>
            <span class="option-hint">{option.hint}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class="setting">
      <div class="setting-label">
        <h2>LLM features</h2>
        <p>
          Structured social interactions and other content that calls the language model. Turn off
          to hide those options.
        </p>
      </div>
      <div class="speed-options" role="radiogroup" aria-label="LLM features">
        <button
          type="button"
          class="speed-option"
          class:selected={settings.llmFeaturesEnabled}
          role="radio"
          aria-checked={settings.llmFeaturesEnabled}
          onclick={() => onLlmFeaturesChange(true)}
        >
          <span class="option-label">On</span>
          <span class="option-hint">Interactions and LLM-gated events</span>
        </button>
        <button
          type="button"
          class="speed-option"
          class:selected={!settings.llmFeaturesEnabled}
          role="radio"
          aria-checked={!settings.llmFeaturesEnabled}
          onclick={() => onLlmFeaturesChange(false)}
        >
          <span class="option-label">Off</span>
          <span class="option-hint">Hide LLM-powered options</span>
        </button>
      </div>
    </section>

    <section class="setting">
      <div class="setting-label">
        <h2>Language</h2>
        <p>Language of generated social interactions: the scene and the choices you can pick.</p>
      </div>
      <div class="speed-options" role="radiogroup" aria-label="Language">
        {#each INTERACTION_LANGUAGE_OPTIONS as option (option.value)}
          <button
            type="button"
            class="speed-option"
            class:selected={settings.language === option.value}
            role="radio"
            aria-checked={settings.language === option.value}
            onclick={() => onLanguageChange(option.value)}
          >
            <span class="option-label">{option.label}</span>
            <span class="option-hint">{option.hint}</span>
          </button>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .settings-screen {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-size: cover;
    background-position: center;
    box-sizing: border-box;
  }

  .settings-panel {
    width: min(36rem, 100%);
    padding: 1.5rem 1.75rem 1.75rem;
    border: 1px solid var(--color-brass);
    border-radius: 6px;
    background-size: cover;
    background-position: center;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--color-brass);
  }

  .header h1 {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 600;
    color: var(--color-brass);
    letter-spacing: 0.02em;
  }

  .back {
    padding: 0.35rem 0.75rem;
    background: var(--color-data);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: inherit;
    font-size: 0.95rem;
    cursor: pointer;
  }

  .back:hover {
    background: var(--color-data-hover);
    border-color: var(--color-golden);
  }

  .setting {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .setting + .setting {
    margin-top: 1.35rem;
    padding-top: 1.35rem;
    border-top: 1px solid color-mix(in srgb, var(--color-brass) 55%, transparent);
  }

  .setting-label h2 {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-cream);
  }

  .setting-label p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--color-muted-label);
    line-height: 1.4;
  }

  .speed-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .speed-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    padding: 0.7rem 0.85rem;
    background: rgba(10, 16, 24, 0.45);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .speed-option:hover {
    background: var(--color-data-hover);
  }

  .speed-option.selected {
    border-color: var(--color-golden);
    box-shadow: inset 0 0 0 1px var(--color-golden);
    background: var(--color-data-hover);
  }

  .option-label {
    font-size: 1rem;
    font-weight: 600;
  }

  .option-hint {
    font-size: 0.85rem;
    color: var(--color-muted-label);
  }
</style>
