<script lang="ts">
  import { CardColor, type Action, type UnitKeywords } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { performAction, type CardCreationParameters } from '@/lib/sim/actions';
  import { KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';

  let {
    action,
    onDone,
    onBack,
  }: {
    action: Action;
    onDone: () => void;
    onBack?: () => void;
  } = $props();

  const STAT_MAX = 20;
  const woodPath = getAssetPath('images/wood_chip_base.png');
  const tablePath = getAssetPath('images/table.jpg');
  const parchmentPath = getAssetPath('images/parchment.png');

  function resolveAvailableColors(): CardColor[] {
    const known = Object.values(CardColor).filter(
      (color) => !!gs.player.craftingKnowledge.colors?.[color]
    );
    return known.length ? known : Object.values(CardColor);
  }

  const startingColors = resolveAvailableColors();
  let colors = $state<CardColor[]>(startingColors.length === 1 ? [startingColors[0]] : []);
  let power = $state(1);
  let hp = $state(1);
  let retaliate = $state(0);
  let keywords = $state<Partial<Record<keyof UnitKeywords, number>>>({});

  function cancel() {
    (onBack ?? onDone)();
  }

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') cancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const availableColors = $derived(resolveAvailableColors());

  const knownKeywords = $derived(
    KEYWORD_KEYS.filter((key) => !!gs.player.craftingKnowledge.keywords?.[key])
  );
  const availableKeywords = $derived(knownKeywords.length ? knownKeywords : KEYWORD_KEYS);

  const parameters = $derived.by((): CardCreationParameters => {
    const selectedKeywords = toUnitKeywords(keywords);
    return {
      colors: colors.length ? colors : undefined,
      power,
      hp,
      retaliate,
      keywords: selectedKeywords,
      resources: Array.isArray(action.actionParameters.resources)
        ? action.actionParameters.resources
        : [],
    };
  });

  function toUnitKeywords(
    selected: Partial<Record<keyof UnitKeywords, number>>
  ): UnitKeywords | undefined {
    const result: UnitKeywords = {};
    for (const key of KEYWORD_KEYS) {
      const value = selected[key];
      if (!value) continue;
      if (NUMERIC_KEYWORDS.has(key)) {
        (result[key] as number) = value;
      } else {
        (result[key] as boolean) = true;
      }
    }
    return Object.keys(result).length ? result : undefined;
  }

  function formatKeyword(keyword: string): string {
    return keyword.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/color_${color}.png`);
  }

  function clamp(value: number | undefined, min: number, max: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function toggleColor(color: CardColor) {
    if (colors.includes(color)) {
      colors = colors.filter((entry) => entry !== color);
    } else {
      colors = [...colors, color];
    }
  }

  function setKeyword(key: keyof UnitKeywords, value: number) {
    const next = { ...keywords };
    if (value) {
      next[key] = value;
    } else {
      delete next[key];
    }
    keywords = next;
  }

  function toggleKeyword(key: keyof UnitKeywords) {
    const next = { ...keywords };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 1;
    }
    keywords = next;
  }

  function adjustKeyword(key: keyof UnitKeywords, delta: number) {
    setKeyword(key, clamp((keywords[key] ?? 0) + delta, 0, STAT_MAX));
  }

  function adjustFromClick(event: MouseEvent, apply: (delta: number) => void) {
    if (event.type === 'contextmenu') event.preventDefault();
    apply(event.type === 'contextmenu' ? -1 : 1);
  }

  function onKeywordRowClick(event: MouseEvent, key: keyof UnitKeywords, numeric: boolean) {
    if (numeric) {
      adjustFromClick(event, (delta) => adjustKeyword(key, delta));
    } else if (event.type === 'contextmenu') {
      event.preventDefault();
      setKeyword(key, 0);
    } else {
      toggleKeyword(key);
    }
  }

  function onNumberInput(event: Event, min: number, apply: (value: number) => void) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    if (raw === '') return;
    apply(clamp(Number.parseInt(raw, 10), min, STAT_MAX));
  }

  function confirm() {
    power = clamp(power, 0, STAT_MAX);
    hp = clamp(hp, 1, STAT_MAX);
    retaliate = clamp(retaliate, 0, STAT_MAX);
    performAction({
      ...action,
      actionParameters: {
        ...action.actionParameters,
        ...parameters,
      },
      missingParameters: {},
    });
    onDone();
  }
</script>

{#snippet stepper(value: number, min: number, label: string, apply: (next: number) => void)}
  <div
    class="num-control"
    onclick={(event) => event.stopPropagation()}
    oncontextmenu={(event) => event.stopPropagation()}
  >
    <input
      type="number"
      {min}
      max={STAT_MAX}
      {value}
      aria-label={label}
      oninput={(event) => onNumberInput(event, min, apply)}
      onblur={() => apply(clamp(value, min, STAT_MAX))}
    />
    <div class="step-arrows">
      <button
        type="button"
        class="step-arrow"
        disabled={value >= STAT_MAX}
        aria-label="Increase {label}"
        onclick={() => apply(clamp(value + 1, min, STAT_MAX))}
      >
        ▲
      </button>
      <button
        type="button"
        class="step-arrow"
        disabled={value <= min}
        aria-label="Decrease {label}"
        onclick={() => apply(clamp(value - 1, min, STAT_MAX))}
      >
        ▼
      </button>
    </div>
  </div>
{/snippet}

{#snippet statControl(
  value: number,
  min: number,
  label: string,
  apply: (next: number) => void,
  icon: string,
  large = false
)}
  <div class="stat-control">
    <div
      class="stat-well"
      class:large
      role="spinbutton"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={STAT_MAX}
      aria-valuenow={value}
      onclick={(event) =>
        adjustFromClick(event, (delta) => apply(clamp(value + delta, min, STAT_MAX)))}
      oncontextmenu={(event) =>
        adjustFromClick(event, (delta) => apply(clamp(value + delta, min, STAT_MAX)))}
    >
      <img class="stat-face" src={icon} alt="" aria-hidden="true" />
      <span class="stat-value">{value}</span>
    </div>
    <div class="step-arrows">
      <button
        type="button"
        class="step-arrow"
        disabled={value >= STAT_MAX}
        aria-label="Increase {label}"
        onclick={() => apply(clamp(value + 1, min, STAT_MAX))}
      >
        ▲
      </button>
      <button
        type="button"
        class="step-arrow"
        disabled={value <= min}
        aria-label="Decrease {label}"
        onclick={() => apply(clamp(value - 1, min, STAT_MAX))}
      >
        ▼
      </button>
    </div>
  </div>
{/snippet}

<div class="overlay" role="presentation">
  <div
    class="frame"
    role="dialog"
    aria-labelledby="invoke-title"
    style="--wood: url('{woodPath}'); --table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="invoke-title" class="title">
        <span class="star" aria-hidden="true"></span>
        Create New Card
        <span class="star" aria-hidden="true"></span>
      </h2>

      <section class="section" aria-label="Colors">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Colors
        </h3>
        <div class="colors" role="group">
          {#each availableColors as color (color)}
            {@const selected = colors.includes(color)}
            <button
              type="button"
              class="color-btn"
              class:selected
              aria-pressed={selected}
              aria-label={capitalize(color)}
              onclick={() => toggleColor(color)}
            >
              <span class="color-orb-wrap">
                <span class="color-orb" style="background-image: url('{colorPath(color)}')"></span>
                {#if selected}
                  <span class="check" aria-hidden="true">✓</span>
                {/if}
              </span>
            </button>
          {/each}
        </div>
      </section>

      <section class="section" aria-label="Stats">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Stats
        </h3>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Power</div>
            {@render statControl(
              power,
              0,
              'Power',
              (next) => (power = next),
              getAssetPath('images/power-icon.png')
            )}
          </div>
          <div class="stat">
            <div class="stat-label">Health</div>
            {@render statControl(
              hp,
              1,
              'Health',
              (next) => (hp = next),
              getAssetPath('images/health-icon.png')
            )}
          </div>
          <div class="stat large">
            <div class="stat-label" title={getKeywordTooltip('retaliate', retaliate || 1)}>
              Retaliate
            </div>
            {@render statControl(
              retaliate,
              0,
              'Retaliate',
              (next) => (retaliate = next),
              getAssetPath('images/retaliate-icon.png'),
              true
            )}
          </div>
        </div>
      </section>

      <section class="section keywords-section" aria-label="Keywords">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Keywords
        </h3>
        <div class="keyword-list">
          {#each availableKeywords as key (key)}
            {#if NUMERIC_KEYWORDS.has(key)}
              {@const value = keywords[key] ?? 0}
              <div
                class="keyword-row"
                class:on={value > 0}
                title={getKeywordTooltip(key, value || 1)}
                onclick={(event) => onKeywordRowClick(event, key, true)}
                oncontextmenu={(event) => onKeywordRowClick(event, key, true)}
              >
                <img
                  class="keyword-icon"
                  src={getAssetPath(`images/keywords/${key}.png`)}
                  alt=""
                  aria-hidden="true"
                />
                <span class="keyword-name">{formatKeyword(key)}</span>
                {@render stepper(value, 0, formatKeyword(key), (next) => setKeyword(key, next))}
              </div>
            {:else}
              {@const selected = !!keywords[key]}
              <div
                class="keyword-row"
                class:on={selected}
                role="switch"
                aria-checked={selected}
                title={getKeywordTooltip(key)}
                onclick={(event) => onKeywordRowClick(event, key, false)}
                oncontextmenu={(event) => onKeywordRowClick(event, key, false)}
              >
                <img
                  class="keyword-icon"
                  src={getAssetPath(`images/keywords/${key}.png`)}
                  alt=""
                  aria-hidden="true"
                />
                <span class="keyword-name">{formatKeyword(key)}</span>
                <span class="toggle" class:on={selected} aria-hidden="true">
                  <span class="toggle-knob"></span>
                </span>
              </div>
            {/if}
          {/each}
        </div>
      </section>

      <footer class="actions">
        <button type="button" class="action-btn cancel" onclick={cancel}>
          {onBack ? 'Back' : 'Cancel'}
        </button>
        <button type="button" class="action-btn confirm" onclick={confirm}>Invoke</button>
      </footer>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.72);
    box-sizing: border-box;
  }

  .frame {
    position: relative;
    width: min(620px, 100%);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: #4a2a18 var(--table) center / cover;
    border: 2px solid #2a1810;
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
  }

  .panel {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: #e8dcc4 var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 16px 16px 12px;
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    box-shadow: inset 0 0 28px rgba(90, 75, 60, 0.12);
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 0 10px;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #2c251d;
    text-align: center;
  }

  .star,
  .star-icon {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    background: #4a3f32;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .section {
    padding: 10px 12px 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(44, 37, 29, 0.45);
    border-radius: 4px;
    background: rgba(255, 248, 230, 0.18);
    box-sizing: border-box;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #3a3228;
  }

  .star-icon {
    width: 12px;
    height: 12px;
  }

  .colors {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
  }

  .color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    color: #2c251d;
    background: transparent;
    border: none;
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .color-orb-wrap {
    position: relative;
    display: block;
  }

  .color-orb {
    display: block;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 3px solid #7a6b5c;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.35),
      inset 0 -2px 4px rgba(0, 0, 0, 0.45),
      0 2px 6px rgba(0, 0, 0, 0.35);
    filter: brightness(0.72) saturate(0.85);
  }

  .color-btn:hover .color-orb,
  .color-btn.selected .color-orb {
    filter: none;
  }

  .color-btn.selected .color-orb {
    border-color: var(--color-golden);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      0 0 0 1px #8a6a28,
      0 3px 8px rgba(0, 0, 0, 0.35);
  }

  .check {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-golden);
    color: #2c251d;
    border: 1px solid #8a6a28;
    border-radius: 50%;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .stat {
    display: grid;
    grid-template-columns: max-content;
    justify-content: center;
    justify-items: start;
    gap: 8px;
    padding: 0 10px;
  }

  .stat + .stat {
    border-left: 1px solid rgba(90, 75, 60, 0.35);
  }

  .stat-label {
    width: 40px;
    font-size: 0.92rem;
    color: #2c251d;
    text-align: center;
    white-space: nowrap;
  }

  .stat-control {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 50px;
  }

  .stat-control .step-arrows {
    height: 40px;
    align-self: center;
  }

  .stat-well {
    position: relative;
    width: 40px;
    height: 40px;
    cursor: pointer;
    user-select: none;
  }

  .stat-well.large {
    width: 55px;
    height: 55px;
  }

  .stat.large .stat-label {
    width: 50px;
  }

  .stat-face {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
  }

  .stat-value {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 500;
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
    text-shadow:
      0 1px 2px #000,
      0 0 3px #000;
    pointer-events: none;
  }

  .stat-well .stat-value {
    transform: translateY(-2px);
  }

  .num-control {
    display: flex;
    align-items: stretch;
    gap: 4px;
  }

  .num-control input {
    width: 2.6rem;
    height: 34px;
    padding: 0 4px;
    color: #f0e6c8;
    background: #2c251d;
    border: 1px solid #3a3228;
    border-radius: 3px;
    font-family: inherit;
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: none;
    box-sizing: border-box;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
    -moz-appearance: textfield;
  }

  .num-control input:focus {
    border-color: var(--color-golden);
  }

  .num-control input::-webkit-inner-spin-button,
  .num-control input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .step-arrows {
    display: flex;
    flex-direction: column;
    width: 18px;
    border-radius: 3px;
    overflow: hidden;
    background: #d8c9ad;
    border: 1px solid rgba(90, 75, 60, 0.35);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }

  .step-arrow {
    flex: 1;
    padding: 0;
    color: #3a3228;
    background: transparent;
    border: none;
    font-size: 0.5rem;
    line-height: 1;
    cursor: pointer;
  }

  .step-arrow + .step-arrow {
    border-top: 1px solid rgba(90, 75, 60, 0.25);
  }

  .step-arrow:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.28);
  }

  .step-arrow:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .keywords-section {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }

  .keyword-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 28px;
    min-height: 0;
    overflow-y: auto;
    padding-right: 2px;
  }

  @supports not selector(::-webkit-scrollbar) {
    .keyword-list {
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .keyword-list::-webkit-scrollbar {
    width: 6px;
  }

  .keyword-list::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .keyword-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .keyword-list::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.45);
    border-radius: 3px;
  }

  .keyword-row {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    cursor: pointer;
    user-select: none;
  }

  .keyword-icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
    flex-shrink: 0;
    background: #f3ead4;
    border: 1px solid rgba(90, 75, 60, 0.35);
    border-radius: 4px;
  }

  .keyword-name {
    flex: 1 1 auto;
    min-width: 0;
    padding: 4px 8px;
    font-size: calc(0.78rem + 2px);
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #efe4c8;
    border: 1px solid rgba(90, 75, 60, 0.28);
    border-radius: 6px;
  }

  .keyword-row .num-control input {
    width: 2rem;
    height: 26px;
    font-size: 0.85rem;
  }

  .keyword-row .step-arrows {
    width: 14px;
  }

  .toggle {
    position: relative;
    width: 34px;
    height: 18px;
    flex-shrink: 0;
    background: #d8c9ad;
    border: 1px solid rgba(90, 75, 60, 0.35);
    border-radius: 999px;
    pointer-events: none;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  .toggle.on {
    background: #5d8a46;
    border-color: #4a6f38;
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 14px;
    background: #f5eedf;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    transition: transform 0.15s ease;
  }

  .toggle.on .toggle-knob {
    transform: translateX(16px);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 14px;
  }

  .action-btn {
    min-width: 7.5rem;
    font-family: inherit;
    font-size: 1rem;
    color: #f0e6c8;
    background: #3a221f var(--wood) center / cover;
    border: 1px solid #2a110a;
    border-radius: 4px;
    padding: 8px 20px;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .action-btn:hover:not(:disabled) {
    filter: brightness(1.12);
  }

  .action-btn.confirm {
    color: #f0e6c8;
    border: 2px solid #000;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .action-btn.cancel {
    color: #ececec;
    background: #6e6e6e;
    border: 1px solid #4a4a4a;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 2px 4px rgba(0, 0, 0, 0.25);
  }
</style>
