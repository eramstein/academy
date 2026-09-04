import type { CardTemplate } from '../_model';
import { NarrationType } from '../_model/enums-sim';
import type { AttributeCheck } from '../_model/model-sim';
import { gs } from '../_state';

export function narrateAttributeCheck(attributeCheck: AttributeCheck) {
  gs.scene.narration = gs.scene.narration.filter(
    (narration) => narration.type !== NarrationType.AttributeCheck
  );
  gs.scene.narration.push({
    id: crypto.randomUUID(),
    text: `You roll a ${attributeCheck.roll} on a ${attributeCheck.difficulty} difficulty check for ${attributeCheck.attribute}.`,
    type: NarrationType.AttributeCheck,
    attributeCheck,
  });
}

export function narrateText(text: string) {
  gs.scene.narration.push({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.Text,
  });
}

export function narrateCardConjured(cardId: string, text: string) {
  gs.scene.narration.push({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.ConjuredCard,
    cardIds: [cardId],
  });
}

export function narrateCardEncanted(oldCard: CardTemplate, newCard: CardTemplate, text: string) {
  gs.scene.narration.push({
    id: crypto.randomUUID(),
    text,
    type: NarrationType.ConjuredCard,
    cardTemplates: [oldCard, newCard],
  });
}
