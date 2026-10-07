<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    fortuneBudgetToStats,
    rollExtraBudget,
    type ConjurationAugury,
  } from '@/lib/sim/actions';
  import {
    craftProfile,
    displayPercentRoll,
    formatPointRoll,
    percentThreshold,
    rollConjureOptionCount,
    rollDiscoveryIndex,
    rollPoints,
    type CraftMode,
    type PointRoll,
  } from '@/lib/sim/cards/crafting-skills';
  import { playAddResourceSound } from '@/lib/sim/sound';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly, scale } from 'svelte/transition';
  import IngredientPile from './IngredientPile.svelte';
  import RitualCircle from './RitualCircle.svelte';

  export type RitualCharm = { id: string; icon: string };

export type AuguryBeat = {
  stage: 'learning' | 'insight' | 'inspiration' | 'fortune' | 'shown';
  learning: number | null;
  fortune: number | null;
  optionCount?: number | null;
  discoveryIndex?: number | null;
};

type DiePhase = 'idle' | 'rolling' | 'hit' | 'miss';

  type CharmPhase = 'enter' | 'orbit' | 'exit' | 'seal';

  type CharmMotion = {
    phase: CharmPhase;
    fromX: number | null;
    fromY: number | null;
    start: number;
    delay: number;
    duration: number;
    /** Viewport point where the ingredient was dropped. */
    entryX: number | null;
    entryY: number | null;
    launched: boolean;
    slot: number;
    slotCount: number;
  };

  let {
    selected = $bindable(),
    disabled = false,
    ignite = false,
    dim = false,
    consume = false,
    split = false,
    hideMaterials = false,
    charms = [],
    onCharmLanded,
    onCharmDismiss,
    onIngredientsSealed,
    onFortuneLanded,
    onSealComplete,
    seal = false,
    shapeText = '',
    shapeCost = null,
    atManaLimit = false,
    budgetRemaining = null,
    rollFortune = false,
    rollAugury = false,
    bonusKind = 'enchantment',
    craft = 'enchant',
    onAuguryBeat,
    onAuguryPrepared,
    onAuguryComplete,
    charmEntry = null,
    acceptingDrop = false,
    circleContent,
    vessel,
    showVessel = false,
    showFlank = true,
    suppressCore = false,
    flank,
    children,
  }: {
    selected: Record<ResourceType, number>;
    disabled?: boolean;
    ignite?: boolean;
    dim?: boolean;
    consume?: boolean;
    /** Resources on one side, tray on the other; vessel sits inside the circle. */
    split?: boolean;
    /** Hide the resources column (enchanting uses the card's own mana). */
    hideMaterials?: boolean;
    charms?: RitualCharm[];
    onCharmLanded?: (id: string) => void;
    /** Click an orbiting charm to send it back to the ingredient tray. */
    onCharmDismiss?: (id: string) => void;
    /** Fired once ingredient charms have entered the card, before Fortune rolls. */
    onIngredientsSealed?: () => void;
    /** Fired when Fortune gifts reach the card. */
    onFortuneLanded?: (fortuneBudget: number) => void;
    /** Fired after sealed charms (and optional fortune or augury reveal) finish. */
    onSealComplete?: (result: { fortuneBudget: number; learning?: number }) => void;
    /** Orbiting charms fly into the card, staggered. */
    seal?: boolean;
    /** Line under the circle (ingredient summary). */
    shapeText?: string;
    /** Mana cost delta shown in bold before the shape summary (enchanting). */
    shapeCost?: number | null;
    /** When true, show a red "at mana limit" label under the circle. */
    atManaLimit?: boolean;
    /** Remaining Scope budget points; shown as diamonds under the formula. */
    budgetRemaining?: number | null;
    /** When true, roll Fortune during seal and reveal a positive result. */
    rollFortune?: boolean;
    /** When true, roll Learning then Fortune before conjured cards appear. */
    rollAugury?: boolean;
    /** Split-layout gauges. Enchantment shows Scope and Fortune; creation shows Learning and Fortune. */
    bonusKind?: 'enchantment' | 'creation';
    /** Which craft the bonuses describe. Conjure also rolls visions and new lore. */
    craft?: CraftMode;
    onAuguryBeat?: (beat: AuguryBeat) => void;
    /** Fired as soon as Learning and Fortune are rolled, before the dice finish. */
    onAuguryPrepared?: (result: ConjurationAugury) => void;
    onAuguryComplete?: (result: ConjurationAugury) => void;
    /** Drop point for a charm that is about to join the orbit. */
    charmEntry?: { id: string; x: number; y: number } | null;
    /** Ingredient drag is in progress; highlight the circle. */
    acceptingDrop?: boolean;
    /** Overlay inside the ritual circle (e.g. Unit / Spell pick). */
    circleContent?: Snippet;
    /** Card preview shown inside the circle. */
    vessel?: Snippet;
    showVessel?: boolean;
    showFlank?: boolean;
    /** Fade the rotating core glyph (vessel flight / forming card). */
    suppressCore?: boolean;
    flank?: Snippet;
    children?: Snippet;
  } = $props();

  const TYPES = Object.values(ResourceType);
  const pagePath = getAssetPath('images/ui/backgrounds/book-page.png');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');
  const bookIcon = getUiIconPath('book');
  const starIcon = getUiIconPath('star');
  const spiralIcon = getUiIconPath('spiral');
  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: getUiIconPath('magic_dust'),
    [ResourceType.Mithril]: getUiIconPath('metal_bar'),
    [ResourceType.Moxes]: getUiIconPath('gem'),
  };
  const BEAD = 28;
  const CHARM = 32;
  const FLY_MS = 520;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAGGER = 52;
  const CONJURE_MS = 1500;
  const MAX_SPIN = 12;
  const SUCTION_START = 900;
  const SUCTION_MS = 600;
  const RADIUS_BASE: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 103,
    [ResourceType.Mithril]: 84,
    [ResourceType.Moxes]: 65,
  };
  /** Wider orbits when the forming card sits in the enlarged split circle. */
  const RADIUS_SPLIT: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 214,
    [ResourceType.Mithril]: 202,
    [ResourceType.Moxes]: 190,
  };
  const SPEED: Record<ResourceType, number> = {
    [ResourceType.MagicDust]: 0.0007,
    [ResourceType.Mithril]: -0.00055,
    [ResourceType.Moxes]: 0.00088,
  };
  const CHARM_RADIUS = { base: 88, split: 172 };
  const CHARM_SPEED = 0.00052;
  const CHARM_STAGGER = 120;
  const SEAL_HOLD_MS = 180;
  const FORTUNE_ROLL_MS = 640;
  const FORTUNE_MISS_MS = 280;
  const FORTUNE_HIT_HOLD_MS = 480;
  /** Linger after bonus icons reach the card, before the form closes. */
  const FORTUNE_SEE_MS = 720;
  const DIE_TICK_MS = 40;
  const healthIcon = getAssetPath('images/ui/icons/health-icon-decorated.png');
  const retaliateIcon = getAssetPath('images/ui/icons/retaliate-icon-decorated.png');

  const orbitRadius = $derived(split ? RADIUS_SPLIT : RADIUS_BASE);

  type Token = { id: string; type: ResourceType; unit: number };
  type Flight = {
    dir: 'in' | 'out';
    fromX: number;
    fromY: number;
    start: number;
    delay: number;
    duration: number;
  };

  let fed = $state(0);
  let benchEl: HTMLDivElement | undefined = $state();
  let circleEl: HTMLDivElement | undefined = $state();
  /* eslint-disable svelte/prefer-svelte-reactivity -- mutated every animation frame */
  const tokenEls = new Map<string, HTMLElement>();
  const charmEls = new Map<string, HTMLElement>();
  const lastPos = new Map<string, { x: number; y: number }>();
  const lastCharmPos = new Map<string, { x: number; y: number }>();
  const flights = new Map<string, Flight>();
  const motions = new Map<string, CharmMotion>();
  /* eslint-enable svelte/prefer-svelte-reactivity */
  let orbitIds = $state<{ id: string; icon: string }[]>([]);
  let sealStarted = false;
  let sealFinished = false;
  let sealWasOn = false;
  let sealPending = 0;
  let sealTimer = 0;
  let fortunePhase = $state<DiePhase>('idle');
  let fortunePct = $state(0);
  let fortuneNeed = $state(0);
  let fortuneFace = $state(0);
  let fortuneAnchorEl: HTMLDivElement | undefined = $state();
  let fortuneTarget = 0;
  let fortunePending = 0;
  let fortuneSpinAt = 0;
  let learningPhase = $state<DiePhase>('idle');
  let learningPct = $state(0);
  let learningNeed = $state(0);
  let learningFace = $state(0);
  let learningSpinAt = 0;
  let inspirationPhase = $state<DiePhase>('idle');
  let inspirationPct = $state(0);
  let inspirationNeed = $state(0);
  let inspirationFace = $state(0);
  let inspirationSpinAt = 0;
  let auguryFortunePhase = $state<DiePhase>('idle');
  let auguryFortunePct = $state(0);
  let auguryFortuneNeed = $state(0);
  let auguryFortuneFace = $state(0);
  let auguryFortuneSpinAt = 0;
  let auguryStarted = false;
  let auguryFinished = false;
  let auguryTimer = 0;
  let prevSelected: Record<ResourceType, number> = { ...selected };
  let consumeAt = 0;
  let orbitClock = 0;
  let lastTick = 0;

  const resourceRows = $derived(
    TYPES.map((type) => ({
      type,
      selected: selected[type] ?? 0,
      owned: gs.player.resources[type] ?? 0,
    }))
  );

  const resources = $derived(
    resourceRows
      .filter((row) => row.selected > 0)
      .map((row) => ({ type: row.type, count: row.selected }))
  );

  const profile = $derived(craftProfile(gs.player.craftingSkills, resources, craft));
  let visionCount = $state<number | null>(null);
  let visionDiscovery = $state<number | null>(null);
  let pendingVisions: number | null = null;
  let pendingDiscovery: number | null = null;
  const charge = $derived(
    Math.min(1, resourceRows.reduce((sum, row) => sum + row.selected, 0) / 8)
  );

  const tokens = $derived.by((): Token[] => {
    const list: Token[] = [];
    for (const row of resourceRows) {
      const pile = consume ? row.owned : Math.max(0, row.owned - row.selected);
      const total = pile + row.selected;
      for (let unit = 0; unit < total; unit++) {
        list.push({ id: `${row.type}:${unit}`, type: row.type, unit });
      }
    }
    return list;
  });

  /** Conjure augury drives a separate mastery die; enchant/invoke seal rolls share fortunePhase. */
  const budgetPhase = $derived(craft === 'conjure' ? auguryFortunePhase : fortunePhase);
  const budgetPct = $derived(craft === 'conjure' ? auguryFortunePct : fortunePct);
  const budgetNeed = $derived(craft === 'conjure' ? auguryFortuneNeed : fortuneNeed);
  const budgetFace = $derived(craft === 'conjure' ? auguryFortuneFace : fortuneFace);

  function pointValue(phase: DiePhase, result: number, forecast: string): string {
    if (phase === 'hit' || phase === 'miss') return result > 0 ? `+${result}` : '0';
    return forecast;
  }

  function outcomeNote(
    phase: DiePhase,
    face: number,
    idle: string,
    gained: string,
    none: string
  ): string {
    if (phase === 'idle' || phase === 'rolling') return idle;
    return face > 0 ? `+${face} ${gained}` : none;
  }

  /** Pause so the player can read the settled roll. Always linger on a gain. */
  function settleHold(phase: DiePhase, need: number, face: number): number {
    if (reduceMotion) return 0;
    if (face > 0) return phase === 'hit' ? FORTUNE_SEE_MS : FORTUNE_HIT_HOLD_MS;
    if (need <= 0) return 0;
    return phase === 'hit' ? FORTUNE_HIT_HOLD_MS : FORTUNE_MISS_MS;
  }

  function padPct(value: number): string {
    return String(Math.max(0, Math.min(100, value))).padStart(2, '0');
  }

  type ChanceSetters = {
    setPhase: (p: DiePhase) => void;
    setPct: (n: number) => void;
    setNeed: (n: number) => void;
    setFace: (n: number) => void;
    setSpinAt: (n: number) => void;
  };

  /** Animate a d100 against the fractional chance. `result` is the final point total. */
  function beginChanceRoll(
    roll: PointRoll,
    result: number,
    setters: ChanceSetters,
    onSettled: (phase: DiePhase) => void,
    useSealTimer = false
  ) {
    const need = percentThreshold(roll.chance);
    const bonus = result > roll.sure;
    setters.setNeed(need);
    setters.setFace(result);

    const finish = (phase: DiePhase, pct: number) => {
      setters.setPct(pct);
      setters.setPhase(phase);
      if (phase === 'hit') playAddResourceSound();
      onSettled(phase);
    };

    if (need <= 0) {
      finish(result > 0 ? 'hit' : 'miss', 0);
      return;
    }
    if (reduceMotion) {
      finish(bonus ? 'hit' : 'miss', displayPercentRoll(bonus, need));
      return;
    }

    setters.setPct(1 + Math.floor(Math.random() * 100));
    setters.setSpinAt(performance.now());
    setters.setPhase('rolling');
    const settle = () => finish(bonus ? 'hit' : 'miss', displayPercentRoll(bonus, need));
    if (useSealTimer) {
      if (sealTimer) clearTimeout(sealTimer);
      sealTimer = window.setTimeout(() => {
        sealTimer = 0;
        if (sealFinished) return;
        settle();
      }, FORTUNE_ROLL_MS);
    } else {
      armAugury(FORTUNE_ROLL_MS, settle);
    }
  }

  const eruditionGauge = $derived({
    label: 'Erudition',
    value: pointValue(learningPhase, learningFace, formatPointRoll(profile.knowledge)),
    note:
      craft === 'conjure'
        ? ''
        : outcomeNote(learningPhase, learningFace, 'Chance of learning', 'knowledge', 'No learning'),
    fill: Math.min(1, profile.knowledge.expected / 2),
    extra: (learningPhase === 'hit' || learningPhase === 'miss') && learningFace > 0,
    pct: learningPct,
    need: learningNeed,
    phase: learningPhase,
  });

  const masteryGauge = $derived({
    label: 'Mastery',
    value: pointValue(budgetPhase, budgetFace, formatPointRoll(profile.extraBudget)),
    note:
      craft === 'conjure'
        ? ''
        : outcomeNote(budgetPhase, budgetFace, 'Extra budget', 'budget', 'No bonus'),
    fill: Math.min(1, profile.extraBudget.expected / 2),
    extra: (budgetPhase === 'hit' || budgetPhase === 'miss') && budgetFace > 0,
    pct: budgetPct,
    need: budgetNeed,
    phase: budgetPhase,
  });

  const inspirationGauge = $derived.by(() => {
    if (craft === 'invoke') {
      const cap = profile.scope;
      return {
        label: 'Inspiration',
        value: cap > 0 ? `${charms.length} / ${cap}` : '0',
        note: 'Ingredients',
        fill: cap > 0 ? Math.min(1, charms.length / cap) : 0,
        extra: false,
        pct: 0,
        need: 0,
        phase: 'idle' as DiePhase,
      };
    }
    if (craft === 'enchant') {
      const mana = profile.scope;
      return {
        label: 'Inspiration',
        value: mana > 0 ? `±${mana}` : '0',
        note: 'Mana',
        fill: Math.min(1, mana / 3),
        extra: false,
        pct: 0,
        need: 0,
        phase: 'idle' as DiePhase,
      };
    }
    const rolled = inspirationPhase === 'hit' || inspirationPhase === 'miss';
    const count = rolled ? inspirationFace : null;
    return {
      label: 'Inspiration',
      value: rolled ? String(count) : formatPointRoll(profile.conjureOptions),
      note: '',
      fill: Math.min(1, (count ?? profile.conjureOptions.expected) / 4),
      extra: rolled && count! > profile.conjureOptions.sure,
      pct: inspirationPct,
      need: inspirationNeed,
      phase: inspirationPhase,
    };
  });

  function setCount(type: ResourceType, value: number) {
    const owned = gs.player.resources[type] ?? 0;
    selected = { ...selected, [type]: Math.min(owned, Math.max(0, value)) };
  }

  function ease(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function tokenId(type: ResourceType, unit: number): string {
    return `${type}:${unit}`;
  }

  function registerToken(node: HTMLElement, id: string) {
    tokenEls.set(id, node);
    return {
      destroy() {
        tokenEls.delete(id);
        lastPos.delete(id);
      },
    };
  }

  function registerCharm(node: HTMLElement, id: string) {
    charmEls.set(id, node);
    return {
      destroy() {
        charmEls.delete(id);
      },
    };
  }

  function charmNest(id: string, bench: DOMRect): { x: number; y: number } | null {
    if (!benchEl) return null;
    for (const node of benchEl.querySelectorAll('[data-charm-nest]')) {
      if (node.getAttribute('data-charm-nest') === id) return benchPoint(node, bench);
    }
    return null;
  }

  function blankMotion(now: number, phase: CharmPhase): CharmMotion {
    return {
      phase,
      fromX: null,
      fromY: null,
      start: now,
      delay: 0,
      duration: FLY_MS,
      entryX: null,
      entryY: null,
      launched: false,
      slot: 0,
      slotCount: 1,
    };
  }

  function beginEnter(
    charm: RitualCharm,
    entry: { id: string; x: number; y: number } | null,
    now: number
  ) {
    const dropped = entry?.id === charm.id ? entry : null;
    motions.set(charm.id, {
      ...blankMotion(now, reduceMotion ? 'orbit' : 'enter'),
      entryX: dropped?.x ?? null,
      entryY: dropped?.y ?? null,
    });
    if (orbitIds.some((actor) => actor.id === charm.id)) {
      orbitIds = orbitIds.map((actor) =>
        actor.id === charm.id ? { id: charm.id, icon: charm.icon } : actor
      );
    } else {
      orbitIds = [...orbitIds, { id: charm.id, icon: charm.icon }];
      fed += 1;
    }
  }

  function beginExit(id: string, now: number) {
    if (reduceMotion) {
      motions.delete(id);
      lastCharmPos.delete(id);
      orbitIds = orbitIds.filter((actor) => actor.id !== id);
      return;
    }
    const pos = lastCharmPos.get(id);
    motions.set(id, {
      ...blankMotion(now, 'exit'),
      fromX: pos?.x ?? null,
      fromY: pos?.y ?? null,
      duration: Math.round(FLY_MS * 0.75),
      launched: true,
    });
  }

  function syncCharms(next: RitualCharm[], entry: { id: string; x: number; y: number } | null) {
    if (sealStarted) return;
    const now = performance.now();
    const nextIds = new Set(next.map((charm) => charm.id));
    for (const actor of orbitIds) {
      const motion = motions.get(actor.id);
      if (!nextIds.has(actor.id) && motion && motion.phase !== 'exit') beginExit(actor.id, now);
    }
    for (const charm of next) {
      const motion = motions.get(charm.id);
      if (!motion || motion.phase === 'exit') beginEnter(charm, entry, now);
      else {
        const actor = orbitIds.find((item) => item.id === charm.id);
        if (actor && actor.icon !== charm.icon) {
          orbitIds = orbitIds.map((item) =>
            item.id === charm.id ? { id: charm.id, icon: charm.icon } : item
          );
        }
      }
    }
  }

  function armFinish(delay: number, force: boolean) {
    if (sealFinished) return;
    if (sealTimer) {
      clearTimeout(sealTimer);
      sealTimer = 0;
    }
    sealTimer = window.setTimeout(() => {
      sealTimer = 0;
      if (sealFinished) return;
      if (force) {
        for (const actor of orbitIds) {
          if (motions.get(actor.id)?.phase === 'seal') onCharmLanded?.(actor.id);
        }
        motions.clear();
        orbitIds = [];
      }
      beginFortuneOrFinish();
    }, delay);
  }

  function beginFortuneOrFinish() {
    // Conjure reveals visions before the card options; use the dedicated augury sequence.
    if (bonusKind === 'creation' && craft === 'conjure') {
      beginAugury();
      return;
    }
    onIngredientsSealed?.();
    const learning = rollPoints(profile.knowledge.expected);
    const wantFortune = rollFortune || bonusKind === 'creation';
    const fortune = wantFortune ? rollExtraBudget(profile.extraBudget.expected) : 0;
    if (bonusKind === 'creation') {
      onAuguryPrepared?.({ learning, fortuneBudget: fortune });
    }
    beginChanceRoll(
      profile.knowledge,
      learning,
      {
        setPhase: (p) => (learningPhase = p),
        setPct: (n) => (learningPct = n),
        setNeed: (n) => (learningNeed = n),
        setFace: (n) => (learningFace = n),
        setSpinAt: (n) => (learningSpinAt = n),
      },
      (learningEnd) => {
        const hold = settleHold(learningEnd, learningNeed, learning);
        const afterLearning = () => {
          if (!wantFortune) {
            finishSeal(0, learning);
            return;
          }
          fortuneTarget = fortune;
          beginChanceRoll(
            profile.extraBudget,
            fortune,
            {
              setPhase: (p) => (fortunePhase = p),
              setPct: (n) => (fortunePct = n),
              setNeed: (n) => (fortuneNeed = n),
              setFace: (n) => (fortuneFace = n),
              setSpinAt: (n) => (fortuneSpinAt = n),
            },
            (fortuneEnd) => {
              if (fortune > 0 && craft === 'enchant') {
                const pause = reduceMotion || fortuneNeed <= 0 ? 0 : 180;
                if (sealTimer) clearTimeout(sealTimer);
                sealTimer = window.setTimeout(() => {
                  sealTimer = 0;
                  if (sealFinished) return;
                  launchFortuneGifts(fortune);
                }, pause);
              } else {
                const pause = settleHold(fortuneEnd, fortuneNeed, fortune);
                if (sealTimer) clearTimeout(sealTimer);
                sealTimer = window.setTimeout(() => {
                  sealTimer = 0;
                  finishSeal(fortune, learning);
                }, pause);
              }
            },
            true
          );
        };
        if (hold <= 0) afterLearning();
        else {
          if (sealTimer) clearTimeout(sealTimer);
          sealTimer = window.setTimeout(() => {
            sealTimer = 0;
            if (sealFinished) return;
            afterLearning();
          }, hold);
        }
      },
      true
    );
  }

  function launchFortuneGifts(budget: number) {
    if (sealFinished) return;
    const { health, retaliate } = fortuneBudgetToStats(budget);
    if (!benchEl || health + retaliate <= 0) {
      if (budget > 0) onFortuneLanded?.(budget);
      finishSeal(budget, learningFace);
      return;
    }
    const bench = benchEl.getBoundingClientRect();
    const origin = benchPoint(fortuneAnchorEl ?? benchEl, bench);
    const gifts: { id: string; icon: string }[] = [];
    for (let i = 0; i < health; i++) {
      gifts.push({ id: `fortune:hp:${i}`, icon: healthIcon });
    }
    for (let i = 0; i < retaliate; i++) {
      gifts.push({ id: `fortune:ret:${i}`, icon: retaliateIcon });
    }
    const now = performance.now();
    fortunePending = gifts.length;
    gifts.forEach((gift, index) => {
      motions.set(gift.id, {
        ...blankMotion(now, 'seal'),
        fromX: origin.x,
        fromY: origin.y,
        delay: index * 110,
        duration: 680,
        launched: true,
        slot: index,
        slotCount: gifts.length,
      });
    });
    orbitIds = [...orbitIds, ...gifts];
    playAddResourceSound();
  }

  function publishAugury(beat: AuguryBeat) {
    onAuguryBeat?.(beat);
  }

  function finishAugury(learning: number, fortuneBudget: number) {
    if (auguryFinished) return;
    auguryFinished = true;
    onAuguryComplete?.({
      learning,
      fortuneBudget,
      optionCount: pendingVisions ?? visionCount ?? undefined,
      discoveryIndex: pendingDiscovery ?? visionDiscovery ?? undefined,
    });
    if (sealStarted && !sealFinished) finishSeal(fortuneBudget, learning);
  }

  function armAugury(delay: number, next: () => void) {
    if (auguryTimer) clearTimeout(auguryTimer);
    auguryTimer = window.setTimeout(() => {
      auguryTimer = 0;
      if (auguryFinished) return;
      next();
    }, delay);
  }

  function settleLearningHold(learning: number, fortune: number, learningEnd: DiePhase) {
    const hold = settleHold(learningEnd, learningNeed, learning);
    armAugury(hold, () => {
      if (craft === 'conjure') startAuguryInspiration(learning, fortune);
      else startAuguryFortune(learning, fortune);
    });
  }

  function settleLearning(learning: number, fortune: number, learningEnd: DiePhase) {
    publishAugury({ stage: 'insight', learning, fortune: null });
    settleLearningHold(learning, fortune, learningEnd);
  }

  function startAuguryInspiration(learning: number, fortune: number) {
    publishAugury({
      stage: 'inspiration',
      learning,
      fortune: null,
      optionCount: null,
    });
    const count = pendingVisions ?? 2;
    beginChanceRoll(
      profile.conjureOptions,
      count,
      {
        setPhase: (p) => (inspirationPhase = p),
        setPct: (n) => (inspirationPct = n),
        setNeed: (n) => (inspirationNeed = n),
        setFace: (n) => (inspirationFace = n),
        setSpinAt: (n) => (inspirationSpinAt = n),
      },
      (inspirationEnd) => {
        revealVisions();
        publishAugury({
          stage: 'inspiration',
          learning,
          fortune: null,
          optionCount: count,
          discoveryIndex: pendingDiscovery ?? visionDiscovery,
        });
        const hold = settleHold(inspirationEnd, inspirationNeed, count);
        armAugury(hold, () => startAuguryFortune(learning, fortune));
      }
    );
  }

  function startAuguryFortune(learning: number, fortune: number) {
    publishAugury({
      stage: 'fortune',
      learning,
      fortune: null,
      optionCount: visionCount,
      discoveryIndex: visionDiscovery,
    });
    beginChanceRoll(
      profile.extraBudget,
      fortune,
      {
        setPhase: (p) => (auguryFortunePhase = p),
        setPct: (n) => (auguryFortunePct = n),
        setNeed: (n) => (auguryFortuneNeed = n),
        setFace: (n) => (auguryFortuneFace = n),
        setSpinAt: (n) => (auguryFortuneSpinAt = n),
      },
      () => {
        publishAugury({
          stage: 'shown',
          learning,
          fortune,
          optionCount: visionCount,
          discoveryIndex: visionDiscovery,
        });
        armAugury(FORTUNE_SEE_MS, () => finishAugury(learning, fortune));
      }
    );
  }

  function revealVisions() {
    if (craft !== 'conjure') return;
    visionCount = pendingVisions;
    visionDiscovery = pendingDiscovery;
  }

  function beginAugury() {
    if (auguryStarted || auguryFinished) return;
    auguryStarted = true;
    const learning = rollPoints(profile.knowledge.expected);
    const fortune = rollPoints(profile.extraBudget.expected);
    if (craft === 'conjure') {
      pendingVisions = rollConjureOptionCount(profile.inspiration.total);
      pendingDiscovery = rollDiscoveryIndex(profile.discoveryChance, pendingVisions);
    } else {
      pendingVisions = null;
      pendingDiscovery = null;
    }
    onAuguryPrepared?.({
      learning,
      fortuneBudget: fortune,
      optionCount: pendingVisions ?? undefined,
      discoveryIndex: pendingDiscovery ?? undefined,
    });
    publishAugury({ stage: 'learning', learning: null, fortune: null });
    beginChanceRoll(
      profile.knowledge,
      learning,
      {
        setPhase: (p) => (learningPhase = p),
        setPct: (n) => (learningPct = n),
        setNeed: (n) => (learningNeed = n),
        setFace: (n) => (learningFace = n),
        setSpinAt: (n) => (learningSpinAt = n),
      },
      (learningEnd) => settleLearning(learning, fortune, learningEnd)
    );
  }

  function finishSeal(budget: number, learning = 0) {
    if (sealFinished) return;
    sealFinished = true;
    onSealComplete?.({ fortuneBudget: budget, learning });
  }

  function beginSeal(list: RitualCharm[], now: number) {
    if (sealStarted) return;
    sealStarted = true;
    const active = list.filter((charm) => {
      const motion = motions.get(charm.id);
      return motion && motion.phase !== 'exit';
    });
    if (reduceMotion || active.length === 0) {
      for (const charm of active) onCharmLanded?.(charm.id);
      motions.clear();
      orbitIds = [];
      armFinish(0, false);
      return;
    }
    sealPending = active.length;
    active.forEach((charm, index) => {
      motions.set(charm.id, {
        ...blankMotion(now, 'seal'),
        delay: index * CHARM_STAGGER,
        slot: index,
        slotCount: active.length,
      });
    });
    armFinish((active.length - 1) * CHARM_STAGGER + FLY_MS + 480, true);
  }

  function charmOrbitPoint(
    slot: number,
    count: number,
    center: { x: number; y: number }
  ): { x: number; y: number } {
    const n = Math.max(1, count);
    const angle = orbitClock * CHARM_SPEED + (slot / n) * Math.PI * 2;
    const radius = split ? CHARM_RADIUS.split : CHARM_RADIUS.base;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  }

  function liveCharmOrbit(id: string, center: { x: number; y: number }): { x: number; y: number } {
    const ring = orbitIds.filter((actor) => {
      const motion = motions.get(actor.id);
      return motion && (motion.phase === 'enter' || motion.phase === 'orbit');
    });
    const index = Math.max(
      0,
      ring.findIndex((actor) => actor.id === id)
    );
    return charmOrbitPoint(index, ring.length, center);
  }

  function charmDropPoint(motion: CharmMotion, bench: DOMRect): { x: number; y: number } | null {
    if (motion.entryX == null || motion.entryY == null) return null;
    return { x: motion.entryX - bench.left, y: motion.entryY - bench.top };
  }

  function placeCharm(
    id: string,
    x: number,
    y: number,
    scale: number,
    opacity: number,
    flying: boolean
  ) {
    const el = charmEls.get(id);
    if (!el) return;
    lastCharmPos.set(id, { x, y });
    el.style.transform = `translate(${x - CHARM / 2}px, ${y - CHARM / 2}px) scale(${scale})`;
    el.style.opacity = String(opacity);
    el.classList.toggle('flying', flying);
    const motion = motions.get(id);
    const canDismiss =
      !!onCharmDismiss &&
      !sealStarted &&
      !disabled &&
      !id.startsWith('fortune:') &&
      !!motion &&
      (motion.phase === 'orbit' || motion.phase === 'enter');
    el.classList.toggle('interactive', canDismiss);
    el.style.pointerEvents = canDismiss ? 'auto' : 'none';
    el.style.cursor = canDismiss ? 'pointer' : '';
  }

  function dismissCharm(id: string) {
    if (!onCharmDismiss || sealStarted || disabled || id.startsWith('fortune:')) return;
    const motion = motions.get(id);
    if (!motion || (motion.phase !== 'orbit' && motion.phase !== 'enter')) return;
    onCharmDismiss(id);
  }

  function benchPoint(el: Element, bench: DOMRect): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - bench.left,
      y: rect.top + rect.height / 2 - bench.top,
    };
  }

  function pileLocal(index: number): { x: number; y: number } {
    const angle = index * 2.3999632;
    const r = Math.min(14, 3 + Math.sqrt(index) * 4.8);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.4 };
  }

  function nestCenter(type: ResourceType, bench: DOMRect): { x: number; y: number } | null {
    const nest = benchEl?.querySelector(`[data-token-nest="${type}"]`);
    if (!nest) return null;
    return benchPoint(nest, bench);
  }

  function circleCenter(bench: DOMRect): { x: number; y: number } | null {
    if (!circleEl) return null;
    return benchPoint(circleEl, bench);
  }

  function charmLandKind(id: string): 'pigment' | 'essence' | 'rune' | null {
    if (id.startsWith('pigment:')) return 'pigment';
    if (id.startsWith('essence:')) return 'essence';
    if (id.startsWith('rune:') || id.startsWith('incantation:')) return 'rune';
    return null;
  }

  /** Landing spot on the forming card (or circle center as fallback). */
  function charmLand(
    id: string,
    bench: DOMRect,
    center: { x: number; y: number } | null
  ): { x: number; y: number } | null {
    const kind = charmLandKind(id);
    if (kind && benchEl) {
      const nest = benchEl.querySelector(`[data-charm-land="${kind}"]`);
      if (nest) return benchPoint(nest, bench);
    }
    return center;
  }

  function pileTarget(
    type: ResourceType,
    unit: number,
    selectedCount: number,
    bench: DOMRect
  ): { x: number; y: number } | null {
    const nest = nestCenter(type, bench);
    if (!nest) return null;
    const local = pileLocal(unit - selectedCount);
    return { x: nest.x + local.x, y: nest.y + local.y };
  }

  function orbitTarget(
    type: ResourceType,
    unit: number,
    selectedCount: number,
    center: { x: number; y: number }
  ): { x: number; y: number } {
    const n = Math.max(1, selectedCount);
    const angle = orbitClock * SPEED[type] + (unit / n) * Math.PI * 2;
    const radius = orbitRadius[type];
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  }

  function startFlights(type: ResourceType, from: number, to: number, now: number) {
    if (to > from) {
      for (let i = 0; i < to - from; i++) {
        const unit = from + i;
        const id = tokenId(type, unit);
        const pos = lastPos.get(id);
        flights.set(id, {
          dir: 'in',
          fromX: pos?.x ?? 0,
          fromY: pos?.y ?? 0,
          start: now,
          delay: i * STAGGER,
          duration: FLY_MS,
        });
      }
      fed += 1;
      playAddResourceSound();
    } else if (to < from) {
      for (let i = 0; i < from - to; i++) {
        const unit = from - 1 - i;
        const id = tokenId(type, unit);
        const pos = lastPos.get(id);
        flights.set(id, {
          dir: 'out',
          fromX: pos?.x ?? 0,
          fromY: pos?.y ?? 0,
          start: now,
          delay: i * STAGGER,
          duration: FLY_MS,
        });
      }
    }
  }

  function feed(type: ResourceType, next: number) {
    setCount(type, next);
  }

  $effect(() => {
    const next = selected;
    untrack(() => {
      const now = performance.now();
      for (const type of TYPES) {
        const before = prevSelected[type] ?? 0;
        const after = next[type] ?? 0;
        if (before !== after) startFlights(type, before, after, now);
      }
      prevSelected = { ...next };
    });
  });

  $effect(() => {
    const next = charms;
    const entry = charmEntry;
    untrack(() => syncCharms(next, entry));
  });

  function resetAugury() {
    learningPhase = 'idle';
    learningFace = 0;
    learningPct = 0;
    learningNeed = 0;
    inspirationPhase = 'idle';
    inspirationFace = 0;
    inspirationPct = 0;
    inspirationNeed = 0;
    auguryFortunePhase = 'idle';
    auguryFortuneFace = 0;
    auguryFortunePct = 0;
    auguryFortuneNeed = 0;
    auguryStarted = false;
    auguryFinished = false;
    visionCount = null;
    visionDiscovery = null;
    pendingVisions = null;
    pendingDiscovery = null;
    if (auguryTimer) {
      clearTimeout(auguryTimer);
      auguryTimer = 0;
    }
  }

  $effect(() => {
    if (!seal) {
      untrack(() => {
        sealStarted = false;
        sealFinished = false;
        sealPending = 0;
        fortunePhase = 'idle';
        fortuneFace = 0;
        fortunePct = 0;
        fortuneNeed = 0;
        fortuneTarget = 0;
        fortunePending = 0;
        if (sealTimer) {
          clearTimeout(sealTimer);
          sealTimer = 0;
        }
        if (sealWasOn) resetAugury();
        sealWasOn = false;
      });
      return;
    }
    sealWasOn = true;
    untrack(() => beginSeal(charms, performance.now()));
  });

  $effect(() => {
    if (!rollAugury) return;
    untrack(() => beginAugury());
  });

  $effect(() => {
    if (consume) {
      if (!consumeAt) consumeAt = performance.now();
    } else {
      consumeAt = 0;
    }
  });

  function spinBoost(now: number): number {
    if (!ignite || !consumeAt) return 1;
    const t = Math.min(1, (now - consumeAt) / CONJURE_MS);
    return 1 + t * t * (MAX_SPIN - 1);
  }

  function suctionAmount(now: number): number {
    if (!consumeAt) return 0;
    return ease(Math.min(1, Math.max(0, now - consumeAt - SUCTION_START) / SUCTION_MS));
  }

  $effect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const loop = (now: number) => {
      untrack(() => paint(now, reduceMotion));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (sealTimer) clearTimeout(sealTimer);
      if (auguryTimer) clearTimeout(auguryTimer);
    };
  });

  function paint(now: number, reduceMotion: boolean) {
    if (!benchEl) return;
    const dt = lastTick ? Math.min(48, now - lastTick) : 0;
    lastTick = now;
    if (fortunePhase === 'rolling' && now - fortuneSpinAt > DIE_TICK_MS) {
      fortuneSpinAt = now;
      fortunePct = 1 + Math.floor(Math.random() * 100);
    }
    if (learningPhase === 'rolling' && now - learningSpinAt > DIE_TICK_MS) {
      learningSpinAt = now;
      learningPct = 1 + Math.floor(Math.random() * 100);
    }
    if (inspirationPhase === 'rolling' && now - inspirationSpinAt > DIE_TICK_MS) {
      inspirationSpinAt = now;
      inspirationPct = 1 + Math.floor(Math.random() * 100);
    }
    if (auguryFortunePhase === 'rolling' && now - auguryFortuneSpinAt > DIE_TICK_MS) {
      auguryFortuneSpinAt = now;
      auguryFortunePct = 1 + Math.floor(Math.random() * 100);
    }
    const boost = reduceMotion ? 1 : spinBoost(now);
    orbitClock += dt * boost;
    if (circleEl) {
      for (const node of circleEl.querySelectorAll('.ring, .spiral')) {
        for (const anim of node.getAnimations()) {
          anim.playbackRate = boost;
        }
      }
    }
    const bench = benchEl.getBoundingClientRect();
    const center = circleCenter(bench);
    const suction = suctionAmount(now);
    const counts = untrack(() =>
      TYPES.map((type) => {
        const chosen = selected[type] ?? 0;
        const owned = gs.player.resources[type] ?? 0;
        const pile = consume ? owned : Math.max(0, owned - chosen);
        return { type, chosen, pile };
      })
    );

    for (const token of untrack(() => tokens)) {
      const el = tokenEls.get(token.id);
      if (!el) continue;
      const row = counts.find((c) => c.type === token.type);
      if (!row || !center) continue;

      const inCircle = token.unit < row.chosen;
      const orbit = orbitTarget(token.type, token.unit, row.chosen, center);
      const pile = pileTarget(token.type, token.unit, row.chosen, bench);
      const flight = flights.get(token.id);
      const leftover = consume && !inCircle;

      let x: number;
      let y: number;
      let scale = 1;
      let opacity = leftover ? Math.max(0, 1 - suction) : 1;
      let flying = false;

      if (leftover) {
        // Leftovers dissolve where they sit — never feed into the circle.
        const prev = lastPos.get(token.id);
        if (prev) {
          x = prev.x;
          y = prev.y;
        } else if (pile) {
          x = pile.x;
          y = pile.y;
        } else {
          continue;
        }
        scale = 1 - suction * 0.4;
        flying = false;
      } else if (flight) {
        const t = (now - flight.start - flight.delay) / flight.duration;
        if (t < 0) {
          x = flight.fromX;
          y = flight.fromY;
        } else if (reduceMotion || t >= 1) {
          flights.delete(token.id);
          const dest = flight.dir === 'in' ? orbit : (pile ?? orbit);
          x = dest.x;
          y = dest.y;
        } else {
          flying = true;
          const dest = flight.dir === 'in' ? orbit : (pile ?? orbit);
          const k = ease(t);
          x = lerp(flight.fromX, dest.x, k);
          y = lerp(flight.fromY, dest.y, k);
        }
      } else if (inCircle) {
        x = orbit.x;
        y = orbit.y;
      } else if (pile) {
        const prev = lastPos.get(token.id);
        x = prev ? lerp(prev.x, pile.x, 0.22) : pile.x;
        y = prev ? lerp(prev.y, pile.y, 0.22) : pile.y;
      } else {
        continue;
      }

      if (consume && suction > 0 && inCircle) {
        x = lerp(x, center.x, suction);
        y = lerp(y, center.y, suction);
        scale = 1 - suction * 0.85;
        opacity = 1 - suction;
        flying = false;
      }

      lastPos.set(token.id, { x, y });
      el.style.transform = `translate(${x - BEAD / 2}px, ${y - BEAD / 2}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.classList.toggle('flying', flying);
    }
    paintCharms(now, bench, center);
  }

  function paintCharms(now: number, bench: DOMRect, center: { x: number; y: number } | null) {
    if (!center) return;
    const removed: string[] = [];
    const landed: string[] = [];

    for (const actor of orbitIds) {
      const motion = motions.get(actor.id);
      const el = charmEls.get(actor.id);
      if (!motion || !el) continue;

      if (motion.phase === 'orbit') {
        const orbit = liveCharmOrbit(actor.id, center);
        placeCharm(actor.id, orbit.x, orbit.y, 1, 1, false);
        continue;
      }

      if (motion.phase === 'seal' && !motion.launched) {
        const orbit = charmOrbitPoint(motion.slot, motion.slotCount, center);
        if (now - motion.start - motion.delay < 0) {
          placeCharm(actor.id, orbit.x, orbit.y, 1, 1, false);
          continue;
        }
        motion.launched = true;
        motion.fromX = orbit.x;
        motion.fromY = orbit.y;
        motion.start = now;
        motion.delay = 0;
      }

      if (motion.fromX == null || motion.fromY == null) {
        const origin =
          motion.phase === 'exit'
            ? (lastCharmPos.get(actor.id) ?? center)
            : (charmDropPoint(motion, bench) ?? charmNest(actor.id, bench) ?? center);
        motion.fromX = origin.x;
        motion.fromY = origin.y;
        if (motion.phase === 'enter') motion.start = now;
      }

      const dest =
        motion.phase === 'seal'
          ? (charmLand(actor.id, bench, center) ?? center)
          : motion.phase === 'exit'
            ? (charmNest(actor.id, bench) ?? center)
            : liveCharmOrbit(actor.id, center);

      const t = (now - motion.start - motion.delay) / motion.duration;
      if (t >= 1) {
        if (motion.phase === 'enter') {
          motion.phase = 'orbit';
          placeCharm(actor.id, dest.x, dest.y, 1, 1, false);
        } else {
          removed.push(actor.id);
          if (motion.phase === 'seal') landed.push(actor.id);
        }
        continue;
      }

      const k = ease(Math.max(0, t));
      const x = lerp(motion.fromX, dest.x, k);
      const y = lerp(motion.fromY, dest.y, k);
      let scale = 1;
      let opacity = 1;
      if (motion.phase === 'seal') {
        scale = lerp(1, 0.4, k);
        opacity = k > 0.78 ? 1 - (k - 0.78) / 0.22 : 1;
      } else if (motion.phase === 'exit') {
        scale = lerp(1, 0.7, k);
        opacity = 1 - k;
      }
      placeCharm(actor.id, x, y, scale, opacity, motion.phase !== 'exit');
    }

    if (removed.length) {
      for (const id of removed) {
        motions.delete(id);
        lastCharmPos.delete(id);
      }
      orbitIds = orbitIds.filter((actor) => !removed.includes(actor.id));
    }
    for (const id of landed) onCharmLanded?.(id);
    if (sealStarted && landed.length) {
      const ritualLands = landed.filter((id) => !id.startsWith('fortune:'));
      const fortuneLands = landed.filter((id) => id.startsWith('fortune:'));
      if (ritualLands.length) {
        sealPending -= ritualLands.length;
        if (sealPending <= 0) armFinish(SEAL_HOLD_MS, false);
      }
      if (fortuneLands.length) {
        fortunePending -= fortuneLands.length;
        if (fortunePending <= 0) {
          onFortuneLanded?.(fortuneTarget);
          sealTimer = window.setTimeout(() => {
            sealTimer = 0;
            finishSeal(fortuneTarget, learningFace);
          }, FORTUNE_SEE_MS);
        }
      }
    }
  }
</script>

{#snippet percentDie(phase: DiePhase, pct: number, need: number, label: string)}
  {#if phase !== 'idle' && need > 0}
    <div class="fortune-die-slot">
      <div
        class="pct-die"
        class:rolling={phase === 'rolling'}
        class:hit={phase === 'hit'}
        class:miss={phase === 'miss'}
        aria-live="polite"
        aria-label={phase === 'rolling'
          ? `Rolling ${label}, need ${need} or less`
          : phase === 'hit'
            ? `${label} ${padPct(pct)} beats ${need}`
            : `${label} ${padPct(pct)} misses ${need}`}
      >
        <span class="pct-roll">{padPct(pct)}</span>
        <span class="pct-mark">≤</span>
        <span class="pct-need">{need}</span>
      </div>
    </div>
  {/if}
{/snippet}

{#snippet percentDieAnchor(phase: DiePhase, pct: number, need: number, label: string)}
  {#if phase !== 'idle' && need > 0}
    <div class="fortune-die-slot" bind:this={fortuneAnchorEl}>
      <div
        class="pct-die"
        class:rolling={phase === 'rolling'}
        class:hit={phase === 'hit'}
        class:miss={phase === 'miss'}
        aria-live="polite"
        aria-label={phase === 'rolling'
          ? `Rolling ${label}, need ${need} or less`
          : phase === 'hit'
            ? `${label} ${padPct(pct)} beats ${need}`
            : `${label} ${padPct(pct)} misses ${need}`}
      >
        <span class="pct-roll">{padPct(pct)}</span>
        <span class="pct-mark">≤</span>
        <span class="pct-need">{need}</span>
      </div>
    </div>
  {/if}
{/snippet}

<div
  class="bench"
  class:consume
  class:auguring={rollAugury}
  class:settled={dim && !ignite}
  class:split
  class:no-materials={hideMaterials}
  bind:this={benchEl}
  style="--page: url('{pagePath}'); --plaque: url('{parchmentPath}')"
>
  <div class="prep" class:split class:no-materials={hideMaterials}>
    {#if !hideMaterials}
      {#if split}
        <div class="materials-col">
          <h3 class="col-title">Resources</h3>
          <div class="materials resources-board">
            {#each resourceRows as row (row.type)}
              <IngredientPile
                type={row.type}
                selected={row.selected}
                owned={row.owned}
                {disabled}
                showCount
                showIcon={false}
                layout="row"
                onChange={(next) => feed(row.type, next)}
              />
            {/each}
          </div>
          <div class="fortune-stage">
            <div class="gauge-pair">
              <div class="gauge chart" class:extra={inspirationGauge.extra}>
                <img class="gauge-icon" src={spiralIcon} alt="" />
                <div class="gauge-head">
                  <span class="gauge-label">{inspirationGauge.label}</span>
                  <span class="gauge-value" class:extra={inspirationGauge.extra}
                    >{inspirationGauge.value}</span
                  >
                </div>
                <span class="gauge-track" aria-hidden="true">
                  <span class="gauge-fill" style="width: {inspirationGauge.fill * 100}%"></span>
                </span>
                {#if inspirationGauge.note}
                  <span class="augury-note">{inspirationGauge.note}</span>
                {/if}
              </div>
              <div
                class="gauge chart"
                class:fortune-live={learningPhase === 'rolling' || learningPhase === 'hit'}
                class:extra={eruditionGauge.extra}
              >
                <img class="gauge-icon" src={bookIcon} alt="" />
                <div class="gauge-head">
                  <span class="gauge-label">{eruditionGauge.label}</span>
                  <span class="gauge-value" class:extra={eruditionGauge.extra}
                    >{eruditionGauge.value}</span
                  >
                </div>
                <span class="gauge-track" aria-hidden="true">
                  <span class="gauge-fill" style="width: {eruditionGauge.fill * 100}%"></span>
                </span>
                {#if eruditionGauge.note}
                  <span class="augury-note" class:miss={learningPhase === 'miss' && learningFace <= 0}
                    >{eruditionGauge.note}</span
                  >
                {/if}
                {@render percentDie(learningPhase, learningPct, learningNeed, 'Erudition')}
              </div>
              <div
                class="gauge chart"
                class:fortune-live={budgetPhase === 'rolling' || budgetPhase === 'hit'}
                class:extra={masteryGauge.extra}
              >
                <img class="gauge-icon" src={starIcon} alt="" />
                <div class="gauge-head">
                  <span class="gauge-label">{masteryGauge.label}</span>
                  <span class="gauge-value" class:extra={masteryGauge.extra}
                    >{masteryGauge.value}</span
                  >
                </div>
                <span class="gauge-track" aria-hidden="true">
                  <span class="gauge-fill" style="width: {masteryGauge.fill * 100}%"></span>
                </span>
                {#if masteryGauge.note}
                  <span class="augury-note" class:miss={budgetPhase === 'miss' && budgetFace <= 0}
                    >{masteryGauge.note}</span
                  >
                {/if}
                {#if craft === 'enchant' || craft === 'invoke'}
                  {@render percentDieAnchor(budgetPhase, budgetPct, budgetNeed, 'Mastery')}
                {:else}
                  {@render percentDie(budgetPhase, budgetPct, budgetNeed, 'Mastery')}
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="materials">
          {#each resourceRows as row (row.type)}
            <IngredientPile
              type={row.type}
              selected={row.selected}
              owned={row.owned}
              {disabled}
              showCount
              showIcon={false}
              onChange={(next) => feed(row.type, next)}
            />
          {/each}
        </div>
        {#if craft === 'conjure'}
          <div
            class="gauge vision-gauge"
            class:fortune-live={inspirationPhase === 'rolling' || inspirationPhase === 'hit'}
            class:extra={inspirationGauge.extra}
          >
            <span class="gauge-label">{inspirationGauge.label}</span>
            <span class="gauge-track" aria-hidden="true">
              <span class="gauge-fill" style="transform: scaleX({inspirationGauge.fill})"></span>
            </span>
            <span class="gauge-value" class:extra={inspirationGauge.extra}>{inspirationGauge.value}</span>
            {@render percentDie(inspirationPhase, inspirationPct, inspirationNeed, 'Inspiration')}
          </div>
        {/if}
      {/if}
    {/if}

    <div class="ritual" class:flanked={!split} class:drop-hot={acceptingDrop} data-ingredient-drop>
      {#if !split}
        <div class="gauge-row">
          <div
            class="gauge"
            class:fortune-live={learningPhase === 'rolling' || learningPhase === 'hit'}
          >
            <span class="gauge-label">{eruditionGauge.label}</span>
            <span class="gauge-track" aria-hidden="true">
              <span class="gauge-fill" style="transform: scaleX({eruditionGauge.fill})"></span>
            </span>
            <span class="gauge-value" class:extra={eruditionGauge.extra}>{eruditionGauge.value}</span>
          </div>
          {#if eruditionGauge.note}
            <span class="augury-note" class:miss={learningPhase === 'miss' && learningFace <= 0}>{eruditionGauge.note}</span>
          {/if}
          {@render percentDie(learningPhase, learningPct, learningNeed, 'Erudition')}
        </div>
      {/if}

      <div class="ritual-core">
        <div class="circle-slot" bind:this={circleEl}>
          <RitualCircle
            {charge}
            {ignite}
            {dim}
            {fed}
            ornate={split}
            suppressCore={suppressCore || showVessel}
          />
          {#if circleContent}
            <div class="circle-content">{@render circleContent()}</div>
          {/if}
          {#if showVessel && vessel}
            <div class="vessel">
              <div class="vessel-inner" in:scale={{ start: 0.72, duration: 420, easing: cubicOut }}>
                {@render vessel()}
              </div>
            </div>
          {/if}
        </div>
      </div>

      {#if split}
        <div class="shape-block" class:ready={showVessel}>
          <p
            class="shape-hint"
            aria-hidden={!showVessel || !(shapeText || shapeCost)}
          >
            {#if shapeCost != null && shapeCost !== 0}
              <strong class="shape-cost" class:cut={shapeCost < 0}
                >{shapeCost > 0 ? '+' : ''}{shapeCost} mana</strong
              >{shapeText ? ' · ' : ''}
            {/if}
            {shapeText || '\u00a0'}
          </p>
          {#if budgetRemaining != null && budgetRemaining > 0}
            <div
              class="budget-remaining"
              aria-label="{budgetRemaining} budget remaining"
            >
              {#each Array(budgetRemaining) as _, i (i)}
                <span class="budget-pip" aria-hidden="true"></span>
              {/each}
            </div>
          {:else if atManaLimit}
            <span class="mana-limit">Mana limit</span>
          {/if}
        </div>
      {/if}

      {#if !split}
        <div class="gauge-row">
          <div
            class="gauge"
            class:fortune-live={auguryFortunePhase === 'rolling' || auguryFortunePhase === 'hit'}
          >
            <span class="gauge-label">{masteryGauge.label}</span>
            <span class="gauge-track" aria-hidden="true">
              <span class="gauge-fill" style="transform: scaleX({masteryGauge.fill})"></span>
            </span>
            <span class="gauge-value" class:extra={masteryGauge.extra}>{masteryGauge.value}</span>
          </div>
          {#if masteryGauge.note}
            <span class="augury-note" class:miss={budgetPhase === 'miss' && budgetFace <= 0}>{masteryGauge.note}</span>
          {/if}
          {@render percentDie(auguryFortunePhase, auguryFortunePct, auguryFortuneNeed, 'Mastery')}
        </div>
      {/if}
    </div>
    {#if showFlank && flank}
      <div class="flank" in:fly={{ x: 28, duration: 460, delay: 100 }}>
        <div class="flank-body">{@render flank()}</div>
      </div>
    {/if}
  </div>

  {@render children?.()}

  <div class="beads" aria-hidden="true">
    {#each tokens as token (token.id)}
      <img
        class="bead"
        data-type={token.type}
        src={RESOURCE_ICONS[token.type]}
        alt=""
        use:registerToken={token.id}
      />
    {/each}
    {#each orbitIds as charm (charm.id)}
      <img
        class="charm"
        src={charm.icon}
        alt=""
        role={onCharmDismiss && !charm.id.startsWith('fortune:') ? 'button' : undefined}
        tabindex={onCharmDismiss && !charm.id.startsWith('fortune:') ? 0 : undefined}
        title={onCharmDismiss && !charm.id.startsWith('fortune:') ? 'Click to remove' : undefined}
        use:registerCharm={charm.id}
        onclick={() => dismissCharm(charm.id)}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            dismissCharm(charm.id);
          }
        }}
      />
    {/each}
  </div>
</div>

<style>
  .bench {
    position: relative;
    min-height: 360px;
    flex: 1 1 auto;
    overflow: visible;
  }

  .bench.split {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .prep {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .materials {
    display: flex;
    justify-content: center;
    gap: 18px;
    flex-wrap: wrap;
    transition:
      opacity 0.7s ease,
      transform 0.7s ease;
  }

  .bench.consume .materials {
    opacity: 0;
    transform: translateY(36px) scale(0.45);
    pointer-events: none;
  }

  .vision-gauge {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    margin: 4px 0 0;
    min-width: 7rem;
  }

  .vision-gauge .fortune-die-slot {
    top: 50%;
    bottom: auto;
    left: calc(100% + 10px);
    transform: translateY(-50%);
  }

  .vision-gauge .gauge-value.extra {
    color: var(--color-golden);
  }

  .prep.split {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
    justify-content: stretch;
    gap: 18px;
    width: 100%;
    min-height: 0;
    overflow: visible;
  }

  .prep.split.no-materials {
    grid-template-columns: auto 1fr;
    justify-content: center;
  }

  .col-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin: 0 0 6px;
    width: 100%;
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  .prep.split .materials {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    flex: 0 0 auto;
    gap: 8px;
  }

  .resources-board {
    padding: 8px;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    background: rgba(255, 248, 230, 0.42);
    box-shadow:
      0 6px 14px rgba(42, 24, 16, 0.16),
      inset 0 0 0 1px rgba(255, 248, 230, 0.3);
  }

  .resources-board :global(.pile.row) {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
  }

  .resources-board :global(.pile.row:hover:not(:disabled):not(.empty)) {
    border-color: rgba(90, 75, 60, 0.35);
    background: rgba(255, 248, 230, 0.35);
  }

  .resources-board :global(.pile.row.on) {
    border-color: color-mix(in srgb, var(--color-golden) 65%, transparent);
    background: rgba(191, 161, 74, 0.12);
  }

  .materials-col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    align-self: stretch;
    justify-self: start;
    gap: 8px;
    width: min(14.5rem, 100%);
    max-width: 15rem;
    overflow: visible;
  }

  .fortune-stage {
    position: relative;
    margin-top: auto;
    overflow: visible;
  }

  .materials-col .materials {
    width: 100%;
  }

  .materials-col .gauge-pair {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 10px;
    transform: translateY(-10px);
    padding: 10px 12px 12px;
    border: 1px solid var(--color-brown-border);
    border-radius: 3px;
    background: var(--color-parchment) var(--plaque) center / cover;
    background-blend-mode: multiply;
    box-shadow:
      0 8px 16px rgba(42, 24, 16, 0.22),
      inset 0 0 0 1px rgba(255, 248, 230, 0.35);
  }

  .materials-col .gauge.chart {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    column-gap: 8px;
    row-gap: 3px;
    align-items: center;
    min-width: 0;
    width: 100%;
  }

  .materials-col .gauge.chart .fortune-die-slot {
    top: 50%;
    bottom: auto;
    left: calc(100% + 8px);
    transform: translateY(-50%);
  }

  .materials-col .gauge.chart .gauge-icon {
    grid-row: 1 / span 2;
    align-self: center;
    width: 18px;
    height: 18px;
    object-fit: contain;
    filter: drop-shadow(0 1px 1px rgba(42, 24, 16, 0.35));
  }

  .materials-col .gauge.chart .gauge-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }

  .materials-col .gauge.chart .gauge-label {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-align: left;
    color: var(--color-ink);
  }

  .materials-col .gauge.chart .gauge-value {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
    text-align: right;
  }

  .materials-col .gauge.chart .gauge-value.extra,
  .gauge-value.extra {
    color: var(--color-golden);
  }

  .materials-col .gauge.chart .gauge-track {
    grid-column: 2;
    width: 100%;
    min-width: 0;
    height: 7px;
    border-radius: 999px;
    background: rgba(74, 58, 42, 0.22);
    box-shadow: inset 0 1px 2px rgba(42, 24, 16, 0.28);
    overflow: hidden;
  }

  .materials-col .gauge.chart .gauge-fill {
    display: block;
    height: 100%;
    max-width: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 100%), #1a2433;
    transform: none;
    transform-origin: left center;
    transition: width 0.28s ease;
  }

  .prep.split .ritual {
    justify-self: center;
    align-self: center;
    justify-content: center;
    transform: translateX(-150px);
  }

  .prep.split .circle-slot {
    width: min(400px, 42vh);
    height: min(400px, 42vh);
    margin: 0;
    display: grid;
    place-items: center;
  }

  .shape-hint {
    margin: 100px 0 0;
    max-width: min(24rem, 100%);
    min-height: 2.6em;
    text-align: center;
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    font-style: italic;
    line-height: 1.35;
    color: var(--color-ink);
    text-shadow: 0 1px 0 rgba(244, 232, 208, 0.45);
    /* Keep layout height from pick → ready so the circle does not jump. */
    visibility: hidden;
  }

  .shape-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .shape-block .shape-hint {
    margin: 100px 0 0;
  }

  .shape-block.ready .shape-hint,
  .shape-block.ready .budget-remaining,
  .shape-block.ready .mana-limit {
    visibility: visible;
  }

  .budget-remaining {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 5px;
    margin: 2px 0 0;
    max-width: min(22rem, 100%);
    min-height: 0.7rem;
    visibility: hidden;
  }

  .budget-pip {
    width: 7px;
    height: 7px;
    flex-shrink: 0;
    background: var(--color-brass, #af8e67);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--color-golden, #bfa14a) 35%, transparent),
      0 1px 2px rgba(0, 0, 0, 0.25);
    transform: rotate(45deg);
  }

  .shape-cost {
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .shape-cost.cut {
    color: #3d6b3a;
    text-shadow: 0 1px 0 rgba(244, 232, 208, 0.55);
  }

  .mana-limit {
    display: inline-block;
    margin: 2px 0 0;
    padding: 2px 8px;
    visibility: hidden;
    font-style: normal;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #f5e6e0;
    background: #8a3a32;
    border: 1px solid #6a2a24;
    border-radius: 3px;
    text-shadow: none;
  }

  .fortune-die-slot {
    position: absolute;
    left: calc(100% + 14px);
    bottom: 2px;
    z-index: 6;
    perspective: 120px;
  }

  .materials-col .gauge.chart .augury-note {
    grid-column: 2;
    margin: 0;
    min-height: 1.15em;
    font-size: 0.68rem;
    line-height: 1.15;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-align: left;
    white-space: nowrap;
    color: var(--color-ink-muted);
  }

  .pct-die {
    display: flex;
    align-items: baseline;
    gap: 2px;
    min-width: 3.6rem;
    padding: 0.35rem 0.45rem 0.4rem;
    font-family: var(--font-narrative);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: #2c251d;
    background:
      radial-gradient(circle at 32% 28%, rgba(255, 248, 230, 0.85), transparent 42%),
      linear-gradient(155deg, #f3e6c8 0%, #d4bc8e 46%, #8f7348 100%);
    border: 1px solid #5c4632;
    border-radius: 5px;
    box-shadow:
      inset 0 1px 0 rgba(255, 248, 230, 0.85),
      inset 0 -3px 4px rgba(70, 48, 24, 0.35),
      0 2px 0 #6a5338,
      0 5px 8px rgba(0, 0, 0, 0.38);
    transform: rotate(-4deg);
  }

  .pct-roll {
    font-size: 1.15rem;
    font-weight: 700;
    min-width: 1.5ch;
    text-align: right;
  }

  .pct-mark {
    font-size: 0.72rem;
    font-weight: 600;
    opacity: 0.7;
    margin: 0 1px;
  }

  .pct-need {
    font-size: 0.95rem;
    font-weight: 700;
    opacity: 0.9;
  }

  .pct-die.rolling {
    animation: fortune-tumble 0.12s linear infinite;
  }

  .pct-die.hit {
    animation: fortune-settle 0.3s cubic-bezier(0.22, 1.4, 0.36, 1) both;
  }

  .pct-die.miss {
    opacity: 0.55;
    filter: grayscale(0.45);
    transform: rotate(-4deg);
  }

  .gauge.fortune-live {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-golden, #bfa14a) 55%, transparent);
  }

  .gauge.fortune-live .gauge-fill {
    background: var(--color-golden, #bfa14a);
  }

  @keyframes fortune-tumble {
    0% {
      transform: rotateX(0deg) rotateZ(-8deg) translateY(0);
    }
    45% {
      transform: rotateX(78deg) rotateZ(10deg) translateY(-3px) scaleY(0.82);
    }
    100% {
      transform: rotateX(0deg) rotateZ(-8deg) translateY(0);
    }
  }

  @keyframes fortune-settle {
    0% {
      transform: rotateX(70deg) rotateZ(12deg) scale(1.18);
    }
    55% {
      transform: rotateX(-8deg) rotateZ(-10deg) scale(1.04);
    }
    100% {
      transform: rotate(-4deg) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pct-die.rolling,
    .pct-die.hit {
      animation: none;
    }
  }

  .prep.split .circle-slot :global(.circle) {
    transform: none;
  }

  .circle-slot {
    position: relative;
    width: 200px;
    height: 200px;
    overflow: visible;
  }

  .circle-content {
    position: absolute;
    inset: -36px;
    z-index: 4;
    pointer-events: none;
  }

  .circle-content > :global(*) {
    pointer-events: auto;
  }

  .ritual-core {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .vessel {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 3;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .vessel-inner {
    pointer-events: none;
  }

  .vessel-inner > :global(*) {
    pointer-events: auto;
  }

  .prep.split .materials :global(.pile.row) {
    width: 100%;
  }

  .prep.split .materials :global(.name),
  .prep.split .materials :global(.stock) {
    text-shadow: 0 1px 0 rgba(244, 232, 208, 0.55);
  }

  .flank {
    min-width: 0;
    max-height: none;
    align-self: stretch;
    justify-self: stretch;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 2px 4px 2px 10px;
    border-left: 1px solid rgba(90, 75, 60, 0.28);
    overflow: hidden;
  }

  .prep.split .flank {
    border-left: none;
    gap: 0;
    /* Inset so ingredient labels clear the page's corner ornaments. */
    padding: 26px 30px 32px 44px;
    margin-bottom: 20px;
    background: var(--page) center / 100% 100% no-repeat;
    width: 100%;
    max-width: none;
    transform: translateX(-60px);
  }

  .flank-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }

  @supports not selector(::-webkit-scrollbar) {
    .flank-body {
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .flank-body::-webkit-scrollbar {
    width: 6px;
  }

  .flank-body::-webkit-scrollbar-thumb {
    background: rgba(90, 75, 60, 0.45);
    border-radius: 3px;
  }

  .gauge-pair {
    display: flex;
    justify-content: center;
    gap: 18px;
  }

  .ritual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .ritual.flanked {
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 22px;
  }

  .gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 7rem;
    transition: opacity 0.4s ease;
  }

  .bench.consume:not(.auguring) .gauge,
  .bench.consume:not(.auguring) .gauge-row {
    opacity: 0;
  }

  .bench.consume:not(.auguring) .beads,
  .bench.settled .beads {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .gauge-row {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: opacity 0.4s ease;
  }

  .ritual.flanked .gauge-row {
    flex: 0 0 7.5rem;
  }

  .gauge-row .fortune-die-slot {
    top: 50%;
    bottom: auto;
    left: calc(100% + 10px);
    transform: translateY(-50%);
  }

  .ritual.flanked .gauge-row:first-child .fortune-die-slot {
    left: auto;
    right: calc(100% + 10px);
  }

  .augury-note {
    margin-top: 1px;
    font-family: var(--font-narrative);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--color-ink-muted);
    text-align: center;
  }

  .augury-note.miss {
    opacity: 0.75;
  }

  .gauge-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #4a3f32;
  }

  .gauge-track {
    display: block;
    width: 5.5rem;
    height: 4px;
    overflow: hidden;
    background: rgba(44, 37, 29, 0.16);
    border-radius: 2px;
  }

  .gauge-fill {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--color-brass);
    transform-origin: left center;
    transition: transform 0.28s ease;
  }

  .gauge-value {
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    color: var(--color-ink);
  }

  .beads {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    overflow: visible;
  }

  .bead {
    position: absolute;
    top: 0;
    left: 0;
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.45));
    transform: translate(-999px, -999px);
    opacity: 0;
    will-change: transform, opacity;
  }

  .bead:global(.flying) {
    filter: drop-shadow(0 2px 3px rgba(42, 24, 16, 0.45))
      drop-shadow(0 0 8px rgba(191, 161, 74, 0.55));
  }

  .charm {
    position: absolute;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    object-fit: contain;
    opacity: 0;
    pointer-events: none;
    transform: translate(-999px, -999px);
    filter: drop-shadow(0 3px 4px rgba(42, 24, 16, 0.45));
    will-change: transform, opacity;
  }

  .charm:global(.interactive) {
    z-index: 8;
  }

  .charm:global(.interactive):hover {
    filter: drop-shadow(0 3px 4px rgba(42, 24, 16, 0.45))
      drop-shadow(0 0 8px rgba(191, 161, 74, 0.7));
  }

  .charm:global(.flying) {
    filter: drop-shadow(0 3px 4px rgba(42, 24, 16, 0.45))
      drop-shadow(0 0 8px rgba(191, 161, 74, 0.55));
  }

  .ritual.drop-hot .circle-slot::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--color-golden) 75%, transparent);
    box-shadow: 0 0 16px rgba(191, 161, 74, 0.4);
    pointer-events: none;
    z-index: 6;
  }

  .bench.split {
    container-type: inline-size;
    container-name: invocation;
  }

  @container invocation (max-width: 620px) {
    .prep.split {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .materials-col {
      width: min(16rem, 100%);
      max-width: none;
    }

    .flank {
      width: 100%;
      max-height: 42vh;
      border-left: none;
      border-top: 1px solid rgba(90, 75, 60, 0.28);
      padding-left: 0;
    }

    .prep.split .flank {
      max-height: 46vh;
      padding: 18px 28px 30px;
      border-top: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .materials,
    .gauge,
    .gauge-fill {
      animation: none;
      transition: none;
    }
  }
</style>
