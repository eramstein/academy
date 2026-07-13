export enum CardType {
  Unit = 'unit',
  Spell = 'spell',
  Land = 'land',
}

export enum CardColor {
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Black = 'black',
}

export enum TriggerType {
  Static = 'Static',
  Activated = 'Activated',
  BeforeDamage = 'Before Damage',
  AfterCombat = 'After Combat',
  AfterMove = 'After Moving',
  BeforeMove = 'Before Moving',
  OnDeath = 'On Death',
  OnDeploy = 'On Deploy',
  OnTurnStart = 'On Turn Start',
  OnReach = 'On Reach',
  OnCardDrawn = 'On Card Drawn',
  OnLandDestroyed = 'On Land Destroyed',
  OnGoldGained = 'On Gold Gained',
}

export enum TargetType {
  Self = 'self',
  Ennemies = 'unit_ennemies',
  Allies = 'unit_allies',
  Cell = 'cell',
  Units = 'unit',
  AllyCell = 'cell_ally',
  EnemyCell = 'cell_enemy',
  EmptyCell = 'cell_empty',
  HandCard = 'hand_card',
  GraveyardCard = 'graveyard_card',
  DeckCard = 'deck_card',
  Land = 'land',
  Player = 'player',
}

export enum StatusType {
  Mezz = 'mezz',
  Stun = 'stun',
  Root = 'root',
  Daze = 'daze',
}

export enum UnitType {
  Mushroom = 'mushroom',
  Beast = 'beast',
  Human = 'human',
  Dwarf = 'dwarf',
  Monster = 'monster',
  Elemental = 'elemental',
  Spirit = 'spirit',
  Dragon = 'dragon',
  Demon = 'demon',
  Halfing = 'halfing',
  Plant = 'plant',
  Construct = 'construct',
  Building = 'building',
}

export enum CounterType {
  Growth = 'growth',
  Decay = 'decay',
  Energy = 'energy',
  Rage = 'rage',
}

/* Updated at the start of the turn, assess the situation and pick a strategy */
export enum AiTurnStrategy {
  Normal = 'Normal',
  Attack = 'Attack', // moderate offensive stance
  Defend = 'Defend', // moderate defensive stance
  Turtle = 'Turtle', // we have long term advantage, try to make the game last long
  Reach = 'Reach', // the opponent is low on HP, all out attack, make sacrifices if needed
}
export enum AiTurnGoal {
  Reset = 'Reset', // we are too far behind, reset the board if possible
  BlockRow = 'Block Row', // get defensive control of a specific row
  BreachRow = 'Breach Row', // try to breach a specific row for lethal damage
  RemoveUnit = 'Remove Unit', // remove a specific unit
  DestroyLand = 'Destroy Land', // destroy a specific land
}
