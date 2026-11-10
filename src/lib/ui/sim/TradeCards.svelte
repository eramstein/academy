<script lang="ts">
  import type { Action, CardTemplate } from '@/lib/_model';
  import { gs } from '@/lib/_state';
  import { getAssetPath, getCharacterImagePath, getUiIconPath } from '@/lib/_utils/asset-paths';
  import {
    getTradePartners,
    performAction,
    rollNpcTradeCards,
    rollPlayerTradeCards,
  } from '@/lib/sim/actions';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';

  let {
    action,
    onDone,
  }: {
    action: Action;
    onDone: () => void;
  } = $props();

  const framePath = getAssetPath('images/ui/backgrounds/trade-background.jpg');
  const handshakePath = getUiIconPath('handshake');
  const arrowPath = getUiIconPath('arrow-left');

  const partners = getTradePartners();
  const startingPartner =
    typeof action.actionParameters.characterKey === 'string'
      ? action.actionParameters.characterKey
      : partners.length === 1
        ? partners[0].key
        : null;

  let characterKey = $state<string | null>(startingPartner);
  let npcCards = $state<CardTemplate[]>(startingPartner ? rollNpcTradeCards(startingPartner) : []);
  let playerCards = $state<CardTemplate[]>(rollPlayerTradeCards());
  let receiveId = $state<string | null>(null);
  let giveId = $state<string | null>(null);
  let leaving = $state(false);

  const partner = $derived(characterKey ? gs.characters[characterKey] : undefined);
  const canTrade = $derived(!!characterKey && !!receiveId && !!giveId && !leaving);
  const theirLabel = $derived(partner ? `${partner.name}'s cards` : 'Their cards');

  $effect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !leaving) onDone();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function selectPartner(key: string) {
    if (leaving || key === characterKey) return;
    characterKey = key;
    receiveId = null;
    npcCards = rollNpcTradeCards(key);
  }

  async function confirm() {
    if (!canTrade || !characterKey || !receiveId || !giveId) return;
    leaving = true;
    await performAction({
      ...action,
      actionParameters: {
        characterKey,
        receiveCardId: receiveId,
        giveCardId: giveId,
      },
      missingParameters: {},
    });
    onDone();
  }
</script>

