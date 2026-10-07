<script lang="ts">
  import type { Character } from '@/lib/_model';
  import type { Emotion } from '@/lib/_model/enums-sim';
  import {
    getCharacterImagePath,
    getCharacterSheetPath,
    getEmotionSheetBackgroundPosition,
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
</script>

{#if useSheet && sheetPosition}
  <span
    role="img"
    aria-label={character.name}
    class="character-portrait character-portrait-sheet"
    style:background-image="url('{sheetPath}')"
    style:background-position="{sheetPosition.x}% {sheetPosition.y}%"
    style:transform="scale({zoom})"
  ></span>
{:else}
  <img
    src={imagePath}
    alt={character.name}
    class="character-portrait"
    style:transform="scale({zoom})"
  />
{/if}

<style>
  .character-portrait {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    border-radius: 8px;
    transform-origin: top center;
  }

  .character-portrait-sheet {
    background-size: 400% 300%;
    background-repeat: no-repeat;
  }
</style>
