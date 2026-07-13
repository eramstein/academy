<script lang="ts">
  import { CardColor, CardType } from '../../../lib/_model';

  export let state: {
    name: string;
    type: CardType;
    cost: number;
    power: number;
    maxHealth: number;
    retaliate: number;
    colors: { color: CardColor; count: number }[];
  };

  export let addColor: () => void;
  export let removeColor: (index: number) => void;
  export let updateColor: (
    index: number,
    field: 'color' | 'count',
    value: CardColor | number
  ) => void;

  // Available options
  const colorOptions = Object.values(CardColor);
  const cardTypeOptions = Object.values(CardType);
</script>

<div class="form-section">
  <h3>Basic Information</h3>

  <div class="form-group">
    <label for="name">Card Name:</label>
    <input id="name" type="text" bind:value={state.name} placeholder="e.g., Savannah Lion" />
  </div>

  <div class="form-group">
    <label for="type">Card Type:</label>
    <select id="type" bind:value={state.type}>
      {#each cardTypeOptions as cardType}
        <option value={cardType}>{cardType}</option>
      {/each}
    </select>
  </div>

  <div class="stats-row" class:hidden={state.type !== CardType.Unit}>
    <div class="form-group">
      <label for="power">Power:</label>
      <input id="power" type="number" bind:value={state.power} min="0" max="20" />
    </div>

    <div class="form-group">
      <label for="maxHealth">Max Health:</label>
      <input id="maxHealth" type="number" bind:value={state.maxHealth} min="1" max="20" />
    </div>
  </div>

  <!-- Land stats -->
  <div class="stats-row" class:hidden={state.type !== CardType.Land}>
    <div class="form-group">
      <label for="landHealth">Health:</label>
      <input id="landHealth" type="number" bind:value={state.maxHealth} min="1" max="50" />
    </div>
    <div class="form-group">
      <label for="landRetaliate">Retaliate:</label>
      <input id="landRetaliate" type="number" bind:value={state.retaliate} min="0" max="10" />
    </div>
  </div>

  {#if state.type !== CardType.Land}
    <div class="form-group">
      <label for="cost">Cost:</label>
      <input id="cost" type="number" bind:value={state.cost} min="0" max="10" />
    </div>
  {/if}

  <div class="form-group">
    <label>Colors:</label>
    {#each state.colors as color, index}
      <div class="color-group">
        <select
          bind:value={color.color}
          onchange={(e) =>
            updateColor(index, 'color', (e.target as HTMLSelectElement).value as CardColor)}
        >
          {#each colorOptions as colorOption}
            <option value={colorOption}>{colorOption}</option>
          {/each}
        </select>

        <input
          type="number"
          bind:value={color.count}
          min="1"
          max="5"
          onchange={(e) =>
            updateColor(index, 'count', parseInt((e.target as HTMLInputElement).value))}
        />

        <button type="button" onclick={() => removeColor(index)}>Remove</button>
      </div>
    {/each}

    <button type="button" onclick={addColor}>Add Color</button>
  </div>
</div>

<style>
  .form-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
    flex: 0 0 auto;
    box-sizing: border-box;
  }

  .hidden {
    display: none !important;
  }

  .form-section h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 10px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .stats-row {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }

  .stats-row .form-group {
    flex: 1;
    margin-bottom: 0;
  }

  .stats-row input {
    width: 100%;
    box-sizing: border-box;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .color-group {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }

  .color-group select {
    flex: 1;
  }

  .color-group input {
    width: 80px;
  }

  .color-group button {
    padding: 8px 12px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .color-group button:hover {
    background-color: #c82333;
  }

  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
