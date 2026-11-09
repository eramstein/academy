<script lang="ts">
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import {
    getTriggerTemplateAsset,
    TRIGGER_TEMPLATE_KEYS,
  } from '@/lib/sim/cards/ability-templates';
  import { AREA_PICK_KEYS, areaCells, areaPickLabel } from '@/lib/sim/cards/ranges';

  const STAT_MAX = 20;

  let {
    description,
    isUnit,
    trigger,
    numeric,
    targetCount,
    rangeKey,
    onTrigger,
    onNumeric,
    onTargetCount,
    onRange,
  }: {
    description: string;
    isUnit: boolean;
    trigger: string;
    numeric: { factoryKey: string; label: string; value: number }[];
    /** Null hides the target stepper. */
    targetCount: number | null;
    /** Null hides the area board. Empty string is the single-target pattern. */
    rangeKey: string | null;
    onTrigger: (trigger: string) => void;
    onNumeric: (factoryKey: string, value: number) => void;
    onTargetCount: (value: number) => void;
    onRange: (range: string) => void;
  } = $props();

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function stepAmount(event: MouseEvent | WheelEvent): number {
    return event.shiftKey ? 5 : 1;
  }

  function triggerLabel(key: string): string {
    return key
      .replace(/^on/, 'On ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  function wheelStep(
    node: HTMLElement,
    opts: { value: number; apply: (next: number) => void }
  ) {
    let current = opts;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      const dir = event.deltaY < 0 ? 1 : -1;
      const next = clamp(current.value + dir * stepAmount(event), 1, STAT_MAX);
      if (next !== current.value) current.apply(next);
    }
    node.addEventListener('wheel', onWheel, { passive: false });
    return {
      update(next: { value: number; apply: (value: number) => void }) {
        current = next;
      },
      destroy() {
        node.removeEventListener('wheel', onWheel);
      },
    };
  }
</script>

{#snippet stepper(label: string, value: number, apply: (next: number) => void)}
  <div class="stepper">
    <span class="stepper-label">{label}</span>
    <div
      class="stepper-row"
      use:wheelStep={{ value, apply }}
      title="{label}: scroll to adjust · shift for 5"
    >
      <button
        type="button"
        class="nudge"
        aria-label="Decrease {label}"
        onclick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const next = clamp(value - stepAmount(event), 1, STAT_MAX);
          if (next !== value) apply(next);
        }}
      >
        −
      </button>
      <span class="medallion">{value}</span>
      <button
        type="button"
        class="nudge"
        aria-label="Increase {label}"
        onclick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const next = clamp(value + stepAmount(event), 1, STAT_MAX);
          if (next !== value) apply(next);
        }}
      >
        +
      </button>
    </div>
  </div>
{/snippet}

