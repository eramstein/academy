<script lang="ts">
  import type { Character } from '@/lib/_model';

  let { character }: { character: Character } = $props();

  // Get the image path based on the character key
  let imagePath = $derived(`/assets/images/characters/${character.key}.jpg`);
</script>

<img src={imagePath} alt={character.name} class="character-portrait" />

<style>
  .character-portrait {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    border-radius: 8px;
  }
</style>
