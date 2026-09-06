<script lang="ts">
  let {
    power,
    health,
    maxHealth,
    armor = 0,
    retaliate = 0,
    compact = false,
  }: {
    power: number;
    health?: number;
    maxHealth?: number;
    armor?: number;
    retaliate?: number;
    compact?: boolean;
  } = $props();
</script>

<div class="stats" class:compact>
  <div class="stat power">{power}</div>
  <div class="stat retaliate">{retaliate}</div>
  <div class="stat health" class:armor-bg={armor > 0}>
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

  .stat {
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
    border: 1px solid #a8a8a8;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    padding-bottom: 2px;
  }

  .power {
    background: url('/assets/images/power-icon.png') center/contain no-repeat rgba(19, 16, 16, 0.8);
  }

  .retaliate {
    background: url('/assets/images/retaliate-icon.png') center/contain no-repeat;
    border: none;
    box-shadow: none;
    width: 30px;
    height: 28px;
    transform: translateX(3px);
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

  .compact {
    gap: 1px;
    align-items: flex-start;
  }

  .compact .stat {
    width: 22px;
    height: 20px;
    font-size: 0.75rem;
    padding: 2px;
    padding-bottom: 3px;
    box-sizing: border-box;
  }

  .compact .retaliate {
    width: 28px;
    height: 26px;
    transform: translateX(-3px);
  }

  .compact .health.armor-bg {
    width: 23px;
    height: 21px;
  }
</style>
