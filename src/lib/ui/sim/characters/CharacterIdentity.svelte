<script lang="ts">
  import type { Character, Player } from '@/lib/_model/model-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import CharacterPortrait from './CharacterPortrait.svelte';

  let { character }: { character: Character } = $props();

  const parchmentPath = getAssetPath('images/parchment.png');
  const cornerPath = getAssetPath('images/ui/corner.svg');

  const place = $derived(gs.places[character.placeKey]);
  const region = $derived(place ? gs.regions[place.regionKey] : undefined);
  const player = $derived(isPlayer(character) ? character : null);

  function isPlayer(value: Character): value is Player {
    return 'maxFocus' in value;
  }

  function iconUrl(name: string) {
    return getAssetPath(`images/ui/${name}.svg`);
  }
</script>

{#snippet icon(name: string)}
  <span class="icon" style="--icon: url('{iconUrl(name)}')" aria-hidden="true"></span>
{/snippet}

{#snippet divider()}
  <div class="divider" aria-hidden="true">
    <span class="rule"></span>
    <span class="diamond"></span>
    <span class="rule"></span>
  </div>
{/snippet}

<header
  class="identity-card"
  style="--parchment: url('{parchmentPath}'); --corner: url('{cornerPath}');"
>
  <div class="portrait-frame">
    <span class="portrait-ornament tl" aria-hidden="true"></span>
    <span class="portrait-ornament tr" aria-hidden="true"></span>
    <span class="portrait-ornament bl" aria-hidden="true"></span>
    <span class="portrait-ornament br" aria-hidden="true"></span>
    <div class="portrait-inner">
      <CharacterPortrait {character} />
    </div>
  </div>
  <div class="identity">
    <h2 class="name">{character.name}</h2>
    {@render divider()}
    <dl class="meta">
      <div class="meta-row">
        {@render icon('pin')}
        <dt>Location</dt>
        <dd>{place?.name ?? character.placeKey}</dd>
      </div>
      {#if region}
        <div class="meta-row">
          {@render icon('temple')}
          <dt>Region</dt>
          <dd>{region.name}</dd>
        </div>
      {/if}
      <div class="meta-row">
        {@render icon('coin')}
        <dt>Gold</dt>
        <dd class="gold">{character.gold}</dd>
      </div>
      {#if player}
        <div class="meta-row">
          {@render icon('spiral')}
          <dt>Focus</dt>
          <dd class="gold">{player.focus}</dd>
        </div>
      {/if}
    </dl>
    {@render divider()}
  </div>
</header>

<style>
  .identity-card {
    display: flex;
    flex-shrink: 0;
    gap: 1rem;
    align-items: center;
    min-width: 0;
    margin: 0.7rem 0.7rem 0;
    padding: 0.7rem 0.85rem;
    box-sizing: border-box;
    color: var(--color-ink);
    font-family: var(--font-narrative);
    background: var(--color-parchment) var(--parchment) center / cover;
    background-blend-mode: multiply;
    border: none;
    border-radius: 6px;
    box-shadow:
      inset 0 0 28px rgba(90, 75, 60, 0.12),
      0 8px 18px rgba(0, 0, 0, 0.35);
  }

  .portrait-frame {
    position: relative;
    flex: 0 0 auto;
    width: clamp(132px, 34%, 210px);
    aspect-ratio: 1;
    padding: 5px;
    box-sizing: border-box;
    background: var(--color-wood);
    border: 2px solid var(--color-deep-brown);
    border-radius: 6px;
    box-shadow:
      inset 0 0 0 1px rgba(175, 142, 103, 0.28),
      0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .portrait-inner {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 3px;
    background: var(--color-deep-brown);
  }

  .portrait-inner :global(.character-portrait) {
    border-radius: 0;
  }

  .portrait-ornament {
    position: absolute;
    z-index: 2;
    width: 12px;
    height: 12px;
    pointer-events: none;
    background: var(--color-brass);
    mask: var(--corner) center / contain no-repeat;
    -webkit-mask: var(--corner) center / contain no-repeat;
  }

  .portrait-ornament.tl {
    top: 1px;
    left: 1px;
  }

  .portrait-ornament.tr {
    top: 1px;
    right: 1px;
    transform: rotate(90deg);
  }

  .portrait-ornament.bl {
    bottom: 1px;
    left: 1px;
    transform: rotate(-90deg);
  }

  .portrait-ornament.br {
    bottom: 1px;
    right: 1px;
    transform: rotate(180deg);
  }

  .identity {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.15rem 0.15rem 0.15rem 0.2rem;
  }

  .name {
    margin: 0;
    font-size: clamp(1.25rem, 2.2vw, 1.7rem);
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-ink);
    letter-spacing: 0.01em;
  }

  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.45rem;
    color: var(--color-ink);
  }

  .rule {
    height: 1px;
    background: currentColor;
    opacity: 0.42;
  }

  .diamond {
    width: 7px;
    height: 7px;
    background: currentColor;
    opacity: 0.7;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .meta {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
  }

  .meta-row {
    display: grid;
    grid-template-columns: 1.1rem 5.6rem 1fr;
    gap: 0.45rem;
    align-items: center;
    min-width: 0;
  }

  .icon {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
    flex-shrink: 0;
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .meta-row dt {
    margin: 0;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.68rem;
    font-weight: 700;
  }

  .meta-row dd {
    margin: 0;
    min-width: 0;
    color: var(--color-ink);
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gold {
    font-variant-numeric: tabular-nums;
  }
</style>
