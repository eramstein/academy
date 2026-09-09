<script lang="ts">
  import type { Character } from '@/lib/_model';
  import { getCharacterImagePath } from '@/lib/_utils/asset-paths';

  let { character, zoom = 1 }: { character: Character; zoom?: number } = $props();

  let imagePath = $derived(getCharacterImagePath(character.key));
</script>

<img
  src={imagePath}
  alt={character.name}
  class="character-portrait"
  style:transform="scale({zoom})"
/>

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
</style>
