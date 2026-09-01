export function getRandomFromArray<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getRandomWeighted<T>(items: { item: T; weight: number }[]): T {
  if (items.length === 0) {
    throw new Error('No items provided');
  }
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (const item of items) {
    cumulativeWeight += item.weight;
    if (random <= cumulativeWeight) return item.item;
  }
  throw new Error('No item found in getRandomWeighted');
}

export function getRandomIntegerWithVariance(mean: number, variance: number) {
  // Box-Muller transform to generate normally distributed random numbers
  const u1 = Math.random();
  const u2 = Math.random();

  // Generate a random number from standard normal distribution (mean=0, std=1)
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Scale by variance (standard deviation) and shift by mean
  const result = mean + z0 * Math.sqrt(variance);

  // Round to nearest integer
  return Math.round(result);
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function generateUniqueId(): string {
  return crypto.randomUUID();
}

export function getRandomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFromObjectWeights(object: Record<string, number>): string {
  const totalWeight = Object.values(object).reduce((acc, value) => acc + value, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (const key in object) {
    cumulativeWeight += object[key];
    if (random <= cumulativeWeight) return key;
  }
  throw new Error('No item found in getRandomFromObjectWeights');
}
