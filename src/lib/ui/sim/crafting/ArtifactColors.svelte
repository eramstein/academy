<script lang="ts">
  import {
    CardColor,
    ResourceType,
    type Artifact,
    type ArtifactTool,
    type ArtifactTrinket,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getPieceDisplayName, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    canPayArtifactCell,
    dreamsphereStock,
    type ArtifactCellPayment,
    type ArtifactCraftView,
    type FillArtifactCellResult,
  } from '@/lib/sim/actions';
  import { playSimSound } from '@/lib/sim/sound';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import ResourceIcon from '@/lib/ui/sim/ResourceIcon.svelte';
  import ArtifactThumb from '@/lib/ui/sim/sim-data/player/ArtifactThumb.svelte';
  import PieceIcon from './PieceIcon.svelte';

  type DragKind =
    | { payment: 'mastery'; color: CardColor }
    | { payment: 'dreamsphere' };

  interface CellLayout {
    index: number;
    filled: boolean;
    x: number;
    y: number;
  }

  interface ColorGroup {
    barIndex: number;
    color: CardColor;
    slots: CellLayout[];
  }

  interface Flyer {
    id: number;
    color: CardColor;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    delay: number;
    barIndex: number;
    slotIndex: number;
    finishArtifact: boolean;
  }

  let {
    pattern,
    leaving = false,
    working = false,
    complete = false,
    affordable = true,
    notice = '',
    chance = 0,
    paceChance = 0,
    focusToSpend = 0,
    sessionTakeYourTime = false,
    progressedThisSession = false,
    onFocus,
    onTakeItSlow,
    onBeginPace,
    onPlace,
    onBack,
    onLeave,
    onFinish,
  }: {
    pattern: ArtifactCraftView;
    leaving?: boolean;
    working?: boolean;
    complete?: boolean;
    affordable?: boolean;
    notice?: string;
    chance?: number;
    paceChance?: number;
    focusToSpend?: number;
    sessionTakeYourTime?: boolean;
    progressedThisSession?: boolean;
    onFocus: (delta: number) => void;
    onTakeItSlow: () => void;
    onBeginPace: () => void;
    onPlace: (barIndex: number, payment: ArtifactCellPayment) => FillArtifactCellResult | null;
    onBack: () => void;
    onLeave: () => void;
    onFinish: () => void;
  } = $props();

  const tablePath = getAssetPath('images/ui/backgrounds/table.jpg');
  const scenePath = getAssetPath('images/ui/backgrounds/artifact-workshop-background.jpg');
  const pagePath = getAssetPath('images/ui/backgrounds/book-page-2.png');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
  const starPath = getAssetPath('images/ui/decorations/page-star.svg');
  const hourglassPath = getUiIconPath('hourglass');
  const DRAG_THRESHOLD = 8;
  const FLY_MS = 420;
  const FLY_STAGGER_MS = 140;

  let drag = $state<{ kind: DragKind; x: number; y: number; over: number | null } | null>(null);
  let press = $state<{
    kind: DragKind;
    x: number;
    y: number;
    from: DOMRect;
  } | null>(null);
  let flyers = $state<Flyer[]>([]);
  let pendingReveal = $state<Set<string>>(new Set());
  let flyerSeq = 0;

  const dreamspheres = $derived(dreamsphereStock());
  const focusAvailable = $derived(gs.player.focus ?? 0);
  const dexterity = $derived(gs.player.attributes?.dexterity ?? 0);
  const attemptLeft = $derived(!sessionTakeYourTime || !progressedThisSession);
  const knowledgeNeed = $derived(
    pattern.artifact.colorCost.reduce((sum, bar) => sum + bar.cost, 0)
  );
  const knowledgeHave = $derived(pattern.filled.reduce((sum, count) => sum + count, 0));
  const bonuses = $derived(bonusLines(pattern.artifact));
  const colors = $derived.by(() => {
    const seen = new Set<CardColor>();
    const items: { color: CardColor; count: number }[] = [];
    for (const bar of pattern.artifact.colorCost) {
      if (seen.has(bar.color)) continue;
      seen.add(bar.color);
      items.push({
        color: bar.color,
        count: gs.player.colorMasteryPoints?.[bar.color] ?? 0,
      });
    }
    return items;
  });
  const groups = $derived(ringGroups(pattern.artifact.colorCost, pattern.filled));

  /**
   * Color clusters on an upper arc, open at the bottom.
   * Slots of one color stay close; each color keeps its own stretch of the ring.
   */
  function ringGroups(
    bars: Artifact['colorCost'],
    filled: number[]
  ): ColorGroup[] {
    const radius = 40;
    const packStep = 24;
    const loneStep = 36;
    const minGap = 34;
    const maxSweep = 168;
    const draft: ColorGroup[] = bars.map((bar, barIndex) => ({
      barIndex,
      color: bar.color,
      slots: Array.from({ length: bar.cost }, (_, index) => ({
        index,
        filled: index < (filled[barIndex] ?? 0),
        x: 50,
        y: 50,
      })),
    }));
    const count = draft.length;
    if (count === 0 || draft.every((group) => group.slots.length === 0)) return draft;

    const steps = draft.map((group) =>
      group.slots.length <= 1 ? 0 : count === 1 ? loneStep : packStep
    );
    const packWidth = draft.reduce(
      (sum, group, index) => sum + Math.max(0, group.slots.length - 1) * steps[index],
      0
    );
    const packed = packWidth + Math.max(0, count - 1) * minGap;
    let gap = minGap;
    let sweep = count === 1 ? packWidth : packed;
    if (count > 1 && sweep > maxSweep) {
      const scale = maxSweep / sweep;
      steps.forEach((_, index) => {
        steps[index] *= scale;
      });
      gap *= scale;
      sweep = maxSweep;
    }

    let angle = 270 - sweep / 2;
    draft.forEach((group, groupIndex) => {
      const step = steps[groupIndex];
      group.slots.forEach((slot, slotIndex) => {
        const rad = (angle * Math.PI) / 180;
        slot.x = 50 + Math.cos(rad) * radius;
        slot.y = 50 + Math.sin(rad) * radius;
        if (slotIndex < group.slots.length - 1) angle += step;
      });
      if (groupIndex < count - 1) angle += gap;
    });
    return draft;
  }

  function bonusLines(artifact: Artifact): string[] {
    if ('skillBonuses' in artifact) {
      return Object.entries((artifact as ArtifactTool).skillBonuses ?? {})
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] !== 0)
        .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${key}`);
    }
    if ('attributeBonuses' in artifact) {
      return Object.entries((artifact as ArtifactTrinket).attributeBonuses ?? {})
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] !== 0)
        .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${key}`);
    }
    return [];
  }

  function colorPath(color: CardColor): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function canDrop(barIndex: number, kind: DragKind): boolean {
    if (!working || leaving || complete) return false;
    if (sessionTakeYourTime && progressedThisSession) return false;
    const bar = pattern.artifact.colorCost[barIndex];
    if (!bar) return false;
    if ((pattern.filled[barIndex] ?? 0) >= bar.cost) return false;
    if (kind.payment === 'mastery' && kind.color !== bar.color) return false;
    return canPayArtifactCell(bar.color, kind.payment);
  }

  function firstOpen(kind: DragKind): number | null {
    for (const group of groups) {
      if (canDrop(group.barIndex, kind)) return group.barIndex;
    }
    return null;
  }

  function canDrag(kind: DragKind): boolean {
    if (!attemptLeft || leaving || !working || complete) return false;
    if (kind.payment === 'dreamsphere') {
      if (dreamspheres <= 0) return false;
    } else if ((gs.player.colorMasteryPoints?.[kind.color] ?? 0) <= 0) {
      return false;
    }
    return firstOpen(kind) !== null;
  }

  function barAt(clientX: number, clientY: number, kind: DragKind): number | null {
    const node = document.elementFromPoint(clientX, clientY)?.closest('[data-bar]');
    if (!node) return null;
    const index = Number(node.getAttribute('data-bar'));
    if (!Number.isInteger(index) || !canDrop(index, kind)) return null;
    return index;
  }

  function slotKey(barIndex: number, slotIndex: number): string {
    return `${barIndex}:${slotIndex}`;
  }

  function slotCenter(barIndex: number, slotIndex: number): { x: number; y: number } | null {
    const node = document.querySelector(
      `.overlay .slot[data-bar="${barIndex}"][data-slot="${slotIndex}"]`
    );
    if (!(node instanceof HTMLElement)) return null;
    const box = node.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }

  function playFillSound(completeFill: boolean) {
    playSimSound('plop');
    if (completeFill) playSimSound('glinggling');
  }

  function revealSlot(barIndex: number, slotIndex: number, finishArtifact: boolean) {
    const key = slotKey(barIndex, slotIndex);
    if (pendingReveal.has(key)) {
      const next = new Set(pendingReveal);
      next.delete(key);
      pendingReveal = next;
    }
    playFillSound(finishArtifact);
  }

  function applyPlace(
    barIndex: number,
    payment: ArtifactCellPayment,
    from: { x: number; y: number } | null,
    animate: boolean
  ) {
    const before = pattern.filled[barIndex] ?? 0;
    const result = onPlace(barIndex, payment);
    if (!result) return;
    const filled = 1 + (result.bonus ? 1 : 0);
    if (!animate || !from) {
      playFillSound(result.complete);
      if (result.bonus) {
        window.setTimeout(() => playSimSound('plop'), FLY_STAGGER_MS);
      }
      return;
    }

    const nextPending = new Set(pendingReveal);
    const nextFlyers: Flyer[] = [];
    for (let i = 0; i < filled; i += 1) {
      const slotIndex = before + i;
      const to = slotCenter(barIndex, slotIndex);
      if (!to) continue;
      nextPending.add(slotKey(barIndex, slotIndex));
      nextFlyers.push({
        id: ++flyerSeq,
        color: pattern.artifact.colorCost[barIndex]?.color ?? CardColor.Blue,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        delay: i * FLY_STAGGER_MS,
        barIndex,
        slotIndex,
        finishArtifact: result.complete && i === filled - 1,
      });
    }
    if (nextFlyers.length === 0) {
      playFillSound(result.complete);
      return;
    }
    pendingReveal = nextPending;
    flyers = [...flyers, ...nextFlyers];
  }

  function launchFlyer(node: HTMLElement, flyer: Flyer) {
    const size = 52;
    const half = size / 2;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    const anim = node.animate(
      [
        {
          transform: `translate(${flyer.fromX - half}px, ${flyer.fromY - half}px) scale(1)`,
          opacity: 1,
        },
        {
          transform: `translate(${flyer.toX - half}px, ${flyer.toY - half}px) scale(0.82)`,
          opacity: 1,
        },
      ],
      {
        duration: FLY_MS,
        delay: flyer.delay,
        easing: 'cubic-bezier(0.22, 0.82, 0.2, 1)',
        fill: 'forwards',
      }
    );
    anim.onfinish = () => {
      revealSlot(flyer.barIndex, flyer.slotIndex, flyer.finishArtifact);
      flyers = flyers.filter((item) => item.id !== flyer.id);
    };
    return {
      destroy() {
        anim.cancel();
      },
    };
  }

  function movePointer(event: PointerEvent) {
    if (!press) return;
    if (!drag) {
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      drag = {
        kind: press.kind,
        x: event.clientX,
        y: event.clientY,
        over: barAt(event.clientX, event.clientY, press.kind),
      };
    } else {
      drag = {
        kind: drag.kind,
        x: event.clientX,
        y: event.clientY,
        over: barAt(event.clientX, event.clientY, drag.kind),
      };
    }
  }

  function endPointer(event: PointerEvent) {
    window.removeEventListener('pointermove', movePointer);
    window.removeEventListener('pointerup', endPointer);
    window.removeEventListener('pointercancel', endPointer);
    const currentPress = press;
    const currentDrag = drag;
    press = null;
    drag = null;
    if (!currentPress || event.type === 'pointercancel') return;
    if (currentDrag) {
      const bar = barAt(event.clientX, event.clientY, currentDrag.kind);
      if (bar === null) return;
      applyPlace(bar, currentDrag.kind.payment, null, false);
      return;
    }
    if (currentPress.kind.payment !== 'mastery') return;
    const bar = firstOpen(currentPress.kind);
    if (bar === null) return;
    applyPlace(
      bar,
      'mastery',
      {
        x: currentPress.from.left + currentPress.from.width / 2,
        y: currentPress.from.top + currentPress.from.height / 2,
      },
      true
    );
  }

  function startPress(event: PointerEvent, kind: DragKind) {
    if (event.button !== 0 || !canDrag(kind)) return;
    event.preventDefault();
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    press = {
      kind,
      x: event.clientX,
      y: event.clientY,
      from: target.getBoundingClientRect(),
    };
    window.addEventListener('pointermove', movePointer);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }

  function masteryKind(color: CardColor): DragKind {
    return { payment: 'mastery', color };
  }

  const dreamKind: DragKind = { payment: 'dreamsphere' };

  function swatch(color: CardColor): string {
    return `var(--color-${color})`;
  }

  function slotShownFilled(barIndex: number, slot: CellLayout): boolean {
    return slot.filled && !pendingReveal.has(slotKey(barIndex, slot.index));
  }

  function placeFromKey(event: KeyboardEvent, kind: DragKind) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (kind.payment === 'dreamsphere') return;
    if (!canDrag(kind)) return;
    const bar = firstOpen(kind);
    if (bar === null) return;
    const button = event.currentTarget;
    const from =
      button instanceof HTMLElement
        ? (() => {
            const box = button.getBoundingClientRect();
            return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
          })()
        : null;
    applyPlace(bar, 'mastery', from, !!from);
  }

  $effect(() => {
    return () => {
      window.removeEventListener('pointermove', movePointer);
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);
    };
  });

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }
</script>

