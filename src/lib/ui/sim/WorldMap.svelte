<script lang="ts">
  import { PLACES, REGIONS } from '@/data/sim/places';
  import type { Character } from '@/lib/_model';
  import { gs } from '@/lib/_state/main.svelte';
  import { clearSelectedSimPlace, selectSimPlace, uiState } from '@/lib/_state/state-ui.svelte';
  import { getAssetPath } from '@/lib/_utils/asset-paths';
  import { isPlaceVisible } from '@/lib/sim/guardians';
  import { untrack } from 'svelte';
  import CharacterPortrait from './characters/CharacterPortrait.svelte';
  import Place from './Place.svelte';

  type MapLevel = 'world' | 'academy' | 'town';

  type MapArea = {
    key: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };

  type MapLayout = {
    imageWidth?: number;
    imageHeight?: number;
    regions?: MapArea[];
    locations?: MapArea[];
  };

  let {
    pickMode = false,
    allowedKeys = null,
    onPick,
  }: {
    pickMode?: boolean;
    /** When set (pick mode), only these place keys can be chosen. */
    allowedKeys?: string[] | null;
    onPick?: (placeKey: string) => void;
  } = $props();

  /** Artwork ids that differ from place and region keys in game data. */
  const AREA_KEYS: Record<string, string> = {
    'forest-of-schlupak': 'forest_of_schlupak',
    'grey-mountains': 'gray_mountains',
    'materials-shop': 'metarials-shop',
  };

  const LEVELS: Record<MapLevel, { image: string; title: string; file: string }> = {
    world: { image: 'world.jpg', title: 'World', file: 'world-map.json' },
    academy: { image: 'academy.jpg', title: 'The Academy', file: 'academy-map.json' },
    town: { image: 'town.jpg', title: 'Town', file: 'town-map.json' },
  };

  const MAX_AREA_PORTRAITS = 6;
  const parchmentPath = getAssetPath('images/ui/backgrounds/parchment.png');

  type LevelLayout = { areas: MapArea[]; aspectRatio: number };

  const layoutCache = new Map<string, Promise<LevelLayout>>();

  function loadLayout(file: string): Promise<LevelLayout> {
    let pending = layoutCache.get(file);
    if (!pending) {
      pending = fetch(getAssetPath(`images/maps/${file}`))
        .then((response) => {
          if (!response.ok) throw new Error(`Missing map layout ${file}`);
          return response.json() as Promise<MapLayout>;
        })
        .then((layout) => {
          const w = layout.imageWidth ?? 1;
          const h = layout.imageHeight ?? 1;
          return {
            areas: layout.regions ?? layout.locations ?? [],
            aspectRatio: w / h,
          };
        })
        .catch(() => ({ areas: [], aspectRatio: 1 }));
      layoutCache.set(file, pending);
    }
    return pending;
  }

  let level = $state<MapLevel>('world');
  let layoutsByLevel = $state<Record<MapLevel, LevelLayout>>({
    world: { areas: [], aspectRatio: 1 },
    academy: { areas: [], aspectRatio: 1 },
    town: { areas: [], aspectRatio: 1 },
  });

  const view = $derived(LEVELS[level]);
  const layout = $derived(layoutsByLevel[level]);
  const areas = $derived(layout.areas);
  const imagePath = $derived(getAssetPath(`images/maps/${view.image}`));
  const allowed = $derived(allowedKeys ? new Set(allowedKeys) : null);
  const caption = $derived(
    level === 'world' ? "It's a beautiful world" : (REGIONS[level]?.description ?? view.title)
  );
  /** People currently in each visible map area (player first). */
  const charactersByArea = $derived.by(() => {
    const people: Character[] = [gs.player, ...Object.values(gs.characters)];
    const byArea: Record<string, Character[]> = {};
    for (const area of areas) {
      const key = AREA_KEYS[area.key] ?? area.key;
      byArea[area.key] =
        level === 'world'
          ? people.filter((character) => {
              const place = gs.places[character.placeKey] ?? PLACES[character.placeKey];
              return place?.regionKey === key;
            })
          : people.filter((character) => character.placeKey === key);
    }
    return byArea;
  });

  $effect(() => {
    let cancelled = false;
    Promise.all(
      (Object.keys(LEVELS) as MapLevel[]).map(
        async (key) => [key, await loadLayout(LEVELS[key].file)] as const
      )
    ).then((entries) => {
      if (cancelled) return;
      const loaded: Record<MapLevel, LevelLayout> = {
        world: { areas: [], aspectRatio: 1 },
        academy: { areas: [], aspectRatio: 1 },
        town: { areas: [], aspectRatio: 1 },
      };
      for (const [key, data] of entries) loaded[key] = data;
      layoutsByLevel = loaded;
    });
    return () => {
      cancelled = true;
    };
  });

  const playerRegionKey = $derived(
    (gs.places[gs.player.placeKey] ?? PLACES[gs.player.placeKey])?.regionKey ?? null
  );
  const selectedPlace = $derived(
    !pickMode && uiState.sim.selectedPlaceKey
      ? (gs.places[uiState.sim.selectedPlaceKey] ?? PLACES[uiState.sim.selectedPlaceKey] ?? null)
      : null
  );

  $effect(() => {
    if (!pickMode) return;
    clearSelectedSimPlace();
    const region = untrack(() => playerRegionKey);
    if (region === 'academy' || region === 'town') level = region;
    else level = 'world';
  });

  $effect(() => {
    const key = uiState.sim.selectedPlaceKey;
    if (!key || pickMode) return;
    if (!gs.places[key] && !PLACES[key]) uiState.sim.selectedPlaceKey = null;
  });

  function gameKey(areaKey: string): string {
    return AREA_KEYS[areaKey] ?? areaKey;
  }

  function placeFor(areaKey: string) {
    const key = gameKey(areaKey);
    return gs.places[key] ?? PLACES[key] ?? null;
  }

  function drillLevel(areaKey: string): MapLevel | null {
    if (level !== 'world') return null;
    if (areaKey === 'academy' || areaKey === 'town') return areaKey;
    return null;
  }

  function isPickable(placeKey: string): boolean {
    const place = gs.places[placeKey] ?? PLACES[placeKey];
    if (!place || !isPlaceVisible(place)) return false;
    if (allowed && !allowed.has(placeKey)) return false;
    return true;
  }

  function regionHasPickable(regionKey: string): boolean {
    return Object.values(gs.places).some(
      (place) => place.regionKey === regionKey && isPickable(place.key)
    );
  }

  function canOpen(areaKey: string): boolean {
    const next = drillLevel(areaKey);
    if (next) {
      if (!pickMode) return true;
      return regionHasPickable(next);
    }
    const place = placeFor(areaKey);
    if (!place) return false;
    if (pickMode) return isPickable(place.key);
    return true;
  }

  function isHere(areaKey: string): boolean {
    if (level === 'world') return gameKey(areaKey) === playerRegionKey;
    return gameKey(areaKey) === gs.player.placeKey;
  }

  function activate(areaKey: string) {
    const next = drillLevel(areaKey);
    if (next) {
      level = next;
      return;
    }
    const place = placeFor(areaKey);
    if (!place) return;
    if (pickMode) {
      if (!isPickable(place.key)) return;
      if (!gs.places[place.key]) gs.places[place.key] = structuredClone(place);
      onPick?.(place.key);
      return;
    }
    if (!gs.places[place.key]) gs.places[place.key] = structuredClone(place);
    selectSimPlace(place.key);
  }

  function backFromPlace() {
    const regionKey = selectedPlace?.regionKey;
    if (regionKey === 'academy' || regionKey === 'town') level = regionKey;
    else level = 'world';
    clearSelectedSimPlace();
  }
