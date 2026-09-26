<script lang="ts">
  import { CardType, type Ability, type UnitKeywords } from '@/lib/_model';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import { formatKeywordLabel, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';

  type SpellParam = {
    index: number;
    key: string;
    label: string;
    actionLabel: string;
    current: number;
  };

  let {
    cardType,
    power = 0,
    maxPower = 0,
    maxHealth = 0,
    maxHealthCut = 0,
    retaliate = 0,
    maxRetaliate = 0,
    ownedKeywords = [],
    keywordMaxes = {},
    keywords = {},
    abilities = [],
    removeAbilities = [],
    spellParams = [],
    actionArgs = {},
    locked = false,
    onPower,
    onMaxHealth,
    onRetaliate,
    onKeyword,
    onToggleKeyword,
    onToggleAbility,
    onSpellArg,
    formatAbility,
  }: {
    cardType: CardType.Unit | CardType.Spell;
    power?: number;
    maxPower?: number;
    maxHealth?: number;
    maxHealthCut?: number;
    retaliate?: number;
    maxRetaliate?: number;
    ownedKeywords?: (keyof UnitKeywords)[];
    keywordMaxes?: Partial<Record<keyof UnitKeywords, number>>;
    keywords?: Partial<Record<keyof UnitKeywords, number>>;
    abilities?: Ability[];
    removeAbilities?: number[];
    spellParams?: SpellParam[];
    actionArgs?: Record<number, Record<string, number>>;
    locked?: boolean;
    onPower: (value: number) => void;
    onMaxHealth: (value: number) => void;
    onRetaliate: (value: number) => void;
    onKeyword: (key: keyof UnitKeywords, value: number) => void;
    onToggleKeyword: (key: keyof UnitKeywords) => void;
    onToggleAbility: (index: number) => void;
    onSpellArg: (index: number, key: string, value: number) => void;
    formatAbility: (ability: Ability) => string;
  } = $props();

  const parchment = getAssetPath('images/ui/backgrounds/parchment.png');
  const powerIcon = getAssetPath('images/ui/icons/power-icon-decorated.png');
  const healthIcon = getAssetPath('images/ui/icons/health-icon-decorated.png');
  const retaliateIcon = getAssetPath('images/ui/icons/retaliate-icon-decorated.png');
  const abilityIcon = getUiIconPath('conjure');
  const isUnit = $derived(cardType === CardType.Unit);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function dialStep(value: number, min: number, max: number, delta: number): number {
    return clamp(value + delta, min, max);
  }

  function wheelDial(
    node: HTMLElement,
    opts:
      | {
          value: number;
          min: number;
          max: number;
          apply: (next: number) => void;
        }
      | null
      | undefined
  ) {
    if (!opts) return {};
    let current = opts;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      const step = event.shiftKey ? 5 : 1;
      const dir = event.deltaY < 0 ? 1 : -1;
      const next = dialStep(current.value, current.min, current.max, dir * step);
      if (next !== current.value) current.apply(next);
    }
    node.addEventListener('wheel', onWheel, { passive: false });
    return {
      update(
        next:
          | {
              value: number;
              min: number;
              max: number;
              apply: (next: number) => void;
            }
          | null
          | undefined
      ) {
        if (!next) return;
        current = next;
      },
      destroy() {
        node.removeEventListener('wheel', onWheel);
      },
    };
  }

  function maxForKeyword(key: keyof UnitKeywords): number {
    return Math.max(1, keywordMaxes[key] ?? 1);
  }
</script>

{#snippet dial(
  value: number,
  min: number,
  max: number,
  label: string,
  apply: (next: number) => void
)}
  <button
    type="button"
    class="dial corner"
    aria-label="{label}: {value}. Click to increase, right-click to decrease"
    title="{label}: click + · right-click − · scroll to adjust"
    use:wheelDial={{ value, min, max, apply }}
    onclick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      const step = event.shiftKey ? 5 : 1;
      const next = dialStep(value, min, max, step);
      if (next !== value) apply(next);
    }}
    oncontextmenu={(event) => {
      event.preventDefault();
      event.stopPropagation();
      const step = event.shiftKey ? 5 : 1;
      const next = dialStep(value, min, max, -step);
      if (next !== value) apply(next);
    }}
  >
    −{value}
  </button>
{/snippet}

