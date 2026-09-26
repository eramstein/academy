<script lang="ts">
  import { CARD_HEIGHT, CARD_WIDTH } from '@/lib/_config/ui-config';
  import { CardColor, type Ability, type UnitKeywords } from '@/lib/_model';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import Abilities from '@/lib/ui/battle/Abilities.svelte';
  import Keywords from '@/lib/ui/battle/Keywords.svelte';

  let {
    colors,
    power,
    health,
    retaliate,
    keywords,
    abilities = [],
    spellText = null,
  }: {
    colors: CardColor[];
    power: number | null;
    health: number | null;
    retaliate: number | null;
    keywords: UnitKeywords;
    abilities?: Ability[];
    spellText?: string | null;
  } = $props();

  const formingBg = getAssetPath('images/ui/backgrounds/card-forming.png');
  const powerIcon = getAssetPath('images/ui/icons/power-icon.png');
  const healthIcon = getAssetPath('images/ui/icons/health-icon.png');
  const armorIcon = getAssetPath('images/ui/icons/armor-icon.png');
  const retaliateIcon = getAssetPath('images/ui/icons/retaliate-icon.png');

  const armor = $derived(typeof keywords.armor === 'number' ? keywords.armor : 0);
  const hasKeywords = $derived(Object.keys(keywords).length > 0);
  const hasStats = $derived(power !== null || health !== null || retaliate !== null);
  const hasAbilities = $derived(abilities.length > 0);

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }
</script>

<div
  class="forming-card"
  style="--card-width: {CARD_WIDTH}px; --card-height: {CARD_HEIGHT +
    70}px; --forming-bg: url('{formingBg}'); --left-margin: 12px; --power-icon: url('{powerIcon}'); --health-icon: url('{healthIcon}'); --armor-icon: url('{armorIcon}'); --retaliate-icon: url('{retaliateIcon}')"
>
  <!-- Charm flight landing spots (always present so ingredients can fly in before content appears). -->
  <span class="land pigment" data-charm-land="pigment" aria-hidden="true"></span>
  <span class="land essence" data-charm-land="essence" aria-hidden="true"></span>
  <span class="land rune" data-charm-land="rune" aria-hidden="true"></span>

  {#if colors.length}
    <div class="mana-bar">
      <div class="mana-colors">
        {#each colors as color (color)}
          <div class="color-pip emerge" style="background-image: url('{colorPath(color)}')"></div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="content">
    <div class="summon-mist" aria-hidden="true"></div>

    {#if hasAbilities || hasStats || hasKeywords}
      <div class="bottom-section">
        {#if hasAbilities}
          <div class="abilities-container emerge">
            <Abilities {abilities} />
          </div>
        {/if}

        {#if hasStats}
          <div class="stats-container emerge">
            <div class="stats">
              {#if power !== null}
                <div class="stat power">{power}</div>
              {/if}
              {#if retaliate !== null}
                <div class="stat retaliate">{retaliate}</div>
              {/if}
              {#if health !== null}
                <div class="stat health" class:armor-bg={armor > 0}>{health}</div>
              {/if}
            </div>
          </div>
        {/if}

        {#if hasKeywords}
          <div class="keywords-container emerge">
            <Keywords {keywords} />
          </div>
        {/if}
      </div>
    {/if}

    {#if spellText}
      <div class="spell-effect emerge">{spellText}</div>
    {/if}
  </div>
</div>

<style>
  .forming-card {
    width: var(--card-width);
    height: var(--card-height);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 18px 16px 16px;
    border: none;
    background: var(--forming-bg) center / 100% 100% no-repeat;
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    position: relative;
    z-index: 1;
  }

  .land {
    position: absolute;
    width: 8px;
    height: 8px;
    pointer-events: none;
    opacity: 0;
  }

  .land.pigment {
    top: 36px;
    right: 18px;
  }

  .land.essence {
    bottom: 18px;
    left: 16px;
  }

  .land.rune {
    bottom: 18px;
    right: 18px;
  }

  .mana-bar {
    position: absolute;
    top: 22px;
    right: 22px;
    z-index: 2;
  }

  .mana-colors {
    display: flex;
  }

  .color-pip {
    width: 18px;
    height: 18px;
    margin-left: -6px;
    border-radius: 50%;
    border: 1px solid #3a2e24;
    background-size: cover;
    background-position: center;
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.5),
      0 2px 3px rgba(0, 0, 0, 0.6);
  }

  .color-pip:first-child {
    margin-left: 0;
  }

  .content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    margin: 0 4px 2px;
    padding: 8px var(--left-margin);
    overflow: hidden;
    background: transparent;
  }

  .summon-mist {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 42%, rgba(191, 161, 74, 0.28), transparent 62%),
      radial-gradient(ellipse at 30% 72%, rgba(175, 142, 103, 0.2), transparent 55%);
    animation: mist-pulse 2.6s ease-in-out infinite;
    pointer-events: none;
  }

  .bottom-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .stats-container {
    position: absolute;
    bottom: 4px;
    left: 4px;
    z-index: 2;
  }

  /* Match Stats.svelte compact layout (incl. retaliate offset). */
  .stats {
    display: flex;
    flex-direction: column;
    gap: 1px;
    align-items: flex-start;
  }

  .stat {
    color: white;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.75rem;
    line-height: 1;
    text-shadow: 0 1px 2px #000;
    width: 22px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px solid #a8a8a8;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    padding: 2px;
    padding-bottom: 4px;
    box-sizing: border-box;
  }

  .power {
    background: var(--power-icon-decorated) center / contain no-repeat rgba(19, 16, 16, 0.8);
  }

  .retaliate {
    background: var(--retaliate-icon-decorated) center / contain no-repeat;
    border: none;
    box-shadow: none;
    width: 28px;
    height: 26px;
    transform: translateX(-3px);
  }

  .health {
    background:
      var(--health-icon-decorated) center / contain no-repeat,
      rgba(139, 0, 0, 0.8);
  }

  .health.armor-bg {
    background: var(--armor-icon) center / contain no-repeat;
    border: none;
    box-shadow: none;
    width: 23px;
    height: 21px;
  }

  .keywords-container {
    align-self: flex-end;
  }

  .abilities-container {
    display: flex;
    justify-content: flex-end;
  }

  .spell-effect {
    position: relative;
    z-index: 1;
    background: rgba(0, 0, 0, 0.7);
    color: #f0e6c8;
    padding: 6px var(--left-margin) 8px;
    font-size: 0.75rem;
    line-height: 1.2;
    text-align: center;
    border-top: 1px solid var(--color-golden);
    margin-top: auto;
    margin-bottom: -8px;
    margin-left: calc(var(--left-margin) * -1);
    margin-right: calc(var(--left-margin) * -1);
  }

  .emerge {
    animation: emerge 0.35s ease;
  }

  @keyframes emerge {
    from {
      opacity: 0;
      transform: scale(0.82);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes mist-pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .summon-mist,
    .emerge {
      animation: none;
    }
  }
</style>
