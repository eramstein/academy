<script lang="ts">
  import { performAction } from '@/lib/sim/actions';
  import { gs } from '@/lib/_state/main.svelte';
  import { NarrationType } from '@/lib/_model/enums-sim';
  import type { Narration } from '@/lib/_model/model-game';

  const narration = $derived(gs.scene.narration);
  const actions = $derived(gs.scene.actions);

  let pageEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    narration.length;
    queueMicrotask(() => {
      pageEl?.scrollTo({ top: pageEl.scrollHeight, behavior: 'smooth' });
    });
  });

  function checkOutcomeLabel(entry: Narration): string {
    const check = entry.attributeCheck;
    if (!check) return '';
    const result = check.success ? 'Success' : 'Failure';
    return check.critical ? `Critical ${result}` : result;
  }
</script>

<div class="scene">
  <article class="book">
    <div class="page" bind:this={pageEl}>
      {#each narration as entry, index (index)}
        {#if entry.type === NarrationType.Text}
          <p class="narration">{entry.text}</p>
        {:else if entry.type === NarrationType.AttributeCheck && entry.attributeCheck}
          {@const check = entry.attributeCheck}
          <div
            class="attribute-check"
            class:success={check.success}
            class:failure={!check.success}
            class:critical={check.critical}
          >
            <p class="check-label">{check.attribute} check — {check.difficulty}</p>
            <p class="check-roll">
              <span class="d20"><span class="d20-face">{check.roll}</span></span>
              <span class="vs">vs {check.target}</span>
            </p>
            <p class="check-outcome">{checkOutcomeLabel(entry)}</p>
          </div>
        {/if}
      {/each}
      <p class="prompt">What do you do?</p>
    </div>
  </article>

  {#if actions.length > 0}
    <div class="actions">
      {#each actions as action (action.label)}
        <button type="button" class="action-btn" onclick={() => performAction(action)}
          >{action.label}</button
        >
      {/each}
    </div>
  {/if}
</div>

<style>
  .scene {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 32px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .book {
    width: 100%;
    max-width: 640px;
    flex: 0 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.5),
      inset -8px 0 16px rgba(0, 0, 0, 0.08);
    border-radius: 4px 12px 12px 4px;
    border-left: 6px solid #5a4b3c;
  }

  .page {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    background: #e8dcc4 url('/assets/images/parchment.png') center/cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 40px 48px;
    border: 1px solid #5a4b3c;
    border-radius: 4px 12px 12px 4px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.05rem;
    line-height: 1.7;
    box-shadow: inset 0 0 40px rgba(90, 75, 60, 0.15);
  }

  /* Chrome 121+ prefers scrollbar-* over ::-webkit-*, which brings OS arrows back */
  @supports not selector(::-webkit-scrollbar) {
    .page {
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .page::-webkit-scrollbar {
    width: 6px;
  }

  .page::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .page::-webkit-scrollbar-track {
    background: transparent;
  }

  .page::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.45);
    border-radius: 3px;
  }

  .page::-webkit-scrollbar-thumb:hover {
    background: rgba(90, 75, 60, 0.65);
  }

  .narration {
    margin: 0 0 1.25em;
  }

  .attribute-check {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em;
    margin: 0 0 1.25em;
    padding: 1em 0;
    border-top: 1px solid rgba(90, 75, 60, 0.35);
    border-bottom: 1px solid rgba(90, 75, 60, 0.35);
    text-align: center;
  }

  .check-label {
    margin: 0;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #4a3f32;
  }

  .check-roll {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0.15em 0;
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }

  .d20 {
    width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
    background: #3d3429;
    color: #e8dcc4;
  }

  .d20-face {
    font-size: 1.15rem;
    font-weight: bold;
    line-height: 1;
    transform: translateY(-0.12em);
  }

  .vs {
    color: #4a3f32;
  }

  .check-outcome {
    margin: 0;
    font-size: 1.05rem;
    font-weight: bold;
  }

  .attribute-check.success .check-outcome {
    color: #2d5a27;
  }

  .attribute-check.failure .check-outcome {
    color: #7a2e22;
  }

  .attribute-check.critical .check-outcome {
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .prompt {
    margin: 0.75em 0 0;
    font-style: italic;
    color: #4a3f32;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    flex-shrink: 0;
    width: 100%;
    max-width: 640px;
    margin-top: auto;
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
</style>
