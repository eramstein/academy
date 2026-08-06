<script lang="ts">
  import { gs } from '@/lib/_state/main.svelte';
  import { getPlaceImagePath } from '@/lib/_utils/asset-paths';

  const regionsWithPlaces = $derived(
    Object.values(gs.regions).map((region) => ({
      region,
      places: Object.values(gs.places).filter((place) => place.regionKey === region.key),
    })),
  );
</script>

<div class="places">
  {#each regionsWithPlaces as { region, places } (region.key)}
    <section class="region">
      <h3 class="region-title">{region.name}</h3>
      <p class="region-description">{region.description}</p>

      <ul class="place-list">
        {#each places as place (place.key)}
          <li class="place-item">
            <div class="place-image" style="--bg-image: url('{getPlaceImagePath(place.key)}')"></div>
            <div class="place-info">
              <h4 class="place-name">{place.name}</h4>
              <p class="place-description">{place.description}</p>
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
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