</script>

<div class="world-map" class:pick-mode={pickMode}>
  {#if selectedPlace}
    <div class="place-view">
      <button type="button" class="back-btn" onclick={backFromPlace}>Back</button>
      <Place place={selectedPlace} />
    </div>
  {:else}
    <div class="map-view" style="--parchment: url('{parchmentPath}')">
      {#if level !== 'world'}
        <button type="button" class="back-btn" onclick={() => (level = 'world')}>Back</button>
      {/if}
      <div class="map-stage">
        <div class="map-frame" style="aspect-ratio: {layout.aspectRatio}">
          <img src={imagePath} alt="{view.title} map" draggable="false" />
          {#each areas as area (area.key)}
            {#if canOpen(area.key)}
              {@const present = charactersByArea[area.key] ?? []}
              <button
                type="button"
                class="hotspot"
                class:here={isHere(area.key)}
                style="left: {area.x}%; top: {area.y}%; width: {area.width}%; height: {area.height}%;"
                onclick={() => activate(area.key)}
              >
                {#if isHere(area.key)}
                  <span class="here-label">Here</span>
                {/if}
                {#if present.length > 0}
                  <span class="area-portraits" aria-hidden="true">
                    {#each present.slice(0, MAX_AREA_PORTRAITS) as character, i (character.key)}
                      <span
                        class="area-portrait"
                        class:player={character.key === gs.player.key}
                        style="z-index: {present.length - i}"
                      >
                        <CharacterPortrait {character} zoom={1.35} />
                      </span>
                    {/each}
                    {#if present.length > MAX_AREA_PORTRAITS}
                      <span class="area-portrait-more">+{present.length - MAX_AREA_PORTRAITS}</span>
                    {/if}
                  </span>
                {/if}
                <span class="hotspot-label">{area.name}</span>
              </button>
            {/if}
          {/each}
        </div>
      </div>
      <div class="map-caption">
        <p>{caption}</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .world-map {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    color: var(--color-cream);
    font-family: var(--font-narrative);
  }

  .place-view,
  .map-view {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .map-view {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .back-btn {
    position: absolute;
    top: 16px;
    right: 20px;
    z-index: 3;
    padding: 0.5rem 0.9rem;
    background: var(--color-data);
    border: 1px solid var(--color-brass);
    border-radius: 4px;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: var(--color-data-hover);
    border-color: var(--color-brass);
  }

  .map-stage {
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    align-self: flex-start;
  }

  .map-frame {
    position: relative;
    width: 100%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  }

  .map-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  .map-caption {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    padding: 1rem 1.15rem;
    box-sizing: border-box;
    background-color: var(--color-parchment);
    background-image: var(--parchment);
    background-size: cover;
    background-position: center;
    background-blend-mode: multiply;
    border: 1px solid var(--color-brown-border);
    border-radius: 3px;
    color: var(--color-ink);
    font-family: var(--font-narrative);
    font-size: 1.05rem;
    line-height: 1.7;
  }

  .map-caption p {
    margin: 0;
  }

  .hotspot {
    appearance: none;
    position: absolute;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    border: 2px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--color-cream);
    font: inherit;
    cursor: pointer;
  }

  .hotspot.here {
    border-color: var(--color-golden);
    background: color-mix(in srgb, var(--color-golden) 14%, transparent);
  }

  .hotspot:hover,
  .hotspot:focus-visible {
    z-index: 2;
    border-color: var(--color-brass);
    background: color-mix(in srgb, var(--color-brass) 18%, transparent);
  }

  .hotspot.here:hover,
  .hotspot.here:focus-visible {
    border-color: var(--color-golden);
    background: color-mix(in srgb, var(--color-golden) 22%, transparent);
  }

  .hotspot-label,
  .here-label {
    position: absolute;
    pointer-events: none;
    border-radius: 3px;
    background: var(--color-data);
    font-family: var(--font-narrative);
    line-height: 1.2;
    white-space: nowrap;
  }

  .hotspot-label {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 0.2rem 0.65rem;
    border: 1px solid var(--color-brass);
    color: var(--color-cream);
    font-size: 0.95rem;
    opacity: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
  }

  .hotspot:hover .hotspot-label,
  .hotspot:focus-visible .hotspot-label {
    opacity: 1;
  }

  .pick-mode .hotspot-label {
    opacity: 0.92;
  }

  .here-label {
    top: 8px;
    left: 8px;
    padding: 0.12rem 0.45rem;
    border: 1px solid var(--color-golden);
    color: var(--color-golden);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  .area-portraits {
    position: absolute;
    left: 6px;
    bottom: 6px;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .area-portrait,
  .area-portrait-more {
    flex-shrink: 0;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    border: 1px solid var(--color-brass);
    background: var(--color-data);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
    overflow: hidden;
  }

  .area-portrait + .area-portrait,
  .area-portrait + .area-portrait-more {
    margin-left: -0.4rem;
  }

  .area-portrait.player {
    border-color: var(--color-golden);
  }

  .area-portrait :global(.character-portrait) {
    border-radius: 0;
  }

  .area-portrait-more {
    z-index: 0;
    display: grid;
    place-items: center;
    color: var(--color-cream);
    font-family: var(--font-narrative);
    font-size: 0.65rem;
    line-height: 1;
  }
</style>
