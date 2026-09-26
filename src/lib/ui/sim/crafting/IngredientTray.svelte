<script lang="ts">
  import { CardColor, CardType, type UnitKeywords } from '@/lib/_model';
  import { getActionTypeIconPath, getAssetPath } from '@/lib/_utils/asset-paths';
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
      icon: getAssetPath('images/ui/icons/power-icon-decorated.png'),
      min: 0,
    },
    {
      key: 'hp',
      label: 'Health',
      icon: getAssetPath('images/ui/icons/health-icon-decorated.png'),
      min: 1,
    },
    {
      key: 'retaliate',
      label: 'Retaliate',
      icon: getAssetPath('images/ui/icons/retaliate-icon-decorated.png'),
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
    locked = false,
    showPigments = true,
    canAdd = () => true,
    onPigment,
    onEssenceDial,
    onEssenceMix,
    onRuneDial,
    onRuneMix,
    onTriggerDial,
    onArgDial,
    onIncantationMix,
    onDrop,
    onDragChange,
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
    locked?: boolean;
    /** When false, pigment stones are hidden (e.g. enchanting an existing card). */
    showPigments?: boolean;
    /** Return false to gray out and block dropping this ingredient. */
    canAdd?: (id: string) => boolean;
    onPigment: (color: CardColor, remove: boolean) => void;
    onEssenceDial: (key: EssenceKey, value: number) => void;
    onEssenceMix: (key: EssenceKey, remove: boolean) => void;
    onRuneDial: (key: keyof UnitKeywords, value: number) => void;
    onRuneMix: (key: keyof UnitKeywords, remove: boolean) => void;
    onTriggerDial: (name: string, trigger: string) => void;
    onArgDial: (name: string, factoryKey: string, value: number) => void;
    onIncantationMix: (name: string, remove: boolean) => void;
    onDrop: (id: string, clientX: number, clientY: number) => void;
    onDragChange?: (active: boolean) => void;
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

  type Gesture = {
    id: string;
    icon: string;
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
    canDrop: boolean;
    increment: ((event: PointerEvent) => void) | null;
  };

  let gesture: Gesture | null = null;
  let ghost = $state<{ icon: string; x: number; y: number } | null>(null);

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function clearGesture() {
    const notify = !!gesture?.moved && !!gesture?.canDrop;
    gesture = null;
    ghost = null;
    document.body.style.cursor = '';
    if (notify) onDragChange?.(false);
    window.removeEventListener('pointermove', moveGesture);
    window.removeEventListener('pointerup', finishGesture);
    window.removeEventListener('pointercancel', clearGesture);
  }

  function startGesture(
    event: PointerEvent,
    id: string,
    icon: string,
    canDrop: boolean,
    increment: ((event: PointerEvent) => void) | null
  ) {
    if (locked || event.button !== 0) return;
    event.preventDefault();
    if (gesture) clearGesture();
    gesture = {
      id,
      icon,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      canDrop,
      increment,
    };
    window.addEventListener('pointermove', moveGesture);
    window.addEventListener('pointerup', finishGesture);
    window.addEventListener('pointercancel', clearGesture);
  }

  function moveGesture(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.moved && dx * dx + dy * dy < 36) return;
    gesture.moved = true;
    if (!gesture.canDrop) return;
    if (!ghost) onDragChange?.(true);
    ghost = { icon: gesture.icon, x: event.clientX, y: event.clientY };
    document.body.style.cursor = 'grabbing';
  }

  function finishGesture(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const current = gesture;
    const moved = current.moved;
    clearGesture();
    if (!moved) {
      current.increment?.(event);
      return;
    }
    if (!current.canDrop) return;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (hit?.closest('[data-ingredient-drop]')) {
      onDrop(current.id, event.clientX, event.clientY);
    }
  }

  function stoneTitle(id: string, numeric: boolean, inMix: boolean): string {
    if (!inMix && !canAdd(id)) {
      return hints[id]
        ? `${hints[id]}\nToo expensive for this enchantment`
        : 'Too expensive for this enchantment';
    }
    const how = inMix
      ? numeric
        ? 'Click to increase · Right-click to remove'
        : 'Right-click to remove'
      : numeric
        ? 'Drag onto the card to add · Click to increase · Right-click to remove'
        : 'Drag onto the card to add · Right-click to remove';
    return hints[id] ? `${hints[id]}\n${how}` : how;
  }

  function incrementIncantation(name: string, event: PointerEvent) {
    const param = (actionNumericParams[name] ?? [])[0];
    if (!param) return;
    const value = argsFor(name)[param.factoryKey] ?? 1;
    const step = event.shiftKey ? 5 : 1;
    const next = dialStep(value, 1, STAT_MAX, false, step);
    if (next !== value) onArgDial(name, param.factoryKey, next);
  }

  $effect(() => {
    if (!locked) return;
    clearGesture();
  });

  $effect(() => () => clearGesture());

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

  function dialStep(value: number, min: number, max: number, wrap: boolean, delta: number): number {
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
  wrap: boolean,
  corner = false
)}
  <button
    type="button"
    class="dial"
    class:corner
    aria-label="{label}: {display}. Click to increase, right-click to decrease"
    title="{label}: click + · right-click − · scroll to adjust"
    use:wheelDial={corner ? null : { value, min, max, wrap, apply }}
    onclick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      const step = !wrap && event.shiftKey ? 5 : 1;
      const next = dialStep(value, min, max, wrap, step);
      if (next !== value) apply(next);
    }}
    oncontextmenu={(event) => {
      event.preventDefault();
      event.stopPropagation();
      const step = !wrap && event.shiftKey ? 5 : 1;
      const next = dialStep(value, min, max, wrap, -step);
      if (next !== value) apply(next);
    }}
  >
    {display}
  </button>
{/snippet}

