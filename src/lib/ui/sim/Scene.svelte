<script lang="ts">
  import { performAction } from '@/lib/sim/actions';
  import { gs } from '@/lib/_state/main.svelte';

  const narration = $derived(gs.scene.narration);
  const actions = $derived(gs.scene.actions);
</script>

<div class="scene">
  <article class="book">
    <div class="page">
      {#each narration as paragraph, index (index)}
        <p class="narration">{paragraph}</p>
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
    overflow: auto;
  }

  .book {
    width: 100%;
    max-width: 640px;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.5),
      inset -8px 0 16px rgba(0, 0, 0, 0.08);
    border-radius: 4px 12px 12px 4px;
    border-left: 6px solid #5a4b3c;
  }

  .page {
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

  .narration {
    margin: 0 0 1.25em;
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
