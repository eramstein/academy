<script lang="ts">
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();
</script>

<PlayerDetail title="Card Crafting" {onBack}>
  <p class="pending">Card crafting details will go here.</p>
</PlayerDetail>
