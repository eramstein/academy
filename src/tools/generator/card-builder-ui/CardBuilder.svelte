<script lang="ts">
  import { onMount, tick } from 'svelte';
  /*
    Giant vibecoded form to help create cards, not meant to be used by other people.
  */
  // @ts-ignore - Svelte 5 rune provided at runtime
  declare const $state: any;
  // @ts-ignore - Svelte 5 rune provided at runtime
  declare const $derived: any;
  // @ts-ignore - Svelte 5 rune provided at runtime
  declare const $effect: any;
  import type {
    Ability,
    ActionDefinition,
    LandTemplate,
    SpellCardTemplate,
    TargetDefinition,
    UnitCardTemplate,
    UnitKeywords,
  } from '../../../lib/_model';
  import { CardColor, CardType, TriggerType, UnitType } from '../../../lib/_model';
  import type { UnitFilterArgs } from '../../../lib/battle/effects';
  import { baseStatsCost, getActionsBudget, getBudgetForSpell, getBudgetForUnit } from '../budgets';
  import { costPerKeywordForUnit } from '../keywords';
  import { uiState, showToast } from '../../../lib/_state';
  import { UiView } from '../../../lib/_model';
  // Import components
  import Abilities from './Abilities.svelte';
  import Actions from './Actions.svelte';
  import BasicInfo from './BasicInfo.svelte';
  import BudgetSection from './BudgetSection.svelte';
  import JsonOutput from './JsonOutput.svelte';
  import Keywords from './Keywords.svelte';
  import UnitTypes from './UnitTypes.svelte';

  // Filter out empty arguments for clean JSON output
  function getCleanArgs(args: Record<string, any>): Record<string, any> {
    const cleanArgs: Record<string, any> = {};

    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && Object.keys(value).length > 0) {
          // For objects (like range), only include if they have properties
          cleanArgs[key] = value;
        } else if (typeof value !== 'object') {
          // For non-objects, include if they have a meaningful value
          // Ensure numeric values are properly typed as numbers
          if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
            cleanArgs[key] = Number(value);
          } else {
            cleanArgs[key] = value;
          }
        }
      }
    }

    return cleanArgs;
  }

  // Form state
  type BuilderState = {
    name: string;
    type: CardType;
    cost: number;
    power: number;
    maxHealth: number;
    retaliate: number;
    colors: { color: CardColor; count: number }[];
    unitTypes: UnitType[];
    keywords: UnitKeywords | undefined;
    actions: ActionDefinition[];
    abilities: Ability[];
  };

  const initialState: BuilderState = {
    name: '',
    type: CardType.Unit,
    cost: 1,
    power: 1,
    maxHealth: 1,
    retaliate: 0,
    colors: [{ color: CardColor.Red, count: 1 }],
    unitTypes: [] as UnitType[],
    keywords: undefined as UnitKeywords | undefined,
    actions: [] as ActionDefinition[],
    abilities: [] as Ability[],
  };
  let state = $state(initialState);

  // Keywords state
  let state_keywords = $state({
    ranged: false,
    haste: false,
    moveAndAttack: false,
    retaliate: 0,
    armor: 0,
    resist: 0,
    poisonous: 0,
    regeneration: 0,
    trample: false,
    zerk: false,
    cleave: false,
    lance: false,
    flying: false,
  });

  onMount(async () => {
    if (uiState.cardEditor.card) {
      const card = uiState.cardEditor.card;

      state.name = card.name || '';
      state.type = card.type || CardType.Unit;
      state.cost = card.cost || 0;
      state.colors = card.colors ? [...card.colors] : [{ color: CardColor.Red, count: 1 }];

      if (card.type === CardType.Unit) {
        state.power = (card as UnitCardTemplate).power || 0;
        state.maxHealth = (card as UnitCardTemplate).maxHealth || 0;
        state.unitTypes = (card as UnitCardTemplate).unitTypes
          ? [...(card as UnitCardTemplate).unitTypes!]
          : [];
        state.abilities = (card as UnitCardTemplate).abilities
          ? [...(card as UnitCardTemplate).abilities!]
          : [];

        const keywords = (card as UnitCardTemplate).keywords || {};
        state_keywords.ranged = !!keywords.ranged;
        state_keywords.haste = !!keywords.haste;
        state_keywords.moveAndAttack = !!keywords.moveAndAttack;
        state_keywords.trample = !!keywords.trample;
        state_keywords.zerk = !!keywords.zerk;
        state_keywords.cleave = !!keywords.cleave;
        state_keywords.lance = !!keywords.lance;
        state_keywords.flying = !!keywords.flying;
        state_keywords.retaliate = keywords.retaliate || 0;
        state_keywords.armor = keywords.armor || 0;
        state_keywords.resist = keywords.resist || 0;
        state_keywords.poisonous = keywords.poisonous || 0;
        state_keywords.regeneration = keywords.regeneration || 0;
      } else if (card.type === CardType.Spell) {
        state.actions = (card as SpellCardTemplate).actions
          ? [...(card as SpellCardTemplate).actions]
          : [];
      } else if (card.type === CardType.Land) {
        state.maxHealth = (card as LandTemplate).health || 0;
        state.retaliate = (card as LandTemplate).retaliate || 0;
        state.abilities = (card as LandTemplate).abilities
          ? [...(card as LandTemplate).abilities!]
          : [];
      }
    }
  });

  // Action editing state
  let editingActionIndex = $state(-1);
  let newAction = $state({
    effectName: '',
    effectArgs: {} as Record<string, any>,
    hasTargets: false,
    targets: [] as TargetDefinition[],
  });

  // Ability editing state
  let editingAbilityIndex = $state(-1);
  let newAbility = $state({
    triggerType: TriggerType.Activated,
    range: {} as UnitFilterArgs,
    cost: 0,
    exhausts: false,
    staticRecompute: [] as TriggerType[],
    text: '',
    actions: [] as ActionDefinition[],
  });

  // Color management
  function addColor() {
    state.colors = [...state.colors, { color: CardColor.Red, count: 1 }];
  }

  function removeColor(index: number) {
    state.colors = state.colors.filter((_: any, i: number) => i !== index);
  }

  function updateColor(index: number, field: 'color' | 'count', value: CardColor | number) {
    state.colors = state.colors.map((color: any, i: number) =>
      i === index ? { ...color, [field]: value } : color
    );
  }

  // Unit type management
  function toggleUnitType(unitType: UnitType) {
    if (state.unitTypes.includes(unitType)) {
      state.unitTypes = state.unitTypes.filter((t: UnitType) => t !== unitType);
    } else {
      state.unitTypes = [...state.unitTypes, unitType];
    }
  }

  // Keywords management
  $effect(() => {
    const keywords: UnitKeywords = {};

    if (state_keywords.ranged) keywords.ranged = true;
    if (state_keywords.haste) keywords.haste = true;
    if (state_keywords.moveAndAttack) keywords.moveAndAttack = true;
    if (state_keywords.trample) keywords.trample = true;
    if (state_keywords.zerk) keywords.zerk = true;
    if (state_keywords.cleave) keywords.cleave = true;
    if (state_keywords.lance) keywords.lance = true;
    if (state_keywords.flying) keywords.flying = true;

    if (state_keywords.retaliate > 0) keywords.retaliate = state_keywords.retaliate;
    if (state_keywords.armor > 0) keywords.armor = state_keywords.armor;
    if (state_keywords.resist > 0) keywords.resist = state_keywords.resist;
    if (state_keywords.poisonous > 0) keywords.poisonous = state_keywords.poisonous;
    if (state_keywords.regeneration > 0) keywords.regeneration = state_keywords.regeneration;

    state.keywords = Object.keys(keywords).length > 0 ? keywords : undefined;
  });

  // Action management
  function addAction() {
    try {
      const action: ActionDefinition = {
        effect: {
          name: newAction.effectName,
          args: getCleanArgs(newAction.effectArgs),
        },
        ...(newAction.hasTargets && {
          targets: newAction.targets,
        }),
      };

      state.actions = [...state.actions, action];

      // Reset form
      newAction.effectName = '';
      newAction.effectArgs = {};
      newAction.hasTargets = false;
      newAction.targets = [];
    } catch (error) {
      alert('Error adding action: ' + error);
    }
  }

  function removeAction(index: number) {
    state.actions = state.actions.filter((_: any, i: number) => i !== index);
  }

  function editAction(index: number) {
    const action = state.actions[index];
    newAction.effectName = action.effect.name;
    newAction.effectArgs = { ...action.effect.args };
    newAction.hasTargets = !!(action.targets && action.targets.length > 0);
    newAction.targets = action.targets || [];
    editingActionIndex = index;
  }

  function updateAction() {
    try {
      const action: ActionDefinition = {
        effect: {
          name: newAction.effectName,
          args: getCleanArgs(newAction.effectArgs),
        },
        ...(newAction.hasTargets && {
          targets: newAction.targets,
        }),
      };

      state.actions = state.actions.map((a: any, i: number) =>
        i === editingActionIndex ? action : a
      );

      // Reset form
      newAction.effectName = '';
      newAction.effectArgs = {};
      newAction.hasTargets = false;
      newAction.targets = [];
      editingActionIndex = -1;
    } catch (error) {
      alert('Error updating action: ' + error);
    }
  }

  function cancelEdit() {
    newAction.effectName = '';
    newAction.effectArgs = {};
    newAction.hasTargets = false;
    newAction.targets = [];
    editingActionIndex = -1;
  }

  // Generate JSON
  function generateJSON() {
    if (state.type === CardType.Unit) {
      const cardData: UnitCardTemplate = {
        id: derivedId,
        name: state.name,
        type: state.type,
        cost: state.cost,
        power: state.power,
        maxHealth: state.maxHealth,
        colors: state.colors,
        unitTypes: state.unitTypes.length > 0 ? state.unitTypes : undefined,
        keywords: state.keywords,
        abilities: state.abilities.length > 0 ? state.abilities : undefined,
      };
      return JSON.stringify(cardData, null, 2);
    } else if (state.type === CardType.Spell) {
      const cardData: SpellCardTemplate = {
        id: derivedId,
        name: state.name,
        type: state.type,
        cost: state.cost,
        colors: state.colors,
        actions: state.actions,
      };
      return JSON.stringify(cardData, null, 2);
    } else {
      const cardData: LandTemplate = {
        id: derivedId,
        name: state.name,
        type: state.type,
        cost: 0,
        colors: state.colors,
        health: state.maxHealth,
        abilities: state.abilities.length > 0 ? state.abilities : undefined,
        ...(state.retaliate > 0 ? { retaliate: state.retaliate } : {}),
      };
      return JSON.stringify(cardData, null, 2);
    }
  }

  // Derived card ID from name
  let derivedId = $derived(
    (() => {
      if (!state.name.trim()) return '';
      return state.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation and special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    })()
  );

  // Budget calculations (for both units and spells)
  let totalBudget = $derived(
    state.type === CardType.Unit
      ? getBudgetForUnit(state.cost, state.colors)
      : getBudgetForSpell(state.cost, state.colors)
  );

  let statsBudget = $derived(
    state.type === CardType.Unit
      ? state.power * baseStatsCost.power + state.maxHealth * baseStatsCost.health
      : 0
  );

  // Get keyword costs for display
  let keywordCosts = $derived(
    state.type === CardType.Unit
      ? costPerKeywordForUnit({
          power: state.power,
          maxHealth: state.maxHealth,
          colors: state.colors,
        })
      : {}
  );

  let keywordsBudget = $derived(
    (() => {
      if (
        state.type !== CardType.Unit ||
        !state.keywords ||
        Object.keys(state.keywords).length === 0
      )
        return 0;
      let total = 0;
      Object.entries(state.keywords).forEach(([key, value]) => {
        const keywordKey = key as keyof UnitKeywords;
        if (typeof value === 'number' && value > 0) {
          total += (keywordCosts as any)[keywordKey] * value;
        } else if (value === true) {
          total += (keywordCosts as any)[keywordKey];
        }
      });
      return total;
    })()
  );

  let actionsBudget = $derived(state.type === CardType.Spell ? getActionsBudget(state.actions) : 0);

  let remainingBudget = $derived(
    state.type === CardType.Unit
      ? totalBudget - statsBudget - keywordsBudget
      : totalBudget - actionsBudget
  );

  let jsonOutput = $derived(generateJSON());

  // Reset form function
  function resetForm() {
    state.name = '';
    state.type = CardType.Unit;
    state.cost = 1;
    state.power = 1;
    state.maxHealth = 1;
    state.retaliate = 0;
    state.unitTypes = [];
    state.actions = [];
    state.abilities = [];

    // Reset keywords state
    state_keywords.ranged = false;
    state_keywords.haste = false;
    state_keywords.moveAndAttack = false;
    state_keywords.trample = false;
    state_keywords.zerk = false;
    state_keywords.cleave = false;
    state_keywords.lance = false;
    state_keywords.flying = false;
    state_keywords.retaliate = 0;
    state_keywords.armor = 0;
    state_keywords.resist = 0;
    state_keywords.poisonous = 0;
    state_keywords.regeneration = 0;

    // Reset action editing
    cancelEdit();

    // Reset ability editing
    cancelEditAbility();
  }

  // Ability management
  function addAbility() {
    try {
      const ability: Ability = {
        trigger: {
          type: newAbility.triggerType,
          ...(Object.keys(newAbility.range || {}).length > 0
            ? { range: newAbility.range as any }
            : {}),
          ...(newAbility.triggerType === TriggerType.Static && newAbility.staticRecompute.length
            ? { staticRecompute: [...newAbility.staticRecompute] }
            : {}),
          ...(newAbility.text?.trim() ? { text: newAbility.text.trim() } : {}),
        },
        actions: [...newAbility.actions],
        ...(newAbility.cost > 0 ? { cost: newAbility.cost } : {}),
        ...(newAbility.exhausts ? { exhausts: true } : {}),
      };
      state.abilities = [...state.abilities, ability];

      // reset
      newAbility.triggerType = TriggerType.Activated;
      newAbility.range = {};
      newAbility.cost = 0;
      newAbility.exhausts = false;
      newAbility.staticRecompute = [];
      newAbility.text = '';
      newAbility.actions = [];
    } catch (error) {
      alert('Error adding ability: ' + error);
    }
  }

  function removeAbility(index: number) {
    state.abilities = state.abilities.filter((_: any, i: number) => i !== index);
  }

  function editAbility(index: number) {
    const ability = state.abilities[index];
    newAbility.triggerType = ability.trigger.type;
    newAbility.range = { ...(ability.trigger.range || {}) } as any;
    newAbility.cost = ability.cost || 0;
    newAbility.exhausts = !!ability.exhausts;
    newAbility.staticRecompute = ability.trigger.staticRecompute
      ? [...ability.trigger.staticRecompute]
      : [];
    newAbility.text = ability.trigger.text || '';
    newAbility.actions = ability.actions ? [...ability.actions] : [];
    editingAbilityIndex = index;
  }

  function updateAbility() {
    try {
      const ability: Ability = {
        trigger: {
          type: newAbility.triggerType,
          ...(Object.keys(newAbility.range || {}).length > 0
            ? { range: newAbility.range as any }
            : {}),
          ...(newAbility.triggerType === TriggerType.Static && newAbility.staticRecompute.length
            ? { staticRecompute: [...newAbility.staticRecompute] }
            : {}),
          ...(newAbility.text?.trim() ? { text: newAbility.text.trim() } : {}),
        },
        actions: [...newAbility.actions],
        ...(newAbility.cost > 0 ? { cost: newAbility.cost } : {}),
        ...(newAbility.exhausts ? { exhausts: true } : {}),
      };
      state.abilities = state.abilities.map((a: any, i: number) =>
        i === editingAbilityIndex ? ability : a
      );

      // reset
      newAbility.triggerType = TriggerType.Activated;
      newAbility.range = {};
      newAbility.cost = 0;
      newAbility.exhausts = false;
      newAbility.staticRecompute = [];
      newAbility.text = '';
      newAbility.actions = [];
      editingAbilityIndex = -1;
    } catch (error) {
      alert('Error updating ability: ' + error);
    }
  }

  function cancelEditAbility() {
    newAbility.triggerType = TriggerType.Activated;
    newAbility.range = {};
    newAbility.cost = 0;
    newAbility.exhausts = false;
    newAbility.staticRecompute = [];
    newAbility.text = '';
    newAbility.actions = [];
    editingAbilityIndex = -1;
  }

  // Download JSON function
  function downloadJSON() {
    if (!derivedId.trim()) {
      showToast('Please enter a Card Name first!', 'error');
      return;
    }

    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${derivedId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveToServer() {
    if (!derivedId.trim()) {
      showToast('Please enter a Card Name first!', 'error');
      return;
    }

    try {
      const response = await fetch('/api/save-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonOutput,
      });

      if (response.ok) {
        showToast(`Card "${state.name}" saved successfully!`, 'success');
        // Clear editor state to prevent re-loading same card if navigating back
        uiState.cardEditor.card = null;
      } else {
        const errorData = await response.json();
        showToast(`Failed to save card: ${errorData.error || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error saving card:', error);
      showToast('Error saving card connectivity issue', 'error');
    }
  }
</script>

<div class="card-builder">
  <BudgetSection
    {state}
    {totalBudget}
    {statsBudget}
    {keywordsBudget}
    {actionsBudget}
    {remainingBudget}
    {resetForm}
  />

  <div class="form-sections">
    <BasicInfo {state} {addColor} {removeColor} {updateColor} />

    <UnitTypes {state} {toggleUnitType} />

    <Keywords {state} {state_keywords} {keywordCosts} />

    <Actions
      {state}
      {editingActionIndex}
      {newAction}
      {addAction}
      {removeAction}
      {editAction}
      {updateAction}
      {cancelEdit}
    />

    <Abilities
      {state}
      {editingAbilityIndex}
      {newAbility}
      {addAbility}
      {removeAbility}
      {editAbility}
      {updateAbility}
      {cancelEditAbility}
    />

    <JsonOutput {jsonOutput} {downloadJSON} {saveToServer} />
  </div>
</div>

<style>
  .card-builder {
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-sections {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
</style>
