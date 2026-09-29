export const config = {
  // battle
  initialMana: 2,
  initialHandSize: 6,
  initialLife: 10,
  boardRows: 4,
  boardColumns: 4,
  aiActionInterval: 1000,
  /** Live opponent policy. `'heuristic'` is the old persona, kept so a match can be compared. */
  aiPolicy: 'search' as 'heuristic' | 'search',
  /** `'aggro'` locks the Aggro weight preset for the whole match. */
  aiPersona: 'normal' as 'normal' | 'aggro',
  maxSimulations: 24,
  maxAbsoluteSimulations: 32,
  maxTargetAssignments: 4,
  randomSamples: 1,
  continuationEnabled: false,
  continuationSteps: 6,
  continuationBranch: 4,
};