{#snippet star()}
  <span class="star" aria-hidden="true"></span>
{/snippet}

{#snippet sectionLabel(text: string)}
  <h3 class="group-label">
    {@render star()}
    {text}
    {@render star()}
  </h3>
{/snippet}

<div class="pile" class:locked style="--parchment: url('{parchment}')">
  <h3 class="page-title">
    <span class="title-rule" aria-hidden="true"></span>
    <span class="title-text">Discard</span>
    <span class="title-rule" aria-hidden="true"></span>
    <span class="title-flourish" aria-hidden="true"></span>
  </h3>
  <p class="hint">Shed traits from the card. Right-click to restore.</p>

  {#if isUnit}
    {#if maxPower > 0 || maxHealthCut > 0 || maxRetaliate > 0}
      <section class="group" aria-label="Essences">
        {@render sectionLabel('Essences')}
        <div class="cluster">
          {#if maxPower > 0}
            <div
              class="token"
              class:shed={power > 0}
              use:wheelDial={{
                value: power,
                min: 0,
                max: maxPower,
                apply: onPower,
              }}
            >
              <button
                type="button"
                class="stone-btn"
                class:shed={power > 0}
                aria-pressed={power > 0}
                title="Power −{power || 0}. Click to shed · right-click to restore"
                onclick={() => onPower(power > 0 ? dialStep(power, 0, maxPower, 1) : 1)}
                oncontextmenu={(event) => {
                  event.preventDefault();
                  onPower(0);
                }}
              >
                <span class="stone">
                  <img src={powerIcon} alt="" />
                </span>
                <span class="token-name">Power</span>
              </button>
              {#if power > 0}
                {@render dial(power, 0, maxPower, 'Power', onPower)}
              {/if}
            </div>
          {/if}
          {#if maxHealthCut > 0}
            <div
              class="token"
              class:shed={maxHealth > 0}
              use:wheelDial={{
                value: maxHealth,
                min: 0,
                max: maxHealthCut,
                apply: onMaxHealth,
              }}
            >
              <button
                type="button"
                class="stone-btn"
                class:shed={maxHealth > 0}
                aria-pressed={maxHealth > 0}
                title="Health −{maxHealth || 0}. Click to shed · right-click to restore"
                onclick={() =>
                  onMaxHealth(maxHealth > 0 ? dialStep(maxHealth, 0, maxHealthCut, 1) : 1)}
                oncontextmenu={(event) => {
                  event.preventDefault();
                  onMaxHealth(0);
                }}
              >
                <span class="stone">
                  <img src={healthIcon} alt="" />
                </span>
                <span class="token-name">Health</span>
              </button>
              {#if maxHealth > 0}
                {@render dial(maxHealth, 0, maxHealthCut, 'Health', onMaxHealth)}
              {/if}
            </div>
          {/if}
          {#if maxRetaliate > 0}
            <div
              class="token"
              class:shed={retaliate > 0}
              use:wheelDial={{
                value: retaliate,
                min: 0,
                max: maxRetaliate,
                apply: onRetaliate,
              }}
            >
              <button
                type="button"
                class="stone-btn"
                class:shed={retaliate > 0}
                aria-pressed={retaliate > 0}
                title="Retaliate −{retaliate || 0}. Click to shed · right-click to restore"
                onclick={() =>
                  onRetaliate(retaliate > 0 ? dialStep(retaliate, 0, maxRetaliate, 1) : 1)}
                oncontextmenu={(event) => {
                  event.preventDefault();
                  onRetaliate(0);
                }}
              >
                <span class="stone spiky">
                  <img src={retaliateIcon} alt="" />
                </span>
                <span class="token-name">Retaliate</span>
              </button>
              {#if retaliate > 0}
                {@render dial(retaliate, 0, maxRetaliate, 'Retaliate', onRetaliate)}
              {/if}
            </div>
          {/if}
        </div>
      </section>
    {/if}

    {#if ownedKeywords.length}
      <section class="group" aria-label="Runes">
        {@render sectionLabel('Runes')}
        <div class="cluster">
          {#each ownedKeywords as key (key)}
            {@const numeric = NUMERIC_KEYWORDS.has(key)}
            {@const amount = keywords[key] ?? 0}
            {@const shed = amount > 0}
            <div
              class="token"
              class:shed
              use:wheelDial={numeric
                ? {
                    value: amount,
                    min: 0,
                    max: maxForKeyword(key),
                    apply: (next: number) => onKeyword(key, next),
                  }
                : undefined}
            >
              <button
                type="button"
                class="stone-btn"
                class:shed
                aria-pressed={shed}
                title="{formatKeywordLabel(key)}{numeric
                  ? ` −${amount}`
                  : ''}. Click to shed · right-click to restore"
                onclick={() => {
                  if (numeric) onKeyword(key, amount > 0 ? amount + 1 : 1);
                  else onToggleKeyword(key);
                }}
                oncontextmenu={(event) => {
                  event.preventDefault();
                  if (numeric) onKeyword(key, 0);
                  else if (shed) onToggleKeyword(key);
                }}
              >
                <span class="stone rune">
                  <img src={getAssetPath(`images/keywords/material-icons/${key}.png`)} alt="" />
                </span>
                <span class="token-name">{formatKeywordLabel(key)}</span>
              </button>
              {#if numeric && amount > 0}
                {@render dial(amount, 0, maxForKeyword(key), formatKeywordLabel(key), (next) =>
                  onKeyword(key, next)
                )}
              {/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if abilities.length}
      <section class="group" aria-label="Abilities">
        {@render sectionLabel('Abilities')}
        <div class="cluster scrolls">
          {#each abilities as ability, index (index)}
            {@const shed = removeAbilities.includes(index)}
            <div class="scroll" class:shed>
              <button
                type="button"
                class="scroll-main"
                aria-pressed={shed}
                title="{formatAbility(ability)}. Click to shed · right-click to restore"
                onclick={() => onToggleAbility(index)}
                oncontextmenu={(event) => {
                  event.preventDefault();
                  if (shed) onToggleAbility(index);
                }}
              >
                <img class="scroll-mark" src={abilityIcon} alt="" />
                <span class="token-name">{formatAbility(ability)}</span>
              </button>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if maxPower <= 0 && maxHealthCut <= 0 && maxRetaliate <= 0 && !ownedKeywords.length && !abilities.length}
      <p class="empty">Nothing left to distill from this card.</p>
    {/if}
  {:else if spellParams.length}
    <section class="group" aria-label="Effects">
      {@render sectionLabel('Effects')}
      <div class="cluster scrolls">
        {#each spellParams as param (`${param.index}-${param.key}`)}
          {@const value = actionArgs[param.index]?.[param.key] ?? 0}
          {@const max = Math.max(0, param.current - 1)}
          {@const shed = value > 0}
          <div
            class="scroll"
            class:shed
            use:wheelDial={{
              value,
              min: 0,
              max,
              apply: (next) => onSpellArg(param.index, param.key, next),
            }}
          >
            <button
              type="button"
              class="scroll-main"
              aria-pressed={shed}
              title="{param.actionLabel}: {param.label} −{value}. Click to shed · right-click to restore"
              onclick={() => onSpellArg(param.index, param.key, value > 0 ? value + 1 : 1)}
              oncontextmenu={(event) => {
                event.preventDefault();
                onSpellArg(param.index, param.key, 0);
              }}
            >
              <img class="scroll-mark" src={abilityIcon} alt="" />
              <span class="token-name">{param.actionLabel}: {param.label}</span>
            </button>
            {#if shed}
              {@render dial(value, 0, max, param.label, (next) =>
                onSpellArg(param.index, param.key, next)
              )}
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <p class="empty">This spell has no adjustable effects.</p>
  {/if}
</div>

<style>
  .pile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 2px 8px;
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .pile.locked {
    pointer-events: none;
    opacity: 0.72;
  }

  .page-title {
    display: grid;
    grid-template-columns: auto auto auto;
    justify-content: center;
    align-items: center;
    column-gap: 10px;
    row-gap: 8px;
    margin: 0 0 2px;
    padding: 0 4px 8px;
    font-family: var(--font-narrative);
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #2c251d;
    text-align: center;
  }

  .title-text {
    font-size: 0.95rem;
    line-height: 1;
  }

  .title-rule {
    position: relative;
    width: 1.6rem;
    height: 1px;
    background: rgba(90, 75, 60, 0.55);
  }

  .title-rule::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 5px;
    height: 5px;
    background: #5c4632;
    transform: translate(-50%, -50%) rotate(45deg);
  }

  .title-flourish {
    grid-column: 1 / -1;
    position: relative;
    width: min(12rem, 70%);
    justify-self: center;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(90, 75, 60, 0.5) 12%,
      rgba(90, 75, 60, 0.5) 88%,
      transparent 100%
    );
  }

  .title-flourish::before,
  .title-flourish::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
  }

  .title-flourish::before {
    width: 7px;
    height: 7px;
    background: #5c4632;
    transform: translate(-50%, -50%) rotate(45deg);
  }

  .title-flourish::after {
    width: 22px;
    height: 5px;
    transform: translate(-50%, -50%);
    background: linear-gradient(90deg, transparent 0%, #5c4632 18%, #5c4632 82%, transparent 100%);
    clip-path: polygon(0 50%, 28% 0, 50% 35%, 72% 0, 100% 50%, 72% 100%, 50% 65%, 28% 100%);
  }

  .hint {
    margin: 0 0 4px;
    font-size: 0.78rem;
    font-style: italic;
    text-align: center;
    color: #5c5146;
  }

  .group-label {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin: 12px 0 10px;
    font-family: var(--font-narrative);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4a3f32;
    text-align: left;
  }

  .group-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(90, 75, 60, 0.4);
  }

  .star {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    background: #5c4632;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .cluster {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 14px;
  }

  .cluster.scrolls {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    padding-left: 3px;
  }

  .token {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 4.7rem;
  }

  .stone-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 0;
    color: var(--color-ink);
    background: transparent;
    border: none;
    font-family: inherit;
    cursor: pointer;
  }

  .stone {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    min-height: 48px;
    flex-shrink: 0;
  }

  .stone img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.35));
    transition:
      opacity 0.18s ease,
      filter 0.18s ease;
  }

  .stone.rune {
    width: 64px;
    height: 64px;
    min-height: 64px;
  }

  .stone.rune img {
    width: 48px;
    height: 48px;
    filter: drop-shadow(3px 4px 3px rgba(42, 24, 16, 0.5));
  }

  .stone.spiky img {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 52px;
    height: 52px;
    transform: translate(-50%, -50%);
  }

  .token.shed .stone img,
  .stone-btn.shed .stone img {
    opacity: 0.4;
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.35)) grayscale(0.35)
      drop-shadow(0 0 5px rgba(90, 50, 40, 0.45));
  }

  .token.shed .stone.rune img {
    filter: drop-shadow(3px 4px 3px rgba(42, 24, 16, 0.5)) grayscale(0.35)
      drop-shadow(0 0 5px rgba(90, 50, 40, 0.45));
  }

  .token-name {
    max-width: 100%;
    font-size: 0.72rem;
    line-height: 1.15;
    text-align: center;
    text-transform: capitalize;
  }

  .scroll {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 3px 6px;
    background: rgba(255, 248, 230, 0.28);
    border: 1px solid rgba(90, 75, 60, 0.28);
    border-radius: 3px;
  }

  .scroll.shed {
    border-color: #6a4638;
    background: rgba(90, 55, 42, 0.14);
    box-shadow: 0 0 0 1px rgba(90, 55, 42, 0.35);
  }

  .scroll.shed .scroll-mark {
    opacity: 0.4;
    filter: grayscale(0.4);
  }

  .scroll-main {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    color: var(--color-ink);
    background: transparent;
    border: none;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
  }

  .scroll-main .token-name {
    flex: 1;
    text-align: left;
    font-size: 0.78rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: none;
  }

  .scroll-mark {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    object-fit: contain;
    pointer-events: none;
  }

  .dial {
    padding: 2px 6px;
    color: var(--color-cream);
    background: #2c251d;
    border: 1px solid #3a3228;
    border-radius: 3px;
    font: inherit;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .dial.corner {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 1.6rem;
    z-index: 1;
  }

  .scroll .dial {
    position: static;
    flex-shrink: 0;
  }

  .dial:hover {
    border-color: var(--color-brass);
  }

  .empty {
    margin: 12px 0 0;
    text-align: center;
    font-size: 0.85rem;
    color: #6a5c4c;
  }
</style>
