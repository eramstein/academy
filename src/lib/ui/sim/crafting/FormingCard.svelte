<script lang="ts">
  import { CardColor, type Ability, type UnitKeywords } from '@/lib/_model';
  import { CARD_HEIGHT, CARD_WIDTH } from '@/lib/_config/ui-config';
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

  const parchment = getAssetPath('images/ui/backgrounds/parchment.png');
  const contour = getAssetPath('images/ui/decorations/gold-contour.png');
  const corner = getAssetPath('images/ui/decorations/corner.png');
  const star = getAssetPath('images/ui/icons/star.png');
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
    40}px; --parchment: url('{parchment}'); --contour: url('{contour}'); --corner: url('{corner}'); --star: url('{star}'); --left-margin: 12px; --power-icon: url('{powerIcon}'); --health-icon: url('{healthIcon}'); --armor-icon: url('{armorIcon}'); --retaliate-icon: url('{retaliateIcon}')"
>
  <span class="filigree" aria-hidden="true">
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
  </span>
  <!-- Charm flight landing spots (always present so ingredients can fly in before content appears). -->
  <span class="land pigment" data-charm-land="pigment" aria-hidden="true"></span>
  <span class="land essence" data-charm-land="essence" aria-hidden="true"></span>
  <span class="land rune" data-charm-land="rune" aria-hidden="true"></span>

  <div class="name">
    <span class="fog-name" aria-hidden="true"></span>
  </div>

  <div class="mana-bar">
    <div class="mana-line"></div>
    {#if colors.length}
      <div class="mana-content">
        <div class="mana-spacer"></div>
        <div class="mana-colors">
          {#each colors as color (color)}
            <div
              class="color-pip emerge"
              style="background-image: url('{colorPath(color)}')"
            ></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="content">
    <div class="summon-mist" aria-hidden="true"></div>
    <div class="compass" class:quiet={hasStats || hasKeywords || hasAbilities || !!spellText} aria-hidden="true"></div>

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
    --corner-size: 22px;
    width: var(--card-width);
    height: var(--card-height);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 10px 8px 8px;
    border-radius: 4px;
    border: 2px solid #c6a15a;
    background: #121820;
    box-shadow:
      0 0 0 1px #5a3e1b,
      inset 0 0 0 1px rgba(198, 161, 90, 0.45),
      0 0 22px rgba(191, 161, 74, 0.38),
      0 14px 22px rgba(0, 0, 0, 0.5);
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    position: relative;
    z-index: 1;
  }

  .filigree {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
  }

  .corner {
    position: absolute;
    width: var(--corner-size);
    height: var(--corner-size);
    background: var(--corner) center / 100% 100% no-repeat;
  }

  .corner.tl {
    top: 0;
    left: 0;
  }

  .corner.tr {
    top: 0;
    right: 0;
    transform: rotate(90deg);
  }

  .corner.bl {
    bottom: 0;
    left: 0;
    transform: rotate(270deg);
  }

  .corner.br {
    bottom: 0;
    right: 0;
    transform: rotate(180deg);
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

  .name {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-height: 26px;
    margin: 0 6px;
    padding: 5px 10px 4px;
    border-radius: 2px 2px 0 0;
    border: 1px solid #8a6a32;
    border-bottom: 2px solid #2c251d;
    background: #e8dcc4 var(--parchment) center / cover;
    background-blend-mode: multiply;
    box-shadow: inset 0 1px 2px rgba(255, 248, 230, 0.45);
    position: relative;
    z-index: 1;
  }

  .fog-name {
    width: 68%;
    height: 0.72rem;
    border-radius: 2px;
    background: rgba(44, 37, 29, 0.16);
    filter: blur(0.4px);
  }

  .mana-bar {
    position: relative;
    height: 0;
    z-index: 2;
  }

  .mana-line {
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #2c251d;
  }

  .mana-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    padding: 0 8px;
    box-sizing: border-box;
  }

  .mana-spacer {
    flex: 1;
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
    background: #141c28;
    box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.55);
  }

  .compass {
    position: absolute;
    left: 50%;
    top: 46%;
    width: 64%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    background:
      var(--star) center / 22% no-repeat,
      var(--contour) center / contain no-repeat;
    opacity: 0.32;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .compass.quiet {
    opacity: 0.16;
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
    background: var(--power-icon) center / contain no-repeat rgba(19, 16, 16, 0.8);
  }

  .retaliate {
    background: var(--retaliate-icon) center / contain no-repeat;
    border: none;
    box-shadow: none;
    width: 28px;
    height: 26px;
    transform: translateX(-3px);
  }

  .health {
    background:
      var(--health-icon) center / contain no-repeat,
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
