<script lang="ts">
  import { formatKeywordLabel } from '@/lib/sim/cards/keywords';
  import { BOOLEAN_KEYWORD_KEYS, NUMBER_KEYWORD_KEYS, type KeywordDraft } from './model';

  let {
    keywords,
    includeStats = false,
  }: {
    keywords: KeywordDraft;
    includeStats?: boolean;
  } = $props();

  type NumberKey = 'power' | 'retaliate' | (typeof NUMBER_KEYWORD_KEYS)[number];

  const numberKeys = $derived<NumberKey[]>(
    includeStats ? ['power', 'retaliate', ...NUMBER_KEYWORD_KEYS] : [...NUMBER_KEYWORD_KEYS]
  );

  function setNumber(key: NumberKey, raw: string) {
    if (raw === '') {
      keywords[key] = null;
      return;
    }
    const value = Number(raw);
    keywords[key] = Number.isFinite(value) ? value : null;
  }
</script>

<div class="cb-checks">
  {#each BOOLEAN_KEYWORD_KEYS as key (key)}
    <label class="cb-check">
      <input type="checkbox" bind:checked={keywords[key]} />
      {formatKeywordLabel(key)}
    </label>
  {/each}
</div>
<div class="cb-numbers">
  {#each numberKeys as key (key)}
    <label class="cb-field">
      <span class="cb-label">{formatKeywordLabel(key)}</span>
      <input
        class="cb-input"
        type="number"
        value={keywords[key] ?? ''}
        placeholder="—"
        oninput={(event) => setNumber(key, event.currentTarget.value)}
      />
    </label>
  {/each}
</div>
