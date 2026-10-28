<script lang="ts">
  import PlayerDetail from './PlayerDetail.svelte';

  let { onBack }: { onBack: () => void } = $props();
</script>

<PlayerDetail title="Subscriptions" {onBack}>
  <p class="pending">Subscription details will go here.</p>
</PlayerDetail>
