<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';

  let {
    type,
    selected,
    owned,
    disabled = false,
    showCount = false,
    layout = 'stack',
    onChange,
  }: {
    type: ResourceType;
    selected: number;
    owned: number;
    disabled?: boolean;
    /** Show how many are owned, and how many are in the circle. */
    showCount?: boolean;
    /** `row` puts the name and count beside the icon. */
    layout?: 'stack' | 'row';
    onChange: (next: number, event: MouseEvent) => void;
  } = $props();

  const RESOURCE_ICONS: Record<ResourceType, string> = {
    [ResourceType.MagicDust]: 'magic_dust',
    [ResourceType.Mithril]: 'metal_bar',
    [ResourceType.Moxes]: 'gem',
  };

  const iconName = RESOURCE_ICONS[type];
  const iconUrl = getUiIconPath(iconName);
  const painted = isPaintedUiIcon(iconName);
  const label = type.replace(/_/g, ' ');
  const remaining = $derived(Math.max(0, owned - selected));
  const empty = $derived(owned === 0 && selected === 0);
  const inactive = $derived(disabled || empty);
  const canAdd = $derived(!inactive && selected < owned);
  const canRemove = $derived(!disabled && selected > 0);

  let bump = $state(false);

  function deltaFor(event: MouseEvent, remove: boolean): number {
    if (remove) return event.shiftKey ? -5 : -1;
    return event.shiftKey ? 5 : 1;
  }

  function commit(event: MouseEvent, remove: boolean) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    if (remove && !canRemove) return;
    if (!remove && !canAdd) return;
    const next = Math.min(owned, Math.max(0, selected + deltaFor(event, remove)));
    if (next === selected) return;
    if (next > selected) bump = true;
    onChange(next, event);
  }
</script>

<button
  type="button"
  class="pile"
  class:row={layout === 'row'}
  class:on={selected > 0}
  class:empty
  class:bump
  disabled={inactive}
  style="--icon: url('{iconUrl}')"
  aria-label="{label}: {selected} in the circle, {remaining} remaining. Click to add, right-click to remove, shift-click for five."
  title="Click to add · Right-click to remove · Shift-click for 5"
  onclick={(event) => commit(event, false)}
  oncontextmenu={(event) => commit(event, true)}
  onanimationend={() => (bump = false)}
>
  <span class="glyph-col">
    <span class="glyph-wrap">
      <span class="glyph" class:painted aria-hidden="true"></span>
    </span>
    <span class="well" data-token-nest={type} aria-hidden="true"></span>
  </span>
  <span class="meta">
    <span class="name">{label}</span>
    {#if showCount}
      <span class="stock">
        {#if selected > 0}<span class="in">{selected}</span><span class="of">/</span>{/if}{owned}
      </span>
    {/if}
  </span>
</button>

<style>
  .pile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 7.6rem;
    padding: 8px 6px 8px;
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

  .pile.row {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    width: 100%;
    padding: 6px 10px 6px 8px;
    border: 1px solid var(--color-brown-border);
    border-radius: 4px;
    background: rgba(255, 248, 230, 0.22);
    box-shadow: inset 0 0 0 1px rgba(255, 248, 230, 0.28);
  }

  .pile:hover:not(:disabled):not(.empty) {
    background: rgba(255, 248, 230, 0.28);
    border-color: rgba(90, 75, 60, 0.28);
  }

  .pile.row:hover:not(:disabled):not(.empty) {
    border-color: var(--color-brass);
    background: rgba(255, 248, 230, 0.4);
  }

  .pile.on {
    border-color: color-mix(in srgb, var(--color-golden) 65%, transparent);
    background: rgba(191, 161, 74, 0.08);
  }

  .pile.row.on {
    border-color: color-mix(in srgb, var(--color-golden) 70%, transparent);
    background: rgba(191, 161, 74, 0.14);
  }

  .pile.bump .glyph {
    animation: bump 0.28s ease;
  }

  .pile.empty,
  .pile:disabled {
    opacity: 0.42;
    cursor: default;
  }

  .pile.on:disabled {
    opacity: 1;
  }

  .glyph-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .glyph-wrap {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .pile.row .glyph-wrap {
    width: 44px;
    height: 44px;
  }

  .well {
    width: 48px;
    height: 18px;
  }

  .pile.row .well {
    width: 28px;
    height: 8px;
  }

  .glyph {
    display: block;
    width: 64px;
    height: 64px;
    background: var(--color-brass);
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
    filter: drop-shadow(0 4px 5px rgba(42, 24, 16, 0.4));
    animation: float 3.4s ease-in-out infinite;
  }

  .pile.row .glyph {
    width: 44px;
    height: 44px;
  }

  .glyph.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .pile.on .glyph {
    filter:
      drop-shadow(0 4px 5px rgba(42, 24, 16, 0.4))
      drop-shadow(0 0 10px color-mix(in srgb, var(--color-golden) 55%, transparent));
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }

  .pile.row .meta {
    align-items: flex-start;
    flex: 1 1 auto;
  }

  .name {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: capitalize;
    color: var(--color-ink);
  }

  .pile.row .name {
    font-size: 0.82rem;
    letter-spacing: 0.04em;
  }

  .stock {
    margin-top: -2px;
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    line-height: 1;
    color: var(--color-ink);
  }

  .pile.row .stock {
    margin-top: 0;
    font-size: 0.9rem;
  }

  .stock .in {
    color: #8a6a28;
    font-weight: 700;
  }

  .stock .of {
    margin: 0 1px;
    color: var(--color-ink-muted);
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  @keyframes bump {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.14) translateY(-6px);
    }
    100% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .glyph,
    .pile.bump .glyph {
      animation: none;
    }
  }
</style>