{#snippet star()}
  <img class="star" src={starPath} alt="" draggable="false" />
{/snippet}

{#snippet goldStar()}
  <span class="gold-star" style:--star="url('{starPath}')"></span>
{/snippet}

{#snippet knowledgeGlyph(kind: DragKind)}
  <span class="glyph">
    {#if kind.payment === 'dreamsphere'}
      <ResourceIcon type={ResourceType.Dreamspheres} />
    {:else}
      <img src={colorPath(kind.color)} alt="" draggable="false" />
    {/if}
  </span>
{/snippet}

<div class="overlay" class:dragging={!!drag} role="presentation" use:portal>
  <div
    class="stage"
    role="dialog"
    aria-modal="true"
    aria-label="Color the artifact"
    style="--table: url('{tablePath}'); --scene: url('{scenePath}'); --page: url('{pagePath}')"
  >
    <div class="scene">
      <section class="sheet dossier" aria-label={pattern.artifact.name}>
        <div class="sheet-body column">
          <div class="dossier-main">
            <h2 class="artifact-name">
              {@render star()}
              {pattern.artifact.name}
              {@render star()}
            </h2>
            {#if knowledgeNeed > 0}
              <div class="meter-block">
                <div
                  class="meter"
                  role="meter"
                  aria-valuenow={knowledgeHave}
                  aria-valuemin={0}
                  aria-valuemax={knowledgeNeed}
                  aria-label="Knowledge set into the artifact"
                >
                  <span
                    class="meter-fill"
                    style:width="{(knowledgeHave / knowledgeNeed) * 100}%"
                  ></span>
                </div>
                <p class="meter-label">{knowledgeHave} / {knowledgeNeed} knowledge</p>
              </div>
            {/if}
            <div class="plate">
              <ArtifactThumb
                patternKey={pattern.artifact.patternKey}
                image={pattern.artifact.image}
                size="fill"
              />
            </div>
            {#if pattern.artifact.description}
              <p class="description">{pattern.artifact.description}</p>
            {/if}
            {#if bonuses.length > 0}
              <ul class="bonuses">
                {#each bonuses as bonus (bonus)}
                  <li class="bonus">
                    <img src={starPath} alt="" draggable="false" />
                    <span>{bonus}</span>
                  </li>
                {/each}
              </ul>
            {/if}
            {#if pattern.pieces.length > 0}
              <h3>
                {@render star()}
                Components
                {@render star()}
              </h3>
              <ul class="components">
                {#each pattern.pieces as piece (piece.name)}
                  <li class="component">
                    <span class="piece-art" title={getPieceDisplayName(piece.name)}>
                      <PieceIcon name={piece.name} />
                    </span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </section>

      {#if !working && !complete}
        <section
          class="plaque"
          aria-label="Choose your crafting pace"
          style:--parchment="url('{parchmentPath}')"
        >
          <span class="medallion" aria-hidden="true">
            <img src={hourglassPath} alt="" draggable="false" />
          </span>
          <h2 class="plaque-title">
            {@render star()}
            Before you begin
            {@render star()}
          </h2>
          <p class="plaque-sub">Choose your crafting pace</p>
          <div class="pace-row">
            <button type="button" class="pace-card" disabled={leaving} onclick={onTakeItSlow}>
              <span class="pace-title">
                {@render goldStar()}
                Take it slow
                {@render goldStar()}
              </span>
              <span class="pace-copy">Guaranteed extra cell, then end this session.</span>
            </button>
            <div class="pace-normal">
              <button type="button" class="pace-card" disabled={leaving} onclick={onBeginPace}>
                <span class="pace-title">
                  {@render goldStar()}
                  Craft normally
                  {@render goldStar()}
                </span>
                <span class="pace-copy">
                  Use knowledge and Focus, with a {paceChance}% chance of extra cells.
                </span>
              </button>
              <div class="focus-line">
                <span class="focus-label">Focus</span>
                <div class="stepper">
                  <button
                    type="button"
                    aria-label="Spend less focus"
                    disabled={leaving || focusToSpend <= 0}
                    onclick={() => onFocus(-1)}
                  >
                    −
                  </button>
                  <span class="stepper-value">{focusToSpend}</span>
                  <button
                    type="button"
                    aria-label="Spend more focus"
                    disabled={leaving || focusToSpend >= focusAvailable}
                    onclick={() => onFocus(1)}
                  >
                    +
                  </button>
                </div>
                <span class="focus-note">Dexterity {dexterity} × 2, plus 5 per focus</span>
              </div>
            </div>
          </div>
        </section>
      {:else if groups.length > 0}
        <div class="apparatus" aria-label="Color cells">
          {#each groups as group (group.barIndex)}
            <div class="socket-group">
              {#each group.slots as slot (`${group.barIndex}-${slot.index}`)}
                {@const shown = slotShownFilled(group.barIndex, slot)}
                {@const next =
                  !shown &&
                  group.slots.find((item) => !slotShownFilled(group.barIndex, item))?.index ===
                    slot.index}
                {@const eligible = drag !== null && canDrop(group.barIndex, drag.kind)}
                <span
                  class="slot"
                  data-bar={group.barIndex}
                  data-slot={slot.index}
                  class:filled={shown}
                  class:eligible={eligible && !shown}
                  class:open={next && working && attemptLeft && !complete}
                  class:hot={next && drag?.over === group.barIndex}
                  style:--swatch={swatch(group.color)}
                  style:--x="{slot.x}%"
                  style:--y="{slot.y}%"
                  role="img"
                  aria-label={shown ? `${group.color} cell filled` : `${group.color} cell empty`}
                >
                  <img
                    src={colorPath(group.color)}
                    alt=""
                    draggable="false"
                    class:dim={!shown}
                  />
                </span>
              {/each}
            </div>
          {/each}
        </div>
      {/if}

      {#if working || complete}
      <section class="sheet ledger" aria-label={working ? 'Knowledge' : 'The work'}>
        <div class="sheet-body">
          {#if complete}
            <h2 class="ledger-title">
              {@render star()}
              The work
              {@render star()}
            </h2>
            <p class="lede">The colors are set. Pick up the artifact when you are ready.</p>
          {:else if working}
            <h2 class="ledger-title">
              {@render star()}
              Knowledge
              {@render star()}
            </h2>
            <div class="knowledge-grid">
              {#each colors as item (item.color)}
                {@const kind = masteryKind(item.color)}
                <button
                  type="button"
                  class="knowledge"
                  disabled={!canDrag(kind)}
                  aria-label={`Click or drag ${item.color} knowledge, ${item.count} available`}
                  onpointerdown={(event) => startPress(event, kind)}
                  onkeydown={(event) => placeFromKey(event, kind)}
                >
                  {@render knowledgeGlyph(kind)}
                  <span class="knowledge-count">{item.count}</span>
                  <span class="knowledge-label">{item.color} knowledge</span>
                </button>
              {/each}
              <button
                type="button"
                class="knowledge"
                disabled={!canDrag(dreamKind)}
                aria-label={`Drag a dreamsphere, ${dreamspheres} available`}
                onpointerdown={(event) => startPress(event, dreamKind)}
              >
                {@render knowledgeGlyph(dreamKind)}
                <span class="knowledge-count">{dreamspheres}</span>
                <span class="knowledge-label">Dreamspheres</span>
              </button>
            </div>

            <section class="care">
              <h3 class="care-title">
                <span class="care-seal">
                  <img src={hourglassPath} alt="" draggable="false" />
                </span>
                {sessionTakeYourTime ? 'Careful crafting' : 'Steady work'}
              </h3>
              {#if notice}
                <p class="notice" aria-live="polite">{notice}</p>
              {/if}
              {#if !progressedThisSession || !sessionTakeYourTime}
                <p class="care-copy">
                  {#if sessionTakeYourTime}
                    The next cell is guaranteed a second.
                  {:else}
                    A color settles on its own circles. A dreamsphere settles on any.
                  {/if}
                </p>
                <p class="care-note">
                  {#if sessionTakeYourTime}
                    This session ends afterward.
                  {:else}
                    Each placement can fill one more cell.
                  {/if}
                </p>
              {/if}
              <p class="pill">
                <img class="pill-glass" src={hourglassPath} alt="" draggable="false" />
                {#if sessionTakeYourTime}
                  {progressedThisSession ? '0 actions remaining' : '1 action remaining'}
                {:else}
                  {chance}% extra cell
                {/if}
              </p>
            </section>
          {/if}
          {#if complete && notice}
            <p class="notice" class:warn={!affordable} aria-live="polite">{notice}</p>
          {:else if complete && !affordable}
            <p class="notice warn">The color work is done. Gold and materials are still short.</p>
          {/if}
        </div>
      </section>
      {/if}
    </div>

    <footer class="actions">
      {#if !working}
        <OrnateButton variant="muted" disabled={leaving} onclick={onBack}>Back</OrnateButton>
      {/if}
      <div class="actions-end">
        {#if complete}
          <OrnateButton disabled={!affordable || leaving} onclick={onFinish}>
            Pick up {pattern.artifact.name}
          </OrnateButton>
        {:else}
          <OrnateButton variant="muted" icon="arrow-left" disabled={leaving} onclick={onLeave}>
            Leave workshop
          </OrnateButton>
        {/if}
      </div>
    </footer>
  </div>

  {#if drag}
    <div class="ghost" style:left="{drag.x}px" style:top="{drag.y}px">
      {@render knowledgeGlyph(drag.kind)}
    </div>
  {/if}

  {#each flyers as flyer (flyer.id)}
    <div class="flyer" use:launchFlyer={flyer}>
      <img src={colorPath(flyer.color)} alt="" draggable="false" />
    </div>
  {/each}
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.72);
  }

  .overlay.dragging,
  .overlay.dragging * {
    cursor: grabbing;
  }

  .stage {
    --scene-ratio: calc(1672 / 941);
    width: min(1600px, calc(100vw - 16px), calc((100vh - 8.5rem) * var(--scene-ratio)));
    max-height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    padding: 0.45rem 0.55rem 0.9rem;
    box-sizing: border-box;
    background: var(--color-wood) var(--table) center / cover;
    border: 2px solid var(--color-deep-brown);
    border-radius: 4px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .scene {
    position: relative;
    container-type: size;
    width: 100%;
    aspect-ratio: 1672 / 941;
    background: var(--scene) center / 100% 100% no-repeat;
  }

  .sheet {
    position: absolute;
    z-index: 2;
    top: 3%;
    bottom: 3.5%;
    width: 23.2%;
    background: var(--page) center / 100% 100% no-repeat;
    filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.38));
  }

  .dossier {
    left: 1.7%;
  }

  .ledger {
    right: 1.7%;
  }

  .sheet-body {
    height: 100%;
    box-sizing: border-box;
    overflow: auto;
    padding: calc(7% + 20px) 8% 6% 7%;
    scrollbar-color: rgba(90, 75, 60, 0.5) transparent;
  }

  .column {
    display: flex;
    flex-direction: column;
  }

  .dossier-main {
    flex: 1 1 auto;
  }

  h2,
  h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45cqw;
    margin: 0;
    font-family: var(--font-narrative);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
  }

  .artifact-name,
  .ledger-title {
    margin-bottom: 0.7cqw;
    font-size: 0.95rem;
    line-height: 1.25;
    color: var(--color-ink);
  }

  .ledger-title {
    margin-bottom: 0.55rem;
  }

  h3 {
    margin: 0.85rem 0 0.55rem;
    font-size: 0.78rem;
    color: var(--color-ink-muted);
  }

  .sheet-body > .ledger-title:first-child {
    margin-top: 0;
  }

  .star {
    width: 1.05cqw;
    height: 1.05cqw;
    flex-shrink: 0;
  }

  .plate {
    width: 72%;
    margin: 0 auto 0.55rem;
    aspect-ratio: 1;
    padding: 7%;
    box-sizing: border-box;
    border: 1px solid rgba(90, 75, 60, 0.45);
    background:
      linear-gradient(rgba(90, 75, 60, 0.2), rgba(90, 75, 60, 0.2)) center / 1px 100% no-repeat,
      linear-gradient(rgba(90, 75, 60, 0.2), rgba(90, 75, 60, 0.2)) center / 100% 1px no-repeat,
      rgba(255, 248, 235, 0.34);
  }

  .description,
  .lede,
  .care-copy,
  .meter-label,
  .notice {
    margin: 0;
    font-family: var(--font-narrative);
    line-height: 1.45;
  }

  .description,
  .lede {
    text-align: center;
    color: var(--color-ink);
  }

  .description {
    font-size: 0.95rem;
  }

  .lede {
    margin-bottom: 0.75rem;
    font-size: 0.92rem;
  }

  .bonuses,
  .components {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.55cqw;
    margin: 0.65rem 0 0;
    padding: 0;
    list-style: none;
  }

  .bonus {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.55rem;
    border: 1px solid var(--color-brass);
    border-radius: 99px;
    background: rgba(255, 248, 235, 0.55);
    font-family: var(--font-narrative);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  .bonus img {
    width: 0.85rem;
    height: 0.85rem;
  }

  .component {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .piece-art {
    display: block;
    width: 4.6cqw;
    height: 4.6cqw;
  }

  .meter-block {
    margin: 0 0 0.75rem;
  }

  .meter {
    height: 0.85rem;
    overflow: hidden;
    border: 1px solid var(--color-brown-border);
    border-radius: 99px;
    background: rgba(44, 37, 29, 0.1);
  }

  .meter-fill {
    display: block;
    height: 100%;
    background: var(--color-blue);
  }

  .meter-label {
    margin-top: 0.3rem;
    text-align: center;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-ink);
  }

  .apparatus {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 47%;
    width: min(46cqw, 82cqh);
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
  }

  .socket-group {
    display: contents;
  }

  .slot {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: 12.5%;
    height: 12.5%;
    display: grid;
    place-items: center;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1.5px solid var(--color-brass);
    background: radial-gradient(circle at 50% 42%, var(--color-wood-hover), var(--color-deep-brown) 72%);
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.7),
      0 1px 2px rgba(0, 0, 0, 0.45);
  }

  .slot.eligible {
    border-color: var(--color-golden);
  }

  .slot img,
  .glyph img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .slot img {
    width: 74%;
    height: 74%;
  }

  .slot img.dim {
    opacity: 0.38;
    filter: grayscale(1);
  }

  .slot.filled {
    border-color: var(--color-golden);
    box-shadow:
      0 0 10px color-mix(in srgb, var(--swatch) 65%, transparent),
      inset 0 0 0 1px rgba(0, 0, 0, 0.35);
  }

  .slot.open {
    animation: pulse 2.6s ease-in-out infinite;
  }

  .slot.hot {
    border-color: var(--color-golden);
    box-shadow: 0 0 12px var(--color-golden);
  }

  .plaque {
    position: absolute;
    z-index: 3;
    left: 27%;
    right: 2.4%;
    top: 50%;
    transform: translateY(-52%);
    padding: 2.1rem 1.15rem 1rem;
    background: var(--color-parchment) var(--parchment) center / cover;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.42);
  }

  .medallion {
    position: absolute;
    left: 50%;
    top: 0;
    display: grid;
    place-items: center;
    width: 3.3rem;
    height: 3.3rem;
    transform: translate(-50%, -52%);
    border: 2px solid var(--color-brass);
    border-radius: 50%;
    background: radial-gradient(circle at 50% 38%, var(--color-wood-hover), var(--color-deep-brown) 70%);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.45);
  }

  .medallion img {
    width: 58%;
    height: 58%;
    object-fit: contain;
  }

  .plaque-title {
    margin: 0;
    font-size: 1.05rem;
  }

  .plaque-sub {
    margin: 0.2rem 0 0.85rem;
    text-align: center;
    font-family: var(--font-narrative);
    font-size: 0.98rem;
    color: var(--color-ink);
  }

  .pace-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem;
    align-items: start;
  }

  .pace-normal {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .pace-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 6.4rem;
    padding: 0.85rem 0.7rem;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    background: var(--color-navy);
    border: 1px solid var(--color-brass);
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px rgba(175, 142, 103, 0.45);
    cursor: pointer;
  }

  .pace-card:hover:not(:disabled) {
    border-color: var(--color-golden);
  }

  .pace-card:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .pace-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pace-copy {
    font-size: 0.92rem;
    line-height: 1.35;
    text-align: center;
    color: var(--color-cream);
  }

  .gold-star {
    display: block;
    width: 0.85rem;
    height: 0.85rem;
    flex-shrink: 0;
    background: var(--color-golden);
    mask: var(--star) center / contain no-repeat;
    -webkit-mask: var(--star) center / contain no-repeat;
  }

  .focus-line {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.35rem 0.55rem;
    padding: 0.35rem 0.25rem 0.15rem;
  }

  .focus-label,
  .focus-note {
    font-family: var(--font-narrative);
    font-size: 0.88rem;
    color: var(--color-ink-muted);
  }

  .focus-label {
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  .knowledge-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35cqw 0.3cqw;
  }

  .knowledge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.05rem;
    padding: 0.3rem 0.15rem 0.4rem;
    color: var(--color-ink);
    font-family: var(--font-narrative);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: grab;
  }

  .knowledge:hover:not(:disabled) {
    border-color: rgba(90, 75, 60, 0.4);
    background: rgba(255, 248, 235, 0.38);
  }

  .knowledge:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .glyph {
    display: block;
    width: 3.6cqw;
    height: 3.6cqw;
  }

  .knowledge-count {
    font-size: 1.05rem;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .knowledge-label {
    font-size: 0.68rem;
    line-height: 1.2;
    letter-spacing: 0.05em;
    text-align: center;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  .care {
    margin-top: 0.85rem;
    padding: 0.6rem 0.4rem 0.55rem;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    background: rgba(255, 248, 235, 0.42);
    text-align: center;
  }

  .care-title {
    flex-direction: column;
    gap: 0.35rem;
    margin: 0 0 0.45rem;
    color: var(--color-ink);
    font-size: 0.78rem;
    letter-spacing: 0.1em;
  }

  .care-seal {
    display: grid;
    place-items: center;
    width: 1.85rem;
    height: 1.85rem;
    flex-shrink: 0;
    border: 1.5px solid var(--color-brass);
    border-radius: 50%;
    background: radial-gradient(circle at 50% 38%, var(--color-wood-hover), var(--color-deep-brown) 72%);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
  }

  .care-seal img,
  .pill-glass {
    display: block;
    object-fit: contain;
  }

  .care-seal img {
    width: 68%;
    height: 68%;
  }

  .care-copy,
  .care-note {
    margin: 0;
    font-family: var(--font-narrative);
    font-size: 0.88rem;
    line-height: 1.35;
  }

  .care-copy {
    color: var(--color-ink);
  }

  .care-note {
    margin-top: 0.12rem;
    color: var(--color-ink-muted);
  }

  .notice {
    margin-bottom: 0.35rem;
    font-size: 0.92rem;
    color: var(--color-ink);
  }

  .notice.warn {
    color: var(--color-red);
  }

  .pill {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: 0.55rem 0 0;
    padding: 0.38rem 0.5rem;
    border: 1px solid var(--color-brass);
    border-radius: 3px;
    background: var(--color-navy);
    box-shadow: inset 0 0 0 1px rgba(175, 142, 103, 0.45);
    font-family: var(--font-narrative);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-align: center;
    text-transform: uppercase;
    color: var(--color-cream);
  }

  .pill-glass {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.15rem;
  }

  .stepper button {
    width: 1.7rem;
    height: 1.7rem;
    padding: 0;
    font-family: var(--font-narrative);
    font-size: 1.15rem;
    line-height: 1;
    color: var(--color-ink);
    background: transparent;
    border: 1px solid var(--color-brown-border);
    border-radius: 3px;
    cursor: pointer;
  }

  .stepper button:disabled {
    cursor: default;
    opacity: 0.35;
  }

  .stepper-value {
    min-width: 0.8rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--color-ink);
  }

  .actions {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0.85rem 1.5% 0.35rem;
  }

  .actions-end {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
  }

  .ghost {
    position: fixed;
    z-index: 5;
    width: 68px;
    height: 68px;
    pointer-events: none;
    transform: translate(-50%, -72%);
    filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.5));
  }

  .ghost .glyph {
    width: 100%;
    height: 100%;
  }

  .flyer {
    position: fixed;
    z-index: 6;
    left: 0;
    top: 0;
    pointer-events: none;
    filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.45));
  }

  .flyer img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.7),
        0 0 0 0 transparent;
    }
    50% {
      box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, 0.7),
        0 0 10px var(--color-golden);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slot.open {
      animation: none;
    }
  }
</style>
