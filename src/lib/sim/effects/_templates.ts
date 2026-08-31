import type { EventEffect } from "@/lib/_model";
import { EventEffectType } from "@/lib/_model/enums-sim";

export const SceneEffectTemplates: Record<
  string,
  (args: Record<string, any>) => EventEffect[]
> = {
  getDeck: (args) => [{ type: EventEffectType.GetDeck, parameters: { deckKey: args.deckKey } }],
};