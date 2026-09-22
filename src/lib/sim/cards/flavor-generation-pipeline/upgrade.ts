/**
 * Remote high-quality image upgrade (deferred).
 * Intended: poll a paid API (~6 images/day), replace cheap Comfy JPGs, set cheapImage=false.
 */

export interface ImageUpgradeProvider {
  /** Upgrade pending cheap images up to the provider's daily quota. */
  upgradeCheapImages(): Promise<void>;
}

/** No-op stub until a real remote provider is wired. */
export class MockImageUpgradeProvider implements ImageUpgradeProvider {
  async upgradeCheapImages(): Promise<void> {
    // Intentionally empty — real upgrade poller comes later.
  }
}

let provider: ImageUpgradeProvider = new MockImageUpgradeProvider();

export function setImageUpgradeProvider(next: ImageUpgradeProvider): void {
  provider = next;
}

export function getImageUpgradeProvider(): ImageUpgradeProvider {
  return provider;
}

export async function upgradeCheapImages(): Promise<void> {
  await provider.upgradeCheapImages();
}
