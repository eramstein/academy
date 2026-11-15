<script lang="ts">
  import {
    CardColor,
    isLandCard,
    isSpellCard,
    isUnitCard,
    type Ability,
    type ActionDefinition,
    type CardTemplate,
    type UnitKeywords,
  } from '@/lib/_model';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { DataEffectTemplates } from '@/lib/battle/effects/effect-templates';
  import { getRangeLabel } from '@/lib/battle/effects';
  import { formatKeywordLabel, KEYWORD_KEYS, NUMERIC_KEYWORDS } from '@/lib/sim/cards/keywords';
  import CardCompact from '@/lib/ui/cards/CardCompact.svelte';
  import {
    MANA_COSTS,
    NPC_COLORS,
    createEmptyQuery,
    filterNpcCards,
    isQueryEmpty,
    npcCardCatalog,
    poolKeyOptions,
    type NpcCardQuery,
    type NpcCardRecord,
  } from './query';

  let query = $state<NpcCardQuery>(createEmptyQuery());
  let selectedKey = $state<string | null>(null);

  const poolKeys = poolKeyOptions(npcCardCatalog);
  const matches = $derived(filterNpcCards(npcCardCatalog, query));
  const selected = $derived(
    matches.find((record) => record.key === selectedKey) ?? matches[0] ?? null
  );

  function toggleColor(color: CardColor) {
    const colors = query.colors.includes(color)
      ? query.colors.filter((item) => item !== color)
      : [...query.colors, color];
    query = { ...query, colorless: false, colors };
  }

  function toggleColorless() {
    query = {
      ...query,
      colorless: !query.colorless,
      colors: query.colorless ? query.colors : [],
    };
  }

  function toggleCost(cost: number) {
    const costs = query.costs.includes(cost)
      ? query.costs.filter((item) => item !== cost)
      : [...query.costs, cost];
    query = { ...query, costs };
  }

  function togglePoolKey(key: string) {
    const keys = query.poolKeys.includes(key)
      ? query.poolKeys.filter((item) => item !== key)
      : [...query.poolKeys, key];
    query = { ...query, poolKeys: keys };
  }

  function costLabel(card: CardTemplate): string {
    return typeof card.cost === 'number' ? String(card.cost) : '—';
  }

  function colorIcon(color: string): string {
    return getAssetPath(`images/ui/icons/color_${color}.png`);
  }

  function selectRecord(record: NpcCardRecord) {
    selectedKey = record.key;
  }

  function actionLabel(action: ActionDefinition): string {
    return DataEffectTemplates[action.effect.name](action.effect.args).label(action.targets || []);
  }

  function abilityLabel(ability: Ability): string {
    let trigger = ability.trigger.type;
    if (ability.cost) trigger += ` (${ability.cost})`;
    if (ability.exhausts) trigger += ' ↻';
    const parts = [
      trigger,
      ability.trigger.range ? getRangeLabel(ability.trigger.range) : '',
      ...ability.actions.map((action) => actionLabel(action)),
    ].filter((part) => part.trim().length > 0);
    return parts.join(' · ');
  }

  function statsLabel(card: CardTemplate): string {
    if (isUnitCard(card)) {
      return `${card.power}/${card.maxHealth}/${card.retaliate}`;
    }
    if (isLandCard(card)) {
      return `hp ${card.health}`;
    }
    return '—';
  }

  function keywordLabels(card: CardTemplate): string[] {
    if (!isUnitCard(card) || !card.keywords) return [];
    const keywords = card.keywords;
    return KEYWORD_KEYS.flatMap((key) => {
      const value = keywords[key as keyof UnitKeywords];
      if (!value) return [];
      const label = formatKeywordLabel(key);
      if (NUMERIC_KEYWORDS.has(key) && typeof value === 'number' && value !== 1) {
        return [`${label} ${value}`];
      }
      return [label];
    });
  }

  function abilityLabels(card: CardTemplate): string[] {
    if (isSpellCard(card)) {
      return card.actions.map((action) => actionLabel(action));
    }
    const abilities: Ability[] = [];
    if ((isUnitCard(card) || isLandCard(card)) && card.abilities) {
      abilities.push(...card.abilities);
    }
    if (isLandCard(card) && card.ruinsAbilities) {
      abilities.push(...card.ruinsAbilities);
    }
    return abilities.map((ability) => abilityLabel(ability));
  }

  function typesLabel(card: CardTemplate): string {
    if (isUnitCard(card) && card.unitTypes?.length) {
      return `${card.type} · ${card.unitTypes.join(', ')}`;
    }
    return card.type;
  }
