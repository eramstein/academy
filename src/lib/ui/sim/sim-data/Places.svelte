<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import {
    clearSelectedSimPlace,
    selectSimPlace,
    uiState,
  } from '@/lib/_state/state-ui.svelte';
  import { getPlaceImagePath } from '@/lib/_utils/asset-paths';
  import Place from '../Place.svelte';

  const regionsWithPlaces = $derived(
    Object.values(gs.regions).map((region) => ({
      region,
      places: Object.values(gs.places).filter((place) => place.regionKey === region.key),
    })),
  );

  const selectedPlace = $derived(
    uiState.sim.selectedPlaceKey ? (gs.places[uiState.sim.selectedPlaceKey] ?? null) : null,
  );

  $effect(() => {
    const key = uiState.sim.selectedPlaceKey;
    if (!key) return;
    if (!gs.places[key]) {
      uiState.sim.selectedPlaceKey = null;
    }
  });
</script>

{#if selectedPlace}
  <div class="place-view">
    <button type="button" class="back-btn" onclick={clearSelectedSimPlace}>Back</button>
    <Place place={selectedPlace} />
  </div>
{:else}
  <div class="places">
    {#each regionsWithPlaces as { region, places } (region.key)}
      <section class="region">
        <h3 class="region-title">{region.name}</h3>
        <p class="region-description">{region.description}</p>

        <ul class="place-list">
          {#each places as place (place.key)}
            <li>
              <button type="button" class="place-item" onclick={() => selectSimPlace(place.key)}>
                <div
                  class="place-image"
                  style="--bg-image: url('{getPlaceImagePath(place.key)}')"
                ></div>
                <div class="place-info">
                  <h4 class="place-name">{place.name}</h4>
                  <p class="place-description">{place.description}</p>
                </div>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
{/if}

<style>
  .place-view {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .back-btn {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 1;
    padding: 0.5rem 0.9rem;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #cccccc;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }

  .places {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .region {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .region-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #cccccc;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .region-description {
    margin: 0;
    font-size: 0.85rem;
    color: #aaaaaa;
    line-height: 1.4;
  }

  .place-list {
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .place-item {
    display: flex;
    gap: 0.75rem;
    min-width: 0;
    width: 100%;
    margin: 0;
    padding: 0.35rem;
    text-align: left;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
  }

  .place-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .place-image {
    flex: 0 0 96px;
    width: 96px;
    height: 72px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: rgba(0, 0, 0, 0.35);
    background-image: var(--bg-image);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .place-info {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .place-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #e8e8e8;
  }

  .place-description {
    margin: 0;
    font-size: 0.85rem;
    color: #aaaaaa;
    line-height: 1.35;
  }
</style>
