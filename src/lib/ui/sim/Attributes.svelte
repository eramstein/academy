<script lang="ts">
  import type { Attributes as AttributeStats } from '@/lib/_model';
  import { getAssetPath } from '@/lib/_utils/asset-paths';

  let { attributes }: { attributes: AttributeStats } = $props();

  const ATTR_MAX = 20;
  const ATTR_ORDER: (keyof AttributeStats)[] = [
    'dexterity',
    'intelligence',
    'vitality',
    'charisma',
    'aura',
  ];
  const ATTR_META: Record<keyof AttributeStats, { icon: string; color: string }> = {
    dexterity: { icon: 'boot', color: '#c68642' },
    intelligence: { icon: 'book', color: '#5b8ac8' },
    vitality: { icon: 'heart', color: '#789b5b' },
    charisma: { icon: 'sun', color: '#8a6da8' },
    aura: { icon: 'spiral', color: '#64999b' },
  };

  const rows = $derived(
    ATTR_ORDER.map((key) => ({
      key,
      value: attributes[key],
      pct: Math.min(100, Math.max(0, (attributes[key] / ATTR_MAX) * 100)),
      ...ATTR_META[key],
    }))
  );

  function iconUrl(name: string) {
    return getAssetPath(`images/ui/${name}.svg`);
  }
</script>

<ul class="attr-list">
  {#each rows as attr (attr.key)}
    <li class="attr-row" style="--attr-color: {attr.color}">
      <span class="icon" style="--icon: url('{iconUrl(attr.icon)}')" aria-hidden="true"></span>
      <span class="attr-name">{attr.key}</span>
      <div class="attr-bar" aria-hidden="true">
        <div class="attr-fill" style="width: {attr.pct}%"></div>
      </div>
      <span class="attr-value">{attr.value}</span>
    </li>
  {/each}
</ul>

<style>
  .attr-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
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

  .attr-row {
    display: grid;
    grid-template-columns: 1.1rem 6.4rem 1fr 1.7rem;
    gap: 0.5rem;
    align-items: center;
  }

  .attr-name {
    font-size: 0.9rem;
    text-transform: capitalize;
    color: var(--color-cream);
  }

  .attr-bar {
    height: 0.72rem;
    border-radius: 2px;
    background: #0c1016;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.7);
  }

  .attr-fill {
    height: 100%;
    border-radius: 2px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 48%, rgba(0, 0, 0, 0.28)),
      var(--attr-color);
    box-shadow: 0 0 8px color-mix(in srgb, var(--attr-color) 42%, transparent);
  }

  .attr-value {
    text-align: right;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-cream);
  }
</style>
