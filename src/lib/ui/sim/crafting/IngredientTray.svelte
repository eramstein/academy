<script lang="ts">
  import { CardColor, CardType, type UnitKeywords } from '@/lib/_model';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    getTriggerTemplateAsset,
    TRIGGER_TEMPLATE_KEYS,
  } from '@/lib/sim/cards/ability-templates';
  import { actionNumericParams, getActionTemplateMeta } from '@/lib/sim/cards/action-templates';
  import { formatKeywordLabel, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';

  export type EssenceKey = 'power' | 'hp' | 'retaliate';

  const STAT_MAX = 20;

  const ESSENCES: { key: EssenceKey; label: string; icon: string; min: number }[] = [
    {
      key: 'power',
      label: 'Power',
      icon: getAssetPath('images/ui/icons/power-icon.png'),
      min: 0,
    },
    {
      key: 'hp',
      label: 'Health',
      icon: getAssetPath('images/ui/icons/health-icon.png'),
      min: 1,
    },
    {
      key: 'retaliate',
      label: 'Retaliate',
      icon: getAssetPath('images/ui/icons/retaliate-icon.png'),
      min: 1,
    },
  ];

  let {
    cardType,
    colors,
    availableColors,
    essences,
    essenceIn,
    runeAmounts,
    runeIn,
    availableKeywords,
    triggers,
    argsFor,
    abilityAction,
    spellAction,
    knownActions,
    hints,
    onPigment,
    onEssenceDial,
    onEssenceMix,
    onRuneDial,
    onRuneMix,
    onTriggerDial,
    onArgDial,
    onIncantationMix,
  }: {
    cardType: CardType.Unit | CardType.Spell;
    colors: CardColor[];
    availableColors: CardColor[];
    essences: Record<EssenceKey, number>;
    essenceIn: Record<EssenceKey, boolean>;
    runeAmounts: Partial<Record<keyof UnitKeywords, number>>;
    runeIn: Partial<Record<keyof UnitKeywords, boolean>>;
    availableKeywords: (keyof UnitKeywords)[];
    triggers: Record<string, string>;
    argsFor: (name: string) => Record<string, number>;
    abilityAction: string | null;
    spellAction: string | null;
    knownActions: string[];
    hints: Record<string, string>;
    onPigment: (color: CardColor, remove: boolean) => void;
    onEssenceDial: (key: EssenceKey, value: number) => void;
    onEssenceMix: (key: EssenceKey, remove: boolean) => void;
    onRuneDial: (key: keyof UnitKeywords, value: number) => void;
    onRuneMix: (key: keyof UnitKeywords, remove: boolean) => void;
    onTriggerDial: (name: string, trigger: string) => void;
    onArgDial: (name: string, factoryKey: string, value: number) => void;
    onIncantationMix: (name: string, remove: boolean) => void;
  } = $props();

  const parchment = getAssetPath('images/ui/backgrounds/parchment.png');
  const isUnit = $derived(cardType === CardType.Unit);
  let openTrigger = $state<string | null>(null);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function triggerLabel(key: string): string {
    return key
      .replace(/^on/, 'On ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  function mixClick(event: MouseEvent, inMix: boolean, apply: (remove: boolean) => void) {
    event.preventDefault();
    if (event.type === 'contextmenu' || event.button === 2) {
      if (inMix) apply(true);
      return;
    }
    if (!inMix) apply(false);
  }

  function toggleTriggerMenu(name: string, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    openTrigger = openTrigger === name ? null : name;
  }

  function pickTrigger(name: string, trigger: string, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    onTriggerDial(name, trigger);
    openTrigger = null;
  }

  function dialStep(
    value: number,
    min: number,
    max: number,
    wrap: boolean,
    delta: number
  ): number {
    const span = max - min + 1;
    return wrap
      ? ((((value - min + delta) % span) + span) % span) + min
      : clamp(value + delta, min, max);
  }

  /** Non-passive wheel listener so preventDefault can stop the tray from scrolling. */
  function wheelDial(
    node: HTMLElement,
    opts:
      | {
          value: number;
          min: number;
          max: number;
          wrap: boolean;
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
      const step = !current.wrap && event.shiftKey ? 5 : 1;
      const dir = event.deltaY < 0 ? 1 : -1;
      const next = dialStep(current.value, current.min, current.max, current.wrap, dir * step);
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
              wrap: boolean;
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

  $effect(() => {
    if (!openTrigger) return;
    function onDoc(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('[data-trigger-pick]')) return;
      openTrigger = null;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') openTrigger = null;
    }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  });
</script>

{#snippet dial(
  value: number,
  min: number,
  max: number,
  label: string,
  apply: (next: number) => void,
  display: string,
  wrap: boolean
)}
  <div
    class="dial"
    class:wide={wrap}
    role="group"
    aria-label={label}
    title="{label}: scroll to adjust"
    use:wheelDial={{ value, min, max, wrap, apply }}
    onclick={(event) => event.stopPropagation()}
    oncontextmenu={(event) => event.stopPropagation()}
  >
    <button
      type="button"
      class="dial-nub"
      aria-label="Decrease {label}"
      disabled={!wrap && value <= min}
      onclick={(event) => {
        const step = !wrap && event.shiftKey ? 5 : 1;
        apply(dialStep(value, min, max, wrap, -step));
      }}
      oncontextmenu={(event) => {
        event.preventDefault();
        apply(dialStep(value, min, max, wrap, -1));
      }}
    >
      ‹
    </button>
    <span class="dial-face">{display}</span>
    <button
      type="button"
      class="dial-nub"
      aria-label="Increase {label}"
      disabled={!wrap && value >= max}
      onclick={(event) => {
        const step = !wrap && event.shiftKey ? 5 : 1;
        apply(dialStep(value, min, max, wrap, step));
      }}
    >
      ›
    </button>
  </div>
{/snippet}

{#snippet stone(
  id: string,
  icon: string,
  label: string,
  inMix: boolean,
  onMix: (remove: boolean) => void,
  spiky = false
)}
  <button
    type="button"
    class="stone-btn"
    aria-pressed={inMix}
    title={hints[id]
      ? `${hints[id]}\nClick to add · Right-click to remove`
      : 'Click to add · Right-click to remove'}
    onclick={(event) => mixClick(event, inMix, onMix)}
    oncontextmenu={(event) => mixClick(event, inMix, onMix)}
  >
    <span class="stone" class:spiky data-charm-nest={id}>
      <img src={icon} alt="" />
    </span>
    <span class="token-name">{label}</span>
  </button>
{/snippet}

<div class="tray" style="--parchment: url('{parchment}')">
  <h3 class="page-title">Ingredients</h3>
  <section class="group" aria-label="Pigments">
    <h3 class="group-label">Pigments</h3>
    <div class="cluster">
      {#each availableColors as color (color)}
        {@const id = `pigment:${color}`}
        {@const inMix = colors.includes(color)}
        <div class="token" class:in-mix={inMix}>
          {@render stone(id, colorPath(color), capitalize(color), inMix, (remove) =>
            onPigment(color, remove)
          )}
        </div>
      {/each}
    </div>
  </section>

  {#if isUnit}
    <section class="group" aria-label="Essences">
      <h3 class="group-label">Essences</h3>
      <div class="cluster">
        {#each ESSENCES as essence (essence.key)}
          {@const id = `essence:${essence.key}`}
          {@const inMix = essenceIn[essence.key]}
          <div
            class="token"
            class:in-mix={inMix}
            use:wheelDial={{
              value: essences[essence.key],
              min: essence.min,
              max: STAT_MAX,
              wrap: false,
              apply: (next) => onEssenceDial(essence.key, next),
            }}
          >
            {@render stone(
              id,
              essence.icon,
              essence.label,
              inMix,
              (remove) => onEssenceMix(essence.key, remove),
              essence.key === 'retaliate'
            )}
            {@render dial(
              essences[essence.key],
              essence.min,
              STAT_MAX,
              essence.label,
              (next) => onEssenceDial(essence.key, next),
              String(essences[essence.key]),
              false
            )}
          </div>
        {/each}
      </div>
    </section>

    <section class="group" aria-label="Runes">
      <h3 class="group-label">Runes</h3>
      <div class="cluster">
        {#each availableKeywords as key (key)}
          {@const id = `rune:${key}`}
          {@const numeric = NUMERIC_KEYWORDS.has(key)}
          {@const amount = runeAmounts[key] ?? 1}
          {@const inMix = !!runeIn[key]}
          <div
            class="token"
            class:in-mix={inMix}
            use:wheelDial={numeric
              ? {
                  value: amount,
                  min: 1,
                  max: STAT_MAX,
                  wrap: false,
                  apply: (next: number) => onRuneDial(key, next),
                }
              : undefined}
          >
            {@render stone(
              id,
              getAssetPath(`images/keywords/${key}.png`),
              formatKeywordLabel(key),
              inMix,
              (remove) => onRuneMix(key, remove)
            )}
            {#if numeric}
              {@render dial(
                amount,
                1,
                STAT_MAX,
                formatKeywordLabel(key),
                (next) => onRuneDial(key, next),
                String(amount),
                false
              )}
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section class="group" aria-label="Incantations">
    <h3 class="group-label">Incantations</h3>
    {#if knownActions.length === 0}
      <p class="empty">No known incantations yet.</p>
    {:else}
      <div class="cluster scrolls">
        {#each knownActions as name (name)}
          {@const id = `incantation:${name}`}
          {@const meta = getActionTemplateMeta(name)}
          {@const inMix = isUnit ? abilityAction === name : spellAction === name}
          {@const numeric = actionNumericParams[name] ?? []}
          {@const args = argsFor(name)}
          {@const trigger = triggers[name] ?? 'onDeploy'}
          <div class="scroll" class:in-mix={inMix}>
            <button
              type="button"
              class="scroll-main"
              aria-pressed={inMix}
              title={hints[id]
                ? `${hints[id]}\nClick to add · Right-click to remove`
                : 'Click to add · Right-click to remove'}
              onclick={(event) => mixClick(event, inMix, (remove) => onIncantationMix(name, remove))}
              oncontextmenu={(event) =>
                mixClick(event, inMix, (remove) => onIncantationMix(name, remove))}
            >
              <img
                class="scroll-mark"
                data-charm-nest={id}
                src={getUiIconPath('conjure')}
                alt=""
              />
              <span class="token-name">{meta?.label ?? name}</span>
            </button>

            <div class="scroll-controls">
              {#if isUnit}
                <div class="trigger-pick" data-trigger-pick>
                  <button
                    type="button"
                    class="trigger-btn"
                    aria-label="Trigger: {triggerLabel(trigger)}"
                    aria-expanded={openTrigger === name}
                    aria-haspopup="listbox"
                    title={triggerLabel(trigger)}
                    onclick={(event) => toggleTriggerMenu(name, event)}
                  >
                    <img
                      class="trigger-icon"
                      src={getAssetPath(getTriggerTemplateAsset(trigger))}
                      alt=""
                    />
                  </button>
                  {#if openTrigger === name}
                    <div class="trigger-menu" role="listbox" aria-label="Choose trigger">
                      {#each TRIGGER_TEMPLATE_KEYS as key (key)}
                        <button
                          type="button"
                          class="trigger-option"
                          class:selected={key === trigger}
                          role="option"
                          aria-selected={key === trigger}
                          onclick={(event) => pickTrigger(name, key, event)}
                        >
                          <img
                            src={getAssetPath(getTriggerTemplateAsset(key))}
                            alt=""
                          />
                          <span>{triggerLabel(key)}</span>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}

              {#each numeric as param (param.factoryKey)}
                {@render dial(
                  args[param.factoryKey] ?? 1,
                  1,
                  STAT_MAX,
                  param.label,
                  (next) => onArgDial(name, param.factoryKey, next),
                  String(args[param.factoryKey] ?? 1),
                  false
                )}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .tray {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .page-title,
  .group-label {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin: 0;
    font-family: var(--font-narrative);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3a3128;
    text-align: left;
  }

  .page-title {
    margin: 0 0 8px;
    font-size: 0.95rem;
  }

  .group-label {
    margin: 10px 0 8px;
    font-size: 0.82rem;
    color: #4a3f32;
  }

  .group-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(90, 75, 60, 0.4);
  }

  .diamond {
    width: 7px;
    height: 7px;
    flex-shrink: 0;
    background: #5c4632;
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }

  .cluster {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
  }

  .cluster.scrolls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 8px;
    align-items: start;
    /* Keep the left column's border/shadow inside the clipped flank. */
    padding-left: 3px;
  }

  .token {
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
    background: transparent;
    border: none;
    box-shadow: none;
    overflow: visible;
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

  /* Draw larger without affecting the shared 48px layout box. */
  .stone.spiky img {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 52px;
    height: 52px;
    transform: translate(-50%, -50%);
  }

  .token.in-mix .stone img {
    opacity: 0.45;
    filter:
      drop-shadow(0 2px 3px rgba(42, 24, 16, 0.35))
      drop-shadow(0 0 6px color-mix(in srgb, var(--color-golden) 55%, transparent));
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
    gap: 4px;
    min-height: 32px;
    padding: 3px 6px;
    background: rgba(255, 248, 230, 0.28);
    border: 1px solid rgba(90, 75, 60, 0.28);
    border-radius: 3px;
    box-shadow: none;
  }

  .scroll.in-mix {
    border-color: #8a6a28;
    background: rgba(191, 161, 74, 0.16);
    box-shadow: 0 0 0 1px rgba(191, 161, 74, 0.45);
  }

  .scroll.in-mix .scroll-mark {
    opacity: 0.45;
    filter:
      drop-shadow(0 1px 2px rgba(42, 24, 16, 0.35))
      drop-shadow(0 0 6px color-mix(in srgb, var(--color-golden) 55%, transparent));
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
  }

  .scroll-mark {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(42, 24, 16, 0.35));
  }

  .scroll-controls {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }

  .trigger-pick {
    position: relative;
  }

  .trigger-btn {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: rgba(255, 248, 230, 0.35);
    cursor: pointer;
  }

  .trigger-btn:hover,
  .trigger-btn[aria-expanded='true'] {
    border-color: var(--color-brass);
    background: rgba(255, 248, 230, 0.7);
  }

  .trigger-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    pointer-events: none;
  }

  .trigger-menu {
    position: absolute;
    bottom: calc(100% + 4px);
    right: 0;
    z-index: 20;
    min-width: 9.5rem;
    padding: 4px;
    background: #efe4c8 var(--parchment) center / cover;
    border: 1px solid #5a4b3c;
    border-radius: 4px;
    box-shadow: 0 6px 16px rgba(42, 24, 16, 0.35);
  }

  .trigger-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--color-ink);
    font-family: inherit;
    font-size: 0.78rem;
    text-align: left;
    cursor: pointer;
  }

  .trigger-option img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .trigger-option:hover,
  .trigger-option.selected {
    background: rgba(175, 142, 103, 0.28);
  }

  .trigger-option.selected {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-brass) 55%, transparent);
  }

  .dial {
    display: flex;
    align-items: center;
    height: 22px;
    border-radius: 11px;
    background: #c4a574;
    border: 1px solid #6d5433;
    box-shadow:
      inset 0 1px 0 rgba(255, 248, 230, 0.55),
      0 1px 2px rgba(42, 24, 16, 0.35);
    overflow: hidden;
  }

  .scroll .dial {
    height: 20px;
    border-radius: 10px;
  }

  .dial-face {
    min-width: 1.35rem;
    padding: 0 2px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-size: 0.78rem;
    font-weight: 700;
    color: #2c251d;
  }

  .scroll .dial-face {
    min-width: 1.1rem;
    font-size: 0.72rem;
  }

  .dial.wide .dial-face {
    min-width: 3.2rem;
    font-size: 0.68rem;
    letter-spacing: 0.03em;
  }

  .dial-nub {
    width: 16px;
    height: 22px;
    padding: 0;
    border: none;
    background: transparent;
    color: #3a2a18;
    font-family: inherit;
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
  }

  .scroll .dial-nub {
    width: 14px;
    height: 20px;
    font-size: 0.85rem;
  }

  .dial-nub:hover:not(:disabled) {
    background: rgba(255, 248, 230, 0.35);
  }

  .dial-nub:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-ink-muted);
  }
</style>
