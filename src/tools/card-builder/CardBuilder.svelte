<script lang="ts">
  import { onDestroy } from 'svelte';
  import { CardType } from '@/lib/_model';
  import './card-builder.css';
  import { blankCard, serializeCard, type CardDraft, type UnitDraft } from './model';
  import AbilityList from './AbilityList.svelte';
  import ActionList from './ActionList.svelte';
  import ColorPips from './ColorPips.svelte';
  import UnitFields from './UnitFields.svelte';

  let card = $state<CardDraft>(blankCard());
  let copied = $state(false);
  let copyError = $state('');
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const json = $derived(JSON.stringify(serializeCard(card), null, 2));
  const cardTypes = Object.values(CardType);

  function guardKeys(event: KeyboardEvent) {
    if (event.key === 'Escape') return;
    event.stopPropagation();
  }

  function markCopied() {
    copied = true;
    copyError = '';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 1600);
  }

  function copyWithSelection(): boolean {
    const area = document.createElement('textarea');
    area.value = json;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.userSelect = 'text';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }

  async function copyJson() {
    copyError = '';
    try {
      await navigator.clipboard.writeText(json);
      markCopied();
    } catch {
      if (copyWithSelection()) {
        markCopied();
        return;
      }
      copied = false;
      copyError = 'Could not copy. Select the JSON and copy it manually.';
    }
  }

  function clearCard() {
    if (!confirm('Clear this card?')) return;
    card = blankCard();
    copied = false;
    copyError = '';
  }

  onDestroy(() => clearTimeout(copyTimer));
</script>

{#snippet unitEditor(summoned: UnitDraft)}
  <UnitFields unit={summoned} showBasics {unitEditor} />
{/snippet}

<div class="cb" data-view="card-builder" onkeydown={guardKeys}>
  <header class="cb-header">
    <div>
      <h1>Card builder</h1>
      <p class="cb-lede">
        Pick every field on the template, including actions, targets, and ranges.
      </p>
    </div>
    <div class="cb-row">
      <button type="button" class="cb-btn cb-btn-ghost" onclick={clearCard}>Clear</button>
      <button type="button" class="cb-btn cb-btn-primary" onclick={copyJson}>
        {copied ? 'Copied' : 'Copy JSON'}
      </button>
    </div>
  </header>
  {#if copyError}
    <p class="cb-error">{copyError}</p>
  {/if}

  <div class="cb-body">
    <div class="cb-form">
      <section class="cb-section">
        <div class="cb-basics">
          <div class="cb-basics-row">
            <label class="cb-field-inline cb-type-field">
              <span class="cb-label">Type</span>
              <select class="cb-input" bind:value={card.type}>
                {#each cardTypes as cardType (cardType)}
                  <option value={cardType}>{cardType}</option>
                {/each}
              </select>
            </label>
            <label class="cb-field-inline cb-name-field">
              <span class="cb-label">Name</span>
              <input class="cb-input" bind:value={card.name} autocomplete="off" />
            </label>
            <label class="cb-field-inline cb-cost-field">
              <span class="cb-label">Cost</span>
              <input class="cb-input" type="number" bind:value={card.cost} />
            </label>
          </div>
          <div class="cb-basics-row cb-basics-meta">
            <ColorPips colors={card.colors} />
            <label class="cb-field-inline cb-pool-field">
              <span class="cb-label">Pool keys</span>
              <input
                class="cb-input"
                bind:value={card.poolKeysText}
                placeholder="emma, base"
                autocomplete="off"
              />
            </label>
          </div>
        </div>
      </section>

      {#if card.type === CardType.Unit}
        <UnitFields unit={card} {unitEditor} />
      {:else if card.type === CardType.Spell}
        <section class="cb-section">
          <ActionList actions={card.actions} {unitEditor} />
        </section>
      {:else}
        <section class="cb-section">
          <div class="cb-numbers">
            <label class="cb-field">
              <span class="cb-label">Health</span>
              <input class="cb-input" type="number" bind:value={card.health} />
            </label>
            <div class="cb-field">
              <span class="cb-label">Retaliate</span>
              <label class="cb-check">
                <input type="checkbox" bind:checked={card.includeLandRetaliate} />
                Include
              </label>
              {#if card.includeLandRetaliate}
                <input class="cb-input" type="number" bind:value={card.retaliate} />
              {/if}
            </div>
          </div>
        </section>
        <section class="cb-section">
          <AbilityList abilities={card.abilities} title="Abilities" {unitEditor} />
        </section>
        <section class="cb-section">
          <AbilityList abilities={card.ruinsAbilities} title="Ruins abilities" {unitEditor} />
        </section>
      {/if}
    </div>

    <aside class="cb-preview">
      <div class="cb-preview-head">Template JSON</div>
      <pre class="cb-json">{json}</pre>
    </aside>
  </div>
</div>
