<script lang="ts">
  let {
    power,
    health,
    maxHealth,
    armor = 0,
    retaliate = 0,
  }: {
    power: number;
    health?: number;
    maxHealth?: number;
    armor?: number;
    retaliate?: number;
  } = $props();
</script>

<div class="stats">
  <div class="power" class:retaliate-bg={retaliate > 0}>
    {power}
  </div>
  <div class="health" class:armor-bg={armor > 0}>
    {health || maxHealth || '0'}
  </div>
</div>

<style>
  .stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  }

  .power,
  .health {
    background: #000;
    color: white;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.9rem;
    line-height: 1;
    text-shadow: 0 1px 2px #000;
    width: 23px;
    height: 21px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px solid #bfa14a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    padding-bottom: 2px;
  }

  .health {
    background:
      url('/assets/images/health-icon.png') center/contain no-repeat,
      rgba(139, 0, 0, 0.8);
  }

  .health.armor-bg {
    background: url('/assets/images/armor-icon.png') center/contain no-repeat;
    border: none;
    box-shadow: none;
    width: 24px;
    height: 22px;
  }

  .power {
    background: url('/assets/images/power-icon.png') center/contain no-repeat rgba(19, 16, 16, 0.8);
  }

  .power.retaliate-bg {
    background: url('/assets/images/retaliate-icon.png') center/contain no-repeat;
    border: none;
    box-shadow: none;
    width: 30px;
    height: 28px;
    transform: translateX(3px);
  }
</style>
