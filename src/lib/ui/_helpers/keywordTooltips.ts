export const KEYWORD_TOOLTIPS = {
  ranged: 'Ranged: Can attack any unit on the row.',
  haste: 'Haste: Can attack immediately when deployed.',
  moveAndAttack: 'Move and Attack: Can move and then attack in the same turn.',
  zerk: 'Zerk: Attacks automatically on turn start.',
  retaliate: (value: number) =>
    `Retaliate ${value}: When this unit is attacked, it deals ${value} damage back to the attacker.`,
  armor: (value: number) => `Armor ${value}: This unit takes ${value} less damage from attacks.`,
  resist: (value: number) =>
    `Resist ${value}: This unit takes ${value} less damage from spells and abilities.`,
  poisonous:
    'Poisonous: When this unit deals damage, the target is poisoned and takes 1 damage at the start of each turn.',
  regeneration: (value: number) =>
    `Regeneration ${value}: This unit heals ${value} health at the start of each turn.`,
  trample: 'Trample: Excess damage is dealt to the unit, land or player behind.',
  cleave: 'Cleave: Attacks adjacent ennemies too.',
  lance: 'Lance: Attacks both units in the row.',
  flying: 'Flying: Can attack any unit.',
  immobile: 'Immobile: Cannot move.',
};
