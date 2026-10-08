export interface NarrateParameters {
  text: string;
}

export function narrate(parameters: NarrateParameters): string {
  const text = typeof parameters.text === 'string' ? parameters.text.trim() : '';
  if (!text) {
    return 'Missing narration text.';
  }
  return text;
}
