<script lang="ts">
  import type { Action } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import {
    artifactProgressChance,
    canAffordPieceChoices,
    completeCraftedArtifact,
    fillArtifactCell,
    getCraftablePatterns,
    performAction,
    spendCraftFocus,
    type ArtifactCellPayment,
    type FillArtifactCellResult,
  } from '@/lib/sim/actions';
  import ArtifactColors from './crafting/ArtifactColors.svelte';
  import ArtifactMaterials from './crafting/ArtifactMaterials.svelte';
  import PatternBook from './crafting/PatternBook.svelte';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  type CraftStep = 'materials' | 'colors';

  const patterns = $derived(getCraftablePatterns());
  let selectedKey = $state<string | null>(null);
  let craftStep = $state<CraftStep>('materials');
  let pieceChoices = $state<number[]>([]);
  let focusToSpend = $state(0);
  let takeYourTime = $state(false);
  let payment = $state<ArtifactCellPayment>('mastery');
  let working = $state(false);
  let spentFocus = $state(0);
  let sessionTakeYourTime = $state(false);
  let progressedThisSession = $state(false);
  let notice = $state('');
  let leaving = $state(false);
  let patternPage = $state(0);

  const selected = $derived(
    patterns.find((pattern) => pattern.artifact.patternKey === selectedKey) ?? null
  );
  const activeTakeYourTime = $derived(working ? sessionTakeYourTime : takeYourTime);
  const chance = $derived(
    artifactProgressChance(working ? spentFocus : focusToSpend, activeTakeYourTime)
  );
  const complete = $derived(
    !!selected &&
      selected.artifact.colorCost.every(
        (bar, index) => (selected.filled[index] ?? 0) >= bar.cost
      )
  );
  const choicesAffordable = $derived(
    !!selected &&
      pieceChoices.length === selected.pieces.length &&
      canAffordPieceChoices(selected.pieces, pieceChoices)
  );
  const paceChance = $derived(artifactProgressChance(focusToSpend, false));

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || leaving) return;
      if (working) {
        void commit('paused');
        return;
      }
      if (selectedKey && craftStep === 'colors') {
        craftStep = 'materials';
        notice = '';
        return;
      }
      if (selectedKey) {
        selectedKey = null;
        craftStep = 'materials';
        pieceChoices = [];
        notice = '';
        return;
      }
      onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function confirmPattern(patternKey: string) {
    if (leaving) return;
    const view = patterns.find((pattern) => pattern.artifact.patternKey === patternKey);
    if (!view || view.missingPatternNames.length > 0) return;
    selectPattern(patternKey);
  }

  function selectPattern(patternKey: string) {
    const view = patterns.find((pattern) => pattern.artifact.patternKey === patternKey);
    selectedKey = patternKey;
    craftStep = 'materials';
    pieceChoices =
      view?.affordableChoices ?? view?.pieces.map((piece) => piece.suggestedIndex) ?? [];
    focusToSpend = 0;
    takeYourTime = false;
    payment = 'mastery';
    working = false;
    spentFocus = 0;
    sessionTakeYourTime = false;
    progressedThisSession = false;
    notice = '';
  }

  function clearPattern() {
    selectedKey = null;
    craftStep = 'materials';
    pieceChoices = [];
    notice = '';
  }

  function goToColors() {
    if (!selected || leaving || !choicesAffordable) return;
    craftStep = 'colors';
    notice = '';
  }

  function goToMaterials() {
    if (working || leaving) return;
    craftStep = 'materials';
    notice = '';
  }

  function cyclePiece(pieceIndex: number, delta: number) {
    if (!selected || leaving || craftStep !== 'materials') return;
    const count = selected.pieces[pieceIndex]?.alternatives.length ?? 0;
    if (count <= 1) return;
    const current = pieceChoices[pieceIndex] ?? 0;
    const next = [...pieceChoices];
    next[pieceIndex] = (current + delta + count) % count;
    pieceChoices = next;
  }

  function setTakeYourTime(value: boolean) {
    if (working || leaving) return;
    takeYourTime = value;
    if (value) focusToSpend = 0;
  }

  function changeFocus(delta: number) {
    if (working || leaving) return;
    const cap = gs.player.focus ?? 0;
    focusToSpend = Math.max(0, Math.min(cap, focusToSpend + delta));
  }

  function beginSlow() {
    setTakeYourTime(true);
    begin();
  }

  function beginPace() {
    setTakeYourTime(false);
    begin();
  }

  function place(barIndex: number, next: ArtifactCellPayment): FillArtifactCellResult | null {
    payment = next;
    return onCell(barIndex);
  }

  function begin() {
    if (!selected || working || leaving || complete || craftStep !== 'colors') return;
    sessionTakeYourTime = takeYourTime;
    spentFocus = takeYourTime ? 0 : spendCraftFocus(focusToSpend);
    working = true;
    progressedThisSession = false;
    if (takeYourTime) {
      notice = 'You take your time. One careful attempt this session.';
    } else {
      notice = spentFocus > 0 ? `You spend ${spentFocus} focus.` : '';
    }
  }

  function onCell(barIndex: number): FillArtifactCellResult | null {
    if (leaving || !working || !selectedKey || craftStep !== 'colors') return null;
    if (sessionTakeYourTime && progressedThisSession) return null;
    const result = fillArtifactCell(selectedKey, barIndex, chance, payment);
    if (!result) return null;
    progressedThisSession = true;
    if (result.bonus) {
      notice = 'A second cell fills for free.';
    } else if (result.rolled) {
      notice = 'One cell fills.';
    } else {
      notice = 'The last cell of that color fills.';
    }
    if (sessionTakeYourTime && !result.complete) {
      notice = result.bonus
        ? 'Careful work fills two cells. That is all for this session.'
        : 'Careful work fills one cell. That is all for this session.';
    }
    if (result.complete) {
      notice = choicesAffordable
        ? 'The colors are set. The artifact is ready to pick up.'
        : 'The colors are set. Gold and materials are still short.';
    }
    return result;
  }

  async function commit(outcome: 'paused' | 'completed') {
    if (leaving || !selectedKey) return;
    const view = getCraftablePatterns().find(
      (pattern) => pattern.artifact.patternKey === selectedKey
    );
    if (!view) return;
    leaving = true;
    if (
      outcome === 'completed' &&
      !completeCraftedArtifact(view.artifact.patternKey, { pieceChoices })
    ) {
      leaving = false;
      notice = 'Gold and materials are still short.';
      return;
    }
    await performAction({
      ...action,
      actionParameters: {
        outcome,
        patternKey: view.artifact.patternKey,
        name: view.artifact.name,
      },
      missingParameters: {},
    });
    onDone();
  }

</script>

{#if !selected}
  <PatternBook
    {patterns}
    bind:page={patternPage}
    onConfirm={confirmPattern}
    onBack={onDone}
  />
{:else if craftStep === 'materials'}
  <ArtifactMaterials
    pieces={selected.pieces}
    {pieceChoices}
    {leaving}
    affordable={choicesAffordable}
    onCycle={cyclePiece}
    onBack={clearPattern}
    onAssemble={goToColors}
  />
{:else}
  <ArtifactColors
    pattern={selected}
    {leaving}
    {working}
    {complete}
    affordable={choicesAffordable}
    {notice}
    {chance}
    {paceChance}
    {focusToSpend}
    {sessionTakeYourTime}
    {progressedThisSession}
    onFocus={changeFocus}
    onTakeItSlow={beginSlow}
    onBeginPace={beginPace}
    onPlace={place}
    onBack={goToMaterials}
    onLeave={() => commit('paused')}
    onFinish={() => commit('completed')}
  />
{/if}