<div class="overlay" role="presentation" use:portal>
  <div
    class="frame"
    role="dialog"
    aria-modal="true"
    aria-labelledby="trade-title"
    style="--frame: url('{framePath}')"
  >
    <h2 id="trade-title" class="title">
      <span class="gem" aria-hidden="true"></span>
      Trade Cards
    </h2>

    <div class="sheet">
      <p class="subtitle">
        {partner ? `Trade with ${partner.name}.` : 'Choose who to trade with.'}
      </p>

      {#if partners.length > 1}
        <div class="partners" role="listbox" aria-label="Training partners">
          {#each partners as option (option.key)}
            <button
              type="button"
              class="partner"
              class:selected={option.key === characterKey}
              role="option"
              aria-selected={option.key === characterKey}
              disabled={leaving}
              onclick={() => selectPartner(option.key)}
            >
              <img src={getCharacterImagePath(option.key)} alt="" />
              <span>{option.name}</span>
            </button>
          {/each}
        </div>
      {/if}

      <section class="offer" aria-label={theirLabel}>
        <h3>
          <span class="star" aria-hidden="true"></span>
          {theirLabel}
          <span class="star" aria-hidden="true"></span>
        </h3>
        {#if npcCards.length === 0}
          <p class="empty">Choose a partner to see their cards.</p>
        {:else}
          <div class="row">
            {#each npcCards as card (card.id)}
              <button
                type="button"
                class="card-pick"
                class:selected={receiveId === card.id}
                aria-pressed={receiveId === card.id}
                disabled={leaving}
                onclick={() => (receiveId = card.id)}
              >
                <span class="card-slot">
                  <CardCompact {card} />
                </span>
                {#if receiveId === card.id}
                  <span class="seal" aria-hidden="true">✓</span>
                  <span class="banner">Selected</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </section>

      <div class="swap" aria-hidden="true">
        <span class="swap-line"></span>
        <svg viewBox="0 0 48 32" class="swap-mark">
          <path
            d="M14 8h16a8 8 0 0 1 0 16H18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <path
            d="M18 20l-5 4 5 4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M34 24H18a8 8 0 0 1 0-16h12"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <path
            d="M30 4l5 4-5 4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="swap-line"></span>
      </div>

      <section class="offer yours" aria-label="Your cards">
        <h3>
          <span class="star" aria-hidden="true"></span>
          Your cards
          <span class="star" aria-hidden="true"></span>
        </h3>
        {#if playerCards.length === 0}
          <p class="empty">You have no card to trade.</p>
        {:else}
          <div class="row">
            {#each playerCards as card (card.id)}
              <button
                type="button"
                class="card-pick"
                class:selected={giveId === card.id}
                aria-pressed={giveId === card.id}
                disabled={leaving}
                onclick={() => (giveId = card.id)}
              >
                <span class="card-slot">
                  <CardCompact {card} />
                </span>
                {#if giveId === card.id}
                  <span class="seal" aria-hidden="true">✓</span>
                  <span class="banner">Selected</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </section>
    </div>

    <footer class="footer">
      <button type="button" class="cancel" disabled={leaving} onclick={onDone}>
        <img src={arrowPath} alt="" />
        Cancel
      </button>
      <button type="button" class="confirm" disabled={!canTrade} onclick={confirm}>
        <img src={handshakePath} alt="" />
        Confirm trade
      </button>
    </footer>
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
    padding: 12px;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.72);
  }

  .frame {
    position: relative;
    container-type: size;
    aspect-ratio: 1536 / 1024;
    width: min(1500px, calc(100vw - 16px), calc((100vh - 12px) * 1536 / 1024));
    background: var(--frame) center / 100% 100% no-repeat;
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .title {
    position: absolute;
    top: 2%;
    left: 0;
    right: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    font-size: clamp(1.15rem, 1.7vw, 1.65rem);
    font-weight: 700;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #f4e7c4;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
  }

  .gem {
    width: 8px;
    height: 8px;
    background: #d7c48a;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .title::after {
    content: '';
    width: 8px;
    height: 8px;
    background: #d7c48a;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .sheet {
    position: absolute;
    left: 7.5%;
    right: 7.5%;
    top: 11%;
    bottom: 16%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 0;
  }

  .subtitle {
    margin: 0 0 6px;
    font-size: clamp(0.95rem, 1.15vw, 1.15rem);
    font-style: italic;
    color: #4a3c2e;
  }

  .partners {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .partner {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px 2px 2px;
    border: 1px solid #8a7048;
    border-radius: 4px;
    background: transparent;
    color: var(--color-ink);
    font-family: var(--font-narrative);
    font-size: 0.85rem;
    cursor: pointer;
  }

  .partner img {
    width: 28px;
    height: 28px;
    object-fit: cover;
    object-position: center 14%;
    border-radius: 3px;
  }

  .partner.selected {
    border-color: #1f8f86;
    box-shadow: inset 0 0 0 1px #1f8f86;
  }

  .offer {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: 0;
  }

  .offer h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 4px 0 10px;
    font-size: clamp(0.78rem, 1vw, 0.95rem);
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #3d3228;
  }

  .star {
    width: 7px;
    height: 7px;
    background: #8d734c;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .row {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: flex-start;
    gap: 14px;
    width: 100%;
  }

  .card-pick {
    /* Two rows, headings, and the Selected ribbon have to fit the parchment. */
    --card-scale: min(0.96, calc(25cqh / 240px));
    position: relative;
    width: calc(200px * var(--card-scale));
    height: calc(240px * var(--card-scale));
    margin-bottom: 1.7rem;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    line-height: 0;
    flex: 0 0 auto;
  }

  .card-slot {
    display: block;
    width: 100%;
    height: 100%;
  }

  .card-slot :global(.card) {
    transform: scale(var(--card-scale));
    transform-origin: top left;
  }

  .card-pick.selected .card-slot :global(.card) {
    box-shadow:
      0 0 0 2px #7ef0e2,
      0 0 14px 3px rgba(46, 214, 196, 0.85),
      0 0 28px 8px rgba(20, 140, 130, 0.45);
  }

  .seal {
    position: absolute;
    left: 50%;
    bottom: -2px;
    z-index: 2;
    transform: translate(-50%, 40%);
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 2px solid #e6c98a;
    background: #14867c;
    color: #f7f3e6;
    font-size: 0.75rem;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(20, 30, 28, 0.35);
  }

  .banner {
    position: absolute;
    left: 50%;
    bottom: 0;
    z-index: 1;
    transform: translate(-50%, calc(100% + 8px));
    padding: 3px 12px 4px;
    border: 1px solid #c6a15a;
    border-radius: 3px;
    background: #14685f;
    color: #f0e2b0;
    font-family: var(--font-narrative);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .swap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: min(280px, 46%);
    margin: 10px 0 4px;
    color: #8a6840;
  }

  .swap-line {
    flex: 1 1 auto;
    height: 1px;
    background: #9a7848;
  }

  .swap-mark {
    width: 42px;
    height: 28px;
    flex: 0 0 auto;
  }

  .empty {
    margin: 12px 0;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .footer {
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: 2.6%;
    height: 8.2%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 22px;
  }

  .cancel,
  .confirm {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 70%;
    padding: 0 18px;
    border-radius: 4px;
    font-family: var(--font-narrative);
    font-size: clamp(0.85rem, 1vw, 1rem);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .cancel {
    min-width: 8.5rem;
    color: #f0e6c8;
    background: #2a2118;
    border: 1px solid #8d734c;
  }

  .confirm {
    min-width: 14rem;
    color: #f6edd4;
    background: #14685f;
    border: 1px solid #e6c98a;
    box-shadow: inset 0 0 0 1px rgba(230, 201, 138, 0.35);
  }

  .cancel img,
  .confirm img {
    width: 1.15rem;
    height: 1.15rem;
    object-fit: contain;
    filter: brightness(0) invert(0.92) sepia(0.3) saturate(0.4);
  }

  .cancel:disabled,
  .confirm:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .cancel:hover:not(:disabled),
  .confirm:hover:not(:disabled) {
    filter: brightness(1.08);
  }
</style>