{#snippet star()}
  <span class="star" aria-hidden="true"></span>
{/snippet}

{#snippet sectionLabel(text: string, withRule = true)}
  <h3 class="group-label" class:no-rule={!withRule}>
    {@render star()}
    {text}
    {@render star()}
  </h3>
{/snippet}

{#snippet stone(
  id: string,
  icon: string,
  label: string,
  inMix: boolean,
  onMix: (remove: boolean) => void,
  increment: ((event: PointerEvent) => void) | null,
  spiky = false,
  showLabel = true
)}
  {@const blocked = !inMix && !canAdd(id)}
  <button
    type="button"
    class="stone-btn"
    class:added={inMix}
    class:blocked
    aria-pressed={inMix}
    aria-disabled={blocked}
    aria-label={showLabel ? undefined : label}
    title={stoneTitle(id, increment !== null, inMix)}
    draggable="false"
    onpointerdown={(event) => {
      if (blocked) {
        event.preventDefault();
        return;
      }
      startGesture(event, id, icon, !inMix, increment);
    }}
    oncontextmenu={(event) => {
      event.preventDefault();
      if (inMix) onMix(true);
    }}
  >
    <span class="stone" class:spiky class:rune={id.startsWith('rune:')} data-charm-nest={id}>
      <img src={icon} alt="" draggable="false" />
    </span>
    {#if showLabel}
      <span class="token-name">{label}</span>
    {/if}
  </button>
{/snippet}

<div class="tray" class:locked style="--parchment: url('{parchment}')">
  <h3 class="page-title">
    <span class="title-rule" aria-hidden="true"></span>
    <span class="title-text">Ingredients</span>
    <span class="title-rule" aria-hidden="true"></span>
    <span class="title-flourish" aria-hidden="true"></span>
  </h3>
  {#if showPigments}
    <section class="group" aria-label="Pigments">
      {@render sectionLabel('Pigments', false)}
      <div class="cluster">
        {#each availableColors as color (color)}
          {@const id = `pigment:${color}`}
          {@const inMix = colors.includes(color)}
          <div class="token icon-only" class:in-mix={inMix}>
            {@render stone(
              id,
              colorPath(color),
              capitalize(color),
              inMix,
              (remove) => onPigment(color, remove),
              null,
              false,
              false
            )}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if isUnit}
    <section class="group" aria-label="Essences">
      {@render sectionLabel('Essences')}
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
              (event) => {
                const step = event.shiftKey ? 5 : 1;
                const next = dialStep(essences[essence.key], essence.min, STAT_MAX, false, step);
                if (next !== essences[essence.key]) onEssenceDial(essence.key, next);
              },
              essence.key === 'retaliate'
            )}
            {@render dial(
              essences[essence.key],
              essence.min,
              STAT_MAX,
              essence.label,
              (next) => onEssenceDial(essence.key, next),
              String(essences[essence.key]),
              false,
              true
            )}
          </div>
        {/each}
      </div>
    </section>

    <section class="group" aria-label="Runes">
      {@render sectionLabel('Runes')}
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
              getAssetPath(`images/keywords/material-icons/${key}.png`),
              formatKeywordLabel(key),
              inMix,
              (remove) => onRuneMix(key, remove),
              numeric
                ? (event) => {
                    const step = event.shiftKey ? 5 : 1;
                    const value = runeAmounts[key] ?? 1;
                    const next = dialStep(value, 1, STAT_MAX, false, step);
                    if (next !== value) onRuneDial(key, next);
                  }
                : null
            )}
            {#if numeric}
              {@render dial(
                amount,
                1,
                STAT_MAX,
                formatKeywordLabel(key),
                (next) => onRuneDial(key, next),
                String(amount),
                false,
                true
              )}
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section class="group" aria-label="Incantations">
    {@render sectionLabel('Incantations')}
    {#if knownActions.length === 0}
      <p class="empty">No known incantations yet.</p>
    {:else}
      <div class="cluster scrolls">
        {#each knownActions as name (name)}
          {@const id = `incantation:${name}`}
          {@const meta = getActionTemplateMeta(name)}
          {@const icon = getActionTypeIconPath(name)}
          {@const inMix = isUnit ? abilityAction === name : spellAction === name}
          {@const blocked = !inMix && !canAdd(id)}
          {@const numeric = actionNumericParams[name] ?? []}
          {@const args = argsFor(name)}
          {@const trigger = triggers[name] ?? 'onDeploy'}
          <div class="scroll" class:in-mix={inMix} class:blocked>
            <button
              type="button"
              class="scroll-main"
              aria-pressed={inMix}
              aria-disabled={blocked}
              title={stoneTitle(id, numeric.length > 0, inMix)}
              draggable="false"
              onpointerdown={(event) => {
                if (blocked) {
                  event.preventDefault();
                  return;
                }
                startGesture(event, id, icon, !inMix, (pointer) =>
                  incrementIncantation(name, pointer)
                );
              }}
              oncontextmenu={(event) => {
                event.preventDefault();
                if (inMix) onIncantationMix(name, true);
              }}
            >
              <img class="scroll-mark" data-charm-nest={id} src={icon} alt="" draggable="false" />
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
                          <img src={getAssetPath(getTriggerTemplateAsset(key))} alt="" />
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

{#if ghost}
  <img
    class="drag-ghost"
    use:portal
    src={ghost.icon}
    alt=""
    draggable="false"
    style="left: {ghost.x}px; top: {ghost.y}px"
  />
{/if}

<style>
  .tray {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 2px 8px;
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .tray.locked {
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
    margin: 0 0 6px;
    padding: 0 4px 10px;
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

  .group-label.no-rule::after {
    display: none;
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
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    align-items: start;
    /* Keep the left column's border/shadow inside the clipped flank. */
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

  .token.icon-only {
    width: 3.2rem;
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
    cursor: grab;
    touch-action: none;
  }

  .stone-btn.added {
    cursor: pointer;
  }

  .stone-btn.blocked {
    opacity: 0.38;
    cursor: not-allowed;
    filter: grayscale(0.55);
  }

  .stone-btn:has(.stone.rune) {
    gap: 1px;
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

  /* Material rune tiles read small at 36px — ~1/3 larger. */
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
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.35))
      drop-shadow(0 0 6px color-mix(in srgb, var(--color-golden) 55%, transparent));
  }

  .token.in-mix .stone.rune img {
    filter: drop-shadow(3px 4px 3px rgba(42, 24, 16, 0.5))
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

  .scroll.blocked {
    opacity: 0.38;
    filter: grayscale(0.55);
  }

  .scroll.blocked .scroll-main {
    cursor: not-allowed;
  }

  .scroll.in-mix .scroll-mark {
    opacity: 0.45;
    filter: drop-shadow(0 1px 2px rgba(42, 24, 16, 0.35))
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
    cursor: grab;
    text-align: left;
    touch-action: none;
  }

  .scroll.in-mix .scroll-main {
    cursor: pointer;
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
    width: 36px;
    height: 36px;
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
    display: grid;
    place-items: center;
    min-width: 1.6rem;
    height: 1.6rem;
    /* Extra bottom padding optically centers serif digits. */
    padding: 0 5px 0.12em;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid #6a5644;
    background:
      linear-gradient(
        145deg,
        rgba(255, 248, 230, 0.45) 0%,
        transparent 38%,
        rgba(42, 24, 16, 0.22) 100%
      ),
      #c4ae8a;
    box-shadow:
      inset 1px 1px 0 rgba(255, 250, 235, 0.7),
      inset -1px -1px 0 rgba(42, 24, 16, 0.4),
      2px 3px 3px rgba(42, 24, 16, 0.45);
    font-family: inherit;
    font-variant-numeric: tabular-nums;
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1;
    color: #1a1510;
    text-shadow: 0 1px 0 rgba(255, 248, 230, 0.35);
    cursor: pointer;
    user-select: none;
  }

  .dial.corner {
    position: absolute;
    top: -4px;
    left: calc(50% + 8px);
    z-index: 2;
    min-width: 1.5rem;
    height: 1.5rem;
    font-size: 0.8rem;
  }

  .scroll .dial {
    min-width: 1.45rem;
    height: 1.45rem;
    font-size: 0.8rem;
  }

  .dial:hover {
    background:
      linear-gradient(
        145deg,
        rgba(255, 250, 235, 0.55) 0%,
        transparent 38%,
        rgba(42, 24, 16, 0.18) 100%
      ),
      #d0bb96;
    border-color: #4a3c30;
  }

  .dial:active {
    box-shadow:
      inset 1px 1px 0 rgba(42, 24, 16, 0.35),
      inset -1px -1px 0 rgba(255, 248, 230, 0.25),
      1px 1px 2px rgba(42, 24, 16, 0.35);
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-ink-muted);
  }

  .drag-ghost {
    position: fixed;
    z-index: 4000;
    width: 40px;
    height: 40px;
    object-fit: contain;
    pointer-events: none;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 4px 6px rgba(42, 24, 16, 0.5));
  }
</style>