</script>

<div class="browser">
  <header class="toolbar">
    <div class="filter-bar">
      <div class="filters">
        <div class="filter">
          <span class="filter-label" id="npc-color-label">Colors</span>
          <div class="chips" role="group" aria-labelledby="npc-color-label">
            {#each NPC_COLORS as color (color)}
              <button
                type="button"
                class="chip color-{color}"
                class:active={query.colors.includes(color)}
                aria-pressed={query.colors.includes(color)}
                onclick={() => toggleColor(color)}
              >
                <img src={colorIcon(color)} alt="" />
                {color}
              </button>
            {/each}
            <button
              type="button"
              class="chip"
              class:active={query.colorless}
              aria-pressed={query.colorless}
              onclick={toggleColorless}
            >
              none
            </button>
          </div>
        </div>

        <div class="filter">
          <span class="filter-label" id="npc-cost-label">Mana</span>
          <div class="chips" role="group" aria-labelledby="npc-cost-label">
            {#each MANA_COSTS as cost (cost)}
              <button
                type="button"
                class="chip cost"
                class:active={query.costs.includes(cost)}
                aria-pressed={query.costs.includes(cost)}
                onclick={() => toggleCost(cost)}
              >
                {cost}
              </button>
            {/each}
          </div>
        </div>

        <div class="filter">
          <span class="filter-label" id="npc-pool-label">Pool</span>
          <div class="chips" role="group" aria-labelledby="npc-pool-label">
            {#each poolKeys as key (key)}
              <button
                type="button"
                class="chip"
                class:active={query.poolKeys.includes(key)}
                aria-pressed={query.poolKeys.includes(key)}
                onclick={() => togglePoolKey(key)}
              >
                {key}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="title-actions">
        <button
          type="button"
          class="chip"
          onclick={() => (query = createEmptyQuery())}
          disabled={isQueryEmpty(query)}
        >
          Clear
        </button>
        <p class="count" aria-live="polite">
          <span class="count-num">{matches.length}</span>
          <span class="count-of">of {npcCardCatalog.length}</span>
        </p>
      </div>
    </div>
  </header>

  <div class="body">
    <div class="list-pane">
      {#if matches.length === 0}
        <p class="empty">No cards match these filters.</p>
      {:else}
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Cost</th>
              <th scope="col">Card</th>
              <th scope="col">Colors</th>
              <th scope="col">Stats</th>
              <th scope="col">Keywords</th>
              <th scope="col">Abilities</th>
            </tr>
          </thead>
          <tbody>
            {#each matches as record (record.key)}
              {@const keywords = keywordLabels(record.card)}
              {@const abilities = abilityLabels(record.card)}
              <tr
                class:active={selected?.key === record.key}
                onclick={() => selectRecord(record)}
                onkeydown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectRecord(record);
                  }
                }}
                tabindex="0"
                aria-selected={selected?.key === record.key}
              >
                <td class="cost">{costLabel(record.card)}</td>
                <td class="card-cell">
                  <span class="name">{record.card.name}</span>
                  <span class="meta">
                    {typesLabel(record.card)}
                    {#if record.card.poolKeys?.length}
                      · {record.card.poolKeys.join(' · ')}
                    {/if}
                    · {record.source}
                  </span>
                </td>
                <td class="pips">
                  {#each record.card.colors ?? [] as info (`${record.key}:${info.color}`)}
                    {#each Array(info.count) as _, index (`${record.key}:${info.color}:${index}`)}
                      <img src={colorIcon(info.color)} alt={info.color} />
                    {/each}
                  {:else}
                    <span class="dash">—</span>
                  {/each}
                </td>
                <td class="stats">{statsLabel(record.card)}</td>
                <td class="keywords">
                  {#if keywords.length}
                    {keywords.join(', ')}
                  {:else}
                    <span class="dash">—</span>
                  {/if}
                </td>
                <td class="abilities">
                  {#if abilities.length}
                    <ul>
                      {#each abilities as line, index (`${record.key}:ability:${index}`)}
                        <li>{line}</li>
                      {/each}
                    </ul>
                  {:else}
                    <span class="dash">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

    <aside class="preview">
      {#if selected}
        <CardCompact card={selected.card} />
        <p class="preview-id">{selected.card.id}</p>
        <p class="preview-source">{selected.source}.json</p>
      {:else}
        <p class="empty">No cards match these filters.</p>
      {/if}
    </aside>
  </div>
</div>

<style>
  .browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--color-navy);
    color: var(--color-cream);
    font-family: var(--font-narrative);
    user-select: text;
  }

  .browser p {
    margin: 0;
  }

  .toolbar {
    flex: none;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(175, 142, 103, 0.35);
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    align-items: flex-start;
    justify-content: space-between;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    flex: 1;
  }

  .title-actions,
  .filter,
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .title-actions {
    flex: none;
  }

  .empty,
  .preview-id,
  .preview-source,
  .meta,
  .dash {
    color: var(--color-muted-label);
    font-size: 0.85rem;
  }

  .count {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 3.25rem;
  }

  .count-num {
    font-size: 1.45rem;
    line-height: 1;
    color: var(--color-brass);
  }

  .count-of {
    color: var(--color-muted-label);
    font-size: 0.8rem;
  }

  .filter-label {
    min-width: 3.5rem;
    color: var(--color-brass);
    font-size: 0.8rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.55rem;
    border-radius: 4px;
    border: 1px solid rgba(175, 142, 103, 0.35);
    background: transparent;
    color: var(--color-muted-label);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .chip.cost {
    min-width: 1.85rem;
    justify-content: center;
  }

  .chip img,
  .pips img {
    width: 0.85rem;
    height: 0.85rem;
    object-fit: contain;
  }

  .chip:hover {
    border-color: rgba(175, 142, 103, 0.7);
    color: var(--color-cream);
  }

  .chip:focus-visible,
  tr:focus-visible {
    outline: 2px solid var(--color-golden);
    outline-offset: 1px;
  }

  .chip.active {
    background: rgba(175, 142, 103, 0.2);
    border-color: var(--color-brass);
    color: var(--color-cream);
  }

  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .color-red.active {
    box-shadow: inset 3px 0 var(--color-red);
  }
  .color-green.active {
    box-shadow: inset 3px 0 var(--color-green);
  }
  .color-blue.active {
    box-shadow: inset 3px 0 var(--color-blue);
  }
  .color-black.active {
    box-shadow: inset 3px 0 var(--color-black);
  }

  .body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18rem;
  }

  .list-pane,
  .preview {
    min-height: 0;
    overflow: auto;
  }

  .list-pane {
    padding: 0.5rem 0.75rem 1.25rem;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.86rem;
  }

  th,
  td {
    padding: 0.45rem 0.5rem;
    border-bottom: 1px solid rgba(175, 142, 103, 0.2);
    vertical-align: top;
    text-align: left;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--color-navy);
    color: var(--color-brass);
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover {
    background: var(--color-data-hover);
  }

  tbody tr.active {
    background: rgba(175, 142, 103, 0.14);
    box-shadow: inset 3px 0 var(--color-golden);
  }

  .cost,
  .stats {
    color: var(--color-brass);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .cost {
    width: 2.5rem;
    text-align: center;
  }

  .card-cell {
    min-width: 10rem;
    max-width: 16rem;
  }

  .name {
    display: block;
    color: var(--color-cream);
  }

  .meta {
    display: block;
    margin-top: 0.1rem;
    line-height: 1.3;
  }

  .pips {
    white-space: nowrap;
  }

  .pips img {
    margin-right: 0.1rem;
  }

  .keywords {
    min-width: 7rem;
    max-width: 12rem;
    color: var(--color-cream);
    line-height: 1.35;
  }

  .abilities {
    min-width: 12rem;
    line-height: 1.35;
  }

  .abilities ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .abilities li + li {
    margin-top: 0.25rem;
  }

  .preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    padding: 1.25rem 1rem 2rem;
    border-left: 1px solid rgba(175, 142, 103, 0.28);
    background: var(--color-data-active);
  }

  .preview-id {
    font-family: monospace;
    font-size: 0.8rem;
  }

  @media (max-width: 900px) {
    .body {
      grid-template-columns: 1fr;
    }

    .preview {
      border-left: 0;
      border-top: 1px solid rgba(175, 142, 103, 0.28);
    }
  }
</style>
