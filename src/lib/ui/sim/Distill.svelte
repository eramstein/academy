<script lang="ts">
  import {
    CardType,
    isSpellCard,
    isUnitCard,
    ResourceType,
    type Ability,
    type Action,
    type CardTemplate,
    type UnitKeywords,
  } from '@/lib/_model';
  import { getAssetPath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    getDistillPreview,
    getCardEnchantmentBonuses,
    getMaxManaCostDelta,
    performAction,
    type ActionArgDeltas,
    type DistillParameters,
  } from '@/lib/sim/actions';
  import { getAbilityActionNames } from '@/lib/sim/cards/ability-templates';
  import {
    getActionNumericParams,
    getActionTemplateMeta,
    getActionTemplateNameForEffect,
  } from '@/lib/sim/cards/action-templates';
  import { formatKeywordLabel, KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import { playAddResourceSound } from '@/lib/sim/sound';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import OrnateButton from '@/lib/ui/OrnateButton.svelte';
  import DiscardPile from './crafting/DiscardPile.svelte';
  import RitualStage, { type RitualCharm } from './crafting/RitualStage.svelte';
  import WorkbenchShell from './crafting/WorkbenchShell.svelte';

  let {
    action,
    sourceCard,
    canChangeCard,
    onBack,
    onDone,
  }: {
    action: Action;
    sourceCard: CardTemplate;
    canChangeCard: boolean;
    onBack: () => void;
    onDone: () => void;
  } = $props();

  const powerIcon = getAssetPath('images/ui/icons/power-icon-decorated.png');
  const healthIcon = getAssetPath('images/ui/icons/health-icon-decorated.png');
  const retaliateIcon = getAssetPath('images/ui/icons/retaliate-icon-decorated.png');
  const abilityIcon = getUiIconPath('conjure');

  let power = $state(0);
  let maxHealth = $state(0);
  let retaliate = $state(0);
  let keywords = $state<Partial<Record<keyof UnitKeywords, number>>>({});
  let actionArgs = $state<ActionArgDeltas>({});
  let removeAbilities = $state<number[]>([]);
  let selected = $state<Record<ResourceType, number>>(
    Object.fromEntries(Object.values(ResourceType).map((type) => [type, 0])) as Record<
      ResourceType,
      number
    >
  );
  let sealing = $state(false);

  const unitCard = $derived(isUnitCard(sourceCard) ? sourceCard : null);
  const spellCard = $derived(isSpellCard(sourceCard) ? sourceCard : null);
  const cardType = $derived(unitCard ? CardType.Unit : spellCard ? CardType.Spell : null);

  const maxPowerCut = $derived(unitCard?.power ?? 0);
  const maxHealthCut = $derived(unitCard ? Math.max(0, unitCard.maxHealth - 1) : 0);
  const maxRetaliateCut = $derived(unitCard?.retaliate ?? 0);
  const ownedKeywords = $derived(
    unitCard ? KEYWORD_KEYS.filter((key) => !!unitCard.keywords?.[key]) : []
  );
  const keywordMaxes = $derived.by((): Partial<Record<keyof UnitKeywords, number>> => {
    const maxes: Partial<Record<keyof UnitKeywords, number>> = {};
    if (!unitCard) return maxes;
    for (const key of ownedKeywords) {
      maxes[key] = keywordOwnedValue(key);
    }
    return maxes;
  });
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

  const distillParameters = $derived.by((): DistillParameters => {
    const selectedKeywords = Object.fromEntries(
      Object.entries(keywords).filter(([, value]) => value)
    ) as Partial<Record<keyof UnitKeywords, number>>;
    return {
      cardId: sourceCard.id,
      power: power || undefined,
      maxHealth: maxHealth || undefined,
      retaliate: retaliate || undefined,
      keywords: Object.keys(selectedKeywords).length ? selectedKeywords : undefined,
      actionArgs: compactActionArgs(actionArgs),
      removeAbilities: removeAbilities.length ? removeAbilities : undefined,
      resources: selectedResources(),
    };
  });

  const distillPreview = $derived(getDistillPreview(distillParameters));

  const hasCuts = $derived.by(() => {
    const p = distillParameters;
    return !!(
      p.power ||
      p.maxHealth ||
      p.retaliate ||
      (p.keywords && Object.keys(p.keywords).length) ||
      (p.actionArgs && Object.keys(p.actionArgs).length) ||
      (p.removeAbilities && p.removeAbilities.length)
    );
  });

  const distillReady = $derived(
    hasCuts && !distillPreview.error && distillPreview.costDecrease > 0
  );
  const previewCard = $derived(distillPreview.preview ?? sourceCard);
  const costDecrease = $derived(distillPreview.costDecrease);
  const enchantmentBonuses = $derived(getCardEnchantmentBonuses(selectedResources()));
  const maxManaDelta = $derived(getMaxManaCostDelta(enchantmentBonuses.extraMana));
  /** Further cuts cannot lower cost beyond Inspiration (skill plus magic dust). */
  const atCostLimit = $derived(
    costDecrease > 0 && costDecrease >= Math.min(maxManaDelta, sourceCard.cost)
  );

  const shapeSummary = $derived.by(() => {
    if (!hasCuts) return 'Shed traits into the discard to lower the cost.';
    const parts: string[] = [];
    if (power) parts.push(`−${power} power`);
    if (maxHealth) parts.push(`−${maxHealth} health`);
    if (retaliate) parts.push(`−${retaliate} retaliate`);
    for (const key of KEYWORD_KEYS) {
      const amount = keywords[key];
      if (!amount) continue;
      const label = formatKeywordLabel(key);
      if (NUMERIC_KEYWORDS.has(key)) parts.push(`−${amount} ${label.toLowerCase()}`);
      else parts.push(`shed ${label}`);
    }
    for (const index of removeAbilities) {
      const ability = unitCard?.abilities?.[index];
      if (ability) parts.push(`shed ${formatAbility(ability)}`);
    }
    if (spellCard) {
      for (const [indexKey, args] of Object.entries(actionArgs)) {
        const spellAction = spellCard.actions[Number(indexKey)];
        if (!spellAction) continue;
        for (const [key, value] of Object.entries(args)) {
          if (!value) continue;
          parts.push(`−${value} ${key}`);
        }
      }
    }
    if (distillReady) return parts.join(', ');
    return `${parts.join(', ')} — cut more to unlock the discount`;
  });

  const charms = $derived.by((): RitualCharm[] => {
    if (!cardType) return [];
    const list: RitualCharm[] = [];
    if (cardType === CardType.Unit) {
      if (power) list.push({ id: 'essence:power', icon: powerIcon });
      if (maxHealth) list.push({ id: 'essence:hp', icon: healthIcon });
      if (retaliate) list.push({ id: 'essence:retaliate', icon: retaliateIcon });
      for (const key of KEYWORD_KEYS) {
        if (!keywords[key]) continue;
        list.push({
          id: `rune:${key}`,
          icon: getAssetPath(`images/keywords/material-icons/${key}.png`),
        });
      }
      for (const index of removeAbilities) {
        list.push({ id: `ability:${index}`, icon: abilityIcon });
      }
    } else if (spellCard) {
      for (const [indexKey, args] of Object.entries(actionArgs)) {
        if (Object.values(args).some((value) => value > 0)) {
          list.push({ id: `spell:${indexKey}`, icon: abilityIcon });
        }
      }
    }
    return list;
  });

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

  function keywordOwnedValue(key: keyof UnitKeywords): number {
    const current = unitCard?.keywords?.[key];
    if (typeof current === 'number') return current;
    return current ? 1 : 0;
  }

  function hasBooleanKeyword(key: keyof UnitKeywords): boolean {
    if (!unitCard || NUMERIC_KEYWORDS.has(key)) return false;
    return !!unitCard.keywords?.[key];
  }

  function formatAbility(ability: Ability): string {
    const actionName = getAbilityActionNames(ability)[0];
    const actionLabel = actionName
      ? (getActionTemplateMeta(actionName)?.label ?? actionName)
      : (ability.actions[0]?.effect.name ?? 'Ability');
    return `${ability.trigger.type}: ${actionLabel}`;
  }

  function toggleRemoveAbility(index: number) {
    if (removeAbilities.includes(index)) {
      removeAbilities = removeAbilities.filter((entry) => entry !== index);
      return;
    }
    if (atCostLimit) return;
    removeAbilities = [...removeAbilities, index];
    playAddResourceSound();
  }

  function setKeyword(key: keyof UnitKeywords, value: number) {
    const next = Math.max(0, Math.min(value, keywordOwnedValue(key)));
    const prev = keywords[key] ?? 0;
    if (next > prev && atCostLimit) return;
    const nextKeywords = { ...keywords };
    if (next) nextKeywords[key] = next;
    else delete nextKeywords[key];
    keywords = nextKeywords;
    if (next > prev) playAddResourceSound();
  }

  function toggleKeyword(key: keyof UnitKeywords) {
    if (!hasBooleanKeyword(key) && !NUMERIC_KEYWORDS.has(key)) return;
    const enabled = !keywords[key];
    if (enabled && atCostLimit) return;
    const nextKeywords = { ...keywords };
    if (enabled) {
      nextKeywords[key] = 1;
      playAddResourceSound();
    } else delete nextKeywords[key];
    keywords = nextKeywords;
  }

  function setPower(value: number) {
    const next = Math.max(0, Math.min(value, maxPowerCut));
    if (next > power && atCostLimit) return;
    if (next > power) playAddResourceSound();
    power = next;
  }

  function setMaxHealth(value: number) {
    const next = Math.max(0, Math.min(value, maxHealthCut));
    if (next > maxHealth && atCostLimit) return;
    if (next > maxHealth) playAddResourceSound();
    maxHealth = next;
  }

  function setRetaliate(value: number) {
    const next = Math.max(0, Math.min(value, maxRetaliateCut));
    if (next > retaliate && atCostLimit) return;
    if (next > retaliate) playAddResourceSound();
    retaliate = next;
  }

  function setSpellArg(index: number, key: string, value: number) {
    const param = spellParams.find((entry) => entry.index === index && entry.key === key);
    const max = param ? Math.max(0, param.current - 1) : 0;
    const next = Math.max(0, Math.min(value, max));
    const prev = actionArgs[index]?.[key] ?? 0;
    if (next > prev && atCostLimit) return;
    const nextArgs = {
      ...actionArgs,
      [index]: { ...actionArgs[index], [key]: next },
    };
    if (!next) {
      delete nextArgs[index][key];
      if (!Object.keys(nextArgs[index]).length) delete nextArgs[index];
    }
    actionArgs = nextArgs;
    if (next > prev) playAddResourceSound();
  }

  function confirmDistill() {
    if (!distillReady || sealing) return;
    sealing = true;
  }

  function onSealComplete(result: { fortuneBudget: number; learning?: number }) {
    performAction({
      ...action,
      actionParameters: {
        ...action.actionParameters,
        ...distillParameters,
        fortuneBudget: result.fortuneBudget,
        learningRoll: result.learning ?? 0,
      },
      missingParameters: {},
    });
    onDone();
  }

  function onCharmDismiss(id: string) {
    if (sealing) return;
    if (id === 'essence:power') {
      setPower(0);
      return;
    }
    if (id === 'essence:hp') {
      setMaxHealth(0);
      return;
    }
    if (id === 'essence:retaliate') {
      setRetaliate(0);
      return;
    }
    if (id.startsWith('rune:')) {
      setKeyword(id.slice('rune:'.length) as keyof UnitKeywords, 0);
      return;
    }
    if (id.startsWith('ability:')) {
      toggleRemoveAbility(Number(id.slice('ability:'.length)));
      return;
    }
    if (id.startsWith('spell:')) {
      const index = Number(id.slice('spell:'.length));
      if (Number.isNaN(index)) return;
      const next = { ...actionArgs };
      delete next[index];
      actionArgs = next;
    }
  }

  const budgetRemaining = $derived.by(() => {
    if (!cardType) return null;
    return Math.max(0, distillPreview.scopeBudget - distillPreview.saved);
  });
</script>

{#if cardType}
  <WorkbenchShell
    title="Distill {sourceCard.name}"
    subtitle="Strip power from the card to lower its cost."
    wide
    scene="invocation"
  >
    <RitualStage
      bind:selected
      {charms}
      {onCharmDismiss}
      {onSealComplete}
      seal={sealing}
      shapeText={shapeSummary}
      shapeCost={distillReady ? -costDecrease : null}
      atManaLimit={budgetRemaining === 0}
      {budgetRemaining}
      craft="enchant"
      rollFortune
      disabled={sealing}
      split
      showVessel
      showFlank
      suppressCore
    >
      {#snippet vessel()}
        <div class="distill-vessel">
          <span class="land essence" data-charm-land="essence" aria-hidden="true"></span>
          <span class="land rune" data-charm-land="rune" aria-hidden="true"></span>
          <CardCompact card={previewCard} />
          {#if costDecrease > 0}
            <div class="cost-rebate" aria-live="polite">−{costDecrease} mana</div>
          {/if}
        </div>
      {/snippet}
      {#snippet flank()}
        <DiscardPile
          {cardType}
          {power}
          maxPower={maxPowerCut}
          {maxHealth}
          {maxHealthCut}
          {retaliate}
          maxRetaliate={maxRetaliateCut}
          {ownedKeywords}
          {keywordMaxes}
          {keywords}
          abilities={unitCard?.abilities ?? []}
          {removeAbilities}
          {spellParams}
          {actionArgs}
          locked={sealing}
          {atCostLimit}
          onPower={setPower}
          onMaxHealth={setMaxHealth}
          onRetaliate={setRetaliate}
          onKeyword={setKeyword}
          onToggleKeyword={toggleKeyword}
          onToggleAbility={toggleRemoveAbility}
          onSpellArg={setSpellArg}
          {formatAbility}
        />
      {/snippet}
    </RitualStage>

    {#snippet footer()}
      {#if distillPreview.error && hasCuts}
        <div class="budget-footer">
          <span class="budget-error">{distillPreview.error}</span>
        </div>
      {/if}
      <button type="button" class="abandon" disabled={sealing} onclick={onBack}>
        <span class="abandon-mark" aria-hidden="true"></span>
        {canChangeCard ? 'Back' : 'Cancel'}
      </button>
      <OrnateButton icon="moon" disabled={!distillReady || sealing} onclick={confirmDistill}>
        Distill
      </OrnateButton>
    {/snippet}
  </WorkbenchShell>
{/if}

<style>
  .distill-vessel {
    position: relative;
    display: grid;
    place-items: center;
    gap: 10px;
  }

  .land {
    position: absolute;
    width: 8px;
    height: 8px;
    pointer-events: none;
    opacity: 0;
  }

  .land.essence {
    bottom: 52px;
    left: 16px;
  }

  .land.rune {
    bottom: 52px;
    right: 18px;
  }

  .cost-rebate {
    min-width: 6.5rem;
    padding: 8px 14px 7px;
    color: #3d6b3a;
    background:
      linear-gradient(180deg, rgba(255, 248, 230, 0.55), rgba(232, 220, 196, 0.35)),
      color-mix(in srgb, var(--color-parchment, #e8dcc4) 88%, #fff);
    border: 1px solid var(--color-golden);
    border-radius: 4px;
    box-shadow:
      inset 0 1px 0 rgba(255, 248, 230, 0.65),
      0 0 0 1px color-mix(in srgb, var(--color-golden) 55%, transparent),
      0 2px 10px rgba(0, 0, 0, 0.3);
    font-family: var(--font-narrative);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
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

  .budget-error {
    color: #e0a090;
    font-size: 0.85rem;
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
