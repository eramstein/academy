<script lang="ts">
  import { CardColor, type Action, type UnitKeywords } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { performAction, type CardCreationParameters } from '@/lib/sim/actions';
  import { KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const STAT_MAX = 20;

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

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDone();
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

  function adjustFromClick(event: MouseEvent, apply: (delta: number) => void) {
    if (event.type === 'contextmenu') event.preventDefault();
    apply(event.type === 'contextmenu' ? -1 : 1);
  }

  function adjustKeyword(key: keyof UnitKeywords, delta: number) {
    setKeyword(key, clamp((keywords[key] ?? 0) + delta, 0, STAT_MAX));
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

<div class="overlay" role="presentation">
  <div class="panel" role="dialog" aria-labelledby="invoke-title">
    <h2 id="invoke-title" class="title">Invoke a unit</h2>

    <div class="colors" role="group" aria-label="Colors">
      {#each availableColors as color (color)}
        {@const selected = colors.includes(color)}
        <button
          type="button"
          class="color-btn"
          class:selected
          aria-pressed={selected}
          onclick={() => toggleColor(color)}
        >
          <span class="color-dot" style="background-image: url('{colorPath(color)}')"></span>
          {capitalize(color)}
        </button>
      {/each}
    </div>

    <div class="fields">
      <button
        type="button"
        class="keyword-btn"
        onclick={(event) =>
          adjustFromClick(event, (delta) => (power = clamp(power + delta, 0, STAT_MAX)))}
        oncontextmenu={(event) =>
          adjustFromClick(event, (delta) => (power = clamp(power + delta, 0, STAT_MAX)))}
      >
        <img class="icon" src={getAssetPath('images/power-icon.png')} alt="" aria-hidden="true" />
        Attack
      </button>
      <input
        type="number"
        min="0"
        max={STAT_MAX}
        bind:value={power}
        aria-label="Attack"
        oninput={(event) => onNumberInput(event, 0, (value) => (power = value))}
        onblur={() => (power = clamp(power, 0, STAT_MAX))}
      />
      <button
        type="button"
        class="keyword-btn"
        onclick={(event) =>
          adjustFromClick(event, (delta) => (hp = clamp(hp + delta, 1, STAT_MAX)))}
        oncontextmenu={(event) =>
          adjustFromClick(event, (delta) => (hp = clamp(hp + delta, 1, STAT_MAX)))}
      >
        <img class="icon" src={getAssetPath('images/health-icon.png')} alt="" aria-hidden="true" />
        Health
      </button>
      <input
        type="number"
        min="1"
        max={STAT_MAX}
        bind:value={hp}
        aria-label="Health"
        oninput={(event) => onNumberInput(event, 1, (value) => (hp = value))}
        onblur={() => (hp = clamp(hp, 1, STAT_MAX))}
      />
      <button
        type="button"
        class="keyword-btn"
        class:on={retaliate > 0}
        title={getKeywordTooltip('retaliate', retaliate || 1)}
        onclick={(event) =>
          adjustFromClick(event, (delta) => (retaliate = clamp(retaliate + delta, 0, STAT_MAX)))}
        oncontextmenu={(event) =>
          adjustFromClick(event, (delta) => (retaliate = clamp(retaliate + delta, 0, STAT_MAX)))}
      >
        <img class="icon" src={getAssetPath('images/retaliate-icon.png')} alt="" aria-hidden="true" />
        Retaliate
      </button>
      <input
        type="number"
        min="0"
        max={STAT_MAX}
        bind:value={retaliate}
        aria-label="Retaliate"
        oninput={(event) => onNumberInput(event, 0, (value) => (retaliate = value))}
        onblur={() => (retaliate = clamp(retaliate, 0, STAT_MAX))}
      />

      <div class="fields-gap"></div>

      {#each availableKeywords as key (key)}
        {#if NUMERIC_KEYWORDS.has(key)}
          {@const value = keywords[key] ?? 0}
          <button
            type="button"
            class="keyword-btn"
            class:on={value > 0}
            title={getKeywordTooltip(key, value || 1)}
            onclick={(event) => adjustFromClick(event, (delta) => adjustKeyword(key, delta))}
            oncontextmenu={(event) => adjustFromClick(event, (delta) => adjustKeyword(key, delta))}
          >
            <img
              class="icon"
              src={getAssetPath(`images/keywords/${key}.png`)}
              alt=""
              aria-hidden="true"
            />
            {formatKeyword(key)}
          </button>
          <input
            type="number"
            min="0"
            max={STAT_MAX}
            {value}
            aria-label={formatKeyword(key)}
            oninput={(event) => onNumberInput(event, 0, (next) => setKeyword(key, next))}
            onblur={(event) =>
              setKeyword(key, clamp(Number.parseInt(event.currentTarget.value, 10), 0, STAT_MAX))}
          />
        {:else}
          {@const selected = !!keywords[key]}
          <button
            type="button"
            class="keyword-btn"
            class:on={selected}
            title={getKeywordTooltip(key)}
            aria-pressed={selected}
            onclick={() => toggleKeyword(key)}
            oncontextmenu={(event) => {
              event.preventDefault();
              setKeyword(key, 0);
            }}
          >
            <img
              class="icon"
              src={getAssetPath(`images/keywords/${key}.png`)}
              alt=""
              aria-hidden="true"
            />
            {formatKeyword(key)}
          </button>
        {/if}
      {/each}
    </div>

    <footer class="actions">
      <button type="button" class="action-btn cancel" onclick={onDone}>Cancel</button>
      <button type="button" class="action-btn confirm" onclick={confirm}>Invoke</button>
    </footer>
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

  .panel {
    width: min(380px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: #2c251d;
    border: 1px solid #5a4b3c;
    border-radius: 6px;
    color: #e8dcc4;
    padding: 16px 18px 12px;
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
  }

  .title {
    margin: 0 0 14px;
    font-size: 1.15rem;
    font-weight: 600;
    color: #f0e6c8;
    text-align: center;
  }

  .colors {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-bottom: 14px;
  }

  .color-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    cursor: pointer;
  }

  .color-btn:hover {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .color-btn.selected {
    border-color: var(--color-golden);
    color: #f0e6c8;
  }

  .color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }

  .fields {
    display: inline-grid;
    grid-template-columns: 1fr 3rem;
    justify-content: start;
    align-items: center;
    column-gap: 8px;
    row-gap: 6px;
    margin-bottom: 14px;
  }

  .fields-gap {
    grid-column: 1 / -1;
    height: 8px;
  }

  .fields input {
    grid-column: 2;
    width: 3rem;
    height: 32px;
    padding: 0 4px;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: none;
    box-sizing: border-box;
    -moz-appearance: textfield;
  }

  .fields input:focus {
    border-color: #7a6b5c;
  }

  .fields input::-webkit-inner-spin-button,
  .fields input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .keyword-btn {
    grid-column: 1;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 100%;
    padding: 4px 10px;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    text-transform: capitalize;
    text-align: left;
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
  }

  .keyword-btn:hover {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .keyword-btn.on {
    border-color: var(--color-golden);
  }

  .icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 4px;
  }

  .action-btn {
    font-family: inherit;
    font-size: 1rem;
    color: #e8dcc4;
    background: #3d3429;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    padding: 8px 20px;
    cursor: pointer;
  }

  .action-btn:hover:not(:disabled) {
    background: #4a3f32;
    border-color: #7a6b5c;
  }

  .action-btn.confirm {
    color: #f0e6c8;
    border-color: var(--color-golden);
  }

  .action-btn.cancel {
    color: #a89880;
    background: transparent;
  }

  .action-btn.cancel:hover {
    color: #e8dcc4;
    background: #3d3429;
  }
</style>
