import type { EventEffect, EventEffectsTemplate } from "@/lib/_model";
import { EventEffectType } from "@/lib/_model/enums-sim";

export const SceneEffectTemplates: Record<
  string,
  (args: Record<string, any>) => EventEffect[]
> = {
  getDeck: (args) => [{ type: EventEffectType.GetDeck, parameters: { deckKey: args.deckKey } }],
  addResource: (args) => [
    {
      type: EventEffectType.AddResource,
      parameters: { resourceType: args.resourceType, amount: args.amount },
    },
  ],
};

export function resolveEffectTemplates(templates: EventEffectsTemplate[]): EventEffect[] {
  return templates.flatMap(
    ({ effectTemplate, args }) => SceneEffectTemplates[effectTemplate](args)
  );
}