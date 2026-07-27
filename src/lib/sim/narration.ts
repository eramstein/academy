import { gs } from '../_state';
import type { AttributeCheck } from '../_model/model-game';
import { NarrationType } from '../_model/enums-sim';

export function narrateAttributeCheck(attributeCheck: AttributeCheck) {
  gs.scene.narration = gs.scene.narration.filter(
    (narration) => narration.type !== NarrationType.AttributeCheck
  );
  gs.scene.narration.push({
    text: `You roll a ${attributeCheck.roll} on a ${attributeCheck.difficulty} difficulty check for ${attributeCheck.attribute}.`,
    type: NarrationType.AttributeCheck,
    attributeCheck,
  });
}

export function narrateText(text: string) {
  gs.scene.narration.push({
    text,
    type: NarrationType.Text,
  });
}
