<script lang="ts">
  import { ResourceType } from '@/lib/_model';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';

  let {
    type,
    selected,
    owned,
    disabled = false,
    onChange,
  }: {
    type: ResourceType;
    selected: number;
    owned: number;
    disabled?: boolean;
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
  <span class="name">{label}</span>
  <span class="glyph-wrap">
    <span class="glyph" class:painted aria-hidden="true"></span>
  </span>
  <span class="well" data-token-nest={type} aria-hidden="true"></span>
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

  .pile:hover:not(:disabled):not(.empty) {
    background: rgba(255, 248, 230, 0.28);
    border-color: rgba(90, 75, 60, 0.28);
  }

  .pile.on {
    border-color: color-mix(in srgb, var(--color-golden) 65%, transparent);
    background: rgba(191, 161, 74, 0.08);
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

  .glyph-wrap {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .well {
    width: 48px;
    height: 18px;
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

  .name {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: capitalize;
    color: var(--color-ink);
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
