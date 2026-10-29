<script lang="ts">
  import type { Character } from '@/lib/_model';
  import type { Emotion } from '@/lib/_model/enums-sim';
  import {
    getCharacterImagePath,
    getCharacterSheetPath,
    getEmotionSheetBackgroundPosition,
    getEmotionSheetBackgroundSize,
    hasCharacterEmotionSheet,
  } from '@/lib/_utils/asset-paths';

  let {
    character,
    zoom = 1,
    emotion,
  }: {
    character: Character;
    zoom?: number;
    emotion?: Emotion;
  } = $props();

  const useSheet = $derived(
    !!emotion && hasCharacterEmotionSheet(character.key)
  );
  const imagePath = $derived(getCharacterImagePath(character.key));
  const sheetPath = $derived(getCharacterSheetPath(character.key));
  const sheetPosition = $derived(
    emotion ? getEmotionSheetBackgroundPosition(emotion) : undefined
  );
  const sheetSize = getEmotionSheetBackgroundSize();
</script>

<span class="character-portrait" style:--portrait-zoom={zoom}>
  {#if useSheet && sheetPosition}
    <span
      role="img"
      aria-label={character.name}
      class="portrait-media character-portrait-sheet"
      style:background-image="url('{sheetPath}')"
      style:background-position="{sheetPosition.x}% {sheetPosition.y}%"
      style:background-size={sheetSize}
    ></span>
  {:else}
    <img
      src={imagePath}
      alt={character.name}
      class="portrait-media"
    />
  {/if}
</span>

<style>
  .character-portrait {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 8px;
  }

  .portrait-media {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    transform: scale(var(--portrait-zoom, 1));
    transform-origin: top center;
  }

  .character-portrait-sheet {
    background-repeat: no-repeat;
  }
</style>
