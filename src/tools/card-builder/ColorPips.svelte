<script lang="ts">
  import { CardColor } from '@/lib/_model';
  import { bumpColor, colorCount, type ColorDraft } from './model';

  let { colors }: { colors: ColorDraft[] } = $props();

  const colorValues = Object.values(CardColor);

  function onClick(event: MouseEvent, color: CardColor) {
    event.preventDefault();
    bumpColor(colors, color, event.button === 2 ? -1 : 1);
  }
</script>

<div class="cb-color-pips" role="group" aria-label="Colors">
  {#each colorValues as color (color)}
    {@const count = colorCount(colors, color)}
    <button
      type="button"
      class="cb-color-pip"
      class:active={count > 0}
      data-color={color}
      title="{color}: left click +1, right click −1"
      onclick={(event) => onClick(event, color)}
      oncontextmenu={(event) => onClick(event, color)}
    >
      <span class="swatch"></span>
      <span class="count">{count}</span>
    </button>
  {/each}
</div>
