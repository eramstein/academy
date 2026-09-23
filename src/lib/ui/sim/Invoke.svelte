<script lang="ts">
  import { CardColor, CardType, type Action, type UnitKeywords } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { performAction, type CardCreationParameters } from '@/lib/sim/actions';
  import {
    buildAbility,
    getTriggerTemplateAsset,
    getTriggerTemplateLabel,
    TRIGGER_TEMPLATE_KEYS,
  } from '@/lib/sim/cards/ability-templates';
  import {
    ACTION_TEMPLATE_KEYS,
    actionNumericParams,
    createActionTemplate,
    defaultActionFactoryArgs,
    getActionTemplateMeta,
    getActionTooltip,
  } from '@/lib/sim/cards/action-templates';
  import { getAbilityCost, getActionBudget, getKeywordBudget } from '@/lib/sim/cards/card-budget';
  import type { PartialConjuredUnit } from '@/lib/sim/cards/creation';
  import { KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';

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
  const CARD_TYPES = [CardType.Unit, CardType.Spell] as const;
  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');

  function resolveAvailableColors(): CardColor[] {
    const known = Object.values(CardColor).filter(
      (color) => !!gs.player.craftingKnowledge.colors?.[color]
    );
    return known.length ? known : Object.values(CardColor);
  }

  const startingColors = resolveAvailableColors();
  let cardType = $state<CardType.Unit | CardType.Spell>(CardType.Unit);
  let colors = $state<CardColor[]>(startingColors.length === 1 ? [startingColors[0]] : []);
  let power = $state(1);
  let hp = $state(1);
  let retaliate = $state(0);
  let keywords = $state<Partial<Record<keyof UnitKeywords, number>>>({});
  let abilityTrigger = $state<string>('onDeploy');
  let abilityAction = $state<string | null>(null);
  let abilityArgs = $state<Record<string, number>>({});
  let spellAction = $state<string | null>(null);
  let spellArgs = $state<Record<string, number>>({});

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
  const knownActions = $derived(
    ACTION_TEMPLATE_KEYS.filter((name) => !!gs.player.craftingKnowledge.actions?.[name])
  );

  const isUnit = $derived(cardType === CardType.Unit);
  const selectedColors = $derived(colors.length ? colors : availableColors);
  const abilityPick = $derived(
    abilityAction
      ? {
          trigger: abilityTrigger,
          action: abilityAction,
          args: Object.keys(abilityArgs).length ? abilityArgs : defaultActionFactoryArgs(abilityAction),
        }
      : undefined
  );
  const draftAbility = $derived(abilityPick ? buildAbility(abilityPick) : null);

  const parameters = $derived.by((): CardCreationParameters => {
    const resources = Array.isArray(action.actionParameters.resources)
      ? action.actionParameters.resources
      : [];
    if (cardType === CardType.Spell) {
      return {
        cardType: CardType.Spell,
        colors: colors.length ? colors : undefined,
        actions: spellAction ? [spellAction] : undefined,
        actionArgs: spellAction
          ? Object.keys(spellArgs).length
            ? spellArgs
            : defaultActionFactoryArgs(spellAction)
          : undefined,
        resources,
      };
    }
    return {
      cardType: CardType.Unit,
      colors: colors.length ? colors : undefined,
      power,
      hp,
      retaliate,
      keywords: toUnitKeywords(keywords),
      ability: abilityPick,
      resources,
    };
  });

  const draftUnit = $derived.by((): PartialConjuredUnit => ({
    type: CardType.Unit,
    colors: selectedColors.map((color) => ({ color, count: 1 })),
    power,
    maxHealth: hp,
    retaliate,
    keywords: toUnitKeywords(keywords) ?? {},
    abilities: draftAbility ? [draftAbility] : undefined,
  }));

  function keywordCost(key: keyof UnitKeywords): number {
    const amount = NUMERIC_KEYWORDS.has(key) ? keywords[key] || 1 : 1;
    return getKeywordBudget(key, draftUnit, amount);
  }

  function abilityCost(): number {
    if (!draftAbility) return 0;
    return getAbilityCost(draftAbility, selectedColors);
  }

  const spellActionCost = $derived.by(() => {
    if (!spellAction) return 0;
    const args = Object.keys(spellArgs).length
      ? spellArgs
      : defaultActionFactoryArgs(spellAction);
    const template = createActionTemplate(spellAction, args);
    return getActionBudget(template.definition, selectedColors);
  });

  function budgetTitle(base: string, cost: number): string {
    return cost ? `${base}\nBudget cost: ${cost}` : base;
  }

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
    return getAssetPath(`images/ui/icons/color_${color}.png`);
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

  function setAbilityTrigger(key: string) {
    abilityTrigger = key;
  }

  function toggleAbilityAction(name: string) {
    if (abilityAction === name) {
      abilityAction = null;
      abilityArgs = {};
      return;
    }
    abilityAction = name;
    abilityArgs = defaultActionFactoryArgs(name);
  }

  function toggleSpellAction(name: string) {
    if (spellAction === name) {
      spellAction = null;
      spellArgs = {};
      return;
    }
    spellAction = name;
    spellArgs = defaultActionFactoryArgs(name);
  }

  function setAbilityArg(key: string, value: number) {
    abilityArgs = { ...abilityArgs, [key]: clamp(value, 1, STAT_MAX) };
  }

  function setSpellArg(key: string, value: number) {
    spellArgs = { ...spellArgs, [key]: clamp(value, 1, STAT_MAX) };
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
    style="--table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="invoke-title" class="title">
        <span class="star" aria-hidden="true"></span>
        Create New Card
        <span class="star" aria-hidden="true"></span>
      </h2>

      <section class="section" aria-label="Card type">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Type
        </h3>
        <div class="type-choices" role="radiogroup" aria-label="Card type">
          {#each CARD_TYPES as type (type)}
            {@const selected = cardType === type}
            <button
              type="button"
              class="type-btn"
              class:selected
              role="radio"
              aria-checked={selected}
              onclick={() => (cardType = type)}
            >
              {capitalize(type)}
            </button>
          {/each}
        </div>
      </section>

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

      {#if isUnit}
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
              getAssetPath('images/ui/icons/power-icon.png')
            )}
          </div>
          <div class="stat">
            <div class="stat-label">Health</div>
            {@render statControl(
              hp,
              1,
              'Health',
              (next) => (hp = next),
              getAssetPath('images/ui/icons/health-icon.png')
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
              getAssetPath('images/ui/icons/retaliate-icon.png'),
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
                title={budgetTitle(getKeywordTooltip(key, value || 1), keywordCost(key))}
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
                title={budgetTitle(getKeywordTooltip(key), keywordCost(key))}
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

      <section class="section abilities-section" aria-label="Ability">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Ability
        </h3>
        {#if knownActions.length === 0}
          <p class="empty">No known actions yet.</p>
        {:else}
          <div class="ability-group">
            <div class="ability-label">Trigger</div>
            <div class="keyword-list">
              {#each TRIGGER_TEMPLATE_KEYS as key (key)}
                {@const selected = abilityTrigger === key}
                <div
                  class="keyword-row"
                  class:on={selected}
                  role="switch"
                  aria-checked={selected}
                  title={getTriggerTemplateLabel(key)}
                  onclick={() => setAbilityTrigger(key)}
                >
                  <img
                    class="keyword-icon"
                    src={getAssetPath(getTriggerTemplateAsset(key))}
                    alt=""
                    aria-hidden="true"
                  />
                  <span class="keyword-name">{getTriggerTemplateLabel(key)}</span>
                  <span class="toggle" class:on={selected} aria-hidden="true">
                    <span class="toggle-knob"></span>
                  </span>
                </div>
              {/each}
            </div>
          </div>
          <div class="ability-group">
            <div class="ability-label">Action</div>
            <div class="keyword-list">
              {#each knownActions as name (name)}
                {@const selected = abilityAction === name}
                {@const meta = getActionTemplateMeta(name)}
                {@const numeric = actionNumericParams[name] ?? []}
                <div class="action-block">
                  <div
                    class="keyword-row"
                    class:on={selected}
                    role="switch"
                    aria-checked={selected}
                    title={budgetTitle(
                      getActionTooltip(name),
                      selected && draftAbility ? abilityCost() : 0
                    )}
                    onclick={() => toggleAbilityAction(name)}
                  >
                    <span class="keyword-name">{meta?.label ?? name}</span>
                    <span class="toggle" class:on={selected} aria-hidden="true">
                      <span class="toggle-knob"></span>
                    </span>
                  </div>
                  {#if selected && numeric.length}
                    <div class="param-list">
                      {#each numeric as param (param.factoryKey)}
                        <div
                          class="param-row"
                          onclick={(event) => event.stopPropagation()}
                          oncontextmenu={(event) => event.stopPropagation()}
                        >
                          <span class="param-label">{param.label}</span>
                          {@render stepper(
                            abilityArgs[param.factoryKey] ?? 1,
                            1,
                            param.label,
                            (next) => setAbilityArg(param.factoryKey, next)
                          )}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </section>
      {:else}
      <section class="section abilities-section" aria-label="Effect">
        <h3 class="section-heading">
          <span class="section-icon star-icon" aria-hidden="true"></span>
          Effect
        </h3>
        {#if knownActions.length === 0}
          <p class="empty">No known actions yet.</p>
        {:else}
          <div class="keyword-list">
            {#each knownActions as name (name)}
              {@const selected = spellAction === name}
              {@const meta = getActionTemplateMeta(name)}
              {@const numeric = actionNumericParams[name] ?? []}
              <div class="action-block">
                <div
                  class="keyword-row"
                  class:on={selected}
                  role="switch"
                  aria-checked={selected}
                  title={budgetTitle(getActionTooltip(name), selected ? spellActionCost : 0)}
                  onclick={() => toggleSpellAction(name)}
                >
                  <span class="keyword-name">{meta?.label ?? name}</span>
                  <span class="toggle" class:on={selected} aria-hidden="true">
                    <span class="toggle-knob"></span>
                  </span>
                </div>
                {#if selected && numeric.length}
                  <div class="param-list">
                    {#each numeric as param (param.factoryKey)}
                      <div
                        class="param-row"
                        onclick={(event) => event.stopPropagation()}
                        oncontextmenu={(event) => event.stopPropagation()}
                      >
                        <span class="param-label">{param.label}</span>
                        {@render stepper(
                          spellArgs[param.factoryKey] ?? 1,
                          1,
                          param.label,
                          (next) => setSpellArg(param.factoryKey, next)
                        )}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </section>
      {/if}
    </div>

    <footer class="actions">
      <button type="button" class="abandon" onclick={cancel}>
        {onBack ? 'Back' : 'Cancel'}
      </button>
      <OrnateButton icon="spiral" onclick={confirm}>Invoke</OrnateButton>
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

  .frame {
    position: relative;
    width: min(620px, 100%);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    padding: 10px 10px 8px;
    background: var(--color-wood, #4a2a18) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown, #2a1810);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    box-sizing: border-box;
  }

  .panel {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    background: #e8dcc4 var(--parchment) center / cover;
    background-blend-mode: multiply;
    color: #2c251d;
    padding: 16px 16px 12px;
    box-sizing: border-box;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    border-radius: 3px;
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

  .type-choices {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .type-btn {
    min-width: 7.5rem;
    padding: 8px 20px;
    color: #2c251d;
    background: #efe4c8;
    border: 1px solid rgba(90, 75, 60, 0.45);
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  .type-btn:hover {
    background: #f5ead0;
  }

  .type-btn.selected {
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.22);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 0 0 1px #8a6a28;
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

  .keywords-section,
  .abilities-section {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }

  .abilities-section {
    flex: 0 1 auto;
    margin-top: 10px;
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: #6a5c4c;
  }

  .ability-group + .ability-group {
    margin-top: 10px;
  }

  .ability-label {
    margin: 0 0 8px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #5c5146;
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

  .action-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .param-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 8px;
  }

  .param-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .param-label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.78rem;
    color: #5c5146;
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
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 3.2rem;
    padding: 10px 8px 4px;
  }

  .abandon {
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    color: var(--color-muted-label);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-brass) 45%, transparent);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .abandon:hover {
    color: var(--color-cream);
    border-color: var(--color-brass);
    background: color-mix(in srgb, var(--color-data) 55%, transparent);
  }
</style>
