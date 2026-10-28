<script lang="ts">
  import type { ArtifactTool, ArtifactTrinket, CardCraftingSkills } from '@/lib/_model';
  import { PossessionType, ResourceType, SubscriptionType } from '@/lib/_model/enums-sim';
  import { gs } from '@/lib/_state/main.svelte';
  import { getUiIconPath, isPaintedUiIcon } from '@/lib/_utils/asset-paths';
  import Attributes from '../Attributes.svelte';
  import CharacterIdentity from '../characters/CharacterIdentity.svelte';
  import ResourceIcon from '../ResourceIcon.svelte';
  import ArtifactThumb from './player/ArtifactThumb.svelte';
  import Artifacts from './player/Artifacts.svelte';
  import Crafting from './player/Crafting.svelte';
  import Jobs from './player/Jobs.svelte';
  import Possessions from './player/Possessions.svelte';
  import Resources from './player/Resources.svelte';
  import Subscriptions from './player/Subscriptions.svelte';

  type PlayerPane =
    | 'resources'
    | 'artifacts'
    | 'possessions'
    | 'crafting'
    | 'subscriptions'
    | 'jobs';

  const FEATURED_RESOURCES: ResourceType[] = [
    ResourceType.MagicDust,
    ResourceType.Mithril,
    ResourceType.Moxes,
  ];

  const SUB_ICONS: Record<SubscriptionType, string> = {
    [SubscriptionType.Academy]: 'temple',
    [SubscriptionType.Library]: 'book',
    [SubscriptionType.Inn]: 'mug',
    [SubscriptionType.MaterialShop]: 'gem',
  };

  const SKILL_ORDER: (keyof CardCraftingSkills)[] = ['mastery', 'erudition', 'inspiration'];
  const SKILL_ICONS: Record<keyof CardCraftingSkills, string> = {
    mastery: 'book',
    erudition: 'trophy',
    inspiration: 'star',
  };

  const ARTIFACT_PREVIEW = 4;
  const JOB_PREVIEW = 2;

  let pane = $state<PlayerPane | null>(null);

  const player = $derived(gs.player);

  const featuredResources = $derived(
    FEATURED_RESOURCES.map((type) => ({
      type,
      amount: player.resources?.[type] ?? 0,
      label: resourceLabel(type),
    }))
  );

  const otherResources = $derived(
    Object.values(ResourceType)
      .filter((type) => !FEATURED_RESOURCES.includes(type) && (player.resources?.[type] ?? 0) > 0)
      .map((type) => ({
        type,
        amount: player.resources?.[type] ?? 0,
        label: resourceLabel(type),
      }))
  );

  const otherResourcesLine = $derived.by(() => {
    if (otherResources.length === 0) return '';
    if (otherResources.length > 5) return plural(otherResources.length, 'other resource');
    return otherResources.map((resource) => `${resource.amount} ${resource.label}`).join(', ');
  });

  const ownedArtifacts = $derived.by(() => {
    const tools = (player.artifacts?.tools ?? []).map((artifact) => ({
      artifact,
      kind: 'Tool' as const,
    }));
    const trinkets = (player.artifacts?.trinkets ?? []).map((artifact) => ({
      artifact,
      kind: 'Trinket' as const,
    }));
    const mixed: { artifact: ArtifactTool | ArtifactTrinket; kind: 'Tool' | 'Trinket' }[] = [];
    const rows = Math.max(tools.length, trinkets.length);
    for (let index = 0; index < rows; index += 1) {
      if (tools[index]) mixed.push(tools[index]);
      if (trinkets[index]) mixed.push(trinkets[index]);
    }
    return mixed;
  });

  const previewArtifacts = $derived(ownedArtifacts.slice(0, ARTIFACT_PREVIEW));
  const otherArtifactCount = $derived(Math.max(0, ownedArtifacts.length - ARTIFACT_PREVIEW));

  const patternsToRealize = $derived.by(() => {
    const realized = new Set(ownedArtifacts.map((entry) => entry.artifact.patternKey));
    return new Set(
      (player.artifacts?.patterns ?? []).filter((key) => key && !realized.has(key))
    ).size;
  });

  const artifactAside = $derived(
    [
      otherArtifactCount > 0 ? plural(otherArtifactCount, 'other artifact') : '',
      patternsToRealize > 0 ? `${plural(patternsToRealize, 'pattern')} to realize` : '',
    ]
      .filter(Boolean)
      .join(' · ')
  );

  const possessionGroups = $derived(
    Object.values(PossessionType)
      .map((type) => ({
        type,
        label: titleWord(type),
        count: (player.possessions ?? [])
          .filter((item) => item.type === type)
          .reduce((sum, item) => sum + (item.count ?? 1), 0),
      }))
      .filter((group) => group.count > 0)
  );

  const craftingSkills = $derived(
    SKILL_ORDER.map((key) => ({
      key,
      label: titleWord(key),
      icon: SKILL_ICONS[key],
      value: player.craftingSkills?.[key] ?? 0,
    }))
  );

  const keywordCount = $derived(Object.keys(player.craftingKnowledge?.keywords ?? {}).length);
  const actionCount = $derived(Object.keys(player.craftingKnowledge?.actions ?? {}).length);

  const subscriptions = $derived(
    Object.values(SubscriptionType).map((type) => ({
      type,
      label: titleWord(type),
      days: player.subscriptions?.[type] ?? 0,
      icon: SUB_ICONS[type],
    }))
  );

  const previewJobs = $derived(player.jobs.slice(0, JOB_PREVIEW));
  const otherJobCount = $derived(Math.max(0, player.jobs.length - JOB_PREVIEW));

  function titleWord(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function resourceLabel(type: ResourceType): string {
    if (type === ResourceType.MollysBeads) return "Molly's Beads";
    return titleWord(type);
  }

  function plural(count: number, singular: string): string {
    return `${count} ${singular}${count === 1 ? '' : 's'}`;
  }

  function iconUrl(name: string) {
    return getUiIconPath(name);
  }

  function bonusLabel(artifact: ArtifactTool | ArtifactTrinket): string {
    const entries =
      'skillBonuses' in artifact
        ? Object.entries(artifact.skillBonuses ?? {})
        : Object.entries(artifact.attributeBonuses ?? {});
    return entries
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] !== 0)
      .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${titleWord(key)}`)
      .join(' · ');
  }

  function closePane() {
    pane = null;
  }
</script>

{#snippet icon(name: string)}
  <span
    class="icon"
    class:painted={isPaintedUiIcon(name)}
    style="--icon: url('{iconUrl(name)}')"
    aria-hidden="true"
  ></span>
{/snippet}

{#snippet divider()}
  <div class="divider" aria-hidden="true">
    <span class="rule"></span>
    <span class="diamond"></span>
    <span class="rule"></span>
  </div>
{/snippet}

{#snippet sectionTitle(label: string, iconName: string, target: PlayerPane)}
  <button type="button" class="section-link" onclick={() => (pane = target)}>
    <span class="section-title">
      {@render icon(iconName)}
      {label}
    </span>
    <span class="chevron" aria-hidden="true"></span>
  </button>
{/snippet}

<div class="player">
  {#if pane === 'resources'}
    <Resources onBack={closePane} />
  {:else if pane === 'artifacts'}
    <Artifacts onBack={closePane} />
  {:else if pane === 'possessions'}
    <Possessions onBack={closePane} />
  {:else if pane === 'crafting'}
    <Crafting onBack={closePane} />
  {:else if pane === 'subscriptions'}
    <Subscriptions onBack={closePane} />
  {:else if pane === 'jobs'}
    <Jobs onBack={closePane} />
  {:else}
    <div class="sheet">
      <CharacterIdentity character={player} />

      <div class="sheet-body">
        <section class="section">
          <h3 class="section-title">
            {@render icon('compass')}
            Attributes
          </h3>
          {@render divider()}
          <Attributes attributes={player.attributes} />
        </section>

        <div class="ledger">
          <section class="block">
            {@render sectionTitle('Resources', 'coin', 'resources')}
            {@render divider()}
            <ul class="resources">
              {#each featuredResources as resource (resource.type)}
                <li class="resource">
                  <span
                    class="resource-glyph"
                    class:magic-dust={resource.type === ResourceType.MagicDust}
                  >
                    <ResourceIcon type={resource.type} />
                  </span>
                  <span class="resource-name">{resource.label}</span>
                  <span class="resource-amount">{resource.amount}</span>
                </li>
              {/each}
            </ul>
            {#if otherResourcesLine}
              <p class="aside">{otherResourcesLine}</p>
            {/if}
          </section>

          <section class="block">
            {@render sectionTitle('Artifacts', 'spiral', 'artifacts')}
            {@render divider()}
            {#if previewArtifacts.length === 0}
              <p class="empty">None yet.</p>
            {:else}
              <ul class="artifacts">
                {#each previewArtifacts as entry, index (`${entry.kind}-${entry.artifact.patternKey}-${index}`)}
                  {@const bonus = bonusLabel(entry.artifact)}
                  <li class="artifact">
                    <ArtifactThumb patternKey={entry.artifact.patternKey} size="sm" />
                    <span class="artifact-copy">
                      <span class="artifact-name" title={entry.artifact.name}>
                        {entry.artifact.name}
                      </span>
                      <span class="artifact-kind">{entry.kind}</span>
                      {#if bonus}
                        <span class="artifact-bonus">{bonus}</span>
                      {/if}
                    </span>
                  </li>
                {/each}
              </ul>
              {#if artifactAside}
                <p class="aside">{artifactAside}</p>
              {/if}
            {/if}
          </section>

          <section class="block">
            {@render sectionTitle('Possessions', 'boot', 'possessions')}
            {@render divider()}
            {#if possessionGroups.length === 0}
              <p class="empty">None yet.</p>
            {:else}
              <ul class="possessions">
                {#each possessionGroups as group (group.type)}
                  <li>
                    <span class="possession-name">{group.label}</span>
                    <span class="possession-count">{group.count}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>

          <section class="block">
            {@render sectionTitle('Card Crafting', 'spiral', 'crafting')}
            {@render divider()}
            <ul class="skills">
              {#each craftingSkills as skill (skill.key)}
                <li class="skill">
                  {@render icon(skill.icon)}
                  <span class="skill-copy">
                    <span class="skill-name">{skill.label}</span>
                    <span class="skill-value">{skill.value}</span>
                  </span>
                </li>
              {/each}
            </ul>
            {#if keywordCount > 0 || actionCount > 0}
              <p class="craft-note">
                {plural(keywordCount, 'keyword')} · {plural(actionCount, 'action')}
              </p>
            {/if}
          </section>

          <section class="block">
            {@render sectionTitle('Subscriptions', 'temple', 'subscriptions')}
            {@render divider()}
            <ul class="subs">
              {#each subscriptions as sub (sub.type)}
                <li class="sub">
                  {@render icon(sub.icon)}
                  <span class="sub-name">{sub.label}</span>
                  <span class="sub-days">{sub.days} days</span>
                </li>
              {/each}
            </ul>
          </section>

          <section class="block">
            {@render sectionTitle('Jobs', 'handshake', 'jobs')}
            {@render divider()}
            {#if player.jobs.length === 0}
              <p class="empty">None yet.</p>
            {:else}
              <ul class="jobs">
                {#each previewJobs as job (job.id)}
                  <li class="job-line">
                    <span class="job-name">{job.name}</span>
                    <span class="job-pay">{job.payPerActivity}g</span>
                  </li>
                {/each}
              </ul>
              {#if otherJobCount > 0}
                <p class="aside">{plural(otherJobCount, 'other job')}</p>
              {/if}
            {/if}
          </section>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .player {
    --brass: var(--color-brass);
    --brass-text: var(--color-cream);
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    color: var(--brass-text);
    font-family: var(--font-narrative);
    background: transparent;
  }

  .sheet {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 142, 103, 0.35) transparent;
  }

  .icon {
    display: block;
    width: 1.35rem;
    height: 1.35rem;
    flex-shrink: 0;
    color: var(--color-brass);
    background: currentColor;
    mask: var(--icon) center / contain no-repeat;
    -webkit-mask: var(--icon) center / contain no-repeat;
  }

  .icon.painted {
    background: var(--icon) center / contain no-repeat;
    mask: none;
    -webkit-mask: none;
  }

  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.45rem;
  }

  .rule {
    height: 1px;
    background: currentColor;
    opacity: 0.38;
  }

  .diamond {
    width: 7px;
    height: 7px;
    background: currentColor;
    opacity: 0.55;
    clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%);
  }

  .sheet-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    min-width: 0;
    padding: 1.05rem 1.2rem 1.2rem;
    box-sizing: border-box;
    color: var(--brass-text);
    background: transparent;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-brass);
  }

  .section-title .icon {
    width: 1.2rem;
    height: 1.2rem;
  }

  .sheet-body .divider {
    color: var(--brass);
  }

  .ledger {
    display: flex;
    flex-direction: column;
  }

  .block {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 1.05rem 0;
  }

  .block:first-child {
    padding-top: 0.15rem;
  }

  .block:last-child {
    padding-bottom: 0.1rem;
  }

  .block .divider {
    margin-bottom: 0.25rem;
  }

  .section-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-brass);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .section-link:hover {
    color: var(--color-golden);
  }

  .section-link:focus-visible {
    outline: 1px solid var(--color-golden);
    outline-offset: 2px;
  }

  .section-link .section-title {
    color: inherit;
  }

  .chevron {
    width: 0.42rem;
    height: 0.42rem;
    flex-shrink: 0;
    border-top: 2px solid currentColor;
    border-right: 2px solid currentColor;
    transform: rotate(45deg);
  }

  .empty,
  .aside {
    margin: 0;
    font-size: 0.84rem;
    color: var(--color-muted-label);
  }

  .resources,
  .artifacts,
  .possessions,
  .skills,
  .subs,
  .jobs {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .resources {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
  }

  .resource {
    display: grid;
    grid-template-columns: 2.65rem auto;
    grid-template-rows: auto auto;
    column-gap: 0.55rem;
    align-items: center;
    justify-content: center;
    padding: 0.15rem 0.85rem;
  }

  .resource:first-child {
    padding-left: 0;
  }

  .resource:last-child {
    padding-right: 0;
  }

  .resource + .resource {
    border-left: 1px solid rgba(175, 142, 103, 0.28);
  }

  .resource-glyph {
    grid-row: 1 / span 2;
    display: block;
    width: 2.65rem;
    height: 2.65rem;
    flex-shrink: 0;
  }

  .resource-glyph.magic-dust {
    transform: translateY(-5px);
  }

  .resource-name,
  .skill-name,
  .sub-name,
  .job-name,
  .possession-name,
  .artifact-name {
    color: var(--color-cream);
  }

  .resource-name {
    font-size: 1.05rem;
    line-height: 1.2;
  }

  .resource-amount,
  .skill-value,
  .possession-count {
    font-variant-numeric: tabular-nums;
    color: var(--color-cream);
  }

  .resource-amount {
    font-size: 1.2rem;
  }

  .artifacts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem 1.1rem;
  }

  .artifact {
    display: grid;
    grid-template-columns: 3.25rem minmax(0, 1fr);
    gap: 0.55rem;
    align-items: center;
    min-width: 0;
  }

  .artifact-copy {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  .artifact-name {
    overflow: hidden;
    font-size: 0.92rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .artifact-kind {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-muted-label);
  }

  .artifact-bonus {
    font-size: 0.84rem;
    color: var(--color-golden);
  }

  .possessions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.15rem;
    min-width: 0;
  }

  .possessions li {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  .possession-name {
    font-size: 0.92rem;
  }

  .skills {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
  }

  .skill {
    display: grid;
    grid-template-columns: 2.65rem auto;
    column-gap: 0.55rem;
    align-items: center;
    justify-content: center;
    padding: 0.15rem 0.85rem;
  }

  .skill:first-child {
    padding-left: 0;
  }

  .skill:last-child {
    padding-right: 0;
  }

  .skill + .skill {
    border-left: 1px solid rgba(175, 142, 103, 0.28);
  }

  .skill .icon {
    width: 2.65rem;
    height: 2.65rem;
  }

  .skill-copy {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  .skill-name {
    font-size: 1.05rem;
    line-height: 1.2;
  }

  .skill-value {
    font-size: 1.2rem;
  }

  .craft-note {
    margin: 0.15rem 0 0;
    text-align: center;
    font-size: 0.95rem;
    font-style: italic;
    color: var(--color-muted-label);
  }

  .subs {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .sub {
    display: grid;
    grid-template-columns: 1.45rem minmax(0, 1fr) auto;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.95rem;
  }

  .sub .icon {
    width: 1.45rem;
    height: 1.45rem;
  }

  .sub-days,
  .job-pay {
    color: var(--color-muted-label);
    font-variant-numeric: tabular-nums;
  }

  .jobs {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .job-line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.95rem;
  }
</style>
