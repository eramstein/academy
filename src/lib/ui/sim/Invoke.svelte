<script lang="ts">
  import {
    CardColor,
    CardType,
    ResourceType,
    type Ability,
    type Action,
    type CardTemplate,
    type UnitKeywords,
  } from '@/lib/_model';
  import { gs, uiState } from '@/lib/_state';
  import { getActionTypeIconPath, getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import { DataEffectTemplates } from '@/lib/battle/effects/effect-templates';
  import {
    commitInvokedCard,
    performAction,
    summonInvokedCard,
    type CardCreationParameters,
    type CardCreationResult,
  } from '@/lib/sim/actions';
  import { buildAbility, getTriggerTemplateLabel } from '@/lib/sim/cards/ability-templates';
  import {
    ACTION_TEMPLATE_KEYS,
    createActionTemplate,
    defaultActionFactoryArgs,
    getActionTooltip,
  } from '@/lib/sim/cards/action-templates';
  import { getAbilityCost, getActionBudget, getKeywordBudget } from '@/lib/sim/cards/card-budget';
  import type { PartialConjuredUnit } from '@/lib/sim/cards/creation';
  import { formatKeywordLabel, KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { playAddResourceSound } from '@/lib/sim/sound';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import FormingCard from './crafting/FormingCard.svelte';
  import IngredientTray, { type EssenceKey } from './crafting/IngredientTray.svelte';
  import RitualStage, { type RitualCharm } from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  let {
    action,
    onDone,
    onBack,
  }: {
    action: Action;
    onDone: () => void;
    onBack?: () => void;
  } = $props();

  const powerIcon = getAssetPath('images/ui/icons/power-icon-decorated.png');
  const healthIcon = getAssetPath('images/ui/icons/health-icon-decorated.png');
  const retaliateIcon = getAssetPath('images/ui/icons/retaliate-icon-decorated.png');

  const ESSENCE_COST: Record<EssenceKey, number> = { power: 4, hp: 2, retaliate: 1 };

  function countsFrom(list: { type: ResourceType; count: number }[]): Record<ResourceType, number> {
    const counts = Object.fromEntries(
      Object.values(ResourceType).map((type) => [type, 0])
    ) as Record<ResourceType, number>;
    for (const resource of list) counts[resource.type] = resource.count;
    return counts;
  }

  const initialResources = Array.isArray(action.actionParameters.resources)
    ? action.actionParameters.resources
    : [];

  let selected = $state<Record<ResourceType, number>>(countsFrom(initialResources));
  let cardType = $state<CardType.Unit | CardType.Spell | null>(null);
  /** pick → absorbing (icon flies in) → forming (card appears) → ready (tray). */
  let revealPhase = $state<'pick' | 'absorbing' | 'forming' | 'ready'>('pick');
  let colors = $state<CardColor[]>([]);
  let essences = $state<Record<EssenceKey, number>>({ power: 1, hp: 1, retaliate: 1 });
  let essenceIn = $state<Record<EssenceKey, boolean>>({
    power: false,
    hp: false,
    retaliate: false,
  });
  let runeAmounts = $state<Partial<Record<keyof UnitKeywords, number>>>({});
  let runeIn = $state<Partial<Record<keyof UnitKeywords, boolean>>>({});
  let stagedTriggers = $state<Record<string, string>>({});
  let stagedArgs = $state<Record<string, Record<string, number>>>({});
  let abilityTrigger = $state('onDeploy');
  let abilityAction = $state<string | null>(null);
  let abilityArgs = $state<Record<string, number>>({});
  let spellAction = $state<string | null>(null);
  let spellArgs = $state<Record<string, number>>({});
  let landed = $state<string[]>([]);
  let sealing = $state(false);
  let draggingIngredient = $state(false);
  let charmEntry = $state<{ id: string; x: number; y: number } | null>(null);
  let abandoned = false;
  /** idle → fog thickens → swap under the fog → fog lifts. */
  let manifest = $state<'idle' | 'shrouding' | 'veiled' | 'revealed'>('idle');
  let createdCard = $state<CardTemplate | null>(null);
  let summon: Promise<CardCreationResult | null> | null = null;
  let creationResult: CardCreationResult | null = null;
  let alive = true;

  const ABSORB_MS = 480;
  const FORM_MS = 420;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealTimers: number[] = [];
  let manifestTimers: number[] = [];
  const FOG_MS = 720;
  const REVEAL_HOLD_MS = 280;

  function clearRevealTimers() {
    for (const id of revealTimers) clearTimeout(id);
    revealTimers = [];
  }

  function clearManifestTimers() {
    for (const id of manifestTimers) clearTimeout(id);
    manifestTimers = [];
  }

  function chooseVessel(type: CardType.Unit | CardType.Spell) {
    if (revealPhase !== 'pick') return;
    clearRevealTimers();
    cardType = type;
    revealPhase = 'absorbing';
    const absorbMs = reduceMotion ? 0 : ABSORB_MS;
    const formMs = reduceMotion ? 0 : FORM_MS;
    revealTimers.push(
      window.setTimeout(() => {
        revealPhase = 'forming';
        revealTimers.push(
          window.setTimeout(() => {
            revealPhase = 'ready';
          }, formMs)
        );
      }, absorbMs)
    );
  }

  function cancel() {
    if (manifest !== 'idle' || sealing) return;
    abandoned = true;
    clearRevealTimers();
    clearManifestTimers();
    (onBack ?? onDone)();
  }

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (manifest === 'revealed') leave();
      else if (manifest === 'idle' && !sealing) cancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  $effect(() => () => {
    alive = false;
    clearRevealTimers();
    clearManifestTimers();
  });

  function resolveAvailableColors(): CardColor[] {
    const known = Object.values(CardColor).filter(
      (color) => !!gs.player.craftingKnowledge.colors?.[color]
    );
    return known.length ? known : Object.values(CardColor);
  }

  const availableColors = $derived(resolveAvailableColors());
  const knownKeywords = $derived(
    KEYWORD_KEYS.filter((key) => !!gs.player.craftingKnowledge.keywords?.[key])
  );
  const availableKeywords = $derived(knownKeywords.length ? knownKeywords : KEYWORD_KEYS);
  const actionNames = $derived.by(() => {
    const known = ACTION_TEMPLATE_KEYS.filter(
      (name) => !!gs.player.craftingKnowledge.actions?.[name]
    );
    return known.length ? known : ACTION_TEMPLATE_KEYS;
  });

  const isUnit = $derived(cardType === CardType.Unit);
  const selectedColors = $derived(colors.length ? colors : availableColors);

  function activeArgs(name: string, committed: Record<string, number>, active: boolean) {
    if (active) {
      return Object.keys(committed).length ? committed : defaultActionFactoryArgs(name);
    }
    return stagedArgs[name] ?? defaultActionFactoryArgs(name);
  }

  function argsFor(name: string): Record<string, number> {
    if (isUnit) return activeArgs(name, abilityArgs, abilityAction === name);
    return activeArgs(name, spellArgs, spellAction === name);
  }

  function triggerFor(name: string): string {
    return stagedTriggers[name] ?? (abilityAction === name ? abilityTrigger : 'onDeploy');
  }

  const keywords = $derived.by((): UnitKeywords | undefined => {
    const result: UnitKeywords = {};
    for (const key of KEYWORD_KEYS) {
      if (!runeIn[key]) continue;
      const amount = runeAmounts[key] ?? 1;
      if (NUMERIC_KEYWORDS.has(key)) (result[key] as number) = amount;
      else (result[key] as boolean) = true;
    }
    return Object.keys(result).length ? result : undefined;
  });

  const abilityPick = $derived(
    abilityAction
      ? {
          trigger: abilityTrigger,
          action: abilityAction,
          args: activeArgs(abilityAction, abilityArgs, true),
        }
      : undefined
  );
  const draftAbility = $derived(abilityPick ? buildAbility(abilityPick) : null);

  const draftUnit = $derived.by(
    (): PartialConjuredUnit => ({
      type: CardType.Unit,
      colors: selectedColors.map((color) => ({ color, count: 1 })),
      power: essenceIn.power ? essences.power : 0,
      maxHealth: essenceIn.hp ? essences.hp : 1,
      retaliate: essenceIn.retaliate ? essences.retaliate : 0,
      keywords: keywords ?? {},
      abilities: draftAbility ? [draftAbility] : undefined,
    })
  );

  function budgetTitle(base: string, cost: number): string {
    return cost ? `${base}\nBudget cost: ${cost}` : base;
  }

  function describeAction(name: string, args: Record<string, number>): string {
    const resolved = Object.keys(args).length ? args : defaultActionFactoryArgs(name);
    const template = createActionTemplate(name, resolved);
    const effect = template.definition.effect;
    const build = DataEffectTemplates[effect.name];
    if (!build) return template.label;
    try {
      const line = build(effect.args).label(template.definition.targets ?? []);
      return line?.trim() ? line.trim() : template.label;
    } catch {
      return template.label;
    }
  }

  const hints = $derived.by(() => {
    const map: Record<string, string> = {};
    for (const key of ['power', 'hp', 'retaliate'] as EssenceKey[]) {
      const value = essences[key];
      const label =
        key === 'retaliate'
          ? getKeywordTooltip('retaliate', value)
          : key === 'power'
            ? `Power ${value}`
            : `Health ${value}`;
      map[`essence:${key}`] = budgetTitle(label, value * ESSENCE_COST[key]);
    }
    for (const key of availableKeywords) {
      const amount = NUMERIC_KEYWORDS.has(key) ? (runeAmounts[key] ?? 1) : 1;
      const preview: PartialConjuredUnit = {
        ...draftUnit,
        keywords: {
          ...draftUnit.keywords,
          [key]: NUMERIC_KEYWORDS.has(key) ? amount : true,
        },
      };
      map[`rune:${key}`] = budgetTitle(
        getKeywordTooltip(key, amount),
        getKeywordBudget(key, preview, amount)
      );
    }
    for (const name of actionNames) {
      const args = argsFor(name);
      const template = createActionTemplate(name, args);
      let cost = getActionBudget(template.definition, selectedColors);
      if (isUnit) {
        const trigger = triggerFor(name);
        const ability = buildAbility({ trigger, action: name, args });
        if (ability) cost = getAbilityCost(ability, selectedColors);
      }
      const triggerNote = isUnit ? `\nTrigger: ${getTriggerTemplateLabel(triggerFor(name))}` : '';
      map[`incantation:${name}`] = budgetTitle(`${getActionTooltip(name)}${triggerNote}`, cost);
    }
    return map;
  });

  const shapeSummary = $derived.by(() => {
    if (cardType !== CardType.Unit && cardType !== CardType.Spell) return '';
    const parts: string[] = [];
    for (const color of colors) {
      parts.push(color.charAt(0).toUpperCase() + color.slice(1));
    }
    if (cardType === CardType.Unit) {
      if (essenceIn.power) parts.push(`${essences.power} power`);
      if (essenceIn.hp) parts.push(`${essences.hp} hp`);
      if (essenceIn.retaliate) parts.push(`${essences.retaliate} retaliate`);
      for (const key of KEYWORD_KEYS) {
        if (!runeIn[key]) continue;
        const label = formatKeywordLabel(key);
        if (NUMERIC_KEYWORDS.has(key))
          parts.push(`${runeAmounts[key] ?? 1} ${label.toLowerCase()}`);
        else parts.push(label);
      }
      if (abilityAction) {
        parts.push(
          `${getTriggerTemplateLabel(abilityTrigger)}: ${describeAction(abilityAction, abilityArgs)}`
        );
      }
    } else if (spellAction) {
      parts.push(describeAction(spellAction, spellArgs));
    }
    return parts.join(', ');
  });

  const inscription = $derived(
    manifest === 'revealed' && createdCard?.name ? createdCard.name : shapeSummary
  );

  const charms = $derived.by((): RitualCharm[] => {
    if (cardType !== CardType.Unit && cardType !== CardType.Spell) return [];
    const list: RitualCharm[] = colors.map((color) => ({
      id: `pigment:${color}`,
      icon: getAssetPath(`images/ui/icons/color_${color}.png`),
    }));
    if (cardType === CardType.Unit) {
      if (essenceIn.power) list.push({ id: 'essence:power', icon: powerIcon });
      if (essenceIn.hp) list.push({ id: 'essence:hp', icon: healthIcon });
      if (essenceIn.retaliate) list.push({ id: 'essence:retaliate', icon: retaliateIcon });
      for (const key of KEYWORD_KEYS) {
        if (!runeIn[key]) continue;
        list.push({
          id: `rune:${key}`,
          icon: getAssetPath(`images/keywords/material-icons/${key}.png`),
        });
      }
      if (abilityAction) {
        list.push({ id: `incantation:${abilityAction}`, icon: getActionTypeIconPath(abilityAction) });
      }
    } else if (spellAction) {
      list.push({ id: `incantation:${spellAction}`, icon: getActionTypeIconPath(spellAction) });
    }
    return list;
  });

  function stillMixed(id: string): boolean {
    if (id.startsWith('pigment:')) return colors.includes(id.slice('pigment:'.length) as CardColor);
    if (id === 'essence:power') return essenceIn.power;
    if (id === 'essence:hp') return essenceIn.hp;
    if (id === 'essence:retaliate') return essenceIn.retaliate;
    if (id.startsWith('rune:')) return !!runeIn[id.slice('rune:'.length) as keyof UnitKeywords];
    if (id.startsWith('incantation:')) {
      const name = id.slice('incantation:'.length);
      return name === abilityAction || name === spellAction;
    }
    return false;
  }

  function conceal(id: string) {
    landed = landed.filter((entry) => entry !== id);
  }

  function onCharmLanded(id: string) {
    if (!stillMixed(id) || landed.includes(id)) return;
    landed = [...landed, id];
  }

  function shown(id: string): boolean {
    return landed.includes(id) && stillMixed(id);
  }

  function onPigment(color: CardColor, remove: boolean) {
    if (remove) {
      if (!colors.includes(color)) return;
      colors = colors.filter((entry) => entry !== color);
      conceal(`pigment:${color}`);
      return;
    }
    if (colors.includes(color)) return;
    colors = [...colors, color];
    playAddResourceSound();
  }

  function onEssenceDial(key: EssenceKey, value: number) {
    essences = { ...essences, [key]: value };
  }

  function onEssenceMix(key: EssenceKey, remove: boolean) {
    if (remove) {
      if (!essenceIn[key]) return;
      essenceIn = { ...essenceIn, [key]: false };
      conceal(`essence:${key}`);
      return;
    }
    if (essenceIn[key]) return;
    essenceIn = { ...essenceIn, [key]: true };
    playAddResourceSound();
  }

  function onRuneDial(key: keyof UnitKeywords, value: number) {
    runeAmounts = { ...runeAmounts, [key]: value };
  }

  function onRuneMix(key: keyof UnitKeywords, remove: boolean) {
    if (remove) {
      if (!runeIn[key]) return;
      const next = { ...runeIn };
      delete next[key];
      runeIn = next;
      conceal(`rune:${key}`);
      return;
    }
    if (runeIn[key]) return;
    runeIn = { ...runeIn, [key]: true };
    if (!runeAmounts[key]) runeAmounts = { ...runeAmounts, [key]: 1 };
    playAddResourceSound();
  }

  function onTriggerDial(name: string, trigger: string) {
    stagedTriggers = { ...stagedTriggers, [name]: trigger };
    if (abilityAction === name) abilityTrigger = trigger;
  }

  function onArgDial(name: string, factoryKey: string, value: number) {
    const next = { ...argsFor(name), [factoryKey]: value };
    stagedArgs = { ...stagedArgs, [name]: next };
    if (isUnit && abilityAction === name) abilityArgs = next;
    if (!isUnit && spellAction === name) spellArgs = next;
  }

  function onIncantationMix(name: string, remove: boolean) {
    if (isUnit) {
      if (remove) {
        if (abilityAction !== name) return;
        conceal(`incantation:${name}`);
        abilityAction = null;
        return;
      }
      if (abilityAction === name) return;
      if (abilityAction) conceal(`incantation:${abilityAction}`);
      const args = { ...argsFor(name) };
      const trigger = triggerFor(name);
      abilityAction = name;
      abilityTrigger = trigger;
      abilityArgs = args;
      playAddResourceSound();
      return;
    }
    if (remove) {
      if (spellAction !== name) return;
      conceal(`incantation:${spellAction}`);
      spellAction = null;
      return;
    }
    if (spellAction === name) return;
    if (spellAction) conceal(`incantation:${spellAction}`);
    const args = { ...argsFor(name) };
    spellAction = name;
    spellArgs = args;
    playAddResourceSound();
  }

  const shownKeywords = $derived.by((): UnitKeywords => {
    if (!isUnit || !keywords) return {};
    const result: UnitKeywords = {};
    for (const key of KEYWORD_KEYS) {
      const value = keywords[key];
      if (!value || !shown(`rune:${key}`)) continue;
      if (typeof value === 'number') (result[key] as number) = value;
      else (result[key] as boolean) = true;
    }
    return result;
  });

  const shownAbilities = $derived.by((): Ability[] => {
    if (!isUnit || !draftAbility || !abilityAction) return [];
    if (!shown(`incantation:${abilityAction}`)) return [];
    return [draftAbility];
  });

  const spellText = $derived.by(() => {
    if (isUnit) return null;
    if (!spellAction || !shown(`incantation:${spellAction}`)) return null;
    return describeAction(spellAction, spellArgs);
  });

  const shownColors = $derived(colors.filter((color) => shown(`pigment:${color}`)));

  function onIngredientDrop(id: string, x: number, y: number) {
    if (sealing) return;
    charmEntry = { id, x, y };
    if (id.startsWith('pigment:')) {
      onPigment(id.slice('pigment:'.length) as CardColor, false);
      return;
    }
    if (id.startsWith('essence:')) {
      onEssenceMix(id.slice('essence:'.length) as EssenceKey, false);
      return;
    }
    if (id.startsWith('rune:')) {
      onRuneMix(id.slice('rune:'.length) as keyof UnitKeywords, false);
      return;
    }
    if (id.startsWith('incantation:')) onIncantationMix(id.slice('incantation:'.length), false);
  }

  function buildParameters(): CardCreationParameters {
    const resources = Object.values(ResourceType)
      .map((type) => ({ type, count: selected[type] ?? 0 }))
      .filter((row) => row.count > 0);

    if (cardType === CardType.Spell) {
      return {
        cardType: CardType.Spell,
        colors: colors.length ? colors : undefined,
        actions: spellAction ? [spellAction] : undefined,
        actionArgs: spellAction ? { ...argsFor(spellAction) } : undefined,
        resources,
      };
    }
    return {
      cardType: CardType.Unit,
      colors: colors.length ? colors : undefined,
      power: essenceIn.power ? essences.power : 0,
      hp: essenceIn.hp ? essences.hp : 1,
      retaliate: essenceIn.retaliate ? essences.retaliate : 0,
      keywords,
      ability: abilityPick,
      resources,
    };
  }

  function beginShroud() {
    if (abandoned || manifest !== 'idle') return;
    manifest = 'shrouding';
    const cover = reduceMotion ? 0 : FOG_MS;
    manifestTimers.push(window.setTimeout(() => void unveil(), cover));
  }

  async function unveil() {
    if (!alive || abandoned) return;
    manifest = 'veiled';
    let result: CardCreationResult | null = null;
    try {
      result = summon ? await summon : null;
    } catch {
      result = null;
    }
    if (!alive || abandoned) return;
    if (!result?.template) {
      manifest = 'idle';
      sealing = false;
      return;
    }
    creationResult = result;
    createdCard = result.template;
    const hold = reduceMotion ? 0 : REVEAL_HOLD_MS;
    manifestTimers.push(
      window.setTimeout(() => {
        if (!alive || abandoned) return;
        manifest = 'revealed';
      }, hold)
    );
  }

  function invoke() {
    if (!cardType || sealing || manifest !== 'idle' || abandoned) return;
    sealing = true;
    summon = summonInvokedCard(buildParameters());
  }

  function onSealComplete() {
    if (abandoned) return;
    beginShroud();
  }

  function leave() {
    if (!createdCard || !creationResult || abandoned) return;
    abandoned = true;
    clearManifestTimers();
    commitInvokedCard(creationResult);
    uiState.sim.invokeCommitted = true;
    performAction({
      ...action,
      actionParameters: {
        ...action.actionParameters,
        ...buildParameters(),
      },
      missingParameters: {},
    });
    onDone();
  }
</script>

<WorkbenchShell
  title="Invocation"
  subtitle="Weave the elements. Bring your card to life."
  wide
  scene="invocation"
>
  <RitualStage
    bind:selected
    {charms}
    {onCharmLanded}
    {onSealComplete}
    seal={sealing}
    shapeText={inscription}
    {charmEntry}
    acceptingDrop={draggingIngredient}
    disabled={sealing}
    split
    showVessel={revealPhase === 'forming' || revealPhase === 'ready'}
    showFlank={revealPhase === 'ready'}
    suppressCore={revealPhase !== 'pick'}
  >
    {#snippet circleContent()}
      {#if (revealPhase === 'forming' || revealPhase === 'ready') && manifest === 'idle'}
        <div class="vessel-badge">
          <span
            class="badge-mark"
            style="--icon: url('{cardType === CardType.Unit
              ? getUiIconPath('page-star')
              : getUiIconPath('spiral')}')"
            aria-hidden="true"
          ></span>
          {cardType === CardType.Unit ? 'Unit' : 'Spell'}
        </div>
      {/if}
      {#if revealPhase === 'pick' || revealPhase === 'absorbing'}
        <div
          class="vessel-pick"
          class:absorbing={revealPhase === 'absorbing'}
          role="group"
          aria-label="Choose a vessel"
        >
          <button
            type="button"
            class="vessel-token unit"
            class:chosen={cardType === CardType.Unit}
            class:dismissed={revealPhase === 'absorbing' && cardType !== CardType.Unit}
            style="--icon: url('{getUiIconPath('page-star')}')"
            disabled={revealPhase !== 'pick'}
            onclick={() => chooseVessel(CardType.Unit)}
          >
            <span class="token-name">Unit</span>
            <span class="token-glyph painted" aria-hidden="true"></span>
          </button>
          <button
            type="button"
            class="vessel-token spell"
            class:chosen={cardType === CardType.Spell}
            class:dismissed={revealPhase === 'absorbing' && cardType !== CardType.Spell}
            style="--icon: url('{getUiIconPath('spiral')}')"
            disabled={revealPhase !== 'pick'}
            onclick={() => chooseVessel(CardType.Spell)}
          >
            <span class="token-name">Spell</span>
            <span class="token-glyph painted" aria-hidden="true"></span>
          </button>
        </div>
      {/if}
    {/snippet}
    {#snippet vessel()}
      <div class="manifest">
        {#if createdCard && (manifest === 'veiled' || manifest === 'revealed')}
          <div class="real-card">
            <CardCompact card={createdCard} />
          </div>
        {:else}
          <FormingCard
            colors={shownColors}
            power={isUnit && shown('essence:power') ? essences.power : null}
            health={isUnit && shown('essence:hp') ? essences.hp : null}
            retaliate={isUnit && shown('essence:retaliate') ? essences.retaliate : null}
            keywords={shownKeywords}
            abilities={shownAbilities}
            {spellText}
          />
        {/if}
        <div
          class="fog"
          class:thick={manifest === 'shrouding' || manifest === 'veiled'}
          aria-hidden="true"
        ></div>
      </div>
    {/snippet}
    {#snippet flank()}
      {#if revealPhase === 'ready' && cardType !== null}
        <IngredientTray
          {cardType}
          {colors}
          {availableColors}
          {essences}
          {essenceIn}
          {runeAmounts}
          {runeIn}
          {availableKeywords}
          triggers={stagedTriggers}
          {argsFor}
          {abilityAction}
          {spellAction}
          knownActions={actionNames}
          {hints}
          {onPigment}
          {onEssenceDial}
          {onEssenceMix}
          {onRuneDial}
          {onRuneMix}
          {onTriggerDial}
          {onArgDial}
          {onIncantationMix}
          locked={sealing}
          onDrop={onIngredientDrop}
          onDragChange={(active) => (draggingIngredient = active)}
        />
      {/if}
    {/snippet}
  </RitualStage>

  {#snippet footer()}
    {#if manifest === 'revealed'}
      <OrnateButton icon="spiral" onclick={leave}>Take the card</OrnateButton>
    {:else}
      <button
        type="button"
        class="abandon"
        disabled={manifest !== 'idle' || sealing}
        onclick={cancel}
      >
        <span class="abandon-mark" aria-hidden="true"></span>
        Abandon ritual
      </button>
      <OrnateButton
        icon="spiral"
        disabled={cardType === null || sealing || manifest !== 'idle'}
        onclick={invoke}
      >
        Invoke
      </OrnateButton>
    {/if}
  {/snippet}
</WorkbenchShell>

<style>
  .manifest {
    position: relative;
    display: grid;
    place-items: center;
  }

  .manifest > :global(.forming-card),
  .real-card {
    grid-area: 1 / 1;
  }

  .fog {
    position: absolute;
    inset: -16% -12%;
    z-index: 4;
    pointer-events: none;
    opacity: 0;
    border-radius: 48% 52% 50% 50%;
    background: radial-gradient(
      ellipse at 50% 46%,
      rgba(244, 236, 214, 0.97) 0%,
      rgba(214, 190, 150, 0.9) 36%,
      rgba(120, 96, 64, 0.42) 64%,
      transparent 78%
    );
    filter: blur(1px);
    transition: opacity 0.72s ease;
  }

  .fog.thick {
    opacity: 1;
  }

  .fog::before,
  .fog::after {
    content: '';
    position: absolute;
    inset: -6%;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.72s ease;
  }

  .fog.thick::before,
  .fog.thick::after {
    opacity: 1;
  }

  .fog::before {
    background: radial-gradient(ellipse at 32% 42%, rgba(255, 250, 236, 0.75), transparent 58%);
    animation: fog-drift 3.4s ease-in-out infinite;
  }

  .fog::after {
    background: radial-gradient(ellipse at 70% 60%, rgba(175, 142, 103, 0.55), transparent 60%);
    animation: fog-drift 4.2s ease-in-out infinite reverse;
  }

  @keyframes fog-drift {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(8px, -10px) scale(1.05);
    }
  }

  .vessel-pick {
    position: absolute;
    inset: 0;
  }

  .vessel-token {
    position: absolute;
    left: 50%;
    top: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 5.6rem;
    padding: 4px;
    color: var(--color-ink);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    font-family: var(--font-narrative);
    cursor: pointer;
    user-select: none;
    transition:
      border-color 0.18s ease,
      background 0.18s ease;
  }

  .vessel-token.unit {
    transform: translate(-50%, -50%) translateY(-150px);
  }

  .vessel-token.spell {
    transform: translate(-50%, -50%) translateY(150px);
  }

  .vessel-token:disabled {
    cursor: default;
  }

  .vessel-pick.absorbing .vessel-token.chosen {
    animation: vessel-absorb 480ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  }

  .vessel-pick.absorbing .vessel-token.dismissed {
    animation: vessel-dismiss 280ms ease forwards;
  }

  .token-name {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: capitalize;
    color: var(--color-ink);
    transition: opacity 0.2s ease;
  }

  .vessel-pick.absorbing .vessel-token.chosen .token-name {
    opacity: 0;
  }

  .token-glyph {
    display: block;
    width: 48px;
    height: 48px;
    background: var(--color-brass);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
    filter: drop-shadow(0 4px 5px rgba(42, 24, 16, 0.4));
  }

  .token-glyph.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .vessel-token:hover:not(:disabled) .token-glyph {
    filter: drop-shadow(0 4px 5px rgba(42, 24, 16, 0.4))
      drop-shadow(0 0 10px color-mix(in srgb, var(--color-golden) 55%, transparent));
  }

  @keyframes vessel-absorb {
    0% {
      transform: translate(-50%, -50%) translateY(var(--from-y, 0)) scale(1);
      opacity: 1;
    }
    55% {
      transform: translate(-50%, -50%) scale(1.08);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.28);
      opacity: 0;
    }
  }

  .vessel-token.unit.chosen {
    --from-y: -150px;
  }

  .vessel-token.spell.chosen {
    --from-y: 150px;
  }

  @keyframes vessel-dismiss {
    to {
      opacity: 0;
      transform: translate(-50%, -50%) translateY(var(--from-y, 0)) scale(0.85);
    }
  }

  .vessel-token.unit.dismissed {
    --from-y: -150px;
  }

  .vessel-token.spell.dismissed {
    --from-y: 150px;
  }

  .vessel-badge {
    position: absolute;
    left: 50%;
    top: -50px;
    transform: translateX(-50%);
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 16px 4px 10px;
    border-radius: 999px;
    border: 1px solid #c6a15a;
    background: var(--color-data);
    color: var(--color-cream);
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    letter-spacing: 0.04em;
    box-shadow:
      0 0 0 1px rgba(42, 24, 16, 0.65),
      0 6px 14px rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  .badge-mark {
    width: 16px;
    height: 16px;
    background: var(--icon) center / contain no-repeat;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
  }

  .abandon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-narrative);
    font-size: 0.95rem;
    color: var(--color-cream);
    background: color-mix(in srgb, var(--color-data) 82%, #000);
    border: 1px solid color-mix(in srgb, var(--color-brass) 55%, transparent);
    border-radius: 4px;
    padding: 8px 16px 8px 12px;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(240, 230, 200, 0.08),
      0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .abandon-mark {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    background: var(--color-cream);
    clip-path: polygon(
      35% 0%,
      65% 0%,
      65% 35%,
      100% 35%,
      100% 65%,
      65% 65%,
      65% 100%,
      35% 100%,
      35% 65%,
      0% 65%,
      0% 35%,
      35% 35%
    );
    opacity: 0.85;
  }

  .abandon:hover {
    color: var(--color-cream);
    border-color: var(--color-brass);
    background: var(--color-data-hover);
  }

  .abandon:hover .abandon-mark {
    background: var(--color-golden);
    opacity: 1;
  }

  .abandon:disabled {
    opacity: 0.45;
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .vessel-pick.absorbing .vessel-token.chosen,
    .vessel-pick.absorbing .vessel-token.dismissed {
      animation: none;
      opacity: 0;
    }

    .fog,
    .fog::before,
    .fog::after {
      animation: none;
      transition: none;
    }
  }
</style>
