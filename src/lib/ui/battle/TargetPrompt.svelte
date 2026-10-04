<script lang="ts">
  import { uiState } from '@lib/_state';
  import { getAssetPath } from '@lib/_utils/asset-paths';
  import { DataEffectTemplates } from '@lib/battle/effects/effect-templates';
  import OrnateButton from '@lib/ui/OrnateButton.svelte';
  import { finishTargetSelection } from '@lib/ui/_helpers/targetting';

  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');

  let targetPrompt = $derived(() => {
    const battle = uiState.battle;
    if (!battle.targetBeingSelected) return null;

    const targetText = `${battle.targetBeingSelected.count || ''} ${battle.targetBeingSelected.type}`;

    // Get count of currently selected targets for the current effect and target index
    const currentEffectIndex = battle.currentEffectIndex || 0;
    const currentTargetIndex = battle.currentTargetIndex || 0;
    const selectedCount =
      battle.selectedTargets[currentEffectIndex]?.[currentTargetIndex]?.length || 0;
    const requiredCount = battle.targetBeingSelected.count || 1;

    // Only show count if more than 1 target is required
    const countText = requiredCount > 1 ? ` (${selectedCount}/${requiredCount})` : '';

    // Get the effect text for the current effect
    let effectText = '';
    if (battle.abilityPending) {
      const currentEffect = battle.abilityPending.ability.actions[currentEffectIndex];
      if (currentEffect) {
        effectText = DataEffectTemplates[currentEffect.effect.name](
          currentEffect.effect.args
        ).label(currentEffect.targets || []);
      }
    } else if (battle.spellPending) {
      const currentEffect = battle.spellPending.actions[currentEffectIndex];
      if (currentEffect) {
        effectText = DataEffectTemplates[currentEffect.effect.name](
          currentEffect.effect.args
        ).label(currentEffect.targets || []);
      }
    } else if (battle.triggeredAbilityPending) {
      const currentEffect = battle.triggeredAbilityPending.ability.actions[currentEffectIndex];
      if (currentEffect) {
        effectText = DataEffectTemplates[currentEffect.effect.name](
          currentEffect.effect.args
        ).label(currentEffect.targets || []);
      }
    }

    return {
      text: `Select ${targetText}${countText}`,
      effectText,
      showDone: requiredCount > 1,
      isVisible: true,
    };
  });
</script>

{#if targetPrompt()?.isVisible}
  <div class="target-prompt" style="--parchment: url('{parchmentPath}')">
    <div class="panel">
      <div class="target-text">{targetPrompt()?.text}</div>
      {#if targetPrompt()?.effectText}
        <div class="effect-text">{targetPrompt()?.effectText}</div>
      {/if}
    </div>
    {#if targetPrompt()?.showDone}
      <div class="actions">
        <OrnateButton onclick={finishTargetSelection}>Done</OrnateButton>
      </div>
    {/if}
  </div>
{/if}

<style>
  .target-prompt {
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 220px;
    max-width: min(360px, calc(100vw - 32px));
    text-align: center;
  }

  .panel {
    width: 100%;
    padding: 12px 18px 14px;
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: var(--color-ink);
    font-family: var(--font-narrative);
    border-radius: 3px;
    border: 1px solid var(--color-brown-border);
    box-sizing: border-box;
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.35),
      inset 0 0 24px rgba(90, 75, 60, 0.12),
      inset 0 0 60px color-mix(in srgb, var(--color-golden) 12%, transparent);
  }

  .target-text {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--color-ink);
    line-height: 1.3;
  }

  .effect-text {
    margin-top: 6px;
    font-size: 0.9rem;
    font-weight: normal;
    color: var(--color-ink-muted);
    line-height: 1.4;
    word-wrap: break-word;
  }

  .actions {
    display: flex;
    justify-content: center;
  }
</style>
