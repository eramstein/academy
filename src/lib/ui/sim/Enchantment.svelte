<script lang="ts">
  import {
    ActionType,
    CardColor,
    CardType,
    ResourceType,
    isSpellCard,
    isUnitCard,
    type Action,
    type UnitKeywords,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    performAction,
    getAugmentPreview,
    getEnchantableCards,
    type ActionArgDeltas,
    type AugmentParameters,
  } from '@/lib/sim/actions';
  import {
    buildAbility,
    getTriggerTemplateLabel,
  } from '@/lib/sim/cards/ability-templates';
  import {
    ACTION_TEMPLATE_KEYS,
    defaultActionFactoryArgs,
    getActionNumericParams,
    getActionTemplateMeta,
    getActionTemplateNameForEffect,
    getActionTooltip,
  } from '@/lib/sim/cards/action-templates';
  import { getAbilityCost, getKeywordBudget } from '@/lib/sim/cards/card-budget';
  import type { PartialConjuredUnit } from '@/lib/sim/cards/creation';
  import { formatKeywordLabel, KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { playAddResourceSound } from '@/lib/sim/sound';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import CardFilters from '@/lib/ui/cards/CardFilters.svelte';
  import { hasActiveCardFilters, matchesCardFilters } from '@/lib/ui/cards/card-filters';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import IngredientTray, { type EssenceKey } from './crafting/IngredientTray.svelte';
  import RitualStage, { type RitualCharm } from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';
  import Distill from './Distill.svelte';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const powerIcon = getAssetPath('images/ui/icons/power-icon.png');
  const healthIcon = getAssetPath('images/ui/icons/health-icon.png');
  const retaliateIcon = getAssetPath('images/ui/icons/retaliate-icon.png');
  const incantationIcon = getUiIconPath('conjure');
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');

  const ESSENCE_COST: Record<EssenceKey, number> = { power: 4, hp: 2, retaliate: 1 };

  const isDistill = $derived(action.actionType === ActionType.Distill);

  let cardId = $state<string | null>(initialCardId(action));
  let colorFilter = $state<CardColor | null>(null);
  let costFilter = $state<number | null>(null);
  let typeFilter = $state<CardType | null>(null);

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
  let spellArgDeltas = $state<ActionArgDeltas>({});
  let selected = $state<Record<ResourceType, number>>(
    Object.fromEntries(Object.values(ResourceType).map((type) => [type, 0])) as Record<
      ResourceType,
      number
    >
  );
  let draggingIngredient = $state(false);
  let charmEntry = $state<{ id: string; x: number; y: number } | null>(null);
  let sealing = $state(false);

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') back();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const availableCards = $derived(getEnchantableCards({ distill: isDistill }));
  const cardFilters = $derived({ color: colorFilter, cost: costFilter, type: typeFilter });
  const filteredCards = $derived(
    availableCards.filter((card) => matchesCardFilters(card, cardFilters))
  );
  const hasActiveFilters = $derived(hasActiveCardFilters(cardFilters));
  const selectingCard = $derived(!cardId);
  const canChangeCard = $derived(availableCards.length > 1);

  const sourceCard = $derived(
    cardId ? (gs.player.collection.find((c) => c.id === cardId) ?? null) : null
  );
  const unitCard = $derived(sourceCard && isUnitCard(sourceCard) ? sourceCard : null);
  const spellCard = $derived(sourceCard && isSpellCard(sourceCard) ? sourceCard : null);
  const cardType = $derived(
    unitCard ? CardType.Unit : spellCard ? CardType.Spell : null
  );

  const knownKeywords = $derived(
    KEYWORD_KEYS.filter((key) => !!gs.player.craftingKnowledge.keywords?.[key])
  );
  const availableKeywords = $derived.by(() => {
    if (!unitCard) return knownKeywords;
    return knownKeywords.filter((key) => {
      if (NUMERIC_KEYWORDS.has(key)) return true;
      return !unitCard.keywords?.[key];
    });
  });
  const actionNames = $derived(
    ACTION_TEMPLATE_KEYS.filter((name) => !!gs.player.craftingKnowledge.actions?.[name])
  );

  const spellParams = $derived.by(() => {
    if (!spellCard) return [];
    return spellCard.actions.flatMap((spellAction, index) => {
      const templateName = getActionTemplateNameForEffect(spellAction.effect.name);
      const actionLabel = templateName
        ? (getActionTemplateMeta(templateName)?.label ?? templateName)
        : spellAction.effect.name;
      return getActionNumericParams(spellAction).map((param) => ({
        index,
        key: param.definitionKey,
        label: param.label,
        actionLabel,
        current: Number(spellAction.effect.args[param.definitionKey]) || 0,
      }));
    });
  });

  function activeArgs(name: string, committed: Record<string, number>, active: boolean) {
    if (active) {
      return Object.keys(committed).length ? committed : defaultActionFactoryArgs(name);
    }
    return stagedArgs[name] ?? defaultActionFactoryArgs(name);
  }

  function argsFor(name: string): Record<string, number> {
    return activeArgs(name, abilityArgs, abilityAction === name);
  }

  function triggerFor(name: string): string {
    return stagedTriggers[name] ?? (abilityAction === name ? abilityTrigger : 'onDeploy');
  }

  const augmentKeywords = $derived.by((): UnitKeywords | undefined => {
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

  const augmentParameters = $derived.by((): AugmentParameters | null => {
    if (!cardId || isDistill) return null;
    const selectedKeywords = augmentKeywords
      ? (Object.fromEntries(
          Object.entries(augmentKeywords).map(([key, value]) => [
            key,
            typeof value === 'number' ? value : 1,
          ])
        ) as Partial<Record<keyof UnitKeywords, number>>)
      : undefined;
    const selectedSpellArgs = compactActionArgs(spellArgDeltas);
    return {
      cardId,
      power: essenceIn.power ? essences.power : undefined,
      maxHealth: essenceIn.hp ? essences.hp : undefined,
      retaliate: essenceIn.retaliate ? essences.retaliate : undefined,
      keywords: selectedKeywords && Object.keys(selectedKeywords).length ? selectedKeywords : undefined,
      ability: abilityPick,
      actionArgs: selectedSpellArgs,
      resources: selectedResources(),
    };
  });

  const hasAugmentIngredients = $derived.by(() => {
    if (!augmentParameters) return false;
    const p = augmentParameters;
    return !!(
      p.power ||
      p.maxHealth ||
      p.retaliate ||
      (p.keywords && Object.keys(p.keywords).length) ||
      p.ability ||
      (p.actionArgs && Object.keys(p.actionArgs).length)
    );
  });

  const augmentPreview = $derived(
    augmentParameters ? getAugmentPreview(augmentParameters) : null
  );

  const budgetUnit = $derived.by((): PartialConjuredUnit | null => {
    if (!unitCard) return null;
    return {
      type: CardType.Unit,
      colors: unitCard.colors,
      power: unitCard.power + (essenceIn.power ? essences.power : 0),
      maxHealth: unitCard.maxHealth + (essenceIn.hp ? essences.hp : 0),
      retaliate: (unitCard.retaliate || 0) + (essenceIn.retaliate ? essences.retaliate : 0),
      keywords: { ...(unitCard.keywords ?? {}), ...(augmentKeywords ?? {}) },
      abilities: unitCard.abilities,
    };
  });

  function budgetTitle(base: string, cost: number): string {
    return cost ? `${base}\nBudget cost: ${cost}` : base;
  }

  const hints = $derived.by(() => {
    const map: Record<string, string> = {};
    for (const key of ['power', 'hp', 'retaliate'] as EssenceKey[]) {
      const value = essences[key];
      const label =
        key === 'retaliate'
          ? getKeywordTooltip('retaliate', value)
          : key === 'power'
            ? `Power +${value}`
            : `Health +${value}`;
      map[`essence:${key}`] = budgetTitle(label, value * ESSENCE_COST[key]);
    }
    for (const key of availableKeywords) {
      const amount = NUMERIC_KEYWORDS.has(key) ? (runeAmounts[key] ?? 1) : 1;
      if (budgetUnit) {
        map[`rune:${key}`] = budgetTitle(
          getKeywordTooltip(key, amount),
          getKeywordBudget(key, budgetUnit, amount)
        );
      }
    }
    for (const name of actionNames) {
      const args = argsFor(name);
      const trigger = triggerFor(name);
      const ability = buildAbility({ trigger, action: name, args });
      const colors = (unitCard ?? spellCard)?.colors.map((entry) => entry.color) ?? [];
      const cost = ability ? getAbilityCost(ability, colors) : 0;
      map[`incantation:${name}`] = budgetTitle(
        `${getActionTooltip(name)}\nTrigger: ${getTriggerTemplateLabel(trigger)}`,
        cost
      );
    }
    return map;
  });

  const shapeSummary = $derived.by(() => {
    if (!hasAugmentIngredients) return 'Add ingredients to enchant this card.';
    const parts: string[] = [];
    if (essenceIn.power) parts.push(`+${essences.power} power`);
    if (essenceIn.hp) parts.push(`+${essences.hp} health`);
    if (essenceIn.retaliate) parts.push(`+${essences.retaliate} retaliate`);
    for (const key of KEYWORD_KEYS) {
      if (!runeIn[key]) continue;
      const label = formatKeywordLabel(key);
      if (NUMERIC_KEYWORDS.has(key)) parts.push(`+${runeAmounts[key] ?? 1} ${label.toLowerCase()}`);
      else parts.push(label);
    }
    if (abilityAction) {
      parts.push(`${getTriggerTemplateLabel(abilityTrigger)}: ${abilityAction}`);
    }
    if (spellCard && spellArgDeltas) {
      for (const [indexKey, args] of Object.entries(spellArgDeltas)) {
        const spellAction = spellCard.actions[Number(indexKey)];
        if (!spellAction) continue;
        for (const [key, value] of Object.entries(args)) {
          if (!value) continue;
          parts.push(`+${value} ${key}`);
        }
      }
    }
    return parts.join(', ');
  });

  const charms = $derived.by((): RitualCharm[] => {
    if (isDistill || !cardType) return [];
    const list: RitualCharm[] = [];
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
      if (abilityAction) list.push({ id: `incantation:${abilityAction}`, icon: incantationIcon });
    } else if (spellCard) {
      for (const [indexKey, args] of Object.entries(spellArgDeltas)) {
        if (Object.values(args).some((value) => value > 0)) {
          list.push({ id: `spell:${indexKey}`, icon: incantationIcon });
        }
      }
    }
    return list;
  });

  function initialCardId(source: Action): string | null {
    if (typeof source.actionParameters.cardId === 'string') {
      return source.actionParameters.cardId;
    }
    const cards = getEnchantableCards({ distill: source.actionType === ActionType.Distill });
    return cards.length === 1 ? cards[0].id : null;
  }

  function compactActionArgs(deltas: ActionArgDeltas): ActionArgDeltas | undefined {
    const next: ActionArgDeltas = {};
    for (const [indexKey, args] of Object.entries(deltas)) {
      const cleaned = Object.fromEntries(Object.entries(args).filter(([, value]) => value));
      if (Object.keys(cleaned).length) {
        next[Number(indexKey)] = cleaned;
      }
    }
    return Object.keys(next).length ? next : undefined;
  }

  function selectedResources(): { type: ResourceType; count: number }[] {
    return Object.values(ResourceType)
      .map((type) => ({ type, count: selected[type] ?? 0 }))
      .filter((row) => row.count > 0);
  }

  function resetAugmentForm() {
    essences = { power: 1, hp: 1, retaliate: 1 };
    essenceIn = { power: false, hp: false, retaliate: false };
    runeAmounts = {};
    runeIn = {};
    stagedTriggers = {};
    stagedArgs = {};
    abilityTrigger = 'onDeploy';
    abilityAction = null;
    abilityArgs = {};
    spellArgDeltas = {};
    selected = Object.fromEntries(Object.values(ResourceType).map((type) => [type, 0])) as Record<
      ResourceType,
      number
    >;
    sealing = false;
    charmEntry = null;
  }

  function selectCard(id: string) {
    cardId = id;
    resetAugmentForm();
  }

  function back() {
    if (sealing) return;
    if (cardId && canChangeCard) {
      cardId = null;
      resetAugmentForm();
      return;
    }
    onDone();
  }

  function fitsAugment(next: AugmentParameters): boolean {
    return getAugmentPreview(next).error === '';
  }

  function withAugmentPatch(patch: Partial<AugmentParameters>): AugmentParameters | null {
    if (!augmentParameters) return null;
    return { ...augmentParameters, ...patch };
  }

  const atManaLimit = $derived.by(() => {
    if (!sourceCard || !hasAugmentIngredients || !augmentPreview) return false;
    return sourceCard.cost + augmentPreview.costIncrease >= 9;
  });

  function canAddIngredient(id: string): boolean {
    if (!augmentParameters) return false;
    if (id.startsWith('essence:')) {
      const key = id.slice('essence:'.length) as EssenceKey;
      if (essenceIn[key]) return true;
      const patch: Partial<AugmentParameters> = {};
      if (key === 'power') patch.power = essences.power;
      if (key === 'hp') patch.maxHealth = essences.hp;
      if (key === 'retaliate') patch.retaliate = essences.retaliate;
      const trial = withAugmentPatch(patch);
      return !!trial && fitsAugment(trial);
    }
    if (id.startsWith('rune:')) {
      const key = id.slice('rune:'.length) as keyof UnitKeywords;
      if (runeIn[key]) return true;
      const amount = runeAmounts[key] ?? 1;
      const nextKeywords = { ...(augmentParameters.keywords ?? {}), [key]: amount };
      const trial = withAugmentPatch({ keywords: nextKeywords });
      return !!trial && fitsAugment(trial);
    }
    if (id.startsWith('incantation:')) {
      const name = id.slice('incantation:'.length);
      if (abilityAction === name) return true;
      const args = { ...argsFor(name) };
      const trigger = triggerFor(name);
      const trial = withAugmentPatch({ ability: { trigger, action: name, args } });
      return !!trial && fitsAugment(trial);
    }
    return true;
  }

  function canIncSpellArg(index: number, key: string): boolean {
    if (!augmentParameters) return false;
    const value = (spellArgDeltas[index]?.[key] ?? 0) + 1;
    const next: ActionArgDeltas = {
      ...spellArgDeltas,
      [index]: { ...spellArgDeltas[index], [key]: value },
    };
    const trial = withAugmentPatch({ actionArgs: compactActionArgs(next) });
    return !!trial && fitsAugment(trial);
  }

  function onEssenceDial(key: EssenceKey, value: number) {
    if (essenceIn[key] && augmentParameters) {
      const patch: Partial<AugmentParameters> = {};
      if (key === 'power') patch.power = value;
      if (key === 'hp') patch.maxHealth = value;
      if (key === 'retaliate') patch.retaliate = value;
      const trial = withAugmentPatch(patch);
      if (!trial || !fitsAugment(trial)) return;
    }
    essences = { ...essences, [key]: value };
  }

  function onEssenceMix(key: EssenceKey, remove: boolean) {
    if (remove) {
      if (!essenceIn[key]) return;
      essenceIn = { ...essenceIn, [key]: false };
      return;
    }
    if (essenceIn[key] || !augmentParameters) return;
    const patch: Partial<AugmentParameters> = {};
    if (key === 'power') patch.power = essences.power;
    if (key === 'hp') patch.maxHealth = essences.hp;
    if (key === 'retaliate') patch.retaliate = essences.retaliate;
    const trial = withAugmentPatch(patch);
    if (!trial || !fitsAugment(trial)) return;
    essenceIn = { ...essenceIn, [key]: true };
    playAddResourceSound();
  }

  function onRuneDial(key: keyof UnitKeywords, value: number) {
    if (runeIn[key] && augmentParameters) {
      const nextKeywords = { ...(augmentParameters.keywords ?? {}), [key]: value };
      const trial = withAugmentPatch({ keywords: nextKeywords });
      if (!trial || !fitsAugment(trial)) return;
    }
    runeAmounts = { ...runeAmounts, [key]: value };
  }

  function onRuneMix(key: keyof UnitKeywords, remove: boolean) {
    if (remove) {
      if (!runeIn[key]) return;
      const next = { ...runeIn };
      delete next[key];
      runeIn = next;
      return;
    }
    if (runeIn[key] || !augmentParameters) return;
    const amount = runeAmounts[key] ?? 1;
    const nextKeywords = { ...(augmentParameters.keywords ?? {}), [key]: amount };
    const trial = withAugmentPatch({ keywords: nextKeywords });
    if (!trial || !fitsAugment(trial)) return;
    runeIn = { ...runeIn, [key]: true };
    if (!runeAmounts[key]) runeAmounts = { ...runeAmounts, [key]: 1 };
    playAddResourceSound();
  }

  function onTriggerDial(name: string, trigger: string) {
    if (abilityAction === name && augmentParameters) {
      const trial = withAugmentPatch({
        ability: { trigger, action: name, args: abilityArgs },
      });
      if (!trial || !fitsAugment(trial)) return;
      abilityTrigger = trigger;
    }
    stagedTriggers = { ...stagedTriggers, [name]: trigger };
  }

  function onArgDial(name: string, factoryKey: string, value: number) {
    const next = { ...argsFor(name), [factoryKey]: value };
    if (abilityAction === name && augmentParameters) {
      const trial = withAugmentPatch({
        ability: { trigger: abilityTrigger, action: name, args: next },
      });
      if (!trial || !fitsAugment(trial)) return;
      abilityArgs = next;
    }
    stagedArgs = { ...stagedArgs, [name]: next };
  }

  function onIncantationMix(name: string, remove: boolean) {
    if (remove) {
      if (abilityAction !== name) return;
      abilityAction = null;
      return;
    }
    if (abilityAction === name || !augmentParameters) return;
    const args = { ...argsFor(name) };
    const trigger = triggerFor(name);
    const trial = withAugmentPatch({ ability: { trigger, action: name, args } });
    if (!trial || !fitsAugment(trial)) return;
    abilityAction = name;
    abilityTrigger = trigger;
    abilityArgs = args;
    playAddResourceSound();
  }

  function onPigment() {
    /* pigments disabled for enchanting */
  }

  function onIngredientDrop(id: string, x: number, y: number) {
    if (sealing) return;
    charmEntry = { id, x, y };
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

  function setSpellArg(index: number, key: string, value: number) {
    if (!augmentParameters || value < 0) return;
    const next: ActionArgDeltas = {
      ...spellArgDeltas,
      [index]: { ...spellArgDeltas[index], [key]: value },
    };
    if (!value) {
      delete next[index][key];
      if (!Object.keys(next[index]).length) delete next[index];
    }
    const trial = withAugmentPatch({ actionArgs: compactActionArgs(next) });
    if (value > (spellArgDeltas[index]?.[key] ?? 0) && (!trial || !fitsAugment(trial))) return;
    spellArgDeltas = next;
    if (value > 0) playAddResourceSound();
  }

  function confirmAugment() {
    if (!augmentParameters || !hasAugmentIngredients || augmentPreview?.error || sealing) return;
    sealing = true;
  }

  function onSealComplete() {
    if (!augmentParameters) {
      sealing = false;
      return;
    }
    performAction({
      ...action,
      actionParameters: {
        ...action.actionParameters,
        ...augmentParameters,
      },
      missingParameters: {},
    });
    onDone();
  }
</script>

{#if selectingCard}
  <WorkbenchShell
    title={isDistill ? 'Distill a Card' : 'Enchant a Card'}
    subtitle={isDistill ? 'Choose a card to distill.' : 'Choose a card to enchant.'}
    wide
    scene="invocation"
  >
    <section class="picker" aria-label="Cards">
      {#if availableCards.length === 0}
        <p class="empty">No cards available.</p>
      {:else}
        <CardFilters
          cards={availableCards}
          bind:colorFilter
          bind:costFilter
          bind:typeFilter
          tone="parchment"
        />
        {#if filteredCards.length === 0}
          <p class="empty">
            {hasActiveFilters ? 'No cards match these filters.' : 'No cards available.'}
          </p>
        {:else}
          <div class="card-grid">
            {#each filteredCards as option (option.id)}
              <button type="button" class="card-pick" onclick={() => selectCard(option.id)}>
                <CardCompact card={option} />
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </section>
    {#snippet footer()}
      <button type="button" class="abandon" onclick={back}>
        <span class="abandon-mark" aria-hidden="true"></span>
        Cancel
      </button>
    {/snippet}
  </WorkbenchShell>
{:else if isDistill && sourceCard}
  <Distill
    {action}
    {sourceCard}
    {canChangeCard}
    onBack={back}
    {onDone}
  />
{:else if sourceCard && cardType}
  <WorkbenchShell
    title="Enchant {sourceCard.name}"
    subtitle="Infuse ingredients. Cost rises to match the power you add."
    wide
    scene="invocation"
  >
    <RitualStage
      bind:selected
      {charms}
      {onSealComplete}
      seal={sealing}
      shapeText={shapeSummary}
      shapeCost={hasAugmentIngredients ? (augmentPreview?.costIncrease ?? null) : null}
      atManaLimit={atManaLimit}
      {charmEntry}
      acceptingDrop={draggingIngredient}
      disabled={sealing}
      split
      showVessel
      showFlank
      suppressCore
    >
      {#snippet vessel()}
        <div class="enchant-vessel">
          <span class="land pigment" data-charm-land="pigment" aria-hidden="true"></span>
          <span class="land essence" data-charm-land="essence" aria-hidden="true"></span>
          <span class="land rune" data-charm-land="rune" aria-hidden="true"></span>
          <CardCompact card={sourceCard} />
        </div>
      {/snippet}
      {#snippet flank()}
        {#if cardType === CardType.Unit}
          <IngredientTray
            {cardType}
            colors={[]}
            availableColors={[]}
            {essences}
            {essenceIn}
            {runeAmounts}
            {runeIn}
            {availableKeywords}
            triggers={stagedTriggers}
            {argsFor}
            {abilityAction}
            spellAction={null}
            knownActions={actionNames}
            {hints}
            showPigments={false}
            canAdd={canAddIngredient}
            locked={sealing}
            {onPigment}
            {onEssenceDial}
            {onEssenceMix}
            {onRuneDial}
            {onRuneMix}
            {onTriggerDial}
            {onArgDial}
            {onIncantationMix}
            onDrop={onIngredientDrop}
            onDragChange={(active) => (draggingIngredient = active)}
          />
        {:else if spellCard}
          <div class="spell-tray" style="--parchment: url('{parchmentPath}')">
            <h3 class="spell-title">Effects</h3>
            {#if spellParams.length === 0}
              <p class="empty">This spell has no adjustable effects.</p>
            {:else}
              <div class="spell-params">
                {#each spellParams as param (`${param.index}-${param.key}`)}
                  {@const value = spellArgDeltas[param.index]?.[param.key] ?? 0}
                  {@const blocked = value === 0 && !canIncSpellArg(param.index, param.key)}
                  <label class="spell-param" class:blocked>
                    <span>{param.actionLabel}: {param.label} +</span>
                    <input
                      type="number"
                      min="0"
                      {value}
                      disabled={sealing || blocked}
                      title={blocked ? 'Too expensive for this enchantment' : undefined}
                      oninput={(event) =>
                        setSpellArg(
                          param.index,
                          param.key,
                          Number.parseInt((event.currentTarget as HTMLInputElement).value, 10) || 0
                        )}
                    />
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/snippet}
    </RitualStage>

    {#snippet footer()}
      <div class="budget-footer" class:over={!!augmentPreview?.error}>
        {#if augmentPreview}
          <span class="budget-stat">
            Spent {augmentPreview.spent}
            {#if augmentPreview.upgradeBudget > 0}
              / {augmentPreview.upgradeBudget}
            {/if}
          </span>
          <span class="budget-stat">Cost +{augmentPreview.costIncrease}</span>
          {#if augmentPreview.error}
            <span class="budget-error">{augmentPreview.error}</span>
          {:else if augmentPreview.extraBudget > 0 && hasAugmentIngredients}
            <span class="budget-note">{augmentPreview.extraBudget} leftover spent automatically</span>
          {/if}
        {/if}
      </div>
      <button type="button" class="abandon" disabled={sealing} onclick={back}>
        <span class="abandon-mark" aria-hidden="true"></span>
        {canChangeCard ? 'Back' : 'Abandon'}
      </button>
      <OrnateButton
        icon="leaf"
        disabled={!hasAugmentIngredients || !!augmentPreview?.error || sealing}
        onclick={confirmAugment}
      >
        Enchant
      </OrnateButton>
    {/snippet}
  </WorkbenchShell>
{/if}

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
  }

  .card-pick {
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 0;
    cursor: pointer;
  }

  .card-pick:hover {
    border-color: var(--color-golden);
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: #6a5c4c;
  }

  .enchant-vessel {
    position: relative;
    display: grid;
    place-items: center;
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

  .budget-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-right: auto;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    font-size: 0.95rem;
  }

  .budget-stat {
    min-width: 5rem;
    padding: 4px 10px;
    background: color-mix(in srgb, var(--color-data) 88%, #000);
    border: 1px solid color-mix(in srgb, var(--color-brass) 55%, transparent);
    border-radius: 3px;
    font-variant-numeric: tabular-nums;
  }

  .budget-footer.over .budget-stat {
    border-color: #8a4a3c;
    color: #e0a090;
  }

  .budget-error {
    color: #e0a090;
    font-size: 0.85rem;
  }

  .budget-note {
    color: var(--color-muted-label, #a89880);
    font-size: 0.85rem;
  }

  .spell-tray {
    padding: 8px 4px;
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .spell-title {
    margin: 0 0 12px;
    font-size: 0.85rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-align: center;
  }

  .spell-params {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .spell-param {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 0.9rem;
  }

  .spell-param.blocked {
    opacity: 0.38;
    filter: grayscale(0.55);
  }

  .spell-param input {
    width: 3rem;
    padding: 4px 6px;
    color: var(--color-cream);
    background: #2c251d;
    border: 1px solid #3a3228;
    border-radius: 3px;
    font: inherit;
    text-align: center;
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

  .abandon:hover:not(:disabled) {
    border-color: var(--color-brass);
    background: var(--color-data-hover);
  }

  .abandon:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
