<script lang="ts">
  import {
    ActionType,
    CardColor,
    CardType,
    isSpellCard,
    isUnitCard,
    type Ability,
    type Action,
    type UnitKeywords,
  } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import {
    performAction,
    getAugmentPreview,
    getDistillPreview,
    getEnchantableCards,
    type ActionArgDeltas,
    type AugmentParameters,
    type DistillParameters,
  } from '@/lib/sim/actions';
  import {
    buildAbility,
    getAbilityActionNames,
    getTriggerTemplateAsset,
    getTriggerTemplateKey,
    getTriggerTemplateLabel,
    TRIGGER_TEMPLATE_KEYS,
  } from '@/lib/sim/cards/ability-templates';
  import {
    ACTION_TEMPLATE_KEYS,
    getActionNumericParams,
    getActionTemplateMeta,
    getActionTemplateNameForEffect,
    getActionTooltip,
  } from '@/lib/sim/cards/action-templates';
  import { getAbilityCost, getActionBudget, getKeywordBudget } from '@/lib/sim/cards/card-budget';
  import { KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import CardFilters from '@/lib/ui/cards/CardFilters.svelte';
  import { hasActiveCardFilters, matchesCardFilters } from '@/lib/ui/cards/card-filters';
  import { getKeywordTooltip } from '@/lib/ui/_helpers/keywordTooltips';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const woodPath = getAssetPath('images/wood_chip_base.png');
  const tablePath = getAssetPath('images/table.jpg');
  const parchmentPath = getAssetPath('images/parchment.png');

  const isDistill = $derived(action.actionType === ActionType.Distill);

  let cardId = $state<string | null>(initialCardId(action));
  let costIncrease = $state(1);
  let power = $state(0);
  let maxHealth = $state(0);
  let retaliate = $state(0);
  let keywords = $state<Partial<Record<keyof UnitKeywords, number>>>({});
  let actionArgs = $state<ActionArgDeltas>({});
  let abilityTrigger = $state<string | null>(null);
  let abilityAction = $state<string | null>(null);
  let abilityArgs = $state<ActionArgDeltas>({});
  let removeAbilities = $state<number[]>([]);
  let colorFilter = $state<CardColor | null>(null);
  let costFilter = $state<number | null>(null);
  let typeFilter = $state<CardType | null>(null);

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
  const knownKeywords = $derived(
    KEYWORD_KEYS.filter((key) => !!gs.player.craftingKnowledge.keywords?.[key])
  );
  const knownActions = $derived(
    ACTION_TEMPLATE_KEYS.filter((name) => !!gs.player.craftingKnowledge.actions?.[name])
  );

  const parameters = $derived.by((): AugmentParameters | DistillParameters | null => {
    if (!cardId) return null;
    const selectedKeywords = Object.fromEntries(
      Object.entries(keywords).filter(([, value]) => value)
    ) as Partial<Record<keyof UnitKeywords, number>>;
    const selectedActionArgs = compactActionArgs(actionArgs);
    const selectedAbilityArgs = compactActionArgs(abilityArgs);
    const abilityPick =
      !isDistill && abilityTrigger && abilityAction
        ? { trigger: abilityTrigger, action: abilityAction }
        : undefined;
    const shared = {
      cardId,
      power: power || undefined,
      maxHealth: maxHealth || undefined,
      retaliate: retaliate || undefined,
      keywords: Object.keys(selectedKeywords).length ? selectedKeywords : undefined,
      actionArgs: selectedActionArgs,
      ability: abilityPick,
      abilityArgs: selectedAbilityArgs,
      removeAbilities: isDistill && removeAbilities.length ? removeAbilities : undefined,
    };
    if (isDistill) {
      return { ...shared, costDecrease: 1 };
    }
    return { ...shared, costIncrease };
  });

  const preview = $derived(
    parameters
      ? isDistill
        ? getDistillPreview(parameters as DistillParameters)
        : getAugmentPreview(parameters as AugmentParameters)
      : null
  );
  const card = $derived(preview?.card ?? null);
  const unitCard = $derived(card && isUnitCard(card) ? card : null);
  const spellCard = $derived(card && isSpellCard(card) ? card : null);
  const budgetUnit = $derived(
    preview?.preview && isUnitCard(preview.preview)
      ? preview.preview
      : unitCard
  );
  const budgetSpell = $derived(
    preview?.preview && isSpellCard(preview.preview)
      ? preview.preview
      : spellCard
  );
  const maxCostIncrease = $derived(card ? 9 - card.cost : 1);
  const maxPowerCut = $derived(unitCard?.power ?? 0);
  const maxHealthCut = $derived(unitCard ? Math.max(0, unitCard.maxHealth - 1) : 0);
  const maxRetaliateCut = $derived(unitCard?.retaliate ?? 0);
  const ownedKeywords = $derived(
    unitCard ? KEYWORD_KEYS.filter((key) => !!unitCard.keywords?.[key]) : []
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
  const unitAbilityParams = $derived.by(() => {
    if (!unitCard?.abilities) return [];
    return unitCard.abilities.flatMap((ability, index) => {
      const abilityActionDef = ability.actions[0];
      if (!abilityActionDef) return [];
      const templateName = getActionTemplateNameForEffect(abilityActionDef.effect.name);
      const actionLabel = templateName
        ? (getActionTemplateMeta(templateName)?.label ?? templateName)
        : abilityActionDef.effect.name;
      return getActionNumericParams(abilityActionDef).map((param) => ({
        index,
        key: param.definitionKey,
        label: param.label,
        abilityLabel: `${ability.trigger.type}: ${actionLabel}`,
        current: Number(abilityActionDef.effect.args[param.definitionKey]) || 0,
      }));
    });
  });

  const canDecCost = $derived(
    !isDistill &&
      !!parameters &&
      costIncrease > 1 &&
      fits({ ...(parameters as AugmentParameters), costIncrease: costIncrease - 1 })
  );
  const canIncCost = $derived(!isDistill && costIncrease < maxCostIncrease);
  const canDecPower = $derived(!!unitCard && power > 0);
  const canIncPower = $derived(
    !!unitCard &&
      !!parameters &&
      (isDistill
        ? power < maxPowerCut
        : fits({ ...(parameters as AugmentParameters), power: power + 1 }))
  );
  const canDecHealth = $derived(!!unitCard && maxHealth > 0);
  const canIncHealth = $derived(
    !!unitCard &&
      !!parameters &&
      (isDistill
        ? maxHealth < maxHealthCut
        : fits({ ...(parameters as AugmentParameters), maxHealth: maxHealth + 1 }))
  );
  const canDecRetaliate = $derived(!!unitCard && retaliate > 0);
  const canIncRetaliate = $derived(
    !!unitCard &&
      !!parameters &&
      (isDistill
        ? retaliate < maxRetaliateCut
        : fits({ ...(parameters as AugmentParameters), retaliate: retaliate + 1 }))
  );

  const budgetUsed = $derived.by(() => {
    if (!preview) return 0;
    return isDistill
      ? (preview as ReturnType<typeof getDistillPreview>).saved
      : (preview as ReturnType<typeof getAugmentPreview>).spent;
  });
  const budgetCap = $derived.by(() => {
    if (!preview) return 0;
    return isDistill
      ? (preview as ReturnType<typeof getDistillPreview>).downgradeBudget
      : (preview as ReturnType<typeof getAugmentPreview>).upgradeBudget;
  });
  const budgetRemainder = $derived.by(() => {
    if (!preview || preview.error) return 0;
    return isDistill
      ? (preview as ReturnType<typeof getDistillPreview>).extraCut
      : (preview as ReturnType<typeof getAugmentPreview>).extraBudget;
  });
  const budgetShort = $derived(
    isDistill && preview?.error ? Math.max(0, budgetCap - budgetUsed) : 0
  );

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

  function resetForm() {
    costIncrease = 1;
    power = 0;
    maxHealth = 0;
    retaliate = 0;
    keywords = {};
    actionArgs = {};
    abilityTrigger = null;
    abilityAction = null;
    abilityArgs = {};
    removeAbilities = [];
  }

  function selectCard(id: string) {
    cardId = id;
    resetForm();
  }

  function back() {
    if (cardId && canChangeCard) {
      cardId = null;
      resetForm();
      return;
    }
    onDone();
  }

  function fits(next: AugmentParameters | DistillParameters): boolean {
    return isDistill
      ? getDistillPreview(next as DistillParameters).error === ''
      : getAugmentPreview(next as AugmentParameters).error === '';
  }

  function formatKeyword(keyword: string): string {
    return keyword.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  function keywordCost(key: keyof UnitKeywords): number {
    if (!budgetUnit) return 0;
    return getKeywordBudget(key, budgetUnit);
  }

  function actionParamCost(index: number, key: string): number {
    if (!budgetSpell) return 0;
    const action = budgetSpell.actions[index];
    if (!action) return 0;
    const colors = budgetSpell.colors.map((entry) => entry.color);
    const current = Number(action.effect.args[key]) || 0;
    const next = {
      ...action,
      effect: {
        ...action.effect,
        args: {
          ...action.effect.args,
          [key]: current + (isDistill ? -1 : 1),
        },
      },
    };
    return Math.abs(getActionBudget(next, colors) - getActionBudget(action, colors));
  }

  function abilityParamCost(index: number, key: string): number {
    if (!budgetUnit) return 0;
    const action = budgetUnit.abilities?.[index]?.actions[0];
    if (!action) return 0;
    const colors = budgetUnit.colors.map((entry) => entry.color);
    const current = Number(action.effect.args[key]) || 0;
    const next = {
      ...action,
      effect: {
        ...action.effect,
        args: {
          ...action.effect.args,
          [key]: current + (isDistill ? -1 : 1),
        },
      },
    };
    return Math.abs(getActionBudget(next, colors) - getActionBudget(action, colors));
  }

  function addAbilityCost(): number {
    if (!abilityTrigger || !abilityAction || !budgetUnit) return 0;
    const ability = buildAbility({ trigger: abilityTrigger, action: abilityAction });
    if (!ability) return 0;
    return getAbilityCost(
      ability,
      budgetUnit.colors.map((entry) => entry.color)
    );
  }

  function formatAbility(ability: Ability): string {
    const actionName = getAbilityActionNames(ability)[0];
    const actionLabel = actionName
      ? (getActionTemplateMeta(actionName)?.label ?? actionName)
      : (ability.actions[0]?.effect.name ?? 'Ability');
    return `${ability.trigger.type}: ${actionLabel}`;
  }

  function hasBooleanKeyword(key: keyof UnitKeywords): boolean {
    if (!unitCard || NUMERIC_KEYWORDS.has(key)) return false;
    return !!unitCard.keywords?.[key];
  }

  function keywordOwnedValue(key: keyof UnitKeywords): number {
    const current = unitCard?.keywords?.[key];
    if (typeof current === 'number') return current;
    return current ? 1 : 0;
  }

  function actionArgValue(index: number, key: string): number {
    return actionArgs[index]?.[key] ?? 0;
  }

  function maxActionArgCut(index: number, key: string): number {
    const param = spellParams.find((entry) => entry.index === index && entry.key === key);
    return Math.max(0, (param?.current ?? 0) - 1);
  }

  function withActionArg(index: number, key: string, value: number): ActionArgDeltas {
    const next: ActionArgDeltas = {
      ...actionArgs,
      [index]: { ...actionArgs[index], [key]: value },
    };
    if (!value) {
      delete next[index][key];
    }
    return next;
  }

  function canIncActionArg(index: number, key: string): boolean {
    if (!parameters) return false;
    const value = actionArgValue(index, key);
    if (isDistill) {
      return value < maxActionArgCut(index, key);
    }
    return fits({ ...parameters, actionArgs: withActionArg(index, key, value + 1) });
  }

  function setActionArg(index: number, key: string, next: number) {
    if (!parameters || !Number.isFinite(next) || next < 0) return;
    const value = Math.round(next);
    if (isDistill && value > maxActionArgCut(index, key)) return;
    const current = actionArgValue(index, key);
    if (value > current && !canIncActionArg(index, key)) return;
    actionArgs = withActionArg(index, key, value);
  }

  function abilityArgValue(index: number, key: string): number {
    return abilityArgs[index]?.[key] ?? 0;
  }

  function maxAbilityArgCut(index: number, key: string): number {
    const param = unitAbilityParams.find((entry) => entry.index === index && entry.key === key);
    return Math.max(0, (param?.current ?? 0) - 1);
  }

  function withAbilityArg(index: number, key: string, value: number): ActionArgDeltas {
    const next: ActionArgDeltas = {
      ...abilityArgs,
      [index]: { ...abilityArgs[index], [key]: value },
    };
    if (!value) {
      delete next[index][key];
    }
    return next;
  }

  function canIncAbilityArg(index: number, key: string): boolean {
    if (!parameters) return false;
    const value = abilityArgValue(index, key);
    if (isDistill) {
      return value < maxAbilityArgCut(index, key);
    }
    return fits({ ...parameters, abilityArgs: withAbilityArg(index, key, value + 1) });
  }

  function setAbilityArg(index: number, key: string, next: number) {
    if (!parameters || !Number.isFinite(next) || next < 0) return;
    const value = Math.round(next);
    if (isDistill && value > maxAbilityArgCut(index, key)) return;
    const current = abilityArgValue(index, key);
    if (value > current && !canIncAbilityArg(index, key)) return;
    abilityArgs = withAbilityArg(index, key, value);
  }

  function isAbilityRemoved(index: number): boolean {
    return removeAbilities.includes(index);
  }

  function toggleRemoveAbility(index: number) {
    if (!isDistill) return;
    if (isAbilityRemoved(index)) {
      removeAbilities = removeAbilities.filter((entry) => entry !== index);
      return;
    }
    removeAbilities = [...removeAbilities, index];
    if (abilityArgs[index]) {
      const next = { ...abilityArgs };
      delete next[index];
      abilityArgs = next;
    }
  }

  function setAbilityTrigger(key: string) {
    if (isDistill || !parameters) return;
    const nextTrigger = abilityTrigger === key ? null : key;
    if (
      nextTrigger &&
      abilityAction &&
      !fits({ ...parameters, ability: { trigger: nextTrigger, action: abilityAction } })
    ) {
      return;
    }
    abilityTrigger = nextTrigger;
  }

  function setAbilityAction(name: string) {
    if (isDistill || !parameters) return;
    const nextAction = abilityAction === name ? null : name;
    if (
      nextAction &&
      abilityTrigger &&
      !fits({ ...parameters, ability: { trigger: abilityTrigger, action: nextAction } })
    ) {
      return;
    }
    abilityAction = nextAction;
  }

  function setKeyword(key: keyof UnitKeywords, value: number) {
    if (!parameters) return;
    const next = Math.max(0, value);
    const maxCut = isDistill ? keywordOwnedValue(key) : Infinity;
    const clamped = Math.min(next, maxCut);
    const nextKeywords = { ...keywords };
    if (clamped) {
      nextKeywords[key] = clamped;
    } else {
      delete nextKeywords[key];
    }
    if (
      !isDistill &&
      clamped > (keywords[key] ?? 0) &&
      !fits({ ...parameters, keywords: nextKeywords })
    ) {
      return;
    }
    keywords = nextKeywords;
  }

  function toggleKeyword(key: keyof UnitKeywords) {
    if (!parameters) return;
    if (!isDistill && hasBooleanKeyword(key)) return;
    if (isDistill && !hasBooleanKeyword(key) && !NUMERIC_KEYWORDS.has(key)) return;

    const enabled = !keywords[key];
    const nextKeywords = { ...keywords };
    if (enabled) {
      nextKeywords[key] = 1;
      if (!isDistill && !fits({ ...parameters, keywords: nextKeywords })) return;
    } else {
      delete nextKeywords[key];
    }
    keywords = nextKeywords;
  }

  function canIncKeyword(key: keyof UnitKeywords): boolean {
    if (!parameters) return false;
    if (isDistill) {
      return (keywords[key] ?? 0) < keywordOwnedValue(key);
    }
    const nextKeywords = { ...keywords, [key]: (keywords[key] ?? 0) + 1 };
    return fits({ ...parameters, keywords: nextKeywords });
  }

  function setCostIncrease(next: number) {
    if (isDistill || !Number.isFinite(next)) return;
    const value = Math.round(next);
    if (value < 1 || value > maxCostIncrease) return;
    if (value < costIncrease && parameters && !fits({ ...parameters, costIncrease: value })) return;
    costIncrease = value;
  }

  function setPower(next: number) {
    if (!Number.isFinite(next) || next < 0) return;
    const value = Math.round(next);
    if (isDistill && value > maxPowerCut) return;
    if (value > power && !canIncPower) return;
    if (value < power && !canDecPower) return;
    power = value;
  }

  function setMaxHealth(next: number) {
    if (!Number.isFinite(next) || next < 0) return;
    const value = Math.round(next);
    if (isDistill && value > maxHealthCut) return;
    if (value > maxHealth && !canIncHealth) return;
    if (value < maxHealth && !canDecHealth) return;
    maxHealth = value;
  }

  function setRetaliate(next: number) {
    if (!Number.isFinite(next) || next < 0) return;
    const value = Math.round(next);
    if (isDistill && value > maxRetaliateCut) return;
    if (value > retaliate && !canIncRetaliate) return;
    if (value < retaliate && !canDecRetaliate) return;
    retaliate = value;
  }

  function adjustFromClick(event: MouseEvent, canDec: boolean, canInc: boolean, apply: () => void) {
    if (event.type === 'contextmenu') event.preventDefault();
    const increase = event.type !== 'contextmenu';
    if (increase && !canInc) return;
    if (!increase && !canDec) return;
    apply();
  }

  function onKeywordRowClick(event: MouseEvent, key: keyof UnitKeywords, numeric: boolean) {
    if (numeric) {
      if (event.type === 'contextmenu') {
        event.preventDefault();
        setKeyword(key, (keywords[key] ?? 0) - 1);
      } else {
        setKeyword(key, (keywords[key] ?? 0) + 1);
      }
      return;
    }
    if (event.type === 'contextmenu') event.preventDefault();
    toggleKeyword(key);
  }

  function onNumberInput(event: Event, apply: (value: number) => void) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    if (raw === '') return;
    apply(Number.parseInt(raw, 10));
  }

  function confirm() {
    if (!parameters || preview?.error) return;
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

{#snippet stepper(
  value: number,
  canDec: boolean,
  canInc: boolean,
  label: string,
  apply: (next: number) => void,
  min = 0
)}
  <div
    class="num-control"
    onclick={(event) => event.stopPropagation()}
    oncontextmenu={(event) => event.stopPropagation()}
  >
    <input
      type="number"
      {min}
      {value}
      aria-label={label}
      oninput={(event) => onNumberInput(event, apply)}
    />
    <div class="step-arrows">
      <button
        type="button"
        class="step-arrow"
        disabled={!canInc}
        aria-label="Increase {label}"
        onclick={() => apply(value + 1)}
      >
        ▲
      </button>
      <button
        type="button"
        class="step-arrow"
        disabled={!canDec}
        aria-label="Decrease {label}"
        onclick={() => apply(value - 1)}
      >
        ▼
      </button>
    </div>
  </div>
{/snippet}

{#snippet statControl(
  value: number,
  canDec: boolean,
  canInc: boolean,
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
      aria-valuemin={0}
      aria-valuenow={value}
      onclick={(event) => adjustFromClick(event, canDec, canInc, () => apply(value + 1))}
      oncontextmenu={(event) => adjustFromClick(event, canDec, canInc, () => apply(value - 1))}
    >
      <img class="stat-face" src={icon} alt="" aria-hidden="true" />
      <span class="stat-value">{value}</span>
    </div>
    <div class="step-arrows">
      <button
        type="button"
        class="step-arrow"
        disabled={!canInc}
        aria-label="Increase {label}"
        onclick={() => apply(value + 1)}
      >
        ▲
      </button>
      <button
        type="button"
        class="step-arrow"
        disabled={!canDec}
        aria-label="Decrease {label}"
        onclick={() => apply(value - 1)}
      >
        ▼
      </button>
    </div>
  </div>
{/snippet}

<div class="overlay" role="presentation">
  <div
    class="frame"
    class:wide={selectingCard}
    role="dialog"
    aria-labelledby="enchant-title"
    style="--wood: url('{woodPath}'); --table: url('{tablePath}'); --parchment: url('{parchmentPath}')"
  >
    <div class="panel">
      <h2 id="enchant-title" class="title">
        <span class="star" aria-hidden="true"></span>
        {#if cardId}
          {isDistill ? 'Distill' : 'Enchant'} {card?.name ?? 'Card'}
        {:else}
          {isDistill ? 'Distill a Card' : 'Enchant a Card'}
        {/if}
        <span class="star" aria-hidden="true"></span>
      </h2>

      {#if selectingCard}
        <section class="section cards-section" aria-label="Cards">
          <h3 class="section-heading">
            <span class="section-icon star-icon" aria-hidden="true"></span>
            Which card?
          </h3>
          {#if availableCards.length === 0}
            <p class="empty">No cards available to enchant.</p>
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
                {hasActiveFilters
                  ? 'No cards match these filters.'
                  : 'No cards available to enchant.'}
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
      {:else if !card || !preview}
        <p class="empty">{preview?.error || 'Card not found.'}</p>
      {:else}
        <section class="section preview-section" aria-label="Preview">
          <div class="preview-row">
            <CardCompact {card} />
            <span class="arrow" aria-hidden="true">→</span>
            {#if preview.preview}
              <CardCompact card={preview.preview} />
            {/if}
          </div>
        </section>

        <section class="section" aria-label="Budget">
          <h3 class="section-heading">
            <span class="section-icon star-icon" aria-hidden="true"></span>
            Budget
          </h3>
          <div class="budget">
            <div class="budget-stat">
              <div class="stat-label">{isDistill ? 'Cut' : 'Spent'}</div>
              <div class="bonus-well" class:over={!!preview.error}>
                {budgetUsed} / {budgetCap}
              </div>
            </div>
            <div class="budget-stat">
              <div class="stat-label">{isDistill ? 'Cost −' : 'Cost +'}</div>
              {#if isDistill}
                <div class="bonus-well">1</div>
              {:else}
                {@render stepper(
                  costIncrease,
                  canDecCost,
                  canIncCost,
                  'Cost increase',
                  setCostIncrease,
                  1
                )}
              {/if}
            </div>
          </div>
          {#if preview.error}
            <p class="budget-note error-note">
              {#if isDistill && budgetShort > 0}
                Need to cut {budgetShort} more
              {:else}
                {preview.error}
              {/if}
            </p>
          {:else if !isDistill && budgetRemainder > 0}
            <p class="budget-note">{budgetRemainder} remaining will be spent automatically</p>
          {:else if isDistill && budgetRemainder > 0}
            <p class="budget-note">Cutting {budgetRemainder} more than required</p>
          {/if}
        </section>

        {#if unitCard}
          <section class="section" aria-label="Stats">
            <h3 class="section-heading">
              <span class="section-icon star-icon" aria-hidden="true"></span>
              Stats
            </h3>
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Power {isDistill ? '−' : '+'}</div>
                {@render statControl(
                  power,
                  canDecPower,
                  canIncPower,
                  'Power',
                  setPower,
                  getAssetPath('images/power-icon.png')
                )}
              </div>
              <div class="stat">
                <div class="stat-label">Health {isDistill ? '−' : '+'}</div>
                {@render statControl(
                  maxHealth,
                  canDecHealth,
                  canIncHealth,
                  'Health',
                  setMaxHealth,
                  getAssetPath('images/health-icon.png')
                )}
              </div>
              <div class="stat large">
                <div class="stat-label" title={getKeywordTooltip('retaliate', retaliate || 1)}>
                  Retaliate {isDistill ? '−' : '+'}
                </div>
                {@render statControl(
                  retaliate,
                  canDecRetaliate,
                  canIncRetaliate,
                  'Retaliate',
                  setRetaliate,
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
            {#if isDistill}
              {#if ownedKeywords.length === 0}
                <p class="empty">This card has no keywords to remove.</p>
              {:else}
                <div class="keyword-list">
                  {#each ownedKeywords as key (key)}
                    {#if NUMERIC_KEYWORDS.has(key)}
                      {@const value = keywords[key] ?? 0}
                      <div
                        class="keyword-row"
                        class:on={value > 0}
                        title={getKeywordTooltip(key, keywordOwnedValue(key))}
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
                        <span class="keyword-cost" title="Budget cost">{keywordCost(key)}</span>
                        {@render stepper(
                          value,
                          value > 0,
                          canIncKeyword(key),
                          formatKeyword(key),
                          (next) => setKeyword(key, next)
                        )}
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
                        <span class="keyword-cost" title="Budget cost">{keywordCost(key)}</span>
                        <span class="toggle" class:on={selected} aria-hidden="true">
                          <span class="toggle-knob"></span>
                        </span>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            {:else if knownKeywords.length === 0}
              <p class="empty">No known keywords yet.</p>
            {:else}
              <div class="keyword-list">
                {#each knownKeywords as key (key)}
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
                      <span class="keyword-cost" title="Budget cost">{keywordCost(key)}</span>
                      {@render stepper(
                        value,
                        value > 0,
                        canIncKeyword(key),
                        formatKeyword(key),
                        (next) => setKeyword(key, next)
                      )}
                    </div>
                  {:else}
                    {@const owned = hasBooleanKeyword(key)}
                    {@const selected = !!keywords[key]}
                    {@const on = owned || selected}
                    <div
                      class="keyword-row"
                      class:on
                      class:owned
                      role="switch"
                      aria-checked={on}
                      aria-disabled={owned || (!selected && !canIncKeyword(key))}
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
                      <span class="keyword-cost" title="Budget cost">{keywordCost(key)}</span>
                      {#if owned}
                        <span class="owned-label">has</span>
                      {/if}
                      <span class="toggle" class:on aria-hidden="true">
                        <span class="toggle-knob"></span>
                      </span>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </section>

          <section class="section abilities-section" aria-label="Abilities">
            <h3 class="section-heading">
              <span class="section-icon star-icon" aria-hidden="true"></span>
              Abilities
            </h3>
            {#if unitCard.abilities?.length}
              <div class="ability-owned">
                {#each unitCard.abilities as ability, index (index)}
                  {@const removed = isAbilityRemoved(index)}
                  <div class="ability-owned-row" class:on={removed} class:removed>
                    {#if isDistill}
                      <div
                        class="keyword-row"
                        class:on={removed}
                        role="switch"
                        aria-checked={removed}
                        title={formatAbility(ability)}
                        onclick={() => toggleRemoveAbility(index)}
                      >
                        <img
                          class="keyword-icon"
                          src={getAssetPath(
                            getTriggerTemplateAsset(
                              getTriggerTemplateKey(ability.trigger.type) ?? 'onDeploy'
                            )
                          )}
                          alt=""
                          aria-hidden="true"
                        />
                        <span class="keyword-name">{formatAbility(ability)}</span>
                        <span class="owned-label">{removed ? 'remove' : 'has'}</span>
                        <span class="toggle" class:on={removed} aria-hidden="true">
                          <span class="toggle-knob"></span>
                        </span>
                      </div>
                    {:else}
                      <div class="ability-name-row">
                        <img
                          class="keyword-icon"
                          src={getAssetPath(
                            getTriggerTemplateAsset(
                              getTriggerTemplateKey(ability.trigger.type) ?? 'onDeploy'
                            )
                          )}
                          alt=""
                          aria-hidden="true"
                        />
                        <span class="keyword-name">{formatAbility(ability)}</span>
                      </div>
                    {/if}
                    {#if !removed}
                      {#each unitAbilityParams.filter((param) => param.index === index) as param (`${param.index}-${param.key}`)}
                        {@const value = abilityArgValue(param.index, param.key)}
                        <div class="ability-param">
                          <span class="stat-label">
                            {param.label}
                            {isDistill ? '−' : '+'}
                            <span class="effect-cost" title="Budget cost of one step"
                              >{abilityParamCost(param.index, param.key)}</span
                            >
                          </span>
                          {@render stepper(
                            value,
                            value > 0,
                            canIncAbilityArg(param.index, param.key),
                            param.label,
                            (next) => setAbilityArg(param.index, param.key, next)
                          )}
                        </div>
                      {/each}
                    {/if}
                  </div>
                {/each}
              </div>
            {:else if isDistill}
              <p class="empty">This card has no abilities to remove.</p>
            {/if}

            {#if !isDistill}
              <div class="ability-group" class:spaced={!!unitCard.abilities?.length}>
                <div class="ability-label">
                  Add ability
                  {#if abilityTrigger && abilityAction}
                    <span class="effect-cost" title="Budget cost">{addAbilityCost()}</span>
                  {/if}
                </div>
                {#if knownActions.length === 0}
                  <p class="empty">No known actions yet.</p>
                {:else}
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
                  <div class="keyword-list action-list">
                    {#each knownActions as name (name)}
                      {@const selected = abilityAction === name}
                      {@const meta = getActionTemplateMeta(name)}
                      <div
                        class="keyword-row"
                        class:on={selected}
                        role="switch"
                        aria-checked={selected}
                        title={getActionTooltip(name)}
                        onclick={() => setAbilityAction(name)}
                      >
                        <span class="keyword-name">{meta?.label ?? name}</span>
                        <span class="toggle" class:on={selected} aria-hidden="true">
                          <span class="toggle-knob"></span>
                        </span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </section>
        {:else if spellCard}
          <section class="section" aria-label="Effects">
            <h3 class="section-heading">
              <span class="section-icon star-icon" aria-hidden="true"></span>
              Effects
            </h3>
            {#if spellParams.length === 0}
              <p class="empty">This spell has no adjustable effects.</p>
            {:else}
              <div class="stats spell-stats">
                {#each spellParams as param (`${param.index}-${param.key}`)}
                  {@const value = actionArgValue(param.index, param.key)}
                  <div class="stat">
                    <div class="stat-label">
                      {param.actionLabel}:
                      {param.label}
                      {isDistill ? '−' : '+'}
                      <span class="effect-cost" title="Budget cost of one step"
                        >{actionParamCost(param.index, param.key)}</span
                      >
                    </div>
                    {@render stepper(
                      value,
                      value > 0,
                      canIncActionArg(param.index, param.key),
                      param.label,
                      (next) => setActionArg(param.index, param.key, next)
                    )}
                  </div>
                {/each}
              </div>
            {/if}
          </section>
        {/if}
      {/if}

      <footer class="actions">
        <button type="button" class="action-btn cancel" onclick={back}>
          {cardId && canChangeCard ? 'Back' : 'Cancel'}
        </button>
        {#if cardId}
          <button
            type="button"
            class="action-btn confirm"
            disabled={!card || !!preview?.error}
            onclick={confirm}
          >
            {isDistill ? 'Distill' : 'Enchant'}
          </button>
        {/if}
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

  .frame.wide {
    width: min(1000px, 100%);
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

  .cards-section {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 0;
    overflow: hidden;
  }

  .cards-section .section-heading {
    margin-bottom: 0;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
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

  .preview-section {
    padding: 8px;
  }

  .preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .arrow {
    flex-shrink: 0;
    font-size: 1.6rem;
    color: #4a3f32;
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: #6a5c4c;
  }

  .budget {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .budget-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 10px;
  }

  .budget-stat + .budget-stat {
    border-left: 1px solid rgba(90, 75, 60, 0.35);
  }

  .bonus-well {
    min-width: 4.5rem;
    padding: 8px 12px;
    color: #f0e6c8;
    background: #2c251d;
    border: 1px solid #3a3228;
    border-radius: 3px;
    font-variant-numeric: tabular-nums;
    text-align: center;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
  }

  .bonus-well.over {
    border-color: #8a4a3c;
    color: #e0a090;
  }

  .budget-note {
    margin: 10px 0 0;
    text-align: center;
    font-size: 0.8rem;
    color: #6a5c4c;
  }

  .error-note {
    color: #8a4a3c;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .spell-stats {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
    width: auto;
    min-width: 40px;
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
    min-width: 4.5rem;
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
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }

  .abilities-section {
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
    margin-top: 10px;
  }

  .ability-owned {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ability-owned-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ability-owned-row.removed {
    opacity: 0.55;
  }

  .ability-name-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .ability-param {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-left: 27px;
  }

  .ability-group.spaced {
    margin-top: 12px;
  }

  .ability-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #5c5146;
  }

  .action-list {
    margin-top: 8px;
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
    .keyword-list,
    .card-grid {
      scrollbar-width: thin;
      scrollbar-color: rgba(90, 75, 60, 0.45) transparent;
    }
  }

  .keyword-list::-webkit-scrollbar,
  .card-grid::-webkit-scrollbar {
    width: 6px;
  }

  .keyword-list::-webkit-scrollbar-button,
  .card-grid::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  .keyword-list::-webkit-scrollbar-track,
  .card-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .keyword-list::-webkit-scrollbar-thumb,
  .card-grid::-webkit-scrollbar-thumb {
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

  .keyword-row.owned {
    opacity: 0.55;
    cursor: default;
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

  .keyword-cost,
  .effect-cost {
    flex-shrink: 0;
    min-width: 1.4rem;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    color: #5c5146;
    text-align: right;
  }

  .effect-cost {
    margin-left: 0.35rem;
  }

  .owned-label {
    flex-shrink: 0;
    font-size: 0.7rem;
    color: #6a5c4c;
    text-transform: uppercase;
    letter-spacing: 0.04em;
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

  .action-btn:disabled {
    opacity: 0.45;
    cursor: default;
    filter: none;
  }
</style>