<div class="details">
  {#if description}
    <p class="blurb">{description}</p>
  {/if}
  <div class="details-body">
    <div class="fields">
      {#each numeric as param (param.factoryKey)}
        {@render stepper(param.label, param.value, (next) => onNumeric(param.factoryKey, next))}
      {/each}
      {#if targetCount !== null}
        {@render stepper('Targets', targetCount, onTargetCount)}
      {/if}
      {#if isUnit}
        <div class="trigger-field">
          <span class="stepper-label">Trigger</span>
          <div class="trigger-list" role="listbox" aria-label="Choose trigger">
            {#each TRIGGER_TEMPLATE_KEYS as key (key)}
              <button
                type="button"
                class="trigger-option"
                class:selected={key === trigger}
                role="option"
                aria-selected={key === trigger}
                onclick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onTrigger(key);
                }}
              >
                <img src={getAssetPath(getTriggerTemplateAsset(key))} alt="" />
                <span>{triggerLabel(key)}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    {#if rangeKey !== null}
      <div class="area">
        <span class="stepper-label">Area</span>
        <p class="area-caption">Choose which units are affected.</p>
        <div class="area-options" role="listbox" aria-label="Choose area">
          {#each AREA_PICK_KEYS as key (key || 'targets')}
            {@const selected = rangeKey === key}
            <button
              type="button"
              class="area-option"
              class:selected
              role="option"
              aria-selected={selected}
              aria-label={areaPickLabel(key)}
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRange(key);
              }}
            >
              <span class="board" aria-hidden="true">
                {#each areaCells(key) as cell, index (`${key}-${index}`)}
                  <i class="cell {cell}"></i>
                {/each}
              </span>
              <span class="area-name">{areaPickLabel(key)}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .details {
    width: 100%;
    padding: 8px 4px 4px;
    border-top: 1px solid rgba(90, 75, 60, 0.28);
    color: var(--color-ink);
    font-family: var(--font-narrative);
  }

  .blurb {
    margin: 0 0 8px;
    font-size: 0.84rem;
    font-style: italic;
    line-height: 1.4;
    color: var(--color-ink-muted);
  }

  .details-body {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    align-items: flex-start;
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 9.5rem;
  }

  .stepper-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #4a3f32;
  }

  .stepper-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .nudge,
  .medallion {
    display: grid;
    place-items: center;
    width: 1.55rem;
    height: 1.55rem;
    padding: 0 0 0.08em;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid #6a5644;
    background:
      linear-gradient(
        145deg,
        rgba(255, 248, 230, 0.45) 0%,
        transparent 38%,
        rgba(42, 24, 16, 0.22) 100%
      ),
      #c4ae8a;
    box-shadow:
      inset 1px 1px 0 rgba(255, 250, 235, 0.7),
      inset -1px -1px 0 rgba(42, 24, 16, 0.4);
    font-family: inherit;
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1;
    color: #1a1510;
  }

  .medallion {
    width: 1.85rem;
    height: 1.85rem;
    font-size: 0.92rem;
  }

  .nudge {
    cursor: pointer;
  }

  .nudge:hover {
    border-color: var(--color-brass);
    background: #d0bb96;
  }

  .trigger-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .trigger-option {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: var(--color-ink);
    font-family: inherit;
    font-size: 0.78rem;
    text-align: left;
    cursor: pointer;
  }

  .trigger-option img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .trigger-option:hover,
  .trigger-option.selected {
    background: rgba(175, 142, 103, 0.22);
  }

  .trigger-option.selected {
    border-color: color-mix(in srgb, var(--color-golden) 70%, #6a5644);
    box-shadow: 0 0 6px rgba(191, 161, 74, 0.35);
  }

  .area {
    flex: 1 1 13rem;
    min-width: 0;
  }

  .area-caption {
    margin: 2px 0 6px;
    font-size: 0.75rem;
    font-style: italic;
    color: var(--color-ink-muted);
  }

  .area-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .area-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 4px 2px 3px;
    border: 1px solid rgba(90, 75, 60, 0.35);
    border-radius: 3px;
    background: rgba(255, 248, 230, 0.28);
    color: var(--color-ink);
    font-family: inherit;
    cursor: pointer;
  }

  .area-option:hover {
    border-color: var(--color-brass);
  }

  .area-option.selected {
    border-color: var(--color-golden);
    background: rgba(191, 161, 74, 0.16);
    box-shadow:
      0 0 0 1px rgba(191, 161, 74, 0.45),
      0 0 10px rgba(191, 161, 74, 0.4);
  }

  .board {
    display: grid;
    grid-template-columns: repeat(5, 7px);
    gap: 2px;
    padding: 3px;
    background: rgba(90, 75, 60, 0.1);
    border: 1px solid rgba(90, 75, 60, 0.28);
    border-radius: 2px;
  }

  .cell {
    width: 7px;
    height: 7px;
    border-radius: 1px;
  }

  .cell.empty {
    background: rgba(232, 220, 196, 0.95);
    box-shadow: inset 0 0 0 1px rgba(90, 75, 60, 0.28);
  }

  .cell.hit {
    background: #8d4a3a;
  }

  .cell.mark {
    background: var(--color-golden);
    box-shadow: 0 0 4px rgba(191, 161, 74, 0.85);
  }

  .area-name {
    font-size: 0.68rem;
    line-height: 1.1;
    text-align: center;
  }
</style>
